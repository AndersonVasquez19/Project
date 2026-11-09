import { NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Defensa CSRF adicional a SameSite=Lax: en peticiones que modifican datos,
 * si el navegador envía `Origin` debe coincidir con el host de la petición.
 * Devuelve una respuesta 403 si no coincide, o null si la petición es válida.
 */
export function rejectCrossOrigin(request: Request): NextResponse | null {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return null;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    // Clientes no navegador (curl, tests): no hay Origin que contrastar.
    return null;
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    originHost = "";
  }

  if (!host || originHost !== host) {
    return NextResponse.json(
      { message: "Origen de la solicitud no permitido." },
      { status: 403 },
    );
  }

  return null;
}

/**
 * IP del cliente para el límite de intentos del backend. Se toma la ÚLTIMA
 * entrada de X-Forwarded-For (la que añade nuestro proxy de confianza); las
 * anteriores las controla el cliente y podrían falsificarse.
 * Solo es fiable si Next corre detrás de un proxy inverso que añade la cabecera.
 */
export function clientIpHeaders(request: Request): Record<string, string> {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidate =
    forwarded?.split(",").at(-1)?.trim() ??
    request.headers.get("x-real-ip")?.trim();

  return candidate && /^[0-9a-fA-F:.]{3,45}$/.test(candidate)
    ? { "X-Forwarded-For": candidate }
    : {};
}
