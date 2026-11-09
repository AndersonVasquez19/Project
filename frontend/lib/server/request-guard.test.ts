import { describe, expect, it } from "vitest";
import { clientIpHeaders, rejectCrossOrigin } from "./request-guard";

function request(method: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/x", { method, headers });
}

describe("rejectCrossOrigin", () => {
  it("no bloquea lecturas", () => {
    expect(
      rejectCrossOrigin(request("GET", { origin: "http://evil.test" })),
    ).toBeNull();
  });

  it("acepta escrituras del mismo origen o sin Origin", () => {
    expect(
      rejectCrossOrigin(
        request("POST", {
          origin: "http://localhost:3000",
          host: "localhost:3000",
        }),
      ),
    ).toBeNull();
    expect(
      rejectCrossOrigin(request("POST", { host: "localhost:3000" })),
    ).toBeNull();
  });

  it("responde 403 a escrituras de otro origen", () => {
    const response = rejectCrossOrigin(
      request("DELETE", { origin: "http://evil.test", host: "localhost:3000" }),
    );
    expect(response?.status).toBe(403);
  });

  it("responde 403 con Origin malformado", () => {
    const response = rejectCrossOrigin(
      request("POST", { origin: "no-es-url", host: "localhost:3000" }),
    );
    expect(response?.status).toBe(403);
  });
});

describe("clientIpHeaders", () => {
  it("usa la última entrada de X-Forwarded-For", () => {
    expect(
      clientIpHeaders(
        request("GET", { "x-forwarded-for": "6.6.6.6, 10.0.0.2" }),
      ),
    ).toEqual({ "X-Forwarded-For": "10.0.0.2" });
  });

  it("cae a x-real-ip y descarta valores inválidos", () => {
    expect(
      clientIpHeaders(request("GET", { "x-real-ip": "10.0.0.9" })),
    ).toEqual({ "X-Forwarded-For": "10.0.0.9" });
    expect(
      clientIpHeaders(request("GET", { "x-forwarded-for": "<script>" })),
    ).toEqual({});
    expect(clientIpHeaders(request("GET"))).toEqual({});
  });
});
