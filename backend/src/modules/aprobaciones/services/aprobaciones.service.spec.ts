import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AprobacionesService } from './aprobaciones.service';

describe('AprobacionesService', () => {
  const transaction = {
    aprobaciones_internas: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    audit_logs: { create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(
      async (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  };
  let service: AprobacionesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AprobacionesService(prisma as never);
  });

  it('creates a pending approval and records the audit event atomically', async () => {
    transaction.aprobaciones_internas.create.mockResolvedValue({
      id: 4n,
      titulo: 'Compra de equipo',
      estado: 'pendiente',
    });

    await expect(
      service.create({ titulo: 'Compra de equipo', tipo: 'compra' }, '9'),
    ).resolves.toEqual({
      id: '4',
      titulo: 'Compra de equipo',
      estado: 'pendiente',
    });
    expect(transaction.audit_logs.create).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('resolves a pending approval and rejects a second decision', async () => {
    transaction.aprobaciones_internas.findUnique.mockResolvedValue({
      id: 4n,
      estado: 'pendiente',
      titulo: 'Compra de equipo',
    });
    transaction.aprobaciones_internas.updateMany.mockResolvedValue({
      count: 1,
    });

    await expect(
      service.decide(
        '4',
        { estado: 'aprobada', comentario: 'Autorizado' },
        '2',
      ),
    ).resolves.toEqual({ id: '4', estado: 'aprobada' });
    expect(transaction.audit_logs.create).toHaveBeenCalledTimes(1);

    transaction.aprobaciones_internas.findUnique.mockResolvedValue({
      id: 4n,
      estado: 'aprobada',
      titulo: 'Compra de equipo',
    });
    await expect(
      service.decide('4', { estado: 'rechazada' }, '2'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not let the requester resolve their own approval', async () => {
    transaction.aprobaciones_internas.findUnique.mockResolvedValue({
      id: 4n,
      estado: 'pendiente',
      titulo: 'Compra de equipo',
      solicitante_id: 9n,
    });

    await expect(
      service.decide('4', { estado: 'aprobada' }, '9'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(transaction.aprobaciones_internas.updateMany).not.toHaveBeenCalled();
    expect(transaction.audit_logs.create).not.toHaveBeenCalled();
  });
});
