/**
 * Catálogo único de permisos (tabla `permissions`, guard `web`).
 *
 * Fuente de verdad en el backend. `permissions.spec.ts` comprueba que:
 *  - cada @RequirePermissions(...) de los controladores existe aquí,
 *  - cada permiso está sembrado en prisma/manual-migrations,
 *  - frontend/lib/permissions.ts lista exactamente los mismos.
 */
export const PERMISSIONS = [
  'usuarios.ver',
  'usuarios.crear',
  'usuarios.editar',
  'usuarios.asignar-roles',
  'roles.ver',
  'roles.editar',
  'estudiantes.ver',
  'estudiantes.crear',
  'estudiantes.editar',
  'estudiantes.eliminar',
  'estudiantes.restaurar',
  'cursos.ver',
  'cursos.crear',
  'cursos.editar',
  'cursos.eliminar',
  'cursos.restaurar',
  'matriculas.ver',
  'matriculas.crear',
  'matriculas.editar',
  'matriculas.eliminar',
  'matriculas.anular',
  'matriculas.restaurar',
  'servicios.ver',
  'servicios.crear',
  'servicios.editar',
  'cotizaciones.ver',
  'cotizaciones.crear',
  'cotizaciones.editar',
  'reclamaciones.ver',
  'reclamaciones.editar',
  'aprobaciones.ver',
  'aprobaciones.crear',
  'aprobaciones.editar',
  'asistente.ver',
  'auditoria.ver',
  'configuracion.ver',
  'configuracion.editar',
  'reportes.ver',
  'respaldo.ver',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
