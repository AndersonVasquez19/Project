import { describe, expect, it, vi } from "vitest";
import { ApiContractError, parseResponse } from "./contract";
import { estudianteSchema, estudiantesPageSchema } from "./estudiante";

const fila = {
  id: "1",
  dni: "12345678",
  nombres: "Ana",
  apellidos: "Pérez",
  email: null,
  telefono: "999888777",
  fecha_nacimiento: "2000-05-01",
  direccion: null,
  estado: "activo",
  created_at: "2026-11-08",
  updated_at: "2026-11-08",
  deleted_at: null,
};

describe("contrato de estudiantes", () => {
  it("acepta una fila con la forma del backend", () => {
    expect(parseResponse(estudianteSchema, fila, "estudiantes")).toEqual(fila);
  });

  it("acepta una página completa", () => {
    const page = {
      data: [fila],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    expect(parseResponse(estudiantesPageSchema, page, "estudiantes").data).toHaveLength(1);
  });

  it("lanza ApiContractError si falta un campo o el estado es desconocido", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      parseResponse(estudianteSchema, { ...fila, dni: undefined }, "estudiantes"),
    ).toThrow(ApiContractError);
    expect(() =>
      parseResponse(estudianteSchema, { ...fila, estado: "otro" }, "estudiantes"),
    ).toThrow(/formato esperado/);
  });
});
