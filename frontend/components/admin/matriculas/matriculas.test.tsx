// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { matriculaColumns } from "./columns";
import { PagoForm } from "./PagoForm";
import type { Matricula } from "@/types/matricula";

const matricula: Matricula = {
  id: "5",
  estudiante_id: "1",
  curso_id: "2",
  fecha_matricula: "2026-11-08T00:00:00.000Z",
  estado: "pendiente",
  monto_pagado: "100",
  monto_total: "250",
  observaciones: null,
  created_at: null,
  updated_at: null,
  deleted_at: null,
  estudiante: { id: "1", dni: "12345678", nombres: "Ana", apellidos: "Pérez", deleted_at: null },
  curso: { id: "2", codigo: "TEC-01", nombre: "Excel", estado: "activo", cupos_disponibles: 3, deleted_at: null },
};

function renderActions(options: Parameters<typeof matriculaColumns>[0]) {
  const column = matriculaColumns(options).find((item) => item.id === "acciones");
  const cell = column?.cell as (ctx: unknown) => React.ReactNode;
  return render(<>{cell({ row: { original: matricula } })}</>);
}

describe("matriculaColumns", () => {
  it("solo muestra las acciones cuyo manejador se pasó y las nombra", () => {
    renderActions({ eliminados: false, onEdit: vi.fn() });

    expect(
      screen.getByRole("button", { name: "Editar matrícula de Ana Pérez en Excel" }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Pagos de Ana Pérez en Excel" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Anular/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Eliminar/ })).toBeNull();
  });

  it("ordena por fecha y estado, no por el resto", () => {
    const sortable = matriculaColumns({ eliminados: false })
      .filter((column) => column.enableSorting)
      .map((column) => column.id);
    expect(sortable).toEqual(["fecha_matricula", "estado"]);
  });
});

describe("PagoForm", () => {
  it("rechaza un abono mayor que el saldo sin llamar a la API", async () => {
    const onSubmit = vi.fn();
    render(<PagoForm saldo={150} pending={false} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole("textbox", { name: /Monto/ }), "200");
    await userEvent.click(screen.getByRole("button", { name: "Registrar pago" }));

    expect(await screen.findByText(/no puede superar el saldo pendiente/)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envía el abono válido con referencia y nota vacías como null", async () => {
    const onSubmit = vi.fn();
    render(<PagoForm saldo={150} pending={false} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByRole("textbox", { name: /Monto/ }), "50.5");
    await userEvent.click(screen.getByRole("button", { name: "Registrar pago" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        monto: "50.5",
        metodo: "efectivo",
        referencia: null,
        nota: null,
      }),
    );
  });
});
