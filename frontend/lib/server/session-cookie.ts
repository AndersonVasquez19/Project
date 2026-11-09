import "server-only";
import type { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/constants";

/** Escribe la cookie de sesión (HttpOnly) con la misma política en login y renovación. */
export function setSessionCookie(
  response: NextResponse,
  accessToken: string,
  maxAgeSeconds: number,
): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}
