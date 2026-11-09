import { z } from "zod";
import { nullableText, pageSchema } from "@/lib/api/contract";

/** Forma que devuelve CursosService (backend) en cada fila. */
export const cursoSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  nombre: z.string(),
  descripcion: z.string(),
  categoria: z.enum(["tecnologia", "educacion", "salud", "gestion", "otros"]),
  duracion_horas: z.number(),
  precio: z.string(),
  modalidad: z.enum(["presencial", "virtual", "hibrido"]),
  horario: z.string(),
  cupos_maximos: z.number(),
  cupos_disponibles: z.number(),
  estado: z.enum(["activo", "inactivo", "archivado"]),
  created_at: nullableText,
  updated_at: nullableText,
  deleted_at: nullableText,
});

export const cursosPageSchema = pageSchema(cursoSchema);
