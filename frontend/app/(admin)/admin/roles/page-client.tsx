"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ErrorBanner } from "@/components/admin/error-banner";
import { PageHeader } from "@/components/admin/page-header";
import { RoleForm } from "@/components/admin/roles/RoleForm";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { notify } from "@/lib/toast";
import { getAll, remove } from "@/services/rolesService";
import type { SystemRole } from "@/types/role";

export function RolesPageClient({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: getAll });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SystemRole>();
  const [toDelete, setToDelete] = useState<SystemRole>();
  const deleteMutation = useMutation({
    mutationFn: remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      notify.success("Rol eliminado.");
      setToDelete(undefined);
    },
  });
  const roles = rolesQuery.data?.data ?? [];
  const permissions = rolesQuery.data?.permissions ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Sistema y seguridad"
        title="Roles y permisos"
        description="Define el acceso del equipo. Los cambios de permisos revocan las sesiones de las personas asignadas al rol."
        actions={
          canManage && (
            <Button
              type="button"
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              Crear rol
            </Button>
          )
        }
      />

      {rolesQuery.error && (
        <ErrorBanner
          message={getApiErrorMessage(rolesQuery.error, "No fue posible cargar los roles.")}
          onRetry={() => void rolesQuery.refetch()}
        />
      )}
      {deleteMutation.error && (
        <ErrorBanner
          message={getApiErrorMessage(deleteMutation.error, "No se pudo eliminar el rol.")}
        />
      )}

      {rolesQuery.isPending ? (
        <div
          className="rounded-2xl border border-horus-line bg-white px-4 py-12 text-center text-sm text-horus-muted"
          role="status"
        >
          Cargando roles…
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {roles.map((role) => (
            <article
              key={role.id}
              className="rounded-2xl border border-horus-line bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-horus-ink">{role.name}</h2>
                  <p className="mt-1 text-xs text-horus-muted">
                    {role.assignedUsers} usuario{role.assignedUsers === 1 ? "" : "s"} ·{" "}
                    {role.permissionIds.length} permiso
                    {role.permissionIds.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={(canManage ? "Editar el rol " : "Ver el rol ") + role.name}
                    onClick={() => {
                      setEditing(role);
                      setFormOpen(true);
                    }}
                  >
                    {canManage ? "Editar" : "Ver"}
                  </Button>
                  {canManage && !role.protected && role.assignedUsers === 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={"Eliminar el rol " + role.name}
                      disabled={deleteMutation.isPending}
                      onClick={() => setToDelete(role)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {role.permissionIds.length === 0 ? (
                  <span className="text-sm text-horus-muted">Sin permisos asignados.</span>
                ) : (
                  role.permissionIds.map((id) => {
                    const permission = permissions.find((item) => item.id === id);
                    return permission ? (
                      <span
                        key={id}
                        className="rounded-full border border-horus-primary/15 bg-horus-primary/5 px-2.5 py-1 text-xs text-horus-primary"
                      >
                        {permission.name}
                      </span>
                    ) : null;
                  })
                )}
              </div>
            </article>
          ))}
          {roles.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-horus-muted">
              No hay roles para mostrar.
            </div>
          )}
        </div>
      )}

      <RoleForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(undefined);
        }}
        role={editing}
        permissions={permissions}
        canManage={canManage}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setToDelete(undefined);
        }}
        onConfirm={() => {
          if (toDelete) deleteMutation.mutate(toDelete.id);
        }}
        pending={deleteMutation.isPending}
        destructive
        title="¿Eliminar este rol?"
        description={
          toDelete
            ? "El rol “" + toDelete.name + "” se eliminará de forma permanente."
            : "El rol se eliminará de forma permanente."
        }
        confirmLabel="Eliminar rol"
        pendingLabel="Eliminando..."
      />
    </section>
  );
}
