import type { ColumnDef } from "@tanstack/react-table";
import { Archive, Pencil } from "lucide-react";
import { BadgeEstado } from "@/components/admin/badge-estado";
import { Button } from "@/components/ui/button";
import type { ServicioTecnologico } from "@/types/servicio";

type Actions = {
  /** Si falta, el botón no se muestra (sin permiso servicios.editar). */
  onEdit?: (servicio: ServicioTecnologico) => void;
  onArchive?: (servicio: ServicioTecnologico) => void;
};

/** Columnas del listado. Los ids ordenables coinciden con el parámetro sort del backend. */
export function servicioColumns({
  onEdit,
  onArchive,
}: Actions): ColumnDef<ServicioTecnologico>[] {
  return [
    {
      id: "codigo",
      accessorKey: "codigo",
      header: "Código",
      cell: ({ row }) => (
        <span className="font-semibold text-horus-ink">{row.original.codigo}</span>
      ),
    },
    {
      id: "nombre",
      accessorKey: "nombre",
      header: "Servicio",
      cell: ({ row }) => (
        <div className="min-w-40">
          <p className="font-medium text-horus-ink">{row.original.nombre}</p>
          <p className="mt-0.5 text-xs text-horus-muted">
            {row.original.categoria || "Sin categoría"}
          </p>
        </div>
      ),
    },
    {
      id: "estado",
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => <BadgeEstado estado={row.original.estado} />,
    },
    {
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const servicio = row.original;
        const archived = servicio.estado === "archivado";

        return (
          <div className="flex items-center justify-end gap-1">
            {onEdit && (
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
            )}
            {onArchive && (
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
            )}
          </div>
        );
      },
    },
  ];
}
