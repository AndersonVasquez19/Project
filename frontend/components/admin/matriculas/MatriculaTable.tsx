"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
} from "@tanstack/react-table";
import Link from "next/link";
import { CreditCard, ChevronLeft, ChevronRight, Pencil, RotateCcw, Trash2, XCircle } from "lucide-react";
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
import type { Matricula } from "@/types/matricula";

type Props = {
  data: Matricula[];
  total: number;
  pageCount: number;
  pagination: PaginationState;
  eliminados: boolean;
  canEdit: boolean;
  canAnnul: boolean;
  canArchive: boolean;
  canRestore: boolean;
  onPaginationChange: OnChangeFn<PaginationState>;
  onEdit: (matricula: Matricula) => void;
  onAnnul: (matricula: Matricula) => void;
  onArchive: (matricula: Matricula) => void;
  onRestore: (matricula: Matricula) => void;
};

function displayDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("es-PE");
}

export function MatriculaTable({
  data,
  total,
  pageCount,
  pagination,
  eliminados,
  canEdit,
  canAnnul,
  canArchive,
  canRestore,
  onPaginationChange,
  onEdit,
  onAnnul,
  onArchive,
  onRestore,
}: Props) {
  const columns = useMemo<ColumnDef<Matricula>[]>(
    () => [
      {
        id: "estudiante",
        header: "Estudiante",
        cell: ({ row }) => (
          <div>
            <span className="block font-semibold text-[#172B3A]">
              {row.original.estudiante
                ? `${row.original.estudiante.nombres} ${row.original.estudiante.apellidos}`
                : "Estudiante no disponible"}
            </span>
            <span className="text-xs text-[#64748B]">
              {row.original.estudiante?.dni ?? "Sin DNI"}
            </span>
          </div>
        ),
      },
      {
        id: "curso",
        header: "Curso",
        cell: ({ row }) => (
          <div>
            <span className="block font-medium text-[#172B3A]">
              {row.original.curso?.nombre ?? "Curso no disponible"}
            </span>
            <span className="text-xs font-medium text-[#176B9A]">
              {row.original.curso?.codigo ?? ""}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "fecha_matricula",
        header: "Fecha",
        cell: ({ row }) => displayDate(row.original.fecha_matricula),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) =>
          eliminados ? (
            <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              Eliminada
            </span>
          ) : (
            <BadgeEstado estado={row.original.estado} />
          ),
      },
      {
        accessorKey: "monto_pagado",
        header: "Pagado",
        cell: ({ row }) =>
          row.original.monto_pagado === null
            ? "—"
            : (
              <div>
                <span className="block">S/ {Number(row.original.monto_pagado).toFixed(2)}</span>
                {row.original.monto_total !== null && (
                  <span className="text-xs text-[#64748B]">
                    de S/ {Number(row.original.monto_total).toFixed(2)}
                  </span>
                )}
              </div>
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
                <Link
                  className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[0.8rem] font-medium text-foreground hover:bg-muted"
                  href={`/admin/matriculas/${encodeURIComponent(row.original.id)}/pagos`}
                >
                    <CreditCard aria-hidden="true" /> Pagos
                </Link>
                {canEdit && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
                    <Pencil aria-hidden="true" /> Editar
                  </Button>
                )}
                {canAnnul && row.original.estado !== "anulada" && (
                  <Button type="button" variant="ghost" size="sm" className="text-amber-700 hover:bg-amber-50 hover:text-amber-800" onClick={() => onAnnul(row.original)}>
                    <XCircle aria-hidden="true" /> Anular
                  </Button>
                )}
                {canArchive && (
                  <Button type="button" variant="ghost" size="sm" className="text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => onArchive(row.original)}>
                    <Trash2 aria-hidden="true" /> Eliminar
                  </Button>
                )}
              </>
            )}
          </div>
        ),
      },
    ],
    [canAnnul, canArchive, canEdit, canRestore, eliminados, onAnnul, onArchive, onEdit, onRestore],
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
                {eliminados ? "No hay matrículas eliminadas." : "No se encontraron matrículas."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#64748B]" aria-live="polite">
          {total === 0 ? "0 matrículas" : `${pagination.pageIndex * pagination.pageSize + 1}–${Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)} de ${total} matrículas`}
        </p>
        <div className="flex items-center justify-end gap-2">
          <label className="text-xs text-[#64748B]" htmlFor="matriculas-page-size">Filas</label>
          <select id="matriculas-page-size" className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-2 text-sm" value={pagination.pageSize} onChange={(event) => table.setPageSize(Number(event.target.value))}>
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
