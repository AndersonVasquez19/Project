// @vitest-environment jsdom
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "./data-table";

type Row = { id: string; nombre: string };

const columns: ColumnDef<Row>[] = [
  { id: "nombre", accessorKey: "nombre", header: "Nombre" },
  {
    id: "acciones",
    header: () => <span className="sr-only">Acciones</span>,
    enableSorting: false,
    cell: () => <button type="button">Editar</button>,
  },
];

const rows: Row[] = [
  { id: "1", nombre: "Alfa" },
  { id: "2", nombre: "Beta" },
];

function renderTable(overrides: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) {
  const props = {
    columns,
    data: rows,
    caption: "Servicios",
    total: 25,
    pageCount: 3,
    pagination: { pageIndex: 0, pageSize: 10 },
    onPaginationChange: vi.fn(),
    itemLabel: { singular: "servicio", plural: "servicios" },
    getRowId: (row: Row) => row.id,
    ...overrides,
  };
  render(<DataTable {...props} />);
  return props;
}

describe("DataTable", () => {
  it("expone la tabla con nombre accesible y encabezados con scope", () => {
    renderTable();

    expect(screen.getByRole("table", { name: "Servicios" })).toBeInTheDocument();
    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(0);
    for (const header of headers) {
      expect(header).toHaveAttribute("scope", "col");
    }
  });

  it("muestra el rango y el total", () => {
    renderTable();
    expect(screen.getByText("1–10 de 25 servicios")).toBeInTheDocument();
  });

  it("muestra el mensaje vacío sin filas", () => {
    renderTable({ data: [], total: 0, pageCount: 0, emptyMessage: "Sin resultados." });
    expect(screen.getByText("Sin resultados.")).toBeInTheDocument();
    expect(screen.getByText("0 servicios")).toBeInTheDocument();
  });

  it("marca la tabla como ocupada y oculta los datos mientras carga", () => {
    renderTable({ isLoading: true });
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Alfa")).toBeNull();
  });

  it("pagina con los botones y respeta los límites", async () => {
    const user = userEvent.setup();
    const props = renderTable();

    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(props.onPaginationChange).toHaveBeenCalled();
  });

  it("ordena desde el encabezado y expone aria-sort", async () => {
    const user = userEvent.setup();
    const onSortingChange = vi.fn();
    const sorting: SortingState = [{ id: "nombre", desc: false }];
    renderTable({ sorting, onSortingChange });

    const header = screen.getByRole("columnheader", { name: /nombre/i });
    expect(header).toHaveAttribute("aria-sort", "ascending");
    await user.click(screen.getByRole("button", { name: /nombre/i }));
    expect(onSortingChange).toHaveBeenCalled();
  });

  it("sin onSortingChange los encabezados no son botones", () => {
    renderTable();
    expect(screen.queryByRole("button", { name: /nombre/i })).toBeNull();
  });
});
