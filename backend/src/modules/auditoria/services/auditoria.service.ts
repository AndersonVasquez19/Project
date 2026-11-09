import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ListAuditLogsDto } from '../dtos/list-audit-logs.dto';

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const search = query.search?.trim();
    const where: Prisma.audit_logsWhereInput = search
      ? {
          OR: [
            { action: { contains: search } },
            { model_type: { contains: search } },
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      this.prisma.audit_logs.findMany({
        where,
        select: {
          id: true,
          action: true,
          model_type: true,
          model_id: true,
          created_at: true,
          users: { select: { name: true } },
        },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.audit_logs.count({ where }),
    ]);
    return {
      data: rows.map((row) => ({
        id: row.id.toString(),
        action: row.action,
        model_type: row.model_type,
        model_id: row.model_id?.toString() ?? null,
        created_at: row.created_at.toISOString(),
        actor: row.users?.name ?? 'Sistema',
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
