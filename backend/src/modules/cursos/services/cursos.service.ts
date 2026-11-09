import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  pageMeta,
  resolveOrderBy,
} from '../../../common/pagination/pagination';
import { CreateCursoDto } from '../dtos/create-curso.dto';
import { ListCursosDto } from '../dtos/list-cursos.dto';
import { UpdateCursoDto } from '../dtos/update-curso.dto';

type CursoRow = {
  id: bigint;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  duracion_horas: number;
  precio: Prisma.Decimal;
  modalidad: string;
  horario: string;
  cupos_maximos: number;
  cupos_disponibles: number;
  estado: string;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
};

export type Curso = Omit<CursoRow, 'id' | 'precio'> & {
  id: string;
  precio: string;
};

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

function toResponse(row: CursoRow): Curso {
  return {
    ...row,
    id: row.id.toString(),
    precio: row.precio.toFixed(2),
  };
}

@Injectable()
export class CursosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListCursosDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const where: Prisma.cursosWhereInput = {
      deleted_at: query.eliminados ? { not: null } : null,
      ...(query.categoria ? { categoria: query.categoria } : {}),
      ...(query.estado ? { estado: query.estado } : {}),
      ...(search
        ? {
            OR: [
              { codigo: { contains: search } },
              { nombre: { contains: search } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.cursos.findMany({
        where,
        orderBy: resolveOrderBy<Prisma.cursosOrderByWithRelationInput>(
          query.sort,
          query.order,
          {
            nombre: (d) => [{ nombre: d }],
            codigo: (d) => [{ codigo: d }],
            precio: (d) => [{ precio: d }],
            created_at: (d) => [{ created_at: d }],
          },
          [{ nombre: 'asc' }],
          [{ id: 'asc' }],
        ),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cursos.count({ where }),
    ]);

    return {
      data: rows.map((row) => toResponse(row)),
      meta: pageMeta(page, limit, total),
    };
  }

  async create(dto: CreateCursoDto): Promise<Curso> {
    try {
      const row = await this.prisma.cursos.create({
        data: {
          ...this.courseData(dto),
          cupos_disponibles: dto.cupos_maximos,
        },
      });

      return toResponse(row);
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('Ya existe un curso con ese código.');
      }

      throw error;
    }
  }

  async update(idValue: string, dto: UpdateCursoDto): Promise<Curso> {
    const id = this.parseId(idValue);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const locked = await transaction.$queryRaw<Array<{ id: bigint }>>`
          SELECT id
          FROM cursos
          WHERE id = ${id} AND deleted_at IS NULL
          FOR UPDATE
        `;
        if (locked.length === 0) {
          throw new NotFoundException('No se encontró el curso.');
        }

        const matriculasActivas = await transaction.matriculas.count({
          where: {
            curso_id: id,
            deleted_at: null,
            estado: { not: 'anulada' },
          },
        });
        if (dto.cupos_maximos < matriculasActivas) {
          throw new UnprocessableEntityException({
            message: 'Revisa los datos ingresados.',
            errors: {
              cupos_maximos: [
                `No puedes reducir los cupos por debajo de las ${matriculasActivas} matrículas activas.`,
              ],
            },
          });
        }

        const row = await transaction.cursos.update({
          where: { id },
          data: {
            ...this.courseData(dto),
            cupos_disponibles: dto.cupos_maximos - matriculasActivas,
            updated_at: new Date(),
          },
        });

        return toResponse(row);
      });
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('Ya existe un curso con ese código.');
      }

      throw error;
    }
  }

  async archive(idValue: string): Promise<Curso> {
    const id = this.parseId(idValue);
    return this.prisma.$transaction(async (transaction) => {
      const locked = await transaction.$queryRaw<Array<{ id: bigint }>>`
        SELECT id
        FROM cursos
        WHERE id = ${id} AND deleted_at IS NULL
        FOR UPDATE
      `;
      if (locked.length === 0) {
        throw new NotFoundException('No se encontró el curso.');
      }

      const row = await transaction.cursos.update({
        where: { id },
        data: { deleted_at: new Date(), updated_at: new Date() },
      });

      return toResponse(row);
    });
  }

  async restore(idValue: string): Promise<Curso> {
    const id = this.parseId(idValue);
    return this.prisma.$transaction(async (transaction) => {
      const locked = await transaction.$queryRaw<Array<{ id: bigint }>>`
        SELECT id
        FROM cursos
        WHERE id = ${id}
        FOR UPDATE
      `;
      if (locked.length === 0) {
        throw new NotFoundException('No se encontró el curso.');
      }

      const current = await transaction.cursos.findUniqueOrThrow({
        where: { id },
      });
      if (current.deleted_at === null) {
        return toResponse(current);
      }

      const row = await transaction.cursos.update({
        where: { id },
        data: { deleted_at: null, updated_at: new Date() },
      });

      return toResponse(row);
    });
  }

  private courseData(dto: CreateCursoDto | UpdateCursoDto) {
    return {
      codigo: dto.codigo.trim(),
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion.trim(),
      categoria: dto.categoria,
      duracion_horas: dto.duracion_horas,
      precio: new Prisma.Decimal(dto.precio.toFixed(2)),
      modalidad: dto.modalidad,
      horario: dto.horario.trim(),
      cupos_maximos: dto.cupos_maximos,
      estado: dto.estado,
    };
  }

  private parseId(value: string): bigint {
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException('El identificador del curso no es válido.');
    }

    return BigInt(value);
  }
}
