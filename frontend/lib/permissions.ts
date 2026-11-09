/**
 * Catálogo de permisos del backend (tabla `permissions`, guard `web`).
 * Mantener alineado con los `@RequirePermissions(...)` de NestJS.
 */
export const PERMISSIONS = [
  "usuarios.ver",
  "usuarios.crear",
  "usuarios.editar",
  "usuarios.asignar-roles",
  "roles.ver",
  "roles.editar",
  "estudiantes.ver",
  "estudiantes.crear",
  "estudiantes.editar",
  "estudiantes.eliminar",
  "estudiantes.restaurar",
  "cursos.ver",
  "cursos.crear",
  "cursos.editar",
  "cursos.eliminar",
  "cursos.restaurar",
  "matriculas.ver",
  "matriculas.crear",
  "matriculas.editar",
  "matriculas.eliminar",
  "matriculas.anular",
  "matriculas.restaurar",
  "servicios.ver",
  "servicios.crear",
  "servicios.editar",
  "cotizaciones.ver",
  "cotizaciones.crear",
  "cotizaciones.editar",
  "reclamaciones.ver",
  "reclamaciones.editar",
  "aprobaciones.ver",
  "aprobaciones.crear",
  "aprobaciones.editar",
  "asistente.ver",
  "auditoria.ver",
  "configuracion.ver",
  "configuracion.editar",
  "reportes.ver",
  "respaldo.ver",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** true si la lista de permisos del usuario incluye `permission`. */
export function can(
  permissions: readonly string[],
  permission: Permission,
): boolean {
  return permissions.includes(permission);
}
