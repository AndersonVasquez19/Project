import { z } from "zod";
import { nullableText, pageSchema } from "@/lib/api/contract";

const estadoMatricula = z.enum(["pendiente", "pagada", "anulada"]);

/** Forma que devuelve MatriculasService (backend) en cada fila. */
export const matriculaSchema = z.object({
  id: z.string(),
  estudiante_id: z.string(),
  curso_id: z.string(),
  fecha_matricula: z.string(),
  estado: estadoMatricula,
  monto_pagado: nullableText,
  monto_total: nullableText,
  observaciones: nullableText,
  created_at: nullableText,
  updated_at: nullableText,
  deleted_at: nullableText,
  estudiante: z
    .object({
      id: z.string(),
      dni: z.string(),
      nombres: z.string(),
      apellidos: z.string(),
      deleted_at: nullableText,
    })
    .nullable(),
  curso: z
    .object({
      id: z.string(),
      codigo: z.string(),
      nombre: z.string(),
      estado: z.string(),
      cupos_disponibles: z.number(),
      deleted_at: nullableText,
    })
    .nullable(),
});

export const matriculasPageSchema = pageSchema(matriculaSchema);

export const pagoSchema = z.object({
  id: z.string(),
  matricula_id: z.string(),
  monto: z.string(),
  metodo: z.string(),
  referencia: nullableText,
  nota: nullableText,
  pagado_at: z.string(),
  registrado_por: nullableText,
  created_at: z.string(),
});

const resumenSchema = z.object({
  total: z.string(),
  pagado: z.string(),
  saldo: z.string(),
  credito: z.string(),
});

/** GET /matriculas/:id/pagos */
export const pagosSnapshotSchema = z.object({
  matricula: z.object({
    id: z.string(),
    fecha_matricula: z.string(),
    estado: estadoMatricula,
    estudiante: z.object({
      id: z.string(),
      nombres: z.string(),
      apellidos: z.string(),
      dni: z.string(),
    }),
    curso: z.object({ id: z.string(), codigo: z.string(), nombre: z.string() }),
  }),
  resumen: resumenSchema,
  data: z.array(pagoSchema),
});

/** POST /matriculas/:id/pagos */
export const pagoCreadoSchema = z.object({
  data: pagoSchema,
  estado: z.string(),
  resumen: resumenSchema,
});
