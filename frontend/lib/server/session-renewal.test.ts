import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  needsRenewal,
  renewSessionIfNeeded,
  tokenTiming,
} from "./session-renewal";

const now = () => Math.floor(Date.now() / 1000);

/** JWT sin firma verificable: el panel solo lee exp/iat. */
function token(iat: number, exp: number): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ iat, exp, jti: `${iat}-${exp}` })}.firma`;
}

describe("tokenTiming / needsRenewal", () => {
  it("calcula lo que queda y la vida total", () => {
    const timing = tokenTiming(token(1_000, 2_800), 1_900);
    expect(timing).toEqual({ remaining: 900, lifetime: 1_800 });
  });

  it("devuelve null con tokens ilegibles o sin exp/iat", () => {
    expect(tokenTiming("basura")).toBeNull();
    expect(tokenTiming(token(2_000, 1_000))).toBeNull();
  });

  it("renueva pasada la mitad de la vida y no antes ni con el token caducado", () => {
    expect(needsRenewal({ remaining: 1_000, lifetime: 1_800 })).toBe(false);
    expect(needsRenewal({ remaining: 900, lifetime: 1_800 })).toBe(true);
    expect(needsRenewal({ remaining: 10, lifetime: 1_800 })).toBe(true);
    expect(needsRenewal({ remaining: 0, lifetime: 1_800 })).toBe(false);
    expect(needsRenewal({ remaining: -5, lifetime: 1_800 })).toBe(false);
    expect(needsRenewal(null)).toBe(false);
  });
});

describe("renewSessionIfNeeded", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.AUTH_API_URL = "http://127.0.0.1:4000";
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const nearExpiry = () => token(now() - 1_500, now() + 300); // vida 1800, quedan 300
  const fresh = () => token(now() - 60, now() + 1_740);

  it("no llama a la API si el token está recién emitido", async () => {
    expect(await renewSessionIfNeeded(fresh())).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renueva con el Bearer actual y devuelve el token nuevo", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ access_token: "nuevo", expires_in: 1800 })),
    );
    const old = nearExpiry();

    const renewed = await renewSessionIfNeeded(old);

    expect(renewed).toEqual({ accessToken: "nuevo", expiresIn: 1800 });
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("http://127.0.0.1:4000/api/auth/refresh");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${old}`);
  });

  it("peticiones simultáneas con el mismo token comparten una sola renovación", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ access_token: "nuevo", expires_in: 1800 })),
    );
    const old = nearExpiry();

    const results = await Promise.all([
      renewSessionIfNeeded(old),
      renewSessionIfNeeded(old),
      renewSessionIfNeeded(old),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r?.accessToken === "nuevo")).toBe(true);
  });

  it("si la API rechaza, falla o responde mal, devuelve null sin lanzar", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 401 }));
    expect(await renewSessionIfNeeded(nearExpiry())).toBeNull();

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect(await renewSessionIfNeeded(nearExpiry())).toBeNull();

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ x: 1 })));
    expect(await renewSessionIfNeeded(nearExpiry())).toBeNull();
  });

  it("sin AUTH_API_URL no intenta renovar", async () => {
    delete process.env.AUTH_API_URL;
    expect(await renewSessionIfNeeded(nearExpiry())).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
