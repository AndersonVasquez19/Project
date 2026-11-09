import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEstudianteDto } from '../dtos/create-estudiante.dto';
import { ListEstudiantesDto } from '../dtos/list-estudiantes.dto';
import { UpdateEstudianteDto } from '../dtos/update-estudiante.dto';

type EstudianteRow = {
  id: bigint;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  fecha_nacimiento: Date | null;
  direccion: string | null;
  estado: string;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type Estudiante = Omit<
  EstudianteRow,
  'id' | 'fecha_nacimiento' | 'created_at' | 'updated_at' | 'deleted_at'
> & {
  id: string;
  fecha_nacimiento: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

function isoDate(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function toResponse(row: EstudianteRow): Estudiante {
  return {
    ...row,
    id: row.id.toString(),
    fecha_nacimiento: isoDate(row.fecha_nacimiento),
    created_at: isoDate(row.created_at),
    updated_at: isoDate(row.updated_at),
    deleted_at: isoDate(row.deleted_at),
  };
}

@Injectable()
export class EstudiantesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListEstudiantesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const where: Prisma.estudiantesWhereInput = {
      deleted_at: query.eliminados ? { not: null } : null,
      ...(query.estado ? { estado: query.estado } : {}),
      ...(search
        ? {
            OR: [
              { dni: { contains: search } },
              { nombres: { contains: search } },
              { apellidos: { contains: search } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.estudiantes.findMany({
        where,
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.estudiantes.count({ where }),
    ]);

    return {
      data: rows.map((row) => toResponse(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(dto: CreateEstudianteDto): Promise<Estudiante> {
    try {
      const now = new Date();
      const row = await this.prisma.estudiantes.create({
        data: {
          ...this.estudianteData(dto),
          created_at: now,
          updated_at: now,
        },
      });

      return toResponse(row);
    } catch (error: unknown) {
      this.mapWriteError(error);
      throw error;
    }
  }

  async update(idValue: string, dto: UpdateEstudianteDto): Promise<Estudiante> {
    const id = this.parseId(idValue);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const locked = await transaction.$queryRaw<Array<{ id: bigint }>>`
          SELECT id
          FROM estudiantes
          WHERE id = ${id}
          FOR UPDATE
        `;
        if (locked.length === 0) {
          throw new NotFoundException('No se encontró el estudiante.');
        }

        const current = await transaction.estudiantes.findUnique({
          where: { id },
        });
        if (!current || current.deleted_at !== null) {
          throw new NotFoundException('No se encontró el estudiante.');
        }

        const row = await transaction.estudiantes.update({
          where: { id },
          data: {
            ...this.estudianteData(dto, true),
            updated_at: new Date(),
          },
        });
        return toResponse(row);
      });
    } catch (error: unknown) {
      this.mapWriteError(error);
      throw error;
    }
  }

  async archive(idValue: string): Promise<Estudiante> {
    const id = this.parseId(idValue);
    return this.prisma.$transaction(async (transaction) => {
      const locked = await transaction.$queryRaw<Array<{ id: bigint }>>`
        SELECT id
        FROM estudiantes
        WHERE id = ${id}
        FOR UPDATE
      `;
      if (locked.length === 0) {
        throw new NotFoundException('No se encontró el estudiante.');
      }

      const current = await transaction.estudiantes.findUnique({
        where: { id },
      });
      if (!current || current.deleted_at !== null) {
        throw new NotFoundException('No se encontró el estudiante.');
      }

      const now = new Date();
      return toResponse(
        await transaction.estudiantes.update({
          where: { id },
          data: { deleted_at: now, updated_at: now },
        }),
      );
    });
  }

  async restore(idValue: string): Promise<Estudiante> {
    const id = this.parseId(idValue);
    return this.prisma.$transaction(async (transaction) => {
      const locked = await transaction.$queryRaw<Array<{ id: bigint }>>`
        SELECT id
        FROM estudiantes
        WHERE id = ${id}
        FOR UPDATE
      `;
      if (locked.length === 0) {
        throw new NotFoundException('No se encontró el estudiante.');
      }

      const current = await transaction.estudiantes.findUnique({
        where: { id },
      });
      if (!current || current.deleted_at === null) {
        throw new NotFoundException('No se encontró el estudiante.');
      }

      return toResponse(
        await transaction.estudiantes.update({
          where: { id },
          data: { deleted_at: null, updated_at: new Date() },
        }),
      );
    });
  }

  private estudianteData(
    dto: CreateEstudianteDto | UpdateEstudianteDto,
    preserveOmitted = false,
  ) {
    return {
      dni: dto.dni,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      ...(preserveOmitted && dto.email === undefined
        ? {}
        : { email: dto.email ?? null }),
      ...(preserveOmitted && dto.telefono === undefined
        ? {}
        : { telefono: dto.telefono ?? null }),
      ...(preserveOmitted && dto.fecha_nacimiento === undefined
        ? {}
        : {
            fecha_nacimiento: dto.fecha_nacimiento
              ? this.dateOnly(dto.fecha_nacimiento)
              : null,
          }),
      ...(preserveOmitted && dto.direccion === undefined
        ? {}
        : { direccion: dto.direccion ?? null }),
      estado: dto.estado,
    };
  }

  private dateOnly(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  }

  private parseId(value: string): bigint {
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException(
        'El identificador del estudiante no es válido.',
      );
    }
    return BigInt(value);
  }

  private mapWriteError(error: unknown): void {
    if (isPrismaError(error, 'P2002')) {
      throw new ConflictException(
        'El DNI o correo electrónico ya está registrado.',
      );
    }
    if (isPrismaError(error, 'P2003')) {
      throw new ConflictException(
        'No se pudo guardar el estudiante por una relación inválida.',
      );
    }
  }
}
