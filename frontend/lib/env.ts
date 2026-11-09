import "server-only";

/**
 * Origen de la API NestJS (variable AUTH_API_URL). Devuelve null si falta o no
 * es una URL http(s) válida, para que cada llamador responda 503 sin repetir
 * la validación.
 */
export function getApiOrigin(): string | null {
  const value = process.env.AUTH_API_URL?.trim();
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.origin
      : null;
  } catch {
    return null;
  }
}
