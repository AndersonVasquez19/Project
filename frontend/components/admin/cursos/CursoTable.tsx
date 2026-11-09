"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Pencil, RotateCcw, Trash2 } from "lucide-react";
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
import type { Curso } from "@/types/curso";

type CursoTableProps = {
  data: Curso[];
  total: number;
  pageCount: number;
  pagination: PaginationState;
  eliminados: boolean;
  canEdit: boolean;
  canArchive: boolean;
  canRestore: boolean;
  onPaginationChange: OnChangeFn<PaginationState>;
  onEdit: (curso: Curso) => void;
  onArchive: (curso: Curso) => void;
  onRestore: (curso: Curso) => void;
};

const categorias: Record<string, string> = {
  tecnologia: "Tecnología",
  educacion: "Educación",
  salud: "Salud",
  gestion: "Gestión",
  otros: "Otros",
};

export function CursoTable({
  data,
  total,
  pageCount,
  pagination,
  eliminados,
  canEdit,
  canArchive,
  canRestore,
  onPaginationChange,
  onEdit,
  onArchive,
  onRestore,
}: CursoTableProps) {
  const columns = useMemo<ColumnDef<Curso>[]>(
    () => [
      {
        accessorKey: "codigo",
        header: "Código / Curso",
        cell: ({ row }) => (
          <div>
            <span className="block text-xs font-semibold text-[#176B9A]">
              {row.original.codigo}
            </span>
            <span className="mt-0.5 block font-semibold text-[#172B3A]">
              {row.original.nombre}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "categoria",
        header: "Categoría",
        cell: ({ row }) => categorias[row.original.categoria] ?? row.original.categoria,
      },
      { accessorKey: "modalidad", header: "Modalidad" },
      {
        accessorKey: "precio",
        header: "Precio",
        cell: ({ row }) => `S/ ${Number(row.original.precio).toFixed(2)}`,
      },
      {
        accessorKey: "cupos_disponibles",
        header: "Cupos",
        cell: ({ row }) => `${row.original.cupos_disponibles} / ${row.original.cupos_maximos}`,
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) =>
          eliminados ? (
            <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              Eliminado
            </span>
          ) : (
            <BadgeEstado estado={row.original.estado} />
          ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {eliminados ? (
              canRestore && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Restaurar ${row.original.nombre}`}
                  onClick={() => onRestore(row.original)}
                >
                  <RotateCcw aria-hidden="true" />
                  <span>Restaurar</span>
                </Button>
              )
            ) : (
              <>
                {canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Editar ${row.original.nombre}`}
                    onClick={() => onEdit(row.original)}
                  >
                    <Pencil aria-hidden="true" />
                    <span>Editar</span>
                  </Button>
                )}
                {canArchive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:bg-red-50 hover:text-red-800"
                    aria-label={`Desactivar ${row.original.nombre}`}
                    onClick={() => onArchive(row.original)}
                  >
                    <Trash2 aria-hidden="true" />
                    <span>Desactivar</span>
                  </Button>
                )}
              </>
            )}
          </div>
        ),
      },
    ],
    [canArchive, canEdit, canRestore, eliminados, onArchive, onEdit, onRestore],
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
                {eliminados ? "No hay cursos eliminados." : "No se encontraron cursos."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#64748B]" aria-live="polite">
          {total === 0
            ? "0 cursos"
            : `${pagination.pageIndex * pagination.pageSize + 1}–${Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                total,
              )} de ${total} cursos`}
        </p>
        <div className="flex items-center justify-end gap-2">
          <label className="text-xs text-[#64748B]" htmlFor="cursos-page-size">Filas</label>
          <select
            id="cursos-page-size"
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
