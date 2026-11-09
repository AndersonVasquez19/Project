import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clientIpHeaders, rejectCrossOrigin } from "@/lib/server/request-guard";

const ACCESS_TOKEN_COOKIE = "horus_access_token";

export async function forwardAcademicRequest(
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
    return NextResponse.json(
      { message: "Se requiere iniciar sesión para continuar." },
      { status: 401 },
    );
  }

  const apiOrigin = process.env.AUTH_API_URL;
  if (!apiOrigin) {
    return NextResponse.json(
      { message: "La API no está configurada." },
      { status: 503 },
    );
  }

  let endpoint: URL;
  try {
    endpoint = new URL(`/api${resourcePath}`, apiOrigin);
  } catch {
    return NextResponse.json(
      { message: "La dirección de la API no es válida." },
      { status: 503 },
    );
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: request.method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...clientIpHeaders(request),
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
      },
      ...(hasBody ? { body: await request.text() } : {}),
      cache: "no-store",
    });
  } catch {
    console.error(`Could not reach the ${resourceName} API.`);
    return NextResponse.json(
      { message: `No fue posible conectar con la API de ${resourceName}.` },
      { status: 502 },
    );
  }

  let responseBody: unknown;
  try {
    responseBody = await upstream.json();
  } catch {
    return NextResponse.json(
      { message: `La API de ${resourceName} devolvió una respuesta inválida.` },
      { status: 502 },
    );
  }

  return NextResponse.json(responseBody, { status: upstream.status });
}
