import { UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  const prisma = {
    matriculas: { findMany: jest.fn() },
    matricula_pagos: { groupBy: jest.fn() },
    system_settings: { findMany: jest.fn() },
  };
  let service: ReportesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportesService(prisma as never);
  });

  it('filters enrollment rows and summarizes payment history with legacy fallback', async () => {
    const rows = [
      {
        id: 1n,
        fecha_matricula: new Date('2026-03-10T00:00:00.000Z'),
        estado: 'pendiente',
        monto_pagado: new Prisma.Decimal(30),
        monto_total: new Prisma.Decimal(100),
        estudiantes: {
          dni: '12345678',
          nombres: 'Ana',
          apellidos: 'Pérez',
        },
        cursos: {
          codigo: 'CUR-1',
          nombre: 'Curso uno',
          precio: new Prisma.Decimal(120),
        },
      },
      {
        id: 2n,
        fecha_matricula: new Date('2026-03-09T00:00:00.000Z'),
        estado: 'pendiente',
        monto_pagado: new Prisma.Decimal(20),
        monto_total: null,
        estudiantes: {
          dni: '87654321',
          nombres: 'Luis',
          apellidos: 'Díaz',
        },
        cursos: {
          codigo: 'CUR-2',
          nombre: 'Curso dos',
          precio: new Prisma.Decimal(50),
        },
      },
    ];
    let queryArgs: Prisma.matriculasFindManyArgs | undefined;
    prisma.matriculas.findMany.mockImplementation(
      (args: Prisma.matriculasFindManyArgs) => {
        queryArgs = args;
        return Promise.resolve(rows);
      },
    );
    prisma.matricula_pagos.groupBy.mockResolvedValue([
      { matricula_id: 1n, _sum: { monto: new Prisma.Decimal(40) } },
    ]);
    prisma.system_settings.findMany.mockResolvedValue([
      { key: 'system.name', value: 'Horus' },
      { key: 'system.currency', value: 'PEN' },
    ]);

    const result = await service.matriculas({
      desde: '2026-03-01',
      hasta: '2026-03-31',
      estado: 'pendiente',
    });

    expect(result.resumen).toEqual({
      matriculas: 2,
      total: '150',
      pagado: '60',
      saldo: '90',
    });
    expect(result.presentacion).toMatchObject({
      nombre_reportes: 'Horus',
      moneda: 'PEN',
    });
    expect(result.data[0]).toMatchObject({
      id: '1',
      estudiante: 'Ana Pérez',
      pagado: '40',
      saldo: '60',
    });
    expect(queryArgs?.where).toMatchObject({
      deleted_at: null,
      estado: 'pendiente',
      fecha_matricula: {
        gte: new Date('2026-03-01T00:00:00.000Z'),
        lt: new Date('2026-04-01T00:00:00.000Z'),
      },
    });
    expect(queryArgs?.take).toBe(10_001);
    expect(prisma.matricula_pagos.groupBy).toHaveBeenCalledTimes(1);
  });

  it('rejects an inverted date range before querying the database', async () => {
    await expect(
      service.matriculas({ desde: '2026-04-01', hasta: '2026-03-01' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(prisma.matriculas.findMany).not.toHaveBeenCalled();
  });
});
