import { describe, expect, it, vi } from "vitest";
import { ApiContractError, parseResponse } from "./contract";
import { cursoSchema, cursosPageSchema } from "./curso";

const fila = {
  id: "7",
  codigo: "TEC-01",
  nombre: "Excel básico",
  descripcion: "Introducción",
  categoria: "tecnologia",
  duracion_horas: 40,
  precio: "250.00",
  modalidad: "virtual",
  horario: "Lun y mié 7pm",
  cupos_maximos: 30,
  cupos_disponibles: 12,
  estado: "activo",
  created_at: "2026-11-08T10:00:00.000Z",
  updated_at: null,
  deleted_at: null,
};

describe("contrato de cursos", () => {
  it("acepta una fila y una página con la forma del backend", () => {
    expect(parseResponse(cursoSchema, fila, "cursos")).toEqual(fila);
    const page = { data: [fila], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    expect(parseResponse(cursosPageSchema, page, "cursos").data).toHaveLength(1);
  });

  it("rechaza un precio numérico o una categoría desconocida", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => parseResponse(cursoSchema, { ...fila, precio: 250 }, "cursos")).toThrow(
      ApiContractError,
    );
    expect(() =>
      parseResponse(cursoSchema, { ...fila, categoria: "arte" }, "cursos"),
    ).toThrow(ApiContractError);
  });
});
