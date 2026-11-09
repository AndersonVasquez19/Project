// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./form-field";

describe("FormField", () => {
  it("asocia la etiqueta con el control", () => {
    render(
      <FormField label="Nombre">
        {(control) => <input {...control} />}
      </FormField>,
    );

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
  });

  it("vincula el error al control con aria-describedby y lo anuncia", () => {
    render(
      <FormField label="Código" error="Ingresa el código.">
        {(control) => <input {...control} />}
      </FormField>,
    );

    const input = screen.getByLabelText("Código");
    const error = screen.getByRole("alert");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(error.id);
    expect(error).toHaveTextContent("Ingresa el código.");
  });

  it("sin error no marca el campo como inválido y muestra la ayuda", () => {
    render(
      <FormField label="Categoría" hint="Opcional">
        {(control) => <input {...control} />}
      </FormField>,
    );

    const input = screen.getByLabelText("Categoría");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Opcional")).toBeInTheDocument();
  });

  it("marca los obligatorios solo de forma visual", () => {
    render(
      <FormField label="Nombre" required>
        {(control) => <input {...control} />}
      </FormField>,
    );

    // El nombre accesible no incluye el asterisco (aria-hidden).
    expect(screen.getByRole("textbox", { name: "Nombre" })).toBeInTheDocument();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });
});
