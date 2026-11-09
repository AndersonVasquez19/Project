import { z } from "zod";
import { pageMetaSchema } from "@/lib/api/contract";

export const usuarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  roles: z.array(z.string()),
});

/** GET /usuarios: la página incluye los roles que quien consulta puede asignar. */
export const usuariosPageSchema = z.object({
  data: z.array(usuarioSchema),
  assignableRoles: z.array(z.string()),
  meta: pageMetaSchema,
});

/** PUT /usuarios/:id */
export const usuarioActualizadoSchema = usuarioSchema.extend({
  sessionRevoked: z.boolean(),
});
