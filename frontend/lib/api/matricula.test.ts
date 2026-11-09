import { describe, expect, it, vi } from "vitest";
import { ApiContractError, parseResponse } from "./contract";
import {
  matriculasPageSchema,
  pagoCreadoSchema,
  pagosSnapshotSchema,
} from "./matricula";

const fila = {
  id: "5",
  estudiante_id: "1",
  curso_id: "2",
  fecha_matricula: "2026-11-08T00:00:00.000Z",
  estado: "pendiente",
  monto_pagado: "100",
  monto_total: "250",
  observaciones: null,
  created_at: "2026-11-08T10:00:00.000Z",
  updated_at: null,
  deleted_at: null,
  estudiante: { id: "1", dni: "12345678", nombres: "Ana", apellidos: "Pérez", deleted_at: null },
  curso: { id: "2", codigo: "TEC-01", nombre: "Excel", estado: "activo", cupos_disponibles: 3, deleted_at: null },
};
const pago = {
  id: "9",
  matricula_id: "5",
  monto: "100",
  metodo: "efectivo",
  referencia: null,
  nota: null,
  pagado_at: "2026-11-08T10:00:00.000Z",
  registrado_por: "1",
  created_at: "2026-11-08T10:00:00.000Z",
};
const resumen = { total: "250", pagado: "100", saldo: "150", credito: "0" };

describe("contrato de matrículas y pagos", () => {
  it("acepta la página, el estado de cuenta y el pago creado", () => {
    const page = { data: [fila], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    expect(parseResponse(matriculasPageSchema, page, "matrículas").data).toHaveLength(1);

    const snapshot = {
      matricula: {
        id: "5",
        fecha_matricula: fila.fecha_matricula,
        estado: "pendiente",
        estudiante: { id: "1", nombres: "Ana", apellidos: "Pérez", dni: "12345678" },
        curso: { id: "2", codigo: "TEC-01", nombre: "Excel" },
      },
      resumen,
      data: [pago],
    };
    expect(parseResponse(pagosSnapshotSchema, snapshot, "pagos").data).toHaveLength(1);
    expect(
      parseResponse(pagoCreadoSchema, { data: pago, estado: "pendiente", resumen }, "pagos").data.id,
    ).toBe("9");
  });

  it("rechaza un estado desconocido o un resumen numérico", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const page = (row: unknown) => ({
      data: [row],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(() =>
      parseResponse(matriculasPageSchema, page({ ...fila, estado: "otra" }), "matrículas"),
    ).toThrow(ApiContractError);
    expect(() =>
      parseResponse(
        pagoCreadoSchema,
        { data: pago, estado: "pendiente", resumen: { ...resumen, saldo: 150 } },
        "pagos",
      ),
    ).toThrow(ApiContractError);
  });
});
