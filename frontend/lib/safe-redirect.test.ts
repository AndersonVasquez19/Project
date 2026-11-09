import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it("acepta rutas internas del panel", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/admin/cursos?page=2")).toBe("/admin/cursos?page=2");
  });

  it("usa el panel por defecto si falta o es inválido", () => {
    expect(safeNextPath(undefined)).toBe("/admin");
    expect(safeNextPath("")).toBe("/admin");
    expect(safeNextPath("/login")).toBe("/admin");
  });

  it.each([
    "//evil.test",
    "/\\evil.test",
    "https://evil.test",
    "/admin//evil.test",
    "/administrador",
    `/admin/${"a".repeat(600)}`,
  ])("rechaza %s", (value) => {
    expect(safeNextPath(value)).toBe("/admin");
  });

  it("toma el primer valor si llega un arreglo", () => {
    expect(safeNextPath(["/admin/roles", "//x"])).toBe("/admin/roles");
  });
});
