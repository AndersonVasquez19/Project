"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { FormDialog } from "@/components/admin/form-dialog";
import { FormField } from "@/components/admin/form-field";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-error";
import { notify } from "@/lib/toast";
import { create, update } from "@/services/rolesService";
import type { PermissionOption, SystemRole } from "@/types/role";

const roleSchema = z.object({
  name: z.string().trim().min(1, "Escribe un nombre para el rol.").max(100),
  permissionIds: z.array(z.string()),
});

type FormValues = z.infer<typeof roleSchema>;

const EMPTY: FormValues = { name: "", permissionIds: [] };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sin rol = crear. */
  role?: SystemRole;
  permissions: PermissionOption[];
  canManage: boolean;
};

export function RoleForm({ open, onOpenChange, role, permissions, canManage }: Props) {
  const queryClient = useQueryClient();
  const readOnly = !canManage || Boolean(role?.protected);
  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      role ? update(role.id, values) : create(values),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      notify.success(
        role
          ? saved.sessionRevoked
            ? "Rol actualizado. Sus usuarios deberán volver a iniciar sesión."
            : "Rol actualizado."
          : "Rol creado.",
      );
      onOpenChange(false);
    },
  });
  const resetMutation = mutation.reset;
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    reset(role ? { name: role.name, permissionIds: role.permissionIds } : EMPTY);
    resetMutation();
  }, [role, open, reset, resetMutation]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={role ? "Editar rol" : "Crear rol"}
      description={
        role?.protected
          ? "El rol administrador está protegido: solo se puede consultar."
          : "Selecciona solo los permisos necesarios para las funciones del rol."
      }
      submitLabel="Guardar cambios"
      pendingLabel="Guardando…"
      className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      pending={mutation.isPending}
      hideSubmit={readOnly}
      error={
        mutation.error
          ? getApiErrorMessage(mutation.error, "No se pudo guardar el rol.")
          : null
      }
      onSubmit={handleSubmit((values) =>
        mutation.mutate({
          name: values.name,
          permissionIds: [...new Set(values.permissionIds)],
        }),
      )}
    >
      <FormField label="Nombre del rol" required error={errors.name?.message}>
        {(controlProps) => (
          <Input
            maxLength={100}
            disabled={readOnly}
            {...controlProps}
            {...register("name")}
          />
        )}
      </FormField>
      <Controller
        control={control}
        name="permissionIds"
        render={({ field }) => (
          <fieldset className="space-y-3">
            <legend className="admin-label">Permisos</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {permissions.map((permission) => (
                <label
                  key={permission.id}
                  className="flex items-center gap-2 rounded-lg border border-horus-line px-3 py-2 text-sm text-horus-ink"
                >
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={field.value.includes(permission.id)}
                    disabled={readOnly}
                    onChange={(event) =>
                      field.onChange(
                        event.currentTarget.checked
                          ? [...field.value, permission.id]
                          : field.value.filter((id) => id !== permission.id),
                      )
                    }
                  />
                  <span>{permission.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      />
    </FormDialog>
  );
}
