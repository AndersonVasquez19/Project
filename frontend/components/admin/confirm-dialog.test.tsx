// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

function setup(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    title: "¿Archivar?",
    description: "Se archivará el registro.",
    confirmLabel: "Archivar",
    pendingLabel: "Archivando...",
    ...overrides,
  };
  render(<ConfirmDialog {...props} />);
  return props;
}

describe("ConfirmDialog", () => {
  it("muestra título y descripción", () => {
    setup();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("¿Archivar?")).toBeInTheDocument();
    expect(screen.getByText("Se archivará el registro.")).toBeInTheDocument();
  });

  it("confirma al pulsar el botón principal", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: "Archivar" }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("mientras está pendiente deshabilita los botones y cambia el texto", () => {
    setup({ pending: true });

    expect(screen.getByRole("button", { name: "Archivando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("no se queda sin cerrar al cancelar", async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });
});
