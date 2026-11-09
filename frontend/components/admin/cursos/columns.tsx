import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { BadgeEstado } from "@/components/admin/badge-estado";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import type { Curso } from "@/types/curso";

const CATEGORIAS: Record<string, string> = {
  tecnologia: "Tecnología",
  educacion: "Educación",
  salud: "Salud",
  gestion: "Gestión",
  otros: "Otros",
};

const MODALIDADES: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
  hibrido: "Híbrido",
};

type Options = {
  eliminados: boolean;
  /** Cada acción solo aparece si el usuario tiene el permiso (se pasa el manejador). */
  onEdit?: (curso: Curso) => void;
  onArchive?: (curso: Curso) => void;
  onRestore?: (curso: Curso) => void;
  restoringId?: string;
};

/** Los ids ordenables (codigo, nombre, precio) coinciden con el parámetro sort del backend. */
export function cursoColumns({
  eliminados,
  onEdit,
  onArchive,
  onRestore,
  restoringId,
}: Options): ColumnDef<Curso>[] {
  return [
    { id: "codigo", accessorKey: "codigo", header: "Código" },
    {
      id: "nombre",
      header: "Curso",
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <span className="block font-semibold text-horus-ink">{row.original.nombre}</span>
          {row.original.deleted_at && (
            <span className="text-xs text-horus-muted">
              Eliminado {formatDate(row.original.deleted_at)}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "categoria",
      header: "Categoría",
      enableSorting: false,
      cell: ({ row }) => CATEGORIAS[row.original.categoria] ?? row.original.categoria,
    },
    {
      id: "modalidad",
      header: "Modalidad",
      enableSorting: false,
      cell: ({ row }) => MODALIDADES[row.original.modalidad] ?? row.original.modalidad,
    },
    {
      id: "precio",
      header: "Precio",
      enableSorting: true,
      cell: ({ row }) => formatMoney(row.original.precio),
    },
    {
      id: "cupos",
      header: "Cupos",
      enableSorting: false,
      cell: ({ row }) =>
        row.original.cupos_disponibles + " / " + row.original.cupos_maximos,
    },
    {
      id: "estado",
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
        const curso = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            {eliminados ? (
              onRestore && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={"Restaurar " + curso.nombre}
                  disabled={restoringId === curso.id}
                  onClick={() => onRestore(curso)}
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
                    aria-label={"Editar " + curso.nombre}
                    onClick={() => onEdit(curso)}
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
                    aria-label={"Desactivar " + curso.nombre}
                    onClick={() => onArchive(curso)}
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
