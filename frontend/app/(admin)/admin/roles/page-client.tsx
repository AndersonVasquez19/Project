"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAll, create, remove, update } from "@/services/rolesService";
import type { RoleInput, SystemRole } from "@/types/role";

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body: unknown = error.response?.data;
    if (typeof body === "object" && body !== null && "message" in body) {
      const message = body.message;
      if (typeof message === "string") return message;
      if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
        return message.join(" ");
      }
    }
  }
  return "No fue posible completar la operación. Inténtalo nuevamente.";
}

export function RolesPageClient({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: getAll });
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SystemRole | null>(null);
  const [name, setName] = useState("");
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const saveMutation = useMutation({
    mutationFn: (input: RoleInput) =>
      selectedRole
        ? update(selectedRole.id, input)
        : create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      setSelectedRole(null);
      setFormOpen(false);
      setFormError(null);
    },
    onError: (error: unknown) => setFormError(errorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
    onError: (error: unknown) => setFormError(errorMessage(error)),
  });
  const roles = rolesQuery.data?.data ?? [];
  const permissions = rolesQuery.data?.permissions ?? [];

  function openRole(role?: SystemRole) {
    setSelectedRole(role ?? null);
    setFormOpen(true);
    setName(role?.name ?? "");
    setPermissionIds(role?.permissionIds ?? []);
    setFormError(null);
  }

  function closeForm(open: boolean) {
    if (saveMutation.isPending) return;
    if (!open) {
      setSelectedRole(null);
      setFormOpen(false);
      setFormError(null);
    }
  }

  function togglePermission(id: string, checked: boolean) {
    setPermissionIds((current) =>
      checked
        ? [...current, id]
        : current.filter((permissionId) => permissionId !== id),
    );
  }

  function submitRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Escribe un nombre para el rol.");
      return;
    }
    setFormError(null);
    saveMutation.mutate({
      name: trimmedName,
      permissionIds: [...new Set(permissionIds)],
    });
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
            Sistema y seguridad
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
            Roles y permisos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
            Define el acceso del equipo. Los cambios de permisos revocan las
            sesiones de las personas asignadas al rol.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => openRole()} disabled={saveMutation.isPending}>
            Crear rol
          </Button>
        )}
      </header>

      {formError && !selectedRole && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {formError}
        </p>
      )}
      {deleteMutation.isError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {errorMessage(deleteMutation.error)}
        </p>
      )}
      {rolesQuery.isError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {errorMessage(rolesQuery.error)}
        </p>
      )}

      {rolesQuery.isPending ? (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-12 text-center text-sm text-[#64748B]">
          Cargando roles…
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {roles.map((role) => (
            <article
              key={role.id}
              className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#172B3A]">{role.name}</h2>
                  <p className="mt-1 text-xs text-[#64748B]">
                    {role.assignedUsers} usuario{role.assignedUsers === 1 ? "" : "s"} ·{" "}
                    {role.permissionIds.length} permiso{role.permissionIds.length === 1 ? "" : "s"}
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openRole(role)}>
                      Editar
                    </Button>
                    {!role.protected && role.assignedUsers === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`¿Eliminar el rol “${role.name}”?`)) {
                            deleteMutation.mutate(role.id);
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {role.permissionIds.length === 0 ? (
                  <span className="text-sm text-[#64748B]">Sin permisos asignados.</span>
                ) : (
                  role.permissionIds.map((id) => {
                    const permission = permissions.find((item) => item.id === id);
                    return permission ? (
                      <span
                        key={id}
                        className="rounded-full border border-[#176B9A]/15 bg-[#176B9A]/5 px-2.5 py-1 text-xs text-[#176B9A]"
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
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-4 py-12 text-center text-sm text-[#64748B]">
              No hay roles para mostrar.
            </div>
          )}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={closeForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRole ? "Editar rol" : "Crear rol"}</DialogTitle>
            <DialogDescription>
              Selecciona solo los permisos necesarios para las funciones del rol.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={submitRole}>
            <label className="block space-y-2">
              <span className="admin-label">Nombre del rol</span>
              <input
                className="admin-input w-full"
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                disabled={selectedRole?.protected}
                required
              />
            </label>
            <fieldset className="space-y-3">
              <legend className="admin-label">Permisos</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {permissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-[#172B3A]"
                  >
                    <input
                      type="checkbox"
                      checked={permissionIds.includes(permission.id)}
                      disabled={selectedRole?.protected}
                      onChange={(event) =>
                        togglePermission(permission.id, event.currentTarget.checked)
                      }
                    />
                    <span>{permission.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {formError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {formError}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => closeForm(false)}>
                Cancelar
              </Button>
              {canManage && !selectedRole?.protected && (
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Guardando…" : "Guardar cambios"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
