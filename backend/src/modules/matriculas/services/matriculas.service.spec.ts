import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMatriculaDto } from '../dtos/create-matricula.dto';
import { UpdateMatriculaDto } from '../dtos/update-matricula.dto';
import { MatriculasService } from './matriculas.service';

const now = new Date('2026-11-05T12:00:00.000Z');

function student(id: bigint, deletedAt: Date | null = null) {
  return {
    id,
    dni: '12345678',
    nombres: 'Ana',
    apellidos: 'García',
    email: null,
    telefono: null,
    fecha_nacimiento: null,
    direccion: null,
    estado: 'activo',
    created_at: now,
    updated_at: now,
    deleted_at: deletedAt,
  };
}

function course(id: bigint, seats: number, deletedAt: Date | null = null) {
  return {
    id,
    codigo: `CUR-${id}`,
    nombre: `Curso ${id}`,
    descripcion: '',
    categoria: 'educacion',
    duracion_horas: 1,
    precio: { toString: () => '10.00' },
    modalidad: 'virtual',
    horario: '',
    cupos_maximos: seats,
    cupos_disponibles: seats,
    estado: 'activo',
    created_at: now,
    updated_at: now,
    deleted_at: deletedAt,
  };
}

function enrollment(
  id: bigint,
  studentId: bigint,
  courseId: bigint,
  state: string,
  deletedAt: Date | null = null,
) {
  return {
    id,
    estudiante_id: studentId,
    curso_id: courseId,
    fecha_matricula: now,
    estado: state,
    monto_pagado: { toString: () => '15.00' },
    observaciones: null,
    created_at: now,
    updated_at: now,
    deleted_at: deletedAt,
    estudiantes: student(studentId),
    cursos: course(courseId, 3),
  };
}

function listInput(state: 'pendiente' | 'pagada' | 'anulada' = 'pendiente') {
  return {
    estudiante_id: '1',
    curso_id: '2',
    fecha_matricula: '2026-11-05',
    estado: state,
    observaciones: 'Importado',
  } satisfies CreateMatriculaDto;
}

