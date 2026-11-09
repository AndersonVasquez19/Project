import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CursosService } from './cursos.service';

function partial<T extends object>(value: T): T {
  const matcher: unknown = expect.objectContaining(value);
  return matcher as T;
}

describe('CursosService', () => {
  const row = {
    id: 8n,
    codigo: 'CUR-008',
    nombre: 'Excel',
    descripcion: 'Curso de hojas de cálculo',
    categoria: 'tecnologia',
    duracion_horas: 20,
    precio: { toFixed: () => '150.00' },
    modalidad: 'virtual',
    horario: 'Lun-Mié',
    cupos_maximos: 20,
    cupos_disponibles: 20,
    estado: 'activo',
    created_at: null,
    updated_at: null,
    deleted_at: null,
  };
  const prisma = {
    cursos: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: CursosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CursosService(prisma as unknown as PrismaService);
  });

  it('paginates and searches current courses', async () => {
    prisma.cursos.findMany.mockResolvedValue([row]);
    prisma.cursos.count.mockResolvedValue(21);

    await expect(
      service.findAll({ page: 2, limit: 10, search: ' excel ' }),
    ).resolves.toMatchObject({
      data: [{ id: '8', precio: '150.00' }],
      meta: { page: 2, limit: 10, total: 21, totalPages: 3 },
    });
    expect(prisma.cursos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: partial({
          deleted_at: null,
          OR: [
            { codigo: { contains: 'excel' } },
            { nombre: { contains: 'excel' } },
          ],
        }),
      }),
    );
  });

  it('initializes available seats to the maximum on creation', async () => {
    prisma.cursos.create.mockResolvedValue(row);
    await service.create({
      codigo: 'CUR-008',
      nombre: ' Excel ',
      descripcion: 'Curso de hojas de cálculo',
      categoria: 'tecnologia',
      duracion_horas: 20,
      precio: 150,
      modalidad: 'virtual',
      horario: ' Lun-Mié ',
      cupos_maximos: 20,
      estado: 'activo',
    });

    expect(prisma.cursos.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: partial({
          nombre: 'Excel',
          horario: 'Lun-Mié',
          cupos_maximos: 20,
          cupos_disponibles: 20,
        }),
      }),
    );
  });

  it('rejects reducing seats below active enrollments and leaves data unchanged', async () => {
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 8n }]),
      matriculas: { count: jest.fn().mockResolvedValue(2) },
      cursos: { update: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(
      service.update('8', {
        codigo: 'CUR-008',
        nombre: 'Excel',
        descripcion: 'Curso de hojas de cálculo',
        categoria: 'tecnologia',
        duracion_horas: 20,
        precio: 150,
        modalidad: 'virtual',
        horario: 'Lun-Mié',
        cupos_maximos: 1,
        estado: 'activo',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(transaction.cursos.update).not.toHaveBeenCalled();
  });

  it('recalculates available seats after a valid capacity update', async () => {
    const updated = { ...row, cupos_maximos: 5, cupos_disponibles: 3 };
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 8n }]),
      matriculas: { count: jest.fn().mockResolvedValue(2) },
      cursos: { update: jest.fn().mockResolvedValue(updated) },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(
      service.update('8', {
        codigo: 'CUR-008',
        nombre: 'Excel',
        descripcion: 'Curso de hojas de cálculo',
        categoria: 'tecnologia',
        duracion_horas: 20,
        precio: 150,
        modalidad: 'virtual',
        horario: 'Lun-Mié',
        cupos_maximos: 5,
        estado: 'activo',
      }),
    ).resolves.toMatchObject({
      cupos_maximos: 5,
      cupos_disponibles: 3,
    });
    expect(transaction.cursos.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: partial({
          cupos_maximos: 5,
          cupos_disponibles: 3,
        }),
      }),
    );
  });

  it('soft-deletes and restores courses without changing their state', async () => {
    const deletedAt = new Date('2026-01-01T00:00:00.000Z');
    const trashed = { ...row, deleted_at: deletedAt };
    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 8n }]),
      cursos: {
        update: jest
          .fn()
          .mockResolvedValueOnce(trashed)
          .mockResolvedValueOnce(row),
        findUniqueOrThrow: jest.fn().mockResolvedValue(trashed),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(service.archive('8')).resolves.toMatchObject({
      deleted_at: deletedAt,
      estado: 'activo',
    });
    await expect(service.restore('8')).resolves.toMatchObject({
      deleted_at: null,
      estado: 'activo',
    });
  });

  it('maps duplicate codes and missing courses to HTTP exceptions', async () => {
    prisma.cursos.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.create({
        codigo: 'CUR-008',
        nombre: 'Excel',
        descripcion: 'Curso',
        categoria: 'tecnologia',
        duracion_horas: 20,
        precio: 150,
        modalidad: 'virtual',
        horario: 'Lun-Mié',
        cupos_maximos: 20,
        estado: 'activo',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    const transaction = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      matriculas: { count: jest.fn() },
      cursos: { update: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );
    await expect(
      service.update('8', {
        codigo: 'CUR-008',
        nombre: 'Excel',
        descripcion: 'Curso',
        categoria: 'tecnologia',
        duracion_horas: 20,
        precio: 150,
        modalidad: 'virtual',
        horario: 'Lun-Mié',
        cupos_maximos: 20,
        estado: 'activo',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
