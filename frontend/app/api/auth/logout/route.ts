import { ACCESS_TOKEN_COOKIE } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOrigin } from "@/lib/server/request-guard";


export async function POST(request: NextRequest) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) {
    return crossOrigin;
  }

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "La sesión ya está cerrada." });
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
    endpoint = new URL("/api/auth/logout", apiOrigin);
  } catch {
    return NextResponse.json(
      { message: "La dirección de la API de autenticación no es válida." },
      { status: 503 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    console.error("Could not reach the authentication API to revoke the token.");

    return NextResponse.json(
      { message: "No fue posible revocar la sesión en el servidor." },
      { status: 502 },
    );
  }

  if (!upstream.ok && upstream.status !== 401) {
    return NextResponse.json(
      { message: "La API no pudo revocar la sesión." },
      { status: upstream.status },
    );
  }

  const response = NextResponse.json({ message: "La sesión se cerró correctamente." });
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
