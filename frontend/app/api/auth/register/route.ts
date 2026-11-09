import { NextRequest, NextResponse } from "next/server";
import { apiErrorSchema, registerSchema } from "@/lib/auth-schema";
import {
  clientIpHeaders,
  rejectCrossOrigin,
} from "@/lib/server/request-guard";

export async function POST(request: NextRequest) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) {
    return crossOrigin;
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { message: "La solicitud no contiene JSON válido." },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(requestBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Revisa los datos ingresados.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const apiOrigin = process.env.AUTH_API_URL;
  if (!apiOrigin) {
    return NextResponse.json(
      { message: "La API de autenticación no está configurada." },
      { status: 503 },
    );
  }

  let endpoint: URL;
  try {
    endpoint = new URL("/api/auth/register", apiOrigin);
  } catch {
    return NextResponse.json(
      { message: "La dirección del servicio de autenticación no es válida." },
      { status: 503 },
    );
  }

  const { name, email, password } = parsed.data;

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...clientIpHeaders(request),
      },
      body: JSON.stringify({ name, email, password }),
      cache: "no-store",
    });
  } catch {
    console.error("Could not reach the authentication API.");

    return NextResponse.json(
      { message: "No fue posible conectar con el servicio de autenticación." },
      { status: 502 },
    );
  }

  let responseBody: unknown;
  try {
    responseBody = await upstream.json();
  } catch {
    return NextResponse.json(
      { message: "La API de autenticación devolvió una respuesta inválida." },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const apiError = apiErrorSchema.safeParse(responseBody);

    return NextResponse.json(
      apiError.success
        ? apiError.data
        : { message: "No se pudo crear la cuenta." },
      { status: upstream.status },
    );
  }

  return NextResponse.json({ message: "Cuenta creada correctamente." });
}
