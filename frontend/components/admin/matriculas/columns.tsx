import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { CreditCard, Pencil, RotateCcw, Trash2, XCircle } from "lucide-react";
import { BadgeEstado } from "@/components/admin/badge-estado";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import type { Matricula } from "@/types/matricula";

type Options = {
  eliminados: boolean;
  /** Cada acción solo aparece si el usuario tiene el permiso (se pasa el manejador). */
  onEdit?: (matricula: Matricula) => void;
  onAnnul?: (matricula: Matricula) => void;
  onArchive?: (matricula: Matricula) => void;
  onRestore?: (matricula: Matricula) => void;
  restoringId?: string;
};

function describe(matricula: Matricula): string {
  const estudiante = matricula.estudiante
    ? matricula.estudiante.nombres + " " + matricula.estudiante.apellidos
    : "estudiante no disponible";
  const curso = matricula.curso ? matricula.curso.nombre : "curso no disponible";
  return estudiante + " en " + curso;
}

/** Los ids ordenables (fecha_matricula, estado) coinciden con el parámetro sort del backend. */
export function matriculaColumns({
  eliminados,
  onEdit,
  onAnnul,
  onArchive,
  onRestore,
  restoringId,
}: Options): ColumnDef<Matricula>[] {
  return [
    {
      id: "estudiante",
      header: "Estudiante",
      enableSorting: false,
      cell: ({ row }) => (
        <div>
          <span className="block font-semibold text-horus-ink">
            {row.original.estudiante
              ? row.original.estudiante.nombres + " " + row.original.estudiante.apellidos
              : "Estudiante no disponible"}
          </span>
          <span className="text-xs text-horus-muted">
            {row.original.estudiante?.dni ?? "Sin DNI"}
          </span>
        </div>
      ),
    },
    {
      id: "curso",
      header: "Curso",
      enableSorting: false,
      cell: ({ row }) => (
        <div>
          <span className="block font-medium text-horus-ink">
            {row.original.curso?.nombre ?? "Curso no disponible"}
          </span>
          <span className="text-xs font-medium text-horus-primary">
            {row.original.curso?.codigo ?? ""}
          </span>
        </div>
      ),
    },
    {
      id: "fecha_matricula",
      header: "Fecha",
      enableSorting: true,
      cell: ({ row }) => formatDate(row.original.fecha_matricula),
    },
    {
      id: "estado",
      header: "Estado",
      enableSorting: true,
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
      id: "pagado",
      header: "Pagado",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.monto_pagado === null ? (
          "—"
        ) : (
          <div>
            <span className="block">{formatMoney(row.original.monto_pagado)}</span>
            {row.original.monto_total !== null && (
              <span className="text-xs text-horus-muted">
                de {formatMoney(row.original.monto_total)}
              </span>
            )}
          </div>
        ),
    },
    {
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const matricula = row.original;
        const quien = describe(matricula);

        return (
          <div className="flex items-center justify-end gap-1">
            {eliminados ? (
              onRestore && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={"Restaurar matrícula de " + quien}
                  disabled={restoringId === matricula.id}
                  onClick={() => onRestore(matricula)}
                >
                  <RotateCcw aria-hidden="true" /> Restaurar
                </Button>
              )
            ) : (
              <>
                <Link
                  className="inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-[0.8rem] font-medium text-foreground hover:bg-muted"
                  href={"/admin/matriculas/" + encodeURIComponent(matricula.id) + "/pagos"}
                  aria-label={"Pagos de " + quien}
                >
                  <CreditCard aria-hidden="true" /> Pagos
                </Link>
                {onEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={"Editar matrícula de " + quien}
                    onClick={() => onEdit(matricula)}
                  >
                    <Pencil aria-hidden="true" /> Editar
                  </Button>
                )}
                {onAnnul && matricula.estado !== "anulada" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    aria-label={"Anular matrícula de " + quien}
                    onClick={() => onAnnul(matricula)}
                  >
                    <XCircle aria-hidden="true" /> Anular
                  </Button>
                )}
                {onArchive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:bg-red-50 hover:text-red-800"
                    aria-label={"Eliminar matrícula de " + quien}
                    onClick={() => onArchive(matricula)}
                  >
                    <Trash2 aria-hidden="true" /> Eliminar
                  </Button>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];
}
