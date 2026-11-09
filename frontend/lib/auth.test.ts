import { describe, expect, it } from "vitest";
import { decodeAuthToken } from "./auth";

function token(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.firma`;
}

const now = Math.floor(Date.now() / 1000);
const claims = {
  sub: "1",
  name: "Ana",
  email: "ana@horus.test",
  role: "admin",
  roles: ["admin"],
  permissions: ["cursos.ver"],
  iat: now - 10,
  nbf: now - 10,
  exp: now + 600,
};

describe("decodeAuthToken", () => {
  it("devuelve la identidad de un token vigente", () => {
    expect(decodeAuthToken(token(claims))).toEqual({
      id: "1",
      name: "Ana",
      email: "ana@horus.test",
      role: "admin",
      roles: ["admin"],
      permissions: ["cursos.ver"],
    });
  });

  it("rechaza tokens caducados o aún no válidos", () => {
    expect(decodeAuthToken(token({ ...claims, exp: now - 1 }))).toBeNull();
    expect(decodeAuthToken(token({ ...claims, nbf: now + 60 }))).toBeNull();
  });

  it("rechaza claims incompletas y basura", () => {
    expect(decodeAuthToken(token({ sub: "1" }))).toBeNull();
    expect(decodeAuthToken("no-es-un-jwt")).toBeNull();
  });
});
