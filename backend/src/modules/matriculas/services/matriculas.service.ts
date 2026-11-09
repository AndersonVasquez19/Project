import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { writeAudit } from '../../../common/audit/write-audit';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMatriculaDto } from '../dtos/create-matricula.dto';
import { ListMatriculasDto } from '../dtos/list-matriculas.dto';
import { UpdateMatriculaDto } from '../dtos/update-matricula.dto';

const RESPONSE_INCLUDE = {
  estudiantes: true,
  cursos: true,
} as const;
const ACTIVE_STATES = ['pendiente', 'pagada'];
const ANNUL_PERMISSION = 'matriculas.anular';

type MatriculaWithRelations = Prisma.matriculasGetPayload<{
  include: typeof RESPONSE_INCLUDE;
}>;
type Transaction = Prisma.TransactionClient;

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

function occupied(state: string): boolean {
  return ACTIVE_STATES.includes(state);
}

function sortedUnique(ids: bigint[]): bigint[] {
  return [...new Set(ids)].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

function isoDate(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function toResponse(row: MatriculaWithRelations) {
  return {
    id: row.id.toString(),
    estudiante_id: row.estudiante_id.toString(),
    curso_id: row.curso_id.toString(),
    fecha_matricula: row.fecha_matricula.toISOString(),
    estado: row.estado,
    monto_pagado: row.monto_pagado?.toString() ?? null,
    monto_total: row.monto_total?.toString() ?? null,
    observaciones: row.observaciones,
    created_at: isoDate(row.created_at),
    updated_at: isoDate(row.updated_at),
    deleted_at: isoDate(row.deleted_at),
    estudiante: {
      id: row.estudiantes.id.toString(),
      nombres: row.estudiantes.nombres,
      apellidos: row.estudiantes.apellidos,
      dni: row.estudiantes.dni,
      deleted_at: isoDate(row.estudiantes.deleted_at),
    },
    curso: {
      id: row.cursos.id.toString(),
      codigo: row.cursos.codigo,
      nombre: row.cursos.nombre,
      estado: row.cursos.estado,
      cupos_disponibles: row.cursos.cupos_disponibles,
      deleted_at: isoDate(row.cursos.deleted_at),
    },
  };
}

function validation(field: string, message: string): never {
  throw new UnprocessableEntityException({
    message: 'Revisa los datos ingresados.',
    errors: { [field]: [message] },
  });
}

@Injectable()
export class MatriculasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListMatriculasDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const cursoId =
      query.curso_id === undefined ? undefined : this.parseId(query.curso_id);
    const where: Prisma.matriculasWhereInput = {
      deleted_at: query.eliminados ? { not: null } : null,
      ...(query.estado ? { estado: query.estado } : {}),
      ...(cursoId ? { curso_id: cursoId } : {}),
      ...(search
        ? {
            OR: [
              {
                estudiantes: {
                  is: {
                    OR: [
                      {
                        dni: { contains: search },
                      },
                      {
                        nombres: { contains: search },
                      },
                      {
                        apellidos: { contains: search },
                      },
                    ],
                  },
                },
              },
              {
                cursos: {
                  is: {
                    OR: [
                      {
                        nombre: { contains: search },
                      },
                      {
                        codigo: { contains: search },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.matriculas.findMany({
        where,
        include: RESPONSE_INCLUDE,
        orderBy: [{ fecha_matricula: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.matriculas.count({ where }),
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

  async create(dto: CreateMatriculaDto, actorValue: string) {
    try {
      const actorId = this.parseId(actorValue);
      const studentId = this.parseId(dto.estudiante_id);
      const courseId = this.parseId(dto.curso_id);
      return await this.prisma.$transaction(async (transaction) => {
        await this.lockRows(transaction, 'cursos', [courseId]);
        await this.lockRows(transaction, 'estudiantes', [studentId]);

        const [student, course] = await Promise.all([
          transaction.estudiantes.findUnique({ where: { id: studentId } }),
          transaction.cursos.findUnique({ where: { id: courseId } }),
        ]);
        this.requireActiveStudent(student);
        this.requireActiveCourse(course);
        if (dto.estado === 'pagada') {
          validation(
            'estado',
            'Registra los pagos desde la cuenta de la matrícula para marcarla como pagada.',
          );
        }

        if (occupied(dto.estado)) {
          await this.ensureNoDuplicate(transaction, studentId, courseId);
          if (course.cupos_disponibles <= 0) {
            validation('curso_id', 'El curso no tiene cupos disponibles.');
          }
          await transaction.cursos.update({
            where: { id: courseId },
            data: {
              cupos_disponibles: { decrement: 1 },
              updated_at: new Date(),
            },
          });
        }

        const now = new Date();
        const row = await transaction.matriculas.create({
          data: {
            estudiante_id: studentId,
            curso_id: courseId,
            fecha_matricula: this.dateOnly(dto.fecha_matricula),
            estado: dto.estado,
            monto_total: course.precio,
            ...(dto.observaciones === undefined
              ? {}
              : { observaciones: dto.observaciones ?? null }),
            created_at: now,
            updated_at: now,
          },
          include: RESPONSE_INCLUDE,
        });
        await writeAudit(transaction, {
          userId: actorId,
          action: 'matriculas.creada',
          modelType: 'matriculas',
          modelId: row.id,
          changes: {
            estudiante_id: studentId.toString(),
            curso_id: courseId.toString(),
            estado: dto.estado,
          },
        });
        return toResponse(row);
      });
    } catch (error: unknown) {
      this.mapWriteError(error);
      throw error;
    }
  }

  async update(
    idValue: string,
    dto: UpdateMatriculaDto,
    permissions: string[],
    actorValue: string,
  ) {
    const id = this.parseId(idValue);
    const actorId = this.parseId(actorValue);
    const studentId = this.parseId(dto.estudiante_id);
    const courseId = this.parseId(dto.curso_id);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const current = await this.lockMatricula(transaction, id, {
          courseIds: [courseId],
          studentIds: [studentId],
        });
        const [student, course] = await Promise.all([
          transaction.estudiantes.findUnique({ where: { id: studentId } }),
          transaction.cursos.findUnique({ where: { id: courseId } }),
        ]);
        this.requirePresentStudent(student);
        this.requirePresentCourse(course);

        const wasOccupied = occupied(current.estado);
        const willBeOccupied = occupied(dto.estado);
        const courseChanged = current.curso_id !== courseId;
        const studentChanged = current.estudiante_id !== studentId;
        if (current.estado === 'pagada' && dto.estado === 'pendiente') {
          validation(
            'estado',
            'No se puede volver a pendiente una matrícula con pagos registrados.',
          );
        }
        if (
          (courseChanged || studentChanged) &&
          (await transaction.matricula_pagos.count({
            where: { matricula_id: id },
          })) > 0
        ) {
          validation(
            'curso_id',
            'No se puede cambiar el curso o estudiante después de registrar pagos.',
          );
        }
        if (dto.estado === 'pagada' && current.estado !== 'pagada') {
          const payments = await transaction.matricula_pagos.aggregate({
            where: { matricula_id: id },
            _sum: { monto: true },
          });
          const total = current.monto_total ?? course.precio;
          if ((payments._sum.monto ?? new Prisma.Decimal(0)).lt(total)) {
            validation(
              'estado',
              'Registra los pagos desde la cuenta de la matrícula para marcarla como pagada.',
            );
          }
        }
        const acquiresSeat = willBeOccupied && (!wasOccupied || courseChanged);
        const releasesSeat = wasOccupied && (!willBeOccupied || courseChanged);

        if (
          wasOccupied &&
          dto.estado === 'anulada' &&
          !permissions.includes(ANNUL_PERMISSION)
        ) {
          throw new ForbiddenException(
            'No tienes permiso para anular matrículas.',
          );
        }

        if (willBeOccupied) {
          await this.ensureNoDuplicate(transaction, studentId, courseId, id);
        }
        if (acquiresSeat) {
          this.requireActiveStudent(student);
          this.requireActiveCourse(course);
          if (course.cupos_disponibles <= 0) {
            validation('curso_id', 'El curso no tiene cupos disponibles.');
          }
        }

        let currentCourse: Awaited<
          ReturnType<Transaction['cursos']['findUnique']>
        > | null = null;
        if (releasesSeat) {
          currentCourse = await transaction.cursos.findUnique({
            where: { id: current.curso_id },
          });
          if (!currentCourse) {
            validation('curso_id', 'El curso de origen ya no existe.');
          }
        }

        if (releasesSeat && currentCourse) {
          await transaction.cursos.update({
            where: { id: current.curso_id },
            data: {
              cupos_disponibles: { increment: 1 },
              updated_at: new Date(),
            },
          });
        }
        if (acquiresSeat) {
          await transaction.cursos.update({
            where: { id: courseId },
            data: {
              cupos_disponibles: { decrement: 1 },
              updated_at: new Date(),
            },
          });
        }

        const row = await transaction.matriculas.update({
          where: { id },
          data: {
            estudiante_id: studentId,
            curso_id: courseId,
            fecha_matricula: this.dateOnly(dto.fecha_matricula),
            estado: dto.estado,
            ...(courseChanged
              ? { monto_total: course.precio }
              : current.monto_total === null
                ? { monto_total: course.precio }
                : {}),
            ...(dto.observaciones === undefined
              ? {}
              : { observaciones: dto.observaciones ?? null }),
            updated_at: new Date(),
          },
          include: RESPONSE_INCLUDE,
        });
        await writeAudit(transaction, {
          userId: actorId,
          action: 'matriculas.actualizada',
          modelType: 'matriculas',
          modelId: id,
          changes: {
            estado_anterior: current.estado,
            estado: dto.estado,
            estudiante_id: studentId.toString(),
            curso_id: courseId.toString(),
          },
        });
        return toResponse(row);
      });
    } catch (error: unknown) {
      this.mapWriteError(error);
      throw error;
    }
  }

  async archive(idValue: string, actorValue: string) {
    const id = this.parseId(idValue);
    const actorId = this.parseId(actorValue);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const current = await this.lockMatricula(transaction, id);
        if (occupied(current.estado)) {
          const course = await transaction.cursos.findUnique({
            where: { id: current.curso_id },
          });
          if (!course) {
            validation('curso_id', 'El curso de origen ya no existe.');
          }
          await transaction.cursos.update({
            where: { id: current.curso_id },
            data: {
              cupos_disponibles: { increment: 1 },
              updated_at: new Date(),
            },
          });
        }

        const archived = await transaction.matriculas.update({
          where: { id },
          data: { deleted_at: new Date(), updated_at: new Date() },
          include: RESPONSE_INCLUDE,
        });
        await writeAudit(transaction, {
          userId: actorId,
          action: 'matriculas.archivada',
          modelType: 'matriculas',
          modelId: id,
          changes: { estado: current.estado },
        });
        return toResponse(archived);
      });
    } catch (error: unknown) {
      this.mapWriteError(error);
      throw error;
    }
  }

  async annul(idValue: string, permissions: string[], actorValue: string) {
    const id = this.parseId(idValue);
    const actorId = this.parseId(actorValue);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const current = await this.lockMatricula(transaction, id);
        if (!permissions.includes(ANNUL_PERMISSION)) {
          throw new ForbiddenException(
            'No tienes permiso para anular matrículas.',
          );
        }

        if (!occupied(current.estado)) {
          return toResponse(
            await transaction.matriculas.findUniqueOrThrow({
              where: { id },
              include: RESPONSE_INCLUDE,
            }),
          );
        }

        const course = await transaction.cursos.findUnique({
          where: { id: current.curso_id },
        });
        if (!course) {
          validation('curso_id', 'El curso de origen ya no existe.');
        }
        await transaction.cursos.update({
          where: { id: current.curso_id },
          data: {
            cupos_disponibles: { increment: 1 },
            updated_at: new Date(),
          },
        });
        const payments = await transaction.matricula_pagos.aggregate({
          where: { matricula_id: id },
          _sum: { monto: true },
          _count: { _all: true },
        });
        const paid = payments._sum.monto ?? new Prisma.Decimal(0);
        const annulled = await transaction.matriculas.update({
          where: { id },
          data: { estado: 'anulada', updated_at: new Date() },
          include: RESPONSE_INCLUDE,
        });
        // Los pagos no se revierten automáticamente: se deja constancia del
        // monto cobrado para que administración concilie o reembolse.
        await writeAudit(transaction, {
          userId: actorId,
          action: 'matriculas.anulada',
          modelType: 'matriculas',
          modelId: id,
          changes: {
            estado_anterior: current.estado,
            pagado: paid.toString(),
            pagos_registrados: payments._count._all,
            requiere_conciliacion: paid.gt(0),
          },
        });
        return {
          ...toResponse(annulled),
          pagado: paid.toString(),
          requiere_conciliacion: paid.gt(0),
        };
      });
    } catch (error: unknown) {
      this.mapWriteError(error);
      throw error;
    }
  }

  async restore(idValue: string, actorValue: string) {
    const id = this.parseId(idValue);
    const actorId = this.parseId(actorValue);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const current = await this.lockMatricula(transaction, id, {
          allowDeleted: true,
        });
        if (current.deleted_at === null) {
          throw new NotFoundException('No se encontró la matrícula eliminada.');
        }

        if (occupied(current.estado)) {
          const [student, course] = await Promise.all([
            transaction.estudiantes.findUnique({
              where: { id: current.estudiante_id },
            }),
            transaction.cursos.findUnique({ where: { id: current.curso_id } }),
          ]);
          this.requireActiveStudent(student);
          this.requireActiveCourse(course);
          await this.ensureNoDuplicate(
            transaction,
            current.estudiante_id,
            current.curso_id,
            id,
          );
          if (course.cupos_disponibles <= 0) {
            validation('curso_id', 'El curso no tiene cupos disponibles.');
          }
          await transaction.cursos.update({
            where: { id: current.curso_id },
            data: {
              cupos_disponibles: { decrement: 1 },
              updated_at: new Date(),
            },
          });
        }

        const restored = await transaction.matriculas.update({
          where: { id },
          data: { deleted_at: null, updated_at: new Date() },
          include: RESPONSE_INCLUDE,
        });
        await writeAudit(transaction, {
          userId: actorId,
          action: 'matriculas.restaurada',
          modelType: 'matriculas',
          modelId: id,
          changes: { estado: current.estado },
        });
        return toResponse(restored);
      });
    } catch (error: unknown) {
      this.mapWriteError(error);
      throw error;
    }
  }

  private async lockMatricula(
    transaction: Transaction,
    id: bigint,
    options: {
      courseIds?: bigint[];
      studentIds?: bigint[];
      allowDeleted?: boolean;
    } = {},
  ) {
    const discovery = await transaction.matriculas.findUnique({
      where: { id },
    });
    if (!discovery) {
      throw new NotFoundException('No se encontró la matrícula.');
    }

    const courses = [discovery.curso_id, ...(options.courseIds ?? [])];
    const students = [discovery.estudiante_id, ...(options.studentIds ?? [])];
    await this.lockRows(transaction, 'cursos', courses);
    await this.lockRows(transaction, 'estudiantes', students);
    const locked = await transaction.$queryRaw<Array<{ id: bigint }>>`
      SELECT id
      FROM matriculas
      WHERE id = ${id}
      FOR UPDATE
    `;
    if (locked.length === 0) {
      throw new NotFoundException('No se encontró la matrícula.');
    }

    const current = await transaction.matriculas.findUnique({
      where: { id },
    });
    if (!current) {
      throw new NotFoundException('No se encontró la matrícula.');
    }
    if (
      current.curso_id !== discovery.curso_id ||
      current.estudiante_id !== discovery.estudiante_id
    ) {
      validation(
        'matricula',
        'Las relaciones cambiaron mientras se preparaba la operación.',
      );
    }
    if (!options.allowDeleted && current.deleted_at !== null) {
      throw new NotFoundException('No se encontró la matrícula.');
    }
    return current;
  }

  private async lockRows(
    transaction: Transaction,
    table: 'cursos' | 'estudiantes',
    ids: bigint[],
  ): Promise<void> {
    for (const id of sortedUnique(ids)) {
      if (table === 'cursos') {
        await transaction.$queryRaw<Array<{ id: bigint }>>`
          SELECT id FROM cursos WHERE id = ${id} FOR UPDATE
        `;
      } else {
        await transaction.$queryRaw<Array<{ id: bigint }>>`
          SELECT id FROM estudiantes WHERE id = ${id} FOR UPDATE
        `;
      }
    }
  }

  private async ensureNoDuplicate(
    transaction: Transaction,
    studentId: bigint,
    courseId: bigint,
    excludedId?: bigint,
  ): Promise<void> {
    const duplicate = await transaction.matriculas.findFirst({
      where: {
        estudiante_id: studentId,
        curso_id: courseId,
        deleted_at: null,
        estado: { in: ACTIVE_STATES },
        ...(excludedId ? { id: { not: excludedId } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) {
      validation(
        'estudiante_id',
        'El estudiante ya está matriculado en este curso.',
      );
    }
  }

  private requireActiveStudent(
    student: Awaited<ReturnType<Transaction['estudiantes']['findUnique']>>,
  ): asserts student {
    this.requirePresentStudent(student);
    if (student.estado !== 'activo') {
      validation('estudiante_id', 'El estudiante no está activo.');
    }
  }

  private requirePresentStudent(
    student: Awaited<ReturnType<Transaction['estudiantes']['findUnique']>>,
  ): asserts student {
    if (!student || student.deleted_at !== null) {
      validation('estudiante_id', 'El estudiante no está disponible.');
    }
  }

  private requireActiveCourse(
    course: Awaited<ReturnType<Transaction['cursos']['findUnique']>>,
  ): asserts course {
    this.requirePresentCourse(course);
    if (course.estado !== 'activo') {
      validation('curso_id', 'El curso no está activo.');
    }
  }

  private requirePresentCourse(
    course: Awaited<ReturnType<Transaction['cursos']['findUnique']>>,
  ): asserts course {
    if (!course || course.deleted_at !== null) {
      validation('curso_id', 'El curso no está disponible.');
    }
  }

  private dateOnly(value: string): Date {
    return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  }

  private parseId(value: string): bigint {
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException(
        'El identificador de matrícula o relación no es válido.',
      );
    }
    return BigInt(value);
  }

  private mapWriteError(error: unknown): void {
    if (isPrismaError(error, 'P2002')) {
      validation(
        'estudiante_id',
        'El estudiante ya está matriculado en este curso.',
      );
    }
    if (isPrismaError(error, 'P2003')) {
      validation('estudiante_id', 'La relación seleccionada no es válida.');
    }
    if (isPrismaError(error, 'P2025')) {
      throw new NotFoundException('No se encontró la matrícula.');
    }
  }
}
