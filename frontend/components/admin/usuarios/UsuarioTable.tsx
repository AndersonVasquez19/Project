"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Usuario } from "@/types/usuario";

type UsuarioTableProps = {
  data: Usuario[];
  total: number;
  pageCount: number;
  pagination: PaginationState;
  canEditRoles: boolean;
  onPaginationChange: OnChangeFn<PaginationState>;
  onEdit: (usuario: Usuario) => void;
};

export function UsuarioTable({
  data,
  total,
  pageCount,
  pagination,
  canEditRoles,
  onPaginationChange,
  onEdit,
}: UsuarioTableProps) {
  const columns = useMemo<ColumnDef<Usuario>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <span className="font-semibold text-[#172B3A]">{row.original.name}</span>
        ),
      },
      { accessorKey: "email", header: "Correo" },
      {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ row }) =>
          row.original.roles.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.original.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex rounded-full border border-[#19A7A1]/30 bg-[#19A7A1]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#0F766E]"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-[#64748B]">Sin rol</span>
          ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) =>
          canEditRoles ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Editar roles de ${row.original.name}`}
                onClick={() => onEdit(row.original)}
              >
                <Pencil aria-hidden="true" />
                <span>Editar roles</span>
              </Button>
            </div>
          ) : null,
      },
    ],
    [canEditRoles, onEdit],
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
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => (
                <TableHead key={header.id} className="px-4 py-3 text-xs uppercase tracking-wide text-[#64748B]">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
              <TableCell colSpan={columns.length} className="h-28 text-center text-sm text-[#64748B]">
                No hay usuarios registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#64748B]" aria-live="polite">
          {total === 0
            ? "0 usuarios"
            : `${pagination.pageIndex * pagination.pageSize + 1}–${Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                total,
              )} de ${total} usuarios`}
        </p>
        <div className="flex items-center justify-end gap-2">
          <label className="text-xs text-[#64748B]" htmlFor="usuarios-page-size">Filas</label>
          <select
            id="usuarios-page-size"
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2 text-sm"
            value={pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <Button type="button" variant="outline" size="icon" aria-label="Página anterior" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="min-w-20 text-center text-sm text-[#64748B]">
            {pageCount === 0 ? 0 : pagination.pageIndex + 1} / {pageCount}
          </span>
          <Button type="button" variant="outline" size="icon" aria-label="Página siguiente" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
