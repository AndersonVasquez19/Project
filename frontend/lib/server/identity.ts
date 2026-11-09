import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { type AdminIdentity, decodeAuthToken } from "@/lib/auth";
import { ACCESS_TOKEN_COOKIE } from "@/lib/constants";
import { can, type Permission } from "@/lib/permissions";
import { type SessionStatus, verifySession } from "@/lib/server/session";

/** Token de la cookie, leído una sola vez por petición. */
export const getAccessToken = cache(async (): Promise<string | null> => {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value ?? null;
});

/** Claims del token decodificadas una sola vez por petición (sin verificar firma). */
export const getIdentity = cache(async (): Promise<AdminIdentity | null> => {
  const token = await getAccessToken();
  return token ? decodeAuthToken(token) : null;
});

/** Verificación contra la API, memoizada por petición (layout + páginas). */
export const getSessionStatus = cache(
  async (token: string): Promise<SessionStatus> => verifySession(token),
);

/** Permisos del usuario actual; vacío si no hay sesión. */
export async function getPermissions(): Promise<string[]> {
  return (await getIdentity())?.permissions ?? [];
}

/** Atajo para páginas de servidor: ¿el usuario actual tiene este permiso? */
export async function hasPermission(permission: Permission): Promise<boolean> {
  return can(await getPermissions(), permission);
}
