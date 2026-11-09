type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Lista de permitidos del proxy del panel: solo estas rutas de la API NestJS se
 * pueden alcanzar desde el navegador. ":id" admite un entero positivo.
 * Mantener alineado con los controladores del backend.
 */
const RULES: ReadonlyArray<readonly [string, readonly Method[]]> = [
  ["aprobaciones", ["GET", "POST"]],
  ["aprobaciones/:id/decision", ["PATCH"]],
  ["asistente/estado", ["GET"]],
  ["asistente/chat", ["POST"]],
  ["auditoria", ["GET"]],
  ["configuracion", ["GET", "PUT"]],
  ["cotizaciones", ["GET", "POST"]],
  ["cotizaciones/:id", ["PATCH"]],
  ["cursos", ["GET", "POST"]],
  ["cursos/:id", ["PUT", "DELETE"]],
  ["cursos/:id/restore", ["PATCH"]],
  ["dashboard", ["GET"]],
  ["estudiantes", ["GET", "POST"]],
  ["estudiantes/:id", ["PUT", "DELETE"]],
  ["estudiantes/:id/restore", ["PATCH"]],
  ["matriculas", ["GET", "POST"]],
  ["matriculas/:id", ["PUT", "DELETE"]],
  ["matriculas/:id/anular", ["PATCH"]],
  ["matriculas/:id/restore", ["PATCH"]],
  ["matriculas/:id/pagos", ["GET", "POST"]],
  ["notificaciones", ["GET"]],
  ["notificaciones/leer-todas", ["PATCH"]],
  ["notificaciones/:id/leer", ["PATCH"]],
  ["reclamaciones", ["GET"]],
  ["reclamaciones/:id/asignar", ["PATCH"]],
  ["reclamaciones/:id/notas", ["POST"]],
  ["reportes/matriculas", ["GET"]],
  ["roles", ["GET", "POST"]],
  ["roles/:id", ["PUT", "DELETE"]],
  ["servicios-tecnologicos", ["GET", "POST"]],
  ["servicios-tecnologicos/:id", ["PUT"]],
  ["servicios-tecnologicos/:id/archive", ["PATCH"]],
  ["usuarios", ["GET", "POST"]],
  ["usuarios/:id", ["PUT"]],
];

const ID = /^[1-9]\d{0,18}$/;
const LITERAL = /^[a-z][a-z-]*$/;

export type ApiRouteMatch = {
  /** Ruta en la API (sin /api), con los ids ya validados. */
  path: string;
  /** Recurso (primer segmento), para los mensajes de error. */
  label: string;
};

/** Devuelve la ruta permitida o null si el método/ruta no está en la lista. */
export function matchApiRoute(
  method: string,
  segments: readonly string[],
): ApiRouteMatch | null {
  const verb = method.toUpperCase() as Method;

  for (const [pattern, methods] of RULES) {
    const parts = pattern.split("/");
    if (parts.length !== segments.length || !methods.includes(verb)) {
      continue;
    }

    const matches = parts.every((part, index) => {
      const segment = segments[index];
      return part === ":id"
        ? ID.test(segment)
        : LITERAL.test(segment) && segment === part;
    });

    if (matches) {
      return { path: `/${segments.join("/")}`, label: parts[0] };
    }
  }

  return null;
}
