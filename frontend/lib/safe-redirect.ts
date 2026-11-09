const DEFAULT_PATH = "/admin";

/**
 * Acepta solo rutas internas del panel (`/admin...`) para el parámetro `next`.
 * Evita redirecciones abiertas como `//evil.test`, `/\evil.test` o `https://...`.
 */
export function safeNextPath(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (
    typeof candidate !== "string" ||
    candidate.length > 500 ||
    !/^\/admin(?:[/?#][^\\]*)?$/.test(candidate) ||
    candidate.includes("//")
  ) {
    return DEFAULT_PATH;
  }

  return candidate;
}
