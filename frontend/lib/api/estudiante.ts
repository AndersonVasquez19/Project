import { z } from "zod";
import { nullableText, pageSchema } from "@/lib/api/contract";

/** Forma que devuelve EstudiantesService (backend) en cada fila. */
export const estudianteSchema = z.object({
  id: z.string(),
  dni: z.string(),
  nombres: z.string(),
  apellidos: z.string(),
  email: nullableText,
  telefono: nullableText,
  fecha_nacimiento: nullableText,
  direccion: nullableText,
  estado: z.enum(["activo", "inactivo"]),
  created_at: nullableText,
  updated_at: nullableText,
  deleted_at: nullableText,
});

export const estudiantesPageSchema = pageSchema(estudianteSchema);
