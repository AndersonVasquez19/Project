import { createHash, randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCotizacionDto } from '../dtos/create-cotizacion.dto';
import { ListCotizacionesDto } from '../dtos/list-cotizaciones.dto';
import { UpdateCotizacionDto } from '../dtos/update-cotizacion.dto';

function parseId(value: string): bigint {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new UnprocessableEntityException(
      'El identificador de cotización no es válido.',
    );
  }
  return BigInt(value);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function toResponse(row: {
  id: bigint;
  codigo: string;
  recibida_at: Date;
  servicio_nombre_historico: string | null;
  necesidad_cliente: string;
  contacto_nombre: string;
  contacto_email: string | null;
  contacto_telefono: string | null;
  estado: string;
  responsable_id: bigint | null;
  ultimo_seguimiento_at: Date | null;
  proximo_seguimiento: Date | null;
  revision: number;
  origen: string;
  servicios_tecnologicos: { nombre: string } | null;
  users_solicitudes_cotizacion_responsable_idTousers: {
    id: bigint;
    name: string;
  } | null;
}) {
  return {
    id: row.id.toString(),
    codigo: row.codigo,
    recibida_at: row.recibida_at.toISOString(),
    servicio:
      row.servicios_tecnologicos?.nombre ??
      row.servicio_nombre_historico ??
      'Servicio no especificado',
    necesidad_cliente: row.necesidad_cliente,
    contacto_nombre: row.contacto_nombre,
    contacto_email: row.contacto_email,
    contacto_telefono: row.contacto_telefono,
    estado: row.estado,
    responsable_id: row.responsable_id?.toString() ?? null,
    responsable: row.users_solicitudes_cotizacion_responsable_idTousers
      ? {
          id: row.users_solicitudes_cotizacion_responsable_idTousers.id.toString(),
          nombre: row.users_solicitudes_cotizacion_responsable_idTousers.name,
        }
      : null,
    ultimo_seguimiento_at: row.ultimo_seguimiento_at?.toISOString() ?? null,
    proximo_seguimiento: row.proximo_seguimiento?.toISOString() ?? null,
    revision: row.revision,
    origen: row.origen,
  };
}

const COTIZACION_INCLUDE = {
  servicios_tecnologicos: { select: { nombre: true } },
  users_solicitudes_cotizacion_responsable_idTousers: {
    select: { id: true, name: true },
  },
} as const;

