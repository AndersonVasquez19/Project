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
import type { Estudiante } from "@/types/estudiante";

type Props = {
  data: Estudiante[];
  total: number;
  pageCount: number;
  pagination: PaginationState;
  eliminados: boolean;
  canEdit: boolean;
  canArchive: boolean;
  canRestore: boolean;
  onPaginationChange: OnChangeFn<PaginationState>;
  onEdit: (estudiante: Estudiante) => void;
  onArchive: (estudiante: Estudiante) => void;
  onRestore: (estudiante: Estudiante) => void;
};

export function EstudianteTable({
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
}: Props) {
  const columns = useMemo<ColumnDef<Estudiante>[]>(
    () => [
      { accessorKey: "dni", header: "DNI" },
      {
        id: "nombre",
        header: "Estudiante",
        cell: ({ row }) => (
          <div>
            <span className="block font-semibold text-[#172B3A]">
              {row.original.apellidos}, {row.original.nombres}
            </span>
            {row.original.deleted_at && (
              <span className="text-xs text-[#64748B]">
                Eliminado {new Date(row.original.deleted_at).toLocaleDateString("es-PE")}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "contacto",
        header: "Contacto",
        cell: ({ row }) => (
          <div>
            <span className="block">{row.original.email || "Sin correo"}</span>
            <span className="text-xs text-[#64748B]">{row.original.telefono || "Sin teléfono"}</span>
          </div>
        ),
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
                <Button type="button" variant="ghost" size="sm" onClick={() => onRestore(row.original)}>
                  <RotateCcw aria-hidden="true" /> Restaurar
                </Button>
              )
            ) : (
              <>
                {canEdit && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
                    <Pencil aria-hidden="true" /> Editar
                  </Button>
                )}
                {canArchive && (
                  <Button type="button" variant="ghost" size="sm" className="text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => onArchive(row.original)}>
                    <Trash2 aria-hidden="true" /> Desactivar
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
          {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-4 py-3.5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-28 text-center text-sm text-[#64748B]">
                {eliminados ? "No hay estudiantes eliminados." : "No se encontraron estudiantes."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#64748B]" aria-live="polite">
          {total === 0 ? "0 estudiantes" : `${pagination.pageIndex * pagination.pageSize + 1}–${Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} de ${total} estudiantes`}
        </p>
        <div className="flex items-center justify-end gap-2">
          <label className="text-xs text-[#64748B]" htmlFor="estudiantes-page-size">Filas</label>
          <select id="estudiantes-page-size" className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2 text-sm" value={pagination.pageSize} onChange={(event) => table.setPageSize(Number(event.target.value))}>
            {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <Button type="button" variant="outline" size="icon" aria-label="Página anterior" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="min-w-20 text-center text-sm text-[#64748B]">{pageCount === 0 ? 0 : pagination.pageIndex + 1} / {pageCount}</span>
          <Button type="button" variant="outline" size="icon" aria-label="Página siguiente" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
