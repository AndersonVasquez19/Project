import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ token: "jwt-de-prueba" as string | undefined }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "horus_access_token" && session.token
        ? { value: session.token }
        : undefined,
  }),
}));

import { MAX_BODY_BYTES, proxyToApi } from "./api-proxy";

function request(
  method = "GET",
  body?: string,
  headers: Record<string, string> = {},
) {
  return new Request("http://localhost:3000/api/cursos", {
    method,
    body,
    headers: { host: "localhost:3000", ...headers },
  });
}

describe("proxyToApi", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    session.token = "jwt-de-prueba";
    process.env.AUTH_API_URL = "http://127.0.0.1:4000";
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("responde 401 sin cookie de sesión", async () => {
    session.token = undefined;
    const response = await proxyToApi(request(), "/cursos", "cursos");
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("responde 503 si AUTH_API_URL falta o es inválida", async () => {
    delete process.env.AUTH_API_URL;
    expect((await proxyToApi(request(), "/cursos", "cursos")).status).toBe(503);
    process.env.AUTH_API_URL = "ftp://x";
    expect((await proxyToApi(request(), "/cursos", "cursos")).status).toBe(503);
  });

  it("reenvía el Bearer y devuelve estado y cuerpo de la API", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );

    const response = await proxyToApi(request(), "/cursos?page=1", "cursos");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [] });
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("http://127.0.0.1:4000/api/cursos?page=1");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer jwt-de-prueba",
    );
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("renueva la sesión en una petición correcta cuando el token ya pasó la mitad de su vida", async () => {
    const encode = (value: unknown) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    session.token = `${encode({ alg: "HS256" })}.${encode({ iat: now - 1_500, exp: now + 300 })}.f`;
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "token-renovado", expires_in: 1800 })),
      );

    const response = await proxyToApi(request(), "/cursos", "cursos");

    expect(response.status).toBe(200);
    const cookie = response.cookies.get("horus_access_token");
    expect(cookie?.value).toBe("token-renovado");
    expect(response.headers.get("set-cookie")).toMatch(/HttpOnly/i);
    expect(response.headers.get("set-cookie")).toMatch(/Max-Age=1800/);
  });

  it("no renueva si la API respondió con error ni si el token es reciente", async () => {
    const encode = (value: unknown) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const build = (iat: number, exp: number) =>
      `${encode({ alg: "HS256" })}.${encode({ iat, exp })}.f`;

    session.token = build(now - 1_500, now + 300);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: "no" }), { status: 403 }));
    const denied = await proxyToApi(request(), "/cursos", "cursos");
    expect(denied.cookies.get("horus_access_token")).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockClear();
    session.token = build(now - 60, now + 1_740);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    const fresh = await proxyToApi(request(), "/cursos", "cursos");
    expect(fresh.cookies.get("horus_access_token")).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rechaza cuerpos mayores al límite con 413", async () => {
    const response = await proxyToApi(
      request("POST", "x".repeat(MAX_BODY_BYTES + 1)),
      "/cursos",
      "cursos",
    );
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bloquea escrituras de otro origen antes de llamar a la API", async () => {
    const response = await proxyToApi(
      request("POST", "{}", { origin: "http://evil.test" }),
      "/cursos",
      "cursos",
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devuelve 502 si la API no responde JSON y 504 si agota el tiempo", async () => {
    fetchMock.mockResolvedValueOnce(new Response("<html>", { status: 200 }));
    expect((await proxyToApi(request(), "/cursos", "cursos")).status).toBe(502);

    fetchMock.mockRejectedValueOnce(new DOMException("t", "TimeoutError"));
    expect((await proxyToApi(request(), "/cursos", "cursos")).status).toBe(504);

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    expect((await proxyToApi(request(), "/cursos", "cursos")).status).toBe(502);
  });
});
