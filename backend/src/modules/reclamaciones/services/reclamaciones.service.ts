import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AddReclamacionNoteDto } from '../dtos/add-reclamacion-note.dto';
import { ListReclamacionesDto } from '../dtos/list-reclamaciones.dto';

function parseId(value: string): bigint {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new BadRequestException(
      'El identificador de reclamación no es válido.',
    );
  }
  return BigInt(value);
}

const RECLAMACION_INCLUDE = {
  users: { select: { id: true, name: true } },
} as const;

@Injectable()
export class ReclamacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListReclamacionesDto) {
    const search = query.search?.trim();
    const where: Prisma.reclamacionesWhereInput = {
      ...(query.estado ? { estado: query.estado } : {}),
      ...(search
        ? {
            OR: [
              { numero: { contains: search } },
              { nombres: { contains: search } },
              { apellidos: { contains: search } },
              { numero_documento: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.reclamaciones.findMany({
        where,
        include: {
          ...RECLAMACION_INCLUDE,
          reclamacion_historial: {
            select: {
              id: true,
              evento: true,
              actor_nombre: true,
              nota: true,
              created_at: true,
            },
            orderBy: { id: 'desc' },
            take: 10,
          },
        },
        orderBy: [{ fecha_limite: 'asc' }, { id: 'desc' }],
        take: 200,
      }),
      this.prisma.reclamaciones.count({ where }),
    ]);
    return {
      data: rows.map((row) => ({
        id: row.id.toString(),
        numero: row.numero,
        estado: row.estado,
        recibida_at: row.recibida_at.toISOString(),
        fecha_limite: row.fecha_limite.toISOString().slice(0, 10),
        nombres: row.nombres,
        apellidos: row.apellidos,
        tipo_documento: row.tipo_documento,
        numero_documento: row.numero_documento,
        telefono: row.telefono,
        email: row.email,
        canal_respuesta: row.canal_respuesta,
        tipo: row.tipo,
        bien_tipo: row.bien_tipo,
        bien_descripcion: row.bien_descripcion,
        monto_bien: row.monto_bien?.toString() ?? null,
        detalle: row.detalle,
        pedido: row.pedido,
        respuesta: row.respuesta,
        respondida_at: row.respondida_at?.toISOString() ?? null,
        responsable_id: row.responsable_id?.toString() ?? null,
        responsable: row.users
          ? { id: row.users.id.toString(), nombre: row.users.name }
          : null,
        historial: row.reclamacion_historial.map((entry) => ({
          id: entry.id.toString(),
          evento: entry.evento,
          actor: entry.actor_nombre,
          nota: entry.nota,
          created_at: entry.created_at.toISOString(),
        })),
      })),
      total,
      limite: 200,
    };
  }

  async addNote(
    idValue: string,
    dto: AddReclamacionNoteDto,
    actorValue: string,
  ) {
    const id = parseId(idValue);
    const actorId = parseId(actorValue);
    const now = new Date();
    return this.prisma.$transaction(async (transaction) => {
      const [reclamacion, actor] = await Promise.all([
        transaction.reclamaciones.findUnique({
          where: { id },
          select: { id: true },
        }),
        transaction.user.findUnique({
          where: { id: actorId },
          select: { name: true },
        }),
      ]);
      if (!reclamacion) {
        throw new NotFoundException('No se encontró la reclamación.');
      }
      if (!actor) {
        throw new NotFoundException('No se encontró el usuario autenticado.');
      }
      const history = await transaction.reclamacion_historial.create({
        data: {
          reclamacion_id: id,
          evento: 'nota_interna',
          actor_id: actorId,
          actor_nombre: actor.name.slice(0, 120),
          metadatos: {},
          nota: dto.nota.trim(),
          created_at: now,
        },
        select: { id: true },
      });
      await transaction.audit_logs.create({
        data: {
          user_id: actorId,
          action: 'reclamaciones.nota_interna',
          model_type: 'reclamaciones',
          model_id: id,
          changes: { historial_id: history.id.toString() },
          created_at: now,
        },
      });
      return { id: history.id.toString(), guardada: true };
    });
  }

  async assignToSelf(idValue: string, actorValue: string) {
    const id = parseId(idValue);
    const actorId = parseId(actorValue);
    const now = new Date();
    return this.prisma.$transaction(async (transaction) => {
      const [reclamacion, actor] = await Promise.all([
        transaction.reclamaciones.findUnique({
          where: { id },
          select: { id: true, responsable_id: true },
        }),
        transaction.user.findUnique({
          where: { id: actorId },
          select: { name: true },
        }),
      ]);
      if (!reclamacion) {
        throw new NotFoundException('No se encontró la reclamación.');
      }
      if (!actor) {
        throw new NotFoundException('No se encontró el usuario autenticado.');
      }
      if (reclamacion.responsable_id === actorId) {
        return { id: id.toString(), asignada: true };
      }

      await transaction.reclamaciones.update({
        where: { id },
        data: { responsable_id: actorId, updated_at: now },
      });
      await transaction.reclamacion_historial.create({
        data: {
          reclamacion_id: id,
          evento: 'responsable_asignado',
          actor_id: actorId,
          actor_nombre: actor.name.slice(0, 120),
          metadatos: {
            responsable_anterior:
              reclamacion.responsable_id?.toString() ?? null,
            responsable_nuevo: actorId.toString(),
          },
          nota: null,
          created_at: now,
        },
      });
      await transaction.audit_logs.create({
        data: {
          user_id: actorId,
          action: 'reclamaciones.asignada',
          model_type: 'reclamaciones',
          model_id: id,
          changes: { responsable_id: actorId.toString() },
          created_at: now,
        },
      });
      return { id: id.toString(), asignada: true };
    });
  }
}
