import { decodeJwt } from "jose";
import { z } from "zod";

const authTokenClaimsSchema = z.object({
  sub: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().nullable(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  iat: z.number(),
  nbf: z.number(),
  exp: z.number(),
});

export type AdminIdentity = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  roles: string[];
  permissions: string[];
};

export function decodeAuthToken(token: string): AdminIdentity | null {
  try {
    const claims = authTokenClaimsSchema.safeParse(decodeJwt(token));
    if (!claims.success) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (claims.data.exp <= now || claims.data.nbf > now) {
      return null;
    }

    return {
      id: claims.data.sub,
      name: claims.data.name,
      email: claims.data.email,
      role: claims.data.role,
      roles: claims.data.roles,
      permissions: claims.data.permissions,
    };
  } catch {
    return null;
  }
}
