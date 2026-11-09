import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ServiciosService } from './servicios.service';

describe('ServiciosService', () => {
  type CreateData = {
    identificador_publico: string;
    codigo: string;
    nombre: string;
    categoria: string | null;
  };

  const row = {
    id: 8n,
    identificador_publico: '8fd2c573-126f-4d86-b4b2-a47f918a8215',
    codigo: 'WEB-01',
    nombre: 'Desarrollo web',
    categoria: 'Tecnología',
    estado: 'activo',
    revision: 1,
    created_at: null,
    updated_at: null,
  };
  const prisma = {
    servicios_tecnologicos: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  let createdData: CreateData | undefined;
  let service: ServiciosService;

  beforeEach(() => {
    jest.clearAllMocks();
    createdData = undefined;
    prisma.servicios_tecnologicos.create.mockImplementation(
      (args: { data: CreateData }) => {
        createdData = args.data;
        return Promise.resolve(row);
      },
    );
    service = new ServiciosService(prisma as unknown as PrismaService);
  });

  it('paginates and searches by service fields', async () => {
    prisma.servicios_tecnologicos.findMany.mockResolvedValue([row]);
    prisma.servicios_tecnologicos.count.mockResolvedValue(21);

    const result = await service.findAll({
      page: 2,
      limit: 10,
      search: ' web ',
    });

    expect(result).toEqual({
      data: [{ ...row, id: '8' }],
      meta: { page: 2, limit: 10, total: 21, totalPages: 3 },
    });
    expect(prisma.servicios_tecnologicos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        orderBy: [{ id: 'asc' }],
        where: {
          OR: [
            { codigo: { contains: 'web' } },
            { nombre: { contains: 'web' } },
            { categoria: { contains: 'web' } },
          ],
        },
      }),
    );
  });

  it('sorts by a whitelisted column with a stable tiebreaker', async () => {
    prisma.servicios_tecnologicos.findMany.mockResolvedValue([row]);
    prisma.servicios_tecnologicos.count.mockResolvedValue(1);

    await service.findAll({ sort: 'nombre', order: 'desc' });

    expect(prisma.servicios_tecnologicos.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ nombre: 'desc' }, { id: 'asc' }],
      }),
    );
  });

  it('creates a service with a generated public identifier', async () => {
    await expect(
      service.create({
        codigo: ' WEB-01 ',
        nombre: ' Desarrollo web ',
        categoria: ' Tecnología ',
      }),
    ).resolves.toEqual({ ...row, id: '8' });

    if (!createdData) {
      throw new Error('No se guardaron los datos del servicio.');
    }
    expect(createdData).toMatchObject({
      codigo: 'WEB-01',
      nombre: 'Desarrollo web',
      categoria: 'Tecnología',
    });
    expect(createdData.identificador_publico).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('converts a missing service update into NotFoundException', async () => {
    prisma.servicios_tecnologicos.update.mockRejectedValue({ code: 'P2025' });

    await expect(
      service.update('9', { nombre: 'Actualizado' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid IDs and empty updates', async () => {
    await expect(
      service.update('0', { nombre: 'Actualizado' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.update('8', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.servicios_tecnologicos.update).not.toHaveBeenCalled();
  });

  it('translates duplicate service codes into ConflictException', async () => {
    prisma.servicios_tecnologicos.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.create({ codigo: 'WEB-01', nombre: 'Desarrollo web' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('archives an existing service and reports a missing service', async () => {
    prisma.servicios_tecnologicos.update.mockResolvedValue({
      ...row,
      estado: 'archivado',
    });
    await expect(service.archive('8')).resolves.toMatchObject({
      id: '8',
      estado: 'archivado',
    });

    prisma.servicios_tecnologicos.update.mockRejectedValue({ code: 'P2025' });
    await expect(service.archive('8')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
