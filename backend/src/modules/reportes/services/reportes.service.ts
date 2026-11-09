import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ListReporteMatriculasDto } from '../dtos/list-reporte-matriculas.dto';

const MAX_ROWS = 10_000;

function decimal(value: Prisma.Decimal | null | undefined): Prisma.Decimal {
  return value ?? new Prisma.Decimal(0);
}

function nextDay(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async matriculas(query: ListReporteMatriculasDto) {
    if (query.desde && query.hasta && query.desde > query.hasta) {
      throw new UnprocessableEntityException({
        message: 'Revisa los datos ingresados.',
        errors: {
          desde: ['La fecha inicial no puede ser posterior a la final.'],
        },
      });
    }

    const cursoId =
      query.curso_id === undefined ? undefined : BigInt(query.curso_id);
    const fechaFilter =
      query.desde || query.hasta
        ? {
            fecha_matricula: {
              ...(query.desde
                ? { gte: new Date(`${query.desde}T00:00:00.000Z`) }
                : {}),
              ...(query.hasta ? { lt: nextDay(query.hasta) } : {}),
            },
          }
        : {};
    const [rows, settings] = await Promise.all([
      this.prisma.matriculas.findMany({
        where: {
          deleted_at: null,
          ...(query.estado ? { estado: query.estado } : {}),
          ...(cursoId ? { curso_id: cursoId } : {}),
          ...fechaFilter,
        },
        select: {
          id: true,
          fecha_matricula: true,
          estado: true,
          monto_pagado: true,
          monto_total: true,
          estudiantes: {
            select: { dni: true, nombres: true, apellidos: true },
          },
          cursos: {
            select: { codigo: true, nombre: true, precio: true },
          },
        },
        orderBy: [{ fecha_matricula: 'desc' }, { id: 'desc' }],
        take: MAX_ROWS + 1,
      }),
      this.prisma.system_settings.findMany({
        where: {
          key: {
            in: [
              'system.name',
              'system.currency',
              'reports.company_name',
              'reports.footer',
            ],
          },
        },
        select: { key: true, value: true },
      }),
    ]);
    if (rows.length > MAX_ROWS) {
      throw new BadRequestException(
        'El reporte supera 10 000 matrículas. Agrega filtros para reducir los resultados.',
      );
    }

    const ids = rows.map(({ id }) => id);
    const paymentSums =
      ids.length === 0
        ? []
        : await this.prisma.matricula_pagos.groupBy({
            by: ['matricula_id'],
            where: { matricula_id: { in: ids } },
            _sum: { monto: true },
          });
    const paidByMatricula = new Map(
      paymentSums.map(({ matricula_id, _sum }) => [
        matricula_id.toString(),
        decimal(_sum.monto),
      ]),
    );
    const data = rows.map((row) => {
      const total = row.monto_total ?? row.cursos.precio;
      const paid =
        paidByMatricula.get(row.id.toString()) ?? decimal(row.monto_pagado);
      const balance = Prisma.Decimal.max(total.minus(paid), 0);
      return {
        id: row.id.toString(),
        fecha_matricula: row.fecha_matricula.toISOString().slice(0, 10),
        estado: row.estado,
        estudiante_dni: row.estudiantes.dni,
        estudiante: `${row.estudiantes.nombres} ${row.estudiantes.apellidos}`,
        curso_codigo: row.cursos.codigo,
        curso: row.cursos.nombre,
        total: total.toString(),
        pagado: paid.toString(),
        saldo: balance.toString(),
        credito: Prisma.Decimal.max(paid.minus(total), 0).toString(),
      };
    });
    const totals = data.reduce(
      (sum, row) => ({
        matriculas: sum.matriculas + 1,
        total: sum.total.plus(row.total),
        pagado: sum.pagado.plus(row.pagado),
        saldo: sum.saldo.plus(row.saldo),
      }),
      {
        matriculas: 0,
        total: new Prisma.Decimal(0),
        pagado: new Prisma.Decimal(0),
        saldo: new Prisma.Decimal(0),
      },
    );
    const settingValues = new Map(
      settings.map(({ key, value }) => [key, value ?? '']),
    );

    return {
      presentacion: {
        nombre: settingValues.get('system.name') || 'Horus',
        nombre_reportes: settingValues.get('reports.company_name') || 'Horus',
        pie: settingValues.get('reports.footer') ?? '',
        moneda: settingValues.get('system.currency') === 'USD' ? 'USD' : 'PEN',
      },
      filtros: {
        desde: query.desde ?? null,
        hasta: query.hasta ?? null,
        curso_id: query.curso_id ?? null,
        estado: query.estado ?? null,
      },
      resumen: {
        matriculas: totals.matriculas,
        total: totals.total.toString(),
        pagado: totals.pagado.toString(),
        saldo: totals.saldo.toString(),
      },
      data,
    };
  }
}
