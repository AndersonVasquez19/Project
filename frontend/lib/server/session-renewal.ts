import "server-only";
import { decodeJwt } from "jose";
import { z } from "zod";
import { getApiOrigin } from "@/lib/env";

const REFRESH_TIMEOUT_MS = 5_000;

const refreshResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
});

export type RenewedSession = { accessToken: string; expiresIn: number };

export type TokenTiming = {
  /** Segundos que le quedan al token (negativo si ya caducó). */
  remaining: number;
  /** Vida total del token en segundos. */
  lifetime: number;
};

export function tokenTiming(
  token: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): TokenTiming | null {
  try {
    const { exp, iat } = decodeJwt(token);
    if (typeof exp !== "number" || typeof iat !== "number" || exp <= iat) {
      return null;
    }
    return { remaining: exp - nowSeconds, lifetime: exp - iat };
  } catch {
    return null;
  }
}

/** ¿Pasó ya la mitad de la vida del token? Entonces toca renovar (si sigue vigente). */
export function needsRenewal(timing: TokenTiming | null): boolean {
  return timing !== null && timing.remaining > 0 && timing.remaining <= timing.lifetime / 2;
}

// Varias peticiones simultáneas con el mismo token comparten una sola renovación.
const inFlight = new Map<string, Promise<RenewedSession | null>>();

async function requestRenewal(token: string): Promise<RenewedSession | null> {
  const apiOrigin = getApiOrigin();
  if (!apiOrigin) return null;

  try {
    const response = await fetch(new URL("/api/auth/refresh", apiOrigin), {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const body = refreshResponseSchema.safeParse(await response.json());
    return body.success
      ? { accessToken: body.data.access_token, expiresIn: body.data.expires_in }
      : null;
  } catch {
    return null;
  }
}

/**
 * Renueva el token si ya pasó la mitad de su vida. Devuelve null si no hace
 * falta, si ya caducó o si la API no pudo renovar (el token actual sigue
 * valiendo hasta su expiración, así que un fallo no cierra la sesión).
 */
export function renewSessionIfNeeded(token: string): Promise<RenewedSession | null> {
  if (!needsRenewal(tokenTiming(token))) {
    return Promise.resolve(null);
  }

  const pending = inFlight.get(token);
  if (pending) return pending;

  const request = requestRenewal(token).finally(() => inFlight.delete(token));
  inFlight.set(token, request);
  return request;
}