@Injectable()
export class CotizacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListCotizacionesDto) {
    const search = query.search?.trim();
    const where: Prisma.solicitudes_cotizacionWhereInput = {
      ...(query.estado ? { estado: query.estado } : {}),
      ...(search
        ? {
            OR: [
              { codigo: { contains: search } },
              { contacto_nombre: { contains: search } },
              { contacto_email: { contains: search } },
              { necesidad_cliente: { contains: search } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.solicitudes_cotizacion.findMany({
        where,
        include: COTIZACION_INCLUDE,
        orderBy: [{ recibida_at: 'desc' }, { id: 'desc' }],
        take: 200,
      }),
      this.prisma.solicitudes_cotizacion.count({ where }),
    ]);
    return {
      data: rows.map(toResponse),
      total,
      limite: 200,
    };
  }

  async create(dto: CreateCotizacionDto, actorValue: string) {
    const actorId = parseId(actorValue);
    const serviceId = dto.servicio_id ? parseId(dto.servicio_id) : null;
    const service = serviceId
      ? await this.prisma.servicios_tecnologicos.findUnique({
          where: { id: serviceId },
          select: { nombre: true, identificador_publico: true },
        })
      : null;
    if (serviceId && !service) {
      throw new UnprocessableEntityException(
        'El servicio seleccionado no está disponible.',
      );
    }

    const now = new Date();
    const identifier = randomUUID();
    const code = `COT-${now.getFullYear()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;
    const fingerprint = hash(
      JSON.stringify({
        contacto_nombre: dto.contacto_nombre.trim(),
        contacto_email: dto.contacto_email ?? null,
        necesidad_cliente: dto.necesidad_cliente.trim(),
      }),
    );
    const requestKey = hash(identifier);

    const created = await this.prisma.$transaction(async (transaction) => {
      const row = await transaction.solicitudes_cotizacion.create({
        data: {
          identificador: identifier,
          codigo: code,
          recibida_at: now,
          servicio_id: serviceId,
          servicio_uuid: service?.identificador_publico ?? null,
          servicio_nombre_historico: service?.nombre ?? null,
          necesidad_cliente: dto.necesidad_cliente.trim(),
          contacto_nombre: dto.contacto_nombre.trim(),
          contacto_email: dto.contacto_email ?? null,
          contacto_telefono: dto.contacto_telefono ?? null,
          estado: 'recibida',
          creado_por: actorId,
          revision: 1,
          creador_ambito: actorId,
          creacion_clave_hash: requestKey,
          creacion_huella: fingerprint,
          created_at: now,
          updated_at: now,
          origen: 'administrativo',
        },
        include: COTIZACION_INCLUDE,
      });
      await transaction.cotizacion_historial.create({
        data: {
          solicitud_id: row.id,
          revision: 1,
          evento: 'solicitud_creada',
          actor_id: actorId,
          metadatos: {
            estado: row.estado,
            codigo: row.codigo,
          },
          nota: 'Solicitud creada desde el panel administrativo.',
          actor_ambito: actorId,
          clave_hash: requestKey,
          huella: fingerprint,
          created_at: now,
        },
      });
      await transaction.audit_logs.create({
        data: {
          user_id: actorId,
          action: 'cotizaciones.creada',
          model_type: 'solicitudes_cotizacion',
          model_id: row.id,
          changes: { codigo: row.codigo, estado: row.estado },
          created_at: now,
        },
      });
      return row;
    });
    return toResponse(created);
  }

  async update(idValue: string, dto: UpdateCotizacionDto, actorValue: string) {
    const id = parseId(idValue);
    const actorId = parseId(actorValue);
    const [user, responsible] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: actorId },
        select: { name: true },
      }),
      dto.responsable_id
        ? this.prisma.user.findUnique({
            where: { id: parseId(dto.responsable_id) },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);
    if (!user) {
      throw new NotFoundException('No se encontró el usuario autenticado.');
    }
    if (dto.responsable_id && !responsible) {
      throw new UnprocessableEntityException(
        'El responsable seleccionado no existe.',
      );
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.solicitudes_cotizacion.findUnique({
        where: { id },
        select: {
          id: true,
          codigo: true,
          revision: true,
          estado: true,
          proximo_seguimiento: true,
          responsable_id: true,
        },
      });
      if (!current) {
        throw new NotFoundException(
          'No se encontró la solicitud de cotización.',
        );
      }
      if (current.revision !== dto.revision) {
        throw new ConflictException(
          'La solicitud cambió. Actualiza la lista antes de guardar.',
        );
      }

      const responsibleId = dto.responsable_id
        ? parseId(dto.responsable_id)
        : null;
      const nextRevision = current.revision + 1;
      const result = await transaction.solicitudes_cotizacion.updateMany({
        where: { id, revision: current.revision },
        data: {
          estado: dto.estado,
          ...(dto.proximo_seguimiento !== undefined
            ? {
                proximo_seguimiento: dto.proximo_seguimiento
                  ? new Date(
                      `${dto.proximo_seguimiento.slice(0, 10)}T00:00:00.000Z`,
                    )
                  : null,
              }
            : {}),
          ...(dto.responsable_id !== undefined
            ? { responsable_id: responsibleId }
            : {}),
          ultimo_seguimiento_at: now,
          revision: { increment: 1 },
          updated_at: now,
        },
      });
      if (result.count !== 1) {
        throw new ConflictException(
          'La solicitud cambió mientras se guardaba.',
        );
      }

      const huella = hash(
        JSON.stringify({
          estado: dto.estado,
          proximo_seguimiento: dto.proximo_seguimiento ?? null,
          responsable_id: dto.responsable_id ?? null,
          nota: dto.nota ?? null,
        }),
      );
      const key = hash(randomUUID());
      await transaction.cotizacion_historial.create({
        data: {
          solicitud_id: id,
          revision: nextRevision,
          evento: 'seguimiento_actualizado',
          actor_id: actorId,
          metadatos: {
            estado_anterior: current.estado,
            estado: dto.estado,
            proximo_seguimiento: dto.proximo_seguimiento ?? null,
            responsable_id: dto.responsable_id ?? null,
          },
          nota: dto.nota?.trim() || null,
          actor_ambito: actorId,
          clave_hash: key,
          huella,
          created_at: now,
        },
      });
      await transaction.audit_logs.create({
        data: {
          user_id: actorId,
          action: 'cotizaciones.actualizada',
          model_type: 'solicitudes_cotizacion',
          model_id: id,
          changes: {
            estado_anterior: current.estado,
            estado: dto.estado,
            revision: nextRevision,
          },
          created_at: now,
        },
      });

      return transaction.solicitudes_cotizacion.findUniqueOrThrow({
        where: { id },
        include: COTIZACION_INCLUDE,
      });
    });
    return toResponse(updated);
  }
}
