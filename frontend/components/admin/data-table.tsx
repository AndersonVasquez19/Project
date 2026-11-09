"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DataTableProps<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  /** Nombre accesible de la tabla (se lee con lector de pantalla; no se ve). */
  caption: string;
  /** Total de filas en el servidor. */
  total: number;
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  /** Orden en el servidor: activa los encabezados ordenables. */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Primera carga (sin datos todavía): muestra filas de carga. */
  isLoading?: boolean;
  emptyMessage?: string;
  /** Para el contador: "12 servicios". */
  itemLabel?: { singular: string; plural: string };
  pageSizes?: number[];
  getRowId?: (row: TData) => string;
};

/**
 * Tabla de listado con paginación y orden en el servidor, estados de carga y
 * vacío, y encabezados accesibles (scope, aria-sort, caption).
 */
export function DataTable<TData>({
  columns,
  data,
  caption,
  total,
  pageCount,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  isLoading = false,
  emptyMessage = "No se encontraron resultados.",
  itemLabel = { singular: "registro", plural: "registros" },
  pageSizes = [10, 20, 50],
  getRowId,
}: DataTableProps<TData>) {
  const pageSizeId = useId();

  // La instancia de TanStack es un controlador mutable por diseño.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    manualPagination: true,
    manualSorting: true,
    enableSortingRemoval: true,
    pageCount,
    onPaginationChange,
    onSortingChange,
    state: { pagination, sorting: sorting ?? [] },
  });

  const from = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min((pagination.pageIndex + 1) * pagination.pageSize, total);
  const label = total === 1 ? itemLabel.singular : itemLabel.plural;
  const columnCount = columns.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-horus-line bg-white shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
      <Table aria-busy={isLoading}>
        <caption className="sr-only">{caption}</caption>
        <TableHeader className="bg-horus-subtle">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const sortable = header.column.getCanSort() && Boolean(onSortingChange);
                const direction = header.column.getIsSorted();
                const content = header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext());

                return (
                  <TableHead
                    key={header.id}
                    scope="col"
                    aria-sort={
                      !sortable
                        ? undefined
                        : direction === "asc"
                          ? "ascending"
                          : direction === "desc"
                            ? "descending"
                            : "none"
                    }
                    className="px-4 py-3 text-xs uppercase tracking-wide text-horus-muted"
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 uppercase tracking-wide hover:text-horus-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-horus-primary"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {content}
                        {direction === "asc" ? (
                          <ArrowUp aria-hidden="true" className="size-3.5" />
                        ) : direction === "desc" ? (
                          <ArrowDown aria-hidden="true" className="size-3.5" />
                        ) : (
                          <ArrowUpDown aria-hidden="true" className="size-3.5 opacity-50" />
                        )}
                      </button>
                    ) : (
                      content
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: Math.min(pagination.pageSize, 5) }, (_, row) => (
              <TableRow key={`skeleton-${row}`} className="hover:bg-transparent">
                {Array.from({ length: columnCount }, (_, cell) => (
                  <TableCell key={cell} className="px-4 py-3.5">
                    <div className="h-4 animate-pulse rounded bg-slate-200" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columnCount}
                className="h-28 text-center text-sm text-horus-muted"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 border-t border-horus-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-horus-muted" aria-live="polite">
          {total === 0 ? `0 ${itemLabel.plural}` : `${from}–${to} de ${total} ${label}`}
        </p>
        <div className="flex items-center justify-end gap-2">
          <label className="text-xs text-horus-muted" htmlFor={pageSizeId}>
            Filas
          </label>
          <select
            id={pageSizeId}
            className="h-9 rounded-lg border border-horus-line bg-white px-2 text-sm"
            value={pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Página anterior"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="min-w-20 text-center text-sm text-horus-muted">
            {pageCount === 0 ? 0 : pagination.pageIndex + 1} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Página siguiente"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
