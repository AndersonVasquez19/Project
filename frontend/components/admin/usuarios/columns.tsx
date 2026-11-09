import type { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Usuario } from "@/types/usuario";

type Options = {
  /** La acción solo aparece si el usuario puede editar roles (se pasa el manejador). */
  onEditRoles?: (usuario: Usuario) => void;
};

/** Los ids ordenables (name, email) coinciden con el parámetro sort del backend. */
export function usuarioColumns({ onEditRoles }: Options): ColumnDef<Usuario>[] {
  return [
    {
      id: "name",
      header: "Nombre",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-semibold text-horus-ink">{row.original.name}</span>
      ),
    },
    { id: "email", accessorKey: "email", header: "Correo", enableSorting: true },
    {
      id: "roles",
      header: "Roles",
      enableSorting: false,
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
          <span className="text-xs text-horus-muted">Sin rol</span>
        ),
    },
    {
      id: "acciones",
      header: () => <span className="sr-only">Acciones</span>,
      enableSorting: false,
      cell: ({ row }) =>
        onEditRoles ? (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={"Editar roles de " + row.original.name}
              onClick={() => onEditRoles(row.original)}
            >
              <Pencil aria-hidden="true" /> Editar roles
            </Button>
          </div>
        ) : null,
    },
  ];
}