describe('MatriculasService', () => {
  let prisma: {
    matriculas: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let service: MatriculasService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = {
      matriculas: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new MatriculasService(prisma as unknown as PrismaService);
  });

  it('rejects active duplicates without changing capacity', async () => {
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 2n }]),
      estudiantes: { findUnique: jest.fn().mockResolvedValue(student(1n)) },
      cursos: {
        findUnique: jest.fn().mockResolvedValue(course(2n, 4)),
        update: jest.fn(),
      },
      matriculas: {
        findFirst: jest.fn().mockResolvedValue({ id: 7n }),
        create: jest.fn(),
      },
      audit_logs: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(service.create(listInput(), '3')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(transaction.cursos.update).not.toHaveBeenCalled();
    expect(transaction.matriculas.create).not.toHaveBeenCalled();
  });

  it('rejects full courses but permits historical annulled enrollment without consuming a seat', async () => {
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 2n }]),
      estudiantes: { findUnique: jest.fn().mockResolvedValue(student(1n)) },
      cursos: {
        findUnique: jest.fn().mockResolvedValue(course(2n, 0)),
        update: jest.fn(),
      },
      matriculas: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(enrollment(10n, 1n, 2n, 'anulada')),
      },
      audit_logs: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(service.create(listInput(), '3')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(transaction.matriculas.create).not.toHaveBeenCalled();

    transaction.matriculas.findFirst.mockClear();
    transaction.cursos.findUnique.mockResolvedValue(course(2n, 0));
    await expect(
      service.create(listInput('anulada'), '3'),
    ).resolves.toMatchObject({
      estado: 'anulada',
      id: '10',
    });
    expect(transaction.matriculas.findFirst).not.toHaveBeenCalled();
    expect(transaction.cursos.update).not.toHaveBeenCalled();
  });

  it('serializes course IDs, student IDs, and the enrollment row in that order', async () => {
    const current = enrollment(11n, 8n, 9n, 'pagada');
    const updated = enrollment(11n, 2n, 3n, 'anulada');
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 1n }]),
      estudiantes: {
        findUnique: jest
          .fn()
          .mockImplementation(({ where }: { where: { id: bigint } }) =>
            Promise.resolve(student(where.id)),
          ),
      },
      cursos: {
        findUnique: jest
          .fn()
          .mockImplementation(({ where }: { where: { id: bigint } }) =>
            Promise.resolve(course(where.id, where.id === 3n ? 2 : 1)),
          ),
        update: jest.fn().mockResolvedValue(undefined),
      },
      matriculas: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(current)
          .mockResolvedValueOnce(current),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue(updated),
      },
      audit_logs: { create: jest.fn() },
      matricula_pagos: {
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _sum: { monto: null } }),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );
    const dto = {
      ...listInput('anulada'),
      estudiante_id: '2',
      curso_id: '3',
    } satisfies UpdateMatriculaDto;

    await expect(
      service.update('11', dto, ['matriculas.anular'], '3'),
    ).resolves.toMatchObject({
      id: '11',
      estudiante_id: '2',
      curso_id: '3',
      estudiante: {
        id: '2',
        nombres: 'Ana',
        apellidos: 'García',
        dni: '12345678',
        deleted_at: null,
      },
      curso: {
        id: '3',
        codigo: 'CUR-3',
        nombre: 'Curso 3',
        estado: 'activo',
        cupos_disponibles: 3,
        deleted_at: null,
      },
    });

    const lockCalls = transaction.$queryRaw.mock.calls.map(
      ([strings, id]: [TemplateStringsArray, bigint]) => ({
        sql: strings.join(' ').replace(/\s+/g, ' '),
        id,
      }),
    );
    expect(
      lockCalls.map(({ sql }) => sql.match(/FROM (\w+) WHERE/)?.[1]),
    ).toEqual(['cursos', 'cursos', 'estudiantes', 'estudiantes', 'matriculas']);
    expect(lockCalls.map(({ id }) => id)).toEqual([3n, 9n, 2n, 8n, 11n]);
    expect(transaction.matriculas.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 11n } }),
    );
  });

  it('does not release capacity twice when annulling an already annulled enrollment', async () => {
    let current = enrollment(5n, 1n, 2n, 'pendiente');
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 2n }]),
      estudiantes: { findUnique: jest.fn() },
      audit_logs: { create: jest.fn() },
      matricula_pagos: {
        aggregate: jest
          .fn()
          .mockResolvedValue({ _sum: { monto: null }, _count: { _all: 0 } }),
      },
      cursos: {
        findUnique: jest.fn().mockResolvedValue(course(2n, 1)),
        update: jest.fn(),
      },
      matriculas: {
        findUnique: jest
          .fn()
          .mockImplementation(() => Promise.resolve(current)),
        findUniqueOrThrow: jest
          .fn()
          .mockImplementation(() => Promise.resolve(current)),
        update: jest
          .fn()
          .mockImplementation(
            ({ data }: { data: Partial<ReturnType<typeof enrollment>> }) => {
              current = { ...current, ...data };
              return Promise.resolve(current);
            },
          ),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    const first = await service.annul('5', ['matriculas.anular'], '3');
    await service.annul('5', ['matriculas.anular'], '3');
    expect(first).toMatchObject({ pagado: '0', requiere_conciliacion: false });
    expect(transaction.audit_logs.create).toHaveBeenCalledTimes(1);

    expect(transaction.cursos.update).toHaveBeenCalledTimes(1);
    expect(transaction.matriculas.update).toHaveBeenCalledTimes(1);
  });

  it('restores annulled history despite duplicates and rejects a repeated restore', async () => {
    let current = enrollment(
      6n,
      1n,
      2n,
      'anulada',
      new Date('2026-11-01T00:00:00.000Z'),
    );
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 2n }]),
      estudiantes: { findUnique: jest.fn() },
      audit_logs: { create: jest.fn() },
      cursos: { findUnique: jest.fn(), update: jest.fn() },
      matriculas: {
        findUnique: jest
          .fn()
          .mockImplementation(() => Promise.resolve(current)),
        findFirst: jest.fn(),
        update: jest
          .fn()
          .mockImplementation(
            ({ data }: { data: Partial<ReturnType<typeof enrollment>> }) => {
              current = { ...current, ...data };
              return Promise.resolve(current);
            },
          ),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(service.restore('6', '3')).resolves.toMatchObject({
      id: '6',
      estado: 'anulada',
      deleted_at: null,
    });
    await expect(service.restore('6', '3')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(transaction.matriculas.findFirst).not.toHaveBeenCalled();
    expect(transaction.cursos.update).not.toHaveBeenCalled();
    expect(transaction.matriculas.update).toHaveBeenCalledTimes(1);
  });

  it('returns singular safe relation objects and standard pagination metadata', async () => {
    prisma.matriculas.findMany.mockResolvedValue([
      enrollment(12n, 1n, 2n, 'pendiente'),
    ]);
    prisma.matriculas.count.mockResolvedValue(23);

    await expect(
      service.findAll({ page: 2, limit: 10, search: 'ana' }),
    ).resolves.toMatchObject({
      data: [
        {
          id: '12',
          monto_pagado: '15.00',
          estudiante: {
            id: '1',
            nombres: 'Ana',
            apellidos: 'García',
            dni: '12345678',
            deleted_at: null,
          },
          curso: {
            id: '2',
            codigo: 'CUR-2',
            nombre: 'Curso 2',
            estado: 'activo',
            cupos_disponibles: 3,
            deleted_at: null,
          },
        },
      ],
      meta: { page: 2, limit: 10, total: 23, totalPages: 3 },
    });

    const response = await service.findAll({ page: 1, limit: 10 });
    expect(response.data[0]).not.toHaveProperty('estudiantes');
    expect(response.data[0]).not.toHaveProperty('cursos');
    expect(prisma.matriculas.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        include: { estudiantes: true, cursos: true },
      }),
    );
  });
});
