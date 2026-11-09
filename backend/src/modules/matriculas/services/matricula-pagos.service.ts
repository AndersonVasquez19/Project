import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePagoDto } from '../dtos/create-pago.dto';

// Tolera pequeños desfases de reloj entre el navegador y el servidor.
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

function parseId(value: string): bigint {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new UnprocessableEntityException(
      'El identificador de matrícula no es válido.',
    );
  }
  return BigInt(value);
}

function validation(field: string, message: string): never {
  throw new UnprocessableEntityException({
    message: 'Revisa los datos ingresados.',
    errors: { [field]: [message] },
  });
}

function serializePago(payment: {
  id: bigint;
  matricula_id: bigint;
  monto: Prisma.Decimal;
  metodo: string;
  referencia: string | null;
  nota: string | null;
  pagado_at: Date;
  registrado_por: bigint | null;
  created_at: Date;
}) {
  return {
    id: payment.id.toString(),
    matricula_id: payment.matricula_id.toString(),
    monto: payment.monto.toString(),
    metodo: payment.metodo,
    referencia: payment.referencia,
    nota: payment.nota,
    pagado_at: payment.pagado_at.toISOString(),
    registrado_por: payment.registrado_por?.toString() ?? null,
    created_at: payment.created_at.toISOString(),
  };
}

@Injectable()
export class MatriculaPagosService {
  constructor(private readonly prisma: PrismaService) {}

  async findForMatricula(idValue: string) {
    const id = parseId(idValue);
    const matricula = await this.prisma.matriculas.findFirst({
      where: { id, deleted_at: null },
      include: {
        estudiantes: {
          select: { id: true, nombres: true, apellidos: true, dni: true },
        },
        cursos: {
          select: { id: true, codigo: true, nombre: true, precio: true },
        },
        pagos: { orderBy: [{ pagado_at: 'desc' }, { id: 'desc' }] },
      },
    });
    if (!matricula) {
      throw new NotFoundException('No se encontró la matrícula.');
    }

    const total = matricula.monto_total ?? matricula.cursos.precio;
    const pagado = matricula.pagos.reduce(
      (sum, payment) => sum.plus(payment.monto),
      new Prisma.Decimal(0),
    );
    const balance = Prisma.Decimal.max(total.minus(pagado), 0);

    return {
      matricula: {
        id: matricula.id.toString(),
        fecha_matricula: matricula.fecha_matricula.toISOString(),
        estado: matricula.estado,
        estudiante: {
          id: matricula.estudiantes.id.toString(),
          nombres: matricula.estudiantes.nombres,
          apellidos: matricula.estudiantes.apellidos,
          dni: matricula.estudiantes.dni,
        },
        curso: {
          id: matricula.cursos.id.toString(),
          codigo: matricula.cursos.codigo,
          nombre: matricula.cursos.nombre,
        },
      },
      resumen: {
        total: total.toString(),
        pagado: pagado.toString(),
        saldo: balance.toString(),
        credito: Prisma.Decimal.max(pagado.minus(total), 0).toString(),
      },
      data: matricula.pagos.map(serializePago),
    };
  }

  async create(idValue: string, dto: CreatePagoDto, registeredBy: string) {
    const id = parseId(idValue);
    const userId = parseId(registeredBy);
    const amount = new Prisma.Decimal(dto.monto);
    if (amount.lte(0)) {
      validation('monto', 'El monto debe ser mayor que cero.');
    }

    return this.prisma.$transaction(async (transaction) => {
      const locked = await transaction.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM matriculas WHERE id = ${id} FOR UPDATE
      `;
      if (locked.length === 0) {
        throw new NotFoundException('No se encontró la matrícula.');
      }

      const matricula = await transaction.matriculas.findUnique({
        where: { id },
        include: {
          cursos: { select: { precio: true } },
        },
      });
      if (!matricula || matricula.deleted_at !== null) {
        throw new NotFoundException('No se encontró la matrícula.');
      }
      if (matricula.estado === 'anulada') {
        throw new ConflictException(
          'No se pueden registrar pagos en una matrícula anulada.',
        );
      }

      const total = matricula.monto_total ?? matricula.cursos.precio;
      const aggregate = await transaction.matricula_pagos.aggregate({
        where: { matricula_id: id },
        _sum: { monto: true },
      });
      const paid = aggregate._sum.monto ?? new Prisma.Decimal(0);
      const balance = total.minus(paid);
      if (balance.lte(0)) {
        validation('monto', 'La matrícula ya está pagada por completo.');
      }
      if (amount.gt(balance)) {
        validation(
          'monto',
          `El monto supera el saldo pendiente de S/ ${balance.toFixed(2)}.`,
        );
      }

      const now = new Date();
      const paidAt = dto.fecha_pago ? new Date(dto.fecha_pago) : now;
      if (paidAt.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
        validation('fecha_pago', 'La fecha de pago no puede ser futura.');
      }
      if (paidAt.getTime() < matricula.fecha_matricula.getTime()) {
        validation(
          'fecha_pago',
          'La fecha de pago no puede ser anterior a la fecha de matrícula.',
        );
      }
      const updatedPaid = paid.plus(amount);
      const payment = await transaction.matricula_pagos.create({
        data: {
          matricula_id: id,
          monto: amount,
          metodo: dto.metodo,
          referencia: dto.referencia ?? null,
          nota: dto.nota ?? null,
          pagado_at: paidAt,
          registrado_por: userId,
          created_at: now,
        },
      });
      await transaction.matriculas.update({
        where: { id },
        data: {
          monto_total: total,
          monto_pagado: updatedPaid,
          ...(updatedPaid.gte(total) ? { estado: 'pagada' } : {}),
          updated_at: now,
        },
      });
      await transaction.audit_logs.create({
        data: {
          user_id: userId,
          action: 'matriculas.pago_registrado',
          model_type: 'matriculas',
          model_id: id,
          changes: {
            pago_id: payment.id.toString(),
            monto: amount.toString(),
            metodo: dto.metodo,
          },
          created_at: now,
        },
      });

      return {
        data: serializePago(payment),
        estado: updatedPaid.gte(total) ? 'pagada' : matricula.estado,
        resumen: {
          total: total.toString(),
          pagado: updatedPaid.toString(),
          saldo: total.minus(updatedPaid).toString(),
          credito: '0',
        },
      };
    });
  }
}
