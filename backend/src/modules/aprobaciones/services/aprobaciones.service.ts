import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAprobacionDto } from '../dtos/create-aprobacion.dto';
import { DecisionAprobacionDto } from '../dtos/decision-aprobacion.dto';

function parseId(value: string): bigint {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new BadRequestException(
      'El identificador de aprobación no es válido.',
    );
  }
  return BigInt(value);
}

@Injectable()
export class AprobacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.aprobaciones_internas.findMany({
      include: {
        users_aprobaciones_internas_solicitante_idTousers: {
          select: { id: true, name: true },
        },
        users_aprobaciones_internas_aprobador_idTousers: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: 200,
    });
    return {
      data: rows.map((row) => ({
        id: row.id.toString(),
        titulo: row.titulo,
        tipo: row.tipo,
        descripcion: row.descripcion,
        estado: row.estado,
        comentario: row.comentario,
        referencia: row.referencia,
        created_at: row.created_at?.toISOString() ?? null,
        updated_at: row.updated_at?.toISOString() ?? null,
        solicitante: row.users_aprobaciones_internas_solicitante_idTousers
          ? {
              id: row.users_aprobaciones_internas_solicitante_idTousers.id.toString(),
              nombre:
                row.users_aprobaciones_internas_solicitante_idTousers.name,
            }
          : null,
        aprobador: row.users_aprobaciones_internas_aprobador_idTousers
          ? {
              id: row.users_aprobaciones_internas_aprobador_idTousers.id.toString(),
              nombre: row.users_aprobaciones_internas_aprobador_idTousers.name,
            }
          : null,
      })),
      limite: 200,
    };
  }

  async create(dto: CreateAprobacionDto, actorValue: string) {
    const actorId = parseId(actorValue);
    const now = new Date();
    return this.prisma.$transaction(async (transaction) => {
      const approval = await transaction.aprobaciones_internas.create({
        data: {
          titulo: dto.titulo.trim(),
          tipo: dto.tipo?.trim() || 'solicitud',
          descripcion: dto.descripcion?.trim() || null,
          referencia: dto.referencia?.trim() || null,
          estado: 'pendiente',
          solicitante_id: actorId,
          created_at: now,
          updated_at: now,
        },
        select: { id: true, titulo: true, estado: true },
      });
      await transaction.audit_logs.create({
        data: {
          user_id: actorId,
          action: 'aprobaciones.creada',
          model_type: 'aprobaciones_internas',
          model_id: approval.id,
          changes: { titulo: approval.titulo, estado: approval.estado },
          created_at: now,
        },
      });
      return {
        id: approval.id.toString(),
        titulo: approval.titulo,
        estado: approval.estado,
      };
    });
  }

  async decide(
    idValue: string,
    dto: DecisionAprobacionDto,
    actorValue: string,
  ) {
    const id = parseId(idValue);
    const actorId = parseId(actorValue);
    const now = new Date();
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.aprobaciones_internas.findUnique({
        where: { id },
        select: {
          id: true,
          estado: true,
          titulo: true,
          solicitante_id: true,
        },
      });
      if (!existing) {
        throw new NotFoundException(
          'No se encontró la solicitud de aprobación.',
        );
      }
      // Separación de funciones: nadie resuelve lo que solicitó.
      if (existing.solicitante_id === actorId) {
        throw new ForbiddenException(
          'No puedes resolver una solicitud que creaste tú. Pide a otra persona autorizada que la revise.',
        );
      }
      if (existing.estado !== 'pendiente') {
        throw new ConflictException(
          'La solicitud ya fue resuelta y no admite otra decisión.',
        );
      }

      const updated = await transaction.aprobaciones_internas.updateMany({
        where: { id, estado: 'pendiente' },
        data: {
          estado: dto.estado,
          comentario: dto.comentario?.trim() || null,
          aprobador_id: actorId,
          updated_at: now,
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'La solicitud cambió mientras se registraba la decisión.',
        );
      }
      await transaction.audit_logs.create({
        data: {
          user_id: actorId,
          action: `aprobaciones.${dto.estado}`,
          model_type: 'aprobaciones_internas',
          model_id: id,
          changes: {
            estado_anterior: existing.estado,
            estado: dto.estado,
            comentario: dto.comentario?.trim() || null,
          },
          created_at: now,
        },
      });
      return { id: id.toString(), estado: dto.estado };
    });
  }
}
