"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
} from "@tanstack/react-table";
import { Archive, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useMemo } from "react";
import { BadgeEstado } from "@/components/admin/badge-estado";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ServicioTecnologico } from "@/types/servicio";

type ServicioTableProps = {
  data: ServicioTecnologico[];
  total: number;
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onEdit: (servicio: ServicioTecnologico) => void;
  onArchive: (servicio: ServicioTecnologico) => void;
};

export function ServicioTable({
  data,
  total,
  pageCount,
  pagination,
  onPaginationChange,
  onEdit,
  onArchive,
}: ServicioTableProps) {
  const columns = useMemo<ColumnDef<ServicioTecnologico>[]>(
    () => [
      {
        accessorKey: "codigo",
        header: "Código",
        cell: ({ row }) => (
          <span className="font-semibold text-[#172B3A]">
            {row.original.codigo}
          </span>
        ),
      },
      {
        accessorKey: "nombre",
        header: "Servicio",
        cell: ({ row }) => (
          <div className="min-w-40">
            <p className="font-medium text-[#172B3A]">{row.original.nombre}</p>
            <p className="mt-0.5 text-xs text-[#64748B]">
              {row.original.categoria || "Sin categoría"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => <BadgeEstado estado={row.original.estado} />,
      },
      {
        id: "acciones",
        header: "Acciones",
        enableHiding: false,
        cell: ({ row }) => {
          const servicio = row.original;
          const archived = servicio.estado === "archivado";

          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Editar ${servicio.nombre}`}
                onClick={() => onEdit(servicio)}
              >
                <Pencil aria-hidden="true" />
                <span>Editar</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-700 hover:bg-red-50 hover:text-red-800"
                aria-label={`Archivar ${servicio.nombre}`}
                disabled={archived}
                onClick={() => onArchive(servicio)}
              >
                <Archive aria-hidden="true" />
                <span>{archived ? "Archivado" : "Archivar"}</span>
              </Button>
            </div>
          );
        },
      },
    ],
    [onArchive, onEdit],
  );

  // The table instance is intentionally used as TanStack's mutable controller.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
    onPaginationChange,
    state: { pagination },
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
      <Table>
        <TableHeader className="bg-[#F8FAFC]">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="px-4 py-3 text-xs uppercase tracking-wide text-[#64748B]">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
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
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-28 text-center text-sm text-[#64748B]"
              >
                No se encontraron servicios tecnológicos.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#64748B]" aria-live="polite">
          {total === 0
            ? "0 servicios"
            : `${pagination.pageIndex * pagination.pageSize + 1}–${Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                total,
              )} de ${total} servicios`}
        </p>
        <div className="flex items-center justify-end gap-2">
          <label className="text-xs text-[#64748B]" htmlFor="servicios-page-size">
            Filas
          </label>
          <select
            id="servicios-page-size"
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2 text-sm"
            value={pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {[10, 20, 50].map((size) => (
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
          <span className="min-w-20 text-center text-sm text-[#64748B]">
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
