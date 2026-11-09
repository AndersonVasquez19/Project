import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  pageMeta,
  resolveOrderBy,
} from '../../../common/pagination/pagination';
import { CreateServicioDto } from '../dtos/create-servicio.dto';
import { ListServiciosDto } from '../dtos/list-servicios.dto';
import { UpdateServicioDto } from '../dtos/update-servicio.dto';

type ServicioRow = {
  id: bigint;
  identificador_publico: string;
  codigo: string;
  nombre: string;
  categoria: string | null;
  estado: string;
  revision: number;
  created_at: Date | null;
  updated_at: Date | null;
};

export type ServicioTecnologico = Omit<ServicioRow, 'id'> & { id: string };

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

function toResponse(row: ServicioRow): ServicioTecnologico {
  return { ...row, id: row.id.toString() };
}

@Injectable()
export class ServiciosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListServiciosDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const where = search
      ? {
          OR: [
            { codigo: { contains: search } },
            { nombre: { contains: search } },
            { categoria: { contains: search } },
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      this.prisma.servicios_tecnologicos.findMany({
        where,
        orderBy:
          resolveOrderBy<Prisma.servicios_tecnologicosOrderByWithRelationInput>(
            query.sort,
            query.order,
            {
              nombre: (d) => [{ nombre: d }],
              codigo: (d) => [{ codigo: d }],
              categoria: (d) => [{ categoria: d }],
              estado: (d) => [{ estado: d }],
              created_at: (d) => [{ created_at: d }],
            },
            [{ id: 'asc' }],
            [{ id: 'asc' }],
          ),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.servicios_tecnologicos.count({ where }),
    ]);

    return {
      data: rows.map((row) => toResponse(row)),
      meta: pageMeta(page, limit, total),
    };
  }

  async create(dto: CreateServicioDto): Promise<ServicioTecnologico> {
    try {
      const row = await this.prisma.servicios_tecnologicos.create({
        data: {
          identificador_publico: randomUUID(),
          codigo: dto.codigo.trim(),
          nombre: dto.nombre.trim(),
          categoria: dto.categoria?.trim() || null,
        },
      });

      return toResponse(row);
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('Ya existe un servicio con ese código.');
      }

      throw error;
    }
  }

  async update(
    idValue: string,
    dto: UpdateServicioDto,
  ): Promise<ServicioTecnologico> {
    const id = this.parseId(idValue);
    const data = {
      ...(dto.codigo !== undefined ? { codigo: dto.codigo.trim() } : {}),
      ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
      ...(dto.categoria !== undefined
        ? { categoria: dto.categoria?.trim() || null }
        : {}),
      updated_at: new Date(),
      revision: { increment: 1 },
    };

    if (
      dto.codigo === undefined &&
      dto.nombre === undefined &&
      dto.categoria === undefined
    ) {
      throw new BadRequestException(
        'Debes enviar al menos un campo para actualizar.',
      );
    }

    try {
      const row = await this.prisma.servicios_tecnologicos.update({
        where: { id },
        data,
      });

      return toResponse(row);
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('No se encontró el servicio tecnológico.');
      }
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('Ya existe un servicio con ese código.');
      }

      throw error;
    }
  }

  async archive(idValue: string): Promise<ServicioTecnologico> {
    const id = this.parseId(idValue);
    try {
      const row = await this.prisma.servicios_tecnologicos.update({
        where: { id },
        data: {
          estado: 'archivado',
          updated_at: new Date(),
          revision: { increment: 1 },
        },
      });

      return toResponse(row);
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('No se encontró el servicio tecnológico.');
      }

      throw error;
    }
  }

  private parseId(value: string): bigint {
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException(
        'El identificador del servicio no es válido.',
      );
    }

    return BigInt(value);
  }
}
