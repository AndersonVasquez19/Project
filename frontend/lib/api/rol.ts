import { z } from "zod";

export const rolSchema = z.object({
  id: z.string(),
  name: z.string(),
  permissionIds: z.array(z.string()),
  assignedUsers: z.number(),
  protected: z.boolean(),
});

/** GET /roles */
export const rolesResponseSchema = z.object({
  data: z.array(rolSchema),
  permissions: z.array(z.object({ id: z.string(), name: z.string() })),
});

/** POST/PUT /roles: devuelve el rol guardado (la edición añade sessionRevoked). */
export const rolGuardadoSchema = z.object({
  id: z.string(),
  name: z.string(),
  permissionIds: z.array(z.string()),
  sessionRevoked: z.boolean().optional(),
});
