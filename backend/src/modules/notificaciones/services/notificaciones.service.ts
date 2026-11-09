import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

function parseId(value: string): bigint {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new BadRequestException('El identificador no es válido.');
  }
  return BigInt(value);
}

@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userValue: string) {
    const userId = parseId(userValue);
    const rows = await this.prisma.notificaciones_internas.findMany({
      where: { user_id: userId },
      orderBy: [{ leida: 'asc' }, { created_at: 'desc' }, { id: 'desc' }],
      take: 100,
    });
    return {
      data: rows.map((row) => ({
        id: row.id.toString(),
        titulo: row.titulo,
        mensaje: row.mensaje,
        tipo: row.tipo,
        leida: row.leida,
        vinculo: row.vinculo,
        created_at: row.created_at?.toISOString() ?? null,
      })),
      no_leidas: rows.filter((row) => !row.leida).length,
    };
  }

  async markRead(idValue: string, userValue: string) {
    const id = parseId(idValue);
    const userId = parseId(userValue);
    const updated = await this.prisma.notificaciones_internas.updateMany({
      where: { id, user_id: userId, leida: false },
      data: { leida: true, updated_at: new Date() },
    });
    if (updated.count === 0) {
      const existing = await this.prisma.notificaciones_internas.findFirst({
        where: { id, user_id: userId },
        select: { id: true },
      });
      if (!existing) {
        throw new NotFoundException('No se encontró la notificación.');
      }
    }
    return { id: id.toString(), leida: true };
  }

  async markAllRead(userValue: string) {
    const userId = parseId(userValue);
    const result = await this.prisma.notificaciones_internas.updateMany({
      where: { user_id: userId, leida: false },
      data: { leida: true, updated_at: new Date() },
    });
    return { actualizadas: result.count };
  }
}
