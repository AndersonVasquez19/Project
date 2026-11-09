import { describe, expect, it } from "vitest";
import { can, PERMISSIONS } from "./permissions";

describe("permissions", () => {
  it("can() comprueba pertenencia exacta", () => {
    expect(can(["cursos.ver"], "cursos.ver")).toBe(true);
    expect(can(["cursos.ver"], "cursos.editar")).toBe(false);
    expect(can([], "cursos.ver")).toBe(false);
  });

  it("el catálogo no tiene duplicados y usa formato módulo.acción", () => {
    expect(new Set(PERMISSIONS).size).toBe(PERMISSIONS.length);
    for (const permission of PERMISSIONS) {
      expect(permission).toMatch(/^[a-z]+\.[a-z-]+$/);
    }
  });
});
