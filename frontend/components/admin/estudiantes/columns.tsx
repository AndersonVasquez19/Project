import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { BadgeEstado } from "@/components/admin/badge-estado";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { Estudiante } from "@/types/estudiante";

type Options = {
  eliminados: boolean;
  /** Cada acción solo aparece si el usuario tiene el permiso (se pasa el manejador). */
  onEdit?: (estudiante: Estudiante) => void;
  onArchive?: (estudiante: Estudiante) => void;
  onRestore?: (estudiante: Estudiante) => void;
  /** Id que se está restaurando (deshabilita su botón). */
  restoringId?: string;
};

/** Los ids ordenables (dni, apellidos) coinciden con el parámetro sort del backend. */
export function estudianteColumns({
  eliminados,
  onEdit,
  onArchive,
  onRestore,
  restoringId,
}: Options): ColumnDef<Estudiante>[] {
  return [
    { id: "dni", accessorKey: "dni", header: "DNI" },
    {
      id: "apellidos",
      header: "Estudiante",
      cell: ({ row }) => (
        <div>
          <span className="block font-semibold text-horus-ink">
            {row.original.apellidos}, {row.original.nombres}
          </span>
          {row.original.deleted_at && (
            <span className="text-xs text-horus-muted">
              Eliminado {formatDate(row.original.deleted_at)}
            </span>
          )}
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "contacto",
      header: "Contacto",
      enableSorting: false,
      cell: ({ row }) => (
        <div>
          <span className="block">{row.original.email || "Sin correo"}</span>
          <span className="text-xs text-horus-muted">
            {row.original.telefono || "Sin teléfono"}
          </span>
        </div>
      ),
    },
    {
      id: "estado",
      accessorKey: "estado",
      header: "Estado",
      enableSorting: false,
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
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const estudiante = row.original;
        const nombre = `${estudiante.nombres} ${estudiante.apellidos}`;

        return (
          <div className="flex items-center justify-end gap-1">
            {eliminados ? (
              onRestore && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Restaurar a ${nombre}`}
                  disabled={restoringId === estudiante.id}
                  onClick={() => onRestore(estudiante)}
                >
                  <RotateCcw aria-hidden="true" /> Restaurar
                </Button>
              )
            ) : (
              <>
                {onEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Editar a ${nombre}`}
                    onClick={() => onEdit(estudiante)}
                  >
                    <Pencil aria-hidden="true" /> Editar
                  </Button>
                )}
                {onArchive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:bg-red-50 hover:text-red-800"
                    aria-label={`Desactivar a ${nombre}`}
                    onClick={() => onArchive(estudiante)}
                  >
                    <Trash2 aria-hidden="true" /> Desactivar
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
