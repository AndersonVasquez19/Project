import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/constants";
import { getApiOrigin } from "@/lib/env";
import { clientIpHeaders, rejectCrossOrigin } from "@/lib/server/request-guard";

/** Tiempo máximo de espera a la API: evita colgar peticiones de Node. */
export const UPSTREAM_TIMEOUT_MS = 10_000;
/** Tamaño máximo del cuerpo que se reenvía a la API. */
export const MAX_BODY_BYTES = 1024 * 1024;

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ message }, { status });
}

/**
 * Reenvía la petición del navegador a la API NestJS añadiendo el Bearer del
 * cookie HttpOnly. Única implementación del proxy (BFF) del panel.
 *
 * - Rechaza escrituras con Origin distinto (CSRF).
 * - Aplica timeout y límite de cuerpo.
 * - No reenvía cuerpos que no sean JSON.
 */
export async function proxyToApi(
  request: Request,
  resourcePath: string,
  resourceName: string,
): Promise<NextResponse> {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) {
    return crossOrigin;
  }

  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return jsonError("Se requiere iniciar sesión para continuar.", 401);
  }

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) {
    return jsonError("La API no está configurada.", 503);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let body: string | undefined;
  if (hasBody) {
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY_BYTES) {
      return jsonError("La solicitud es demasiado grande.", 413);
    }

    body = await request.text();
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      return jsonError("La solicitud es demasiado grande.", 413);
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(new URL(`/api${resourcePath}`, apiOrigin), {
      method: request.method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...clientIpHeaders(request),
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    console.error(
      `${timedOut ? "Timeout" : "Could not reach"} the ${resourceName} API.`,
    );
    return jsonError(
      timedOut
        ? `La API de ${resourceName} tardó demasiado en responder.`
        : `No fue posible conectar con la API de ${resourceName}.`,
      timedOut ? 504 : 502,
    );
  }

  let responseBody: unknown;
  try {
    responseBody = await upstream.json();
  } catch {
    return jsonError(
      `La API de ${resourceName} devolvió una respuesta inválida.`,
      502,
    );
  }

  return NextResponse.json(responseBody, { status: upstream.status });
}
