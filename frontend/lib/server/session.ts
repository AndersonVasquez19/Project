import "server-only";

export type SessionStatus = "valid" | "invalid" | "unavailable";

/**
 * Comprueba el token contra la API (firma, caducidad y revocación). El frontend
 * no conoce el secreto JWT: `decodeJwt` solo lee las claims, no las valida.
 */
export async function verifySession(token: string): Promise<SessionStatus> {
  const apiOrigin = process.env.AUTH_API_URL;
  if (!apiOrigin) {
    return "unavailable";
  }

  try {
    const response = await fetch(new URL("/api/auth/me", apiOrigin), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return "valid";
    }
    return response.status === 401 || response.status === 403
      ? "invalid"
      : "unavailable";
  } catch {
    return "unavailable";
  }
}
