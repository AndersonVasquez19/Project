import { describe, expect, it } from "vitest";
import { matchApiRoute } from "./api-routes";

describe("matchApiRoute", () => {
  it("acepta rutas y métodos de la lista", () => {
    expect(matchApiRoute("GET", ["cursos"])).toEqual({
      path: "/cursos",
      label: "cursos",
    });
    expect(matchApiRoute("PATCH", ["matriculas", "12", "anular"])).toEqual({
      path: "/matriculas/12/anular",
      label: "matriculas",
    });
    expect(matchApiRoute("get", ["reportes", "matriculas"])?.path).toBe(
      "/reportes/matriculas",
    );
    expect(matchApiRoute("PATCH", ["notificaciones", "leer-todas"])).not.toBeNull();
    expect(matchApiRoute("PATCH", ["notificaciones", "7", "leer"])).not.toBeNull();
  });

  it("rechaza métodos no permitidos para la ruta", () => {
    expect(matchApiRoute("DELETE", ["servicios-tecnologicos", "3"])).toBeNull();
    expect(matchApiRoute("POST", ["dashboard"])).toBeNull();
    expect(matchApiRoute("GET", ["cursos", "5"])).toBeNull();
  });

  it("rechaza rutas desconocidas, incluidas las de autenticación", () => {
    expect(matchApiRoute("GET", ["auth", "me"])).toBeNull();
    expect(matchApiRoute("POST", ["auth", "login"])).toBeNull();
    expect(matchApiRoute("GET", [])).toBeNull();
    expect(matchApiRoute("GET", ["cursos", "5", "otra"])).toBeNull();
  });

  it("valida que :id sea un entero positivo", () => {
    for (const id of ["0", "-1", "01", "abc", "1.5", "1/2", "..", "%2e%2e", ""]) {
      expect(matchApiRoute("PUT", ["cursos", id])).toBeNull();
    }
    expect(matchApiRoute("PUT", ["cursos", "900719925474099"])).not.toBeNull();
  });

  it("no deja pasar segmentos literales con caracteres raros", () => {
    expect(matchApiRoute("GET", ["Cursos"])).toBeNull();
    expect(matchApiRoute("GET", ["cursos "])).toBeNull();
    expect(matchApiRoute("GET", ["..", "cursos"])).toBeNull();
  });
});
