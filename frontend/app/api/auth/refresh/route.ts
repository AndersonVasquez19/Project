import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/constants";
import { rejectCrossOrigin } from "@/lib/server/request-guard";
import { setSessionCookie } from "@/lib/server/session-cookie";
import {
  renewSessionIfNeeded,
  tokenTiming,
} from "@/lib/server/session-renewal";

/**
 * Latido de sesión: el panel lo llama mientras el usuario está activo (aunque no
 * haga peticiones, p. ej. rellenando un formulario largo). Renueva el token solo
 * si ya pasó la mitad de su vida; si no, no toca nada.
 */
export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) {
    return crossOrigin;
  }

  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  const timing = token ? tokenTiming(token) : null;
  if (!token || !timing || timing.remaining <= 0) {
    return NextResponse.json(
      { message: "La sesión ha expirado." },
      { status: 401 },
    );
  }

  const renewed = await renewSessionIfNeeded(token);
  const response = NextResponse.json({
    renewed: renewed !== null,
    expiresIn: renewed?.expiresIn ?? timing.remaining,
  });
  if (renewed) {
    setSessionCookie(response, renewed.accessToken, renewed.expiresIn);
  }

  return response;
}
