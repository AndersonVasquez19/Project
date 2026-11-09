import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MatriculaPagosService } from './matricula-pagos.service';

describe('MatriculaPagosService', () => {
  const payment = {
    id: 8n,
    matricula_id: 3n,
    monto: new Prisma.Decimal(60),
    metodo: 'transferencia',
    referencia: 'OP-123',
    nota: null,
    pagado_at: new Date('2026-11-08T12:00:00.000Z'),
    registrado_por: 2n,
    created_at: new Date('2026-11-08T12:00:00.000Z'),
  };
  const transaction = {
    $queryRaw: jest.fn(),
    matriculas: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    matricula_pagos: {
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    audit_logs: { create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(
      async (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  };
  let service: MatriculaPagosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MatriculaPagosService(prisma as never);
    transaction.$queryRaw.mockResolvedValue([{ id: 3n }]);
    transaction.matriculas.findUnique.mockResolvedValue({
      deleted_at: null,
      estado: 'pendiente',
      fecha_matricula: new Date('2026-11-01T00:00:00.000Z'),
      monto_total: new Prisma.Decimal(100),
      cursos: { precio: new Prisma.Decimal(120) },
    });
    transaction.matricula_pagos.aggregate.mockResolvedValue({
      _sum: { monto: new Prisma.Decimal(40) },
    });
    transaction.matricula_pagos.create.mockResolvedValue(payment);
    transaction.matriculas.update.mockResolvedValue({});
  });

  it('records an abono and marks the enrollment paid when its balance reaches zero', async () => {
    const result = await service.create(
      '3',
      { monto: '60.00', metodo: 'transferencia' },
      '2',
    );

    expect(result.resumen).toEqual({
      total: '100',
      pagado: '100',
      saldo: '0',
      credito: '0',
    });
    expect(result.estado).toBe('pagada');
    expect(transaction.matriculas.update).toHaveBeenCalledTimes(1);
    expect(transaction.audit_logs.create).toHaveBeenCalledTimes(1);
  });

  it('rejects a payment larger than the current balance without writing', async () => {
    await expect(
      service.create('3', { monto: '61', metodo: 'efectivo' }, '2'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(transaction.matricula_pagos.create).not.toHaveBeenCalled();
    expect(transaction.matriculas.update).not.toHaveBeenCalled();
  });

  it('rejects future payment dates and dates before the enrollment', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await expect(
      service.create(
        '3',
        { monto: '10', metodo: 'efectivo', fecha_pago: tomorrow },
        '2',
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    await expect(
      service.create(
        '3',
        { monto: '10', metodo: 'efectivo', fecha_pago: '2026-10-01' },
        '2',
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(transaction.matricula_pagos.create).not.toHaveBeenCalled();
  });

  it('does not accept payments for an annulled enrollment', async () => {
    transaction.matriculas.findUnique.mockResolvedValue({
      deleted_at: null,
      estado: 'anulada',
      monto_total: new Prisma.Decimal(100),
      cursos: { precio: new Prisma.Decimal(100) },
    });

    await expect(
      service.create('3', { monto: '10', metodo: 'efectivo' }, '2'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transaction.matricula_pagos.create).not.toHaveBeenCalled();
  });
});
