"use client";

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/admin/data-table";
import { ErrorBanner } from "@/components/admin/error-banner";
import { PageHeader } from "@/components/admin/page-header";
import { SearchInput } from "@/components/admin/search-input";
import { CreateUsuarioDialog } from "@/components/admin/usuarios/CreateUsuarioDialog";
import { usuarioColumns } from "@/components/admin/usuarios/columns";
import { UsuarioForm } from "@/components/admin/usuarios/UsuarioForm";
import { Button } from "@/components/ui/button";
import { useUrlListState } from "@/hooks/use-url-list-state";
import { getApiErrorMessage } from "@/lib/api-error";
import { can } from "@/lib/permissions";
import { getAll } from "@/services/usuariosService";
import type { Usuario, UsuarioUpdateResult } from "@/types/usuario";

type Props = { permissions: readonly string[] };

export function UsuariosPageClient({ permissions }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const list = useUrlListState({ filters: {} });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario>();

  const usuariosQuery = useQuery({
    queryKey: ["usuarios", list.params],
    queryFn: () => getAll(list.params),
    placeholderData: keepPreviousData,
  });

  const canAssign = can(permissions, "usuarios.asignar-roles");
  const canEditRoles = can(permissions, "usuarios.editar") && canAssign;
  const canCreateUser = can(permissions, "usuarios.crear") && canAssign;
  const roleOptions = usuariosQuery.data?.assignableRoles ?? [];

  const columns = useMemo(
    () => usuarioColumns({ onEditRoles: canEditRoles ? setEditing : undefined }),
    [canEditRoles],
  );

  function onSaved(result: UsuarioUpdateResult) {
    setEditing(undefined);
    if (result.sessionRevoked) {
      router.replace("/login");
      router.refresh();
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Acceso"
        title="Usuarios del sistema"
        description="Administra las cuentas internas y los roles asignados al personal."
        actions={
          canCreateUser && (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden="true" /> Crear usuario
            </Button>
          )
        }
      />

      <div className="rounded-2xl border border-horus-line bg-white p-4 shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
        <div className="w-full sm:max-w-sm">
          <SearchInput
            aria-label="Buscar usuarios por nombre o correo"
            placeholder="Buscar por nombre o correo"
            value={list.searchInput}
            onChange={(event) => list.setSearch(event.currentTarget.value)}
          />
        </div>
        {usuariosQuery.isFetching && !usuariosQuery.isPending && (
          <p className="mt-3 text-xs text-horus-muted" role="status">
            Actualizando resultados…
          </p>
        )}
      </div>

      {usuariosQuery.error && (
        <ErrorBanner
          message={getApiErrorMessage(usuariosQuery.error, "No fue posible cargar los usuarios.")}
          onRetry={() => void usuariosQuery.refetch()}
        />
      )}

      <DataTable
        columns={columns}
        data={usuariosQuery.data?.data ?? []}
        caption="Usuarios del sistema"
        total={usuariosQuery.data?.meta.total ?? 0}
        pageCount={usuariosQuery.data?.meta.totalPages ?? 0}
        pagination={list.pagination}
        onPaginationChange={list.setPagination}
        sorting={list.sorting}
        onSortingChange={list.setSorting}
        isLoading={usuariosQuery.isPending}
        emptyMessage="No se encontraron usuarios."
        itemLabel={{ singular: "usuario", plural: "usuarios" }}
        getRowId={(usuario) => usuario.id}
      />

      <UsuarioForm
        key={editing?.id ?? "ninguno"}
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        usuario={editing}
        roleOptions={roleOptions}
        onSaved={onSaved}
      />
      <CreateUsuarioDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roleOptions={roleOptions}
      />
    </section>
  );
}
