"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateRoles } from "@/services/usuariosService";
import type { Usuario, UsuarioUpdateResult } from "@/types/usuario";

const usuarioSchema = z.object({
  roles: z.array(z.string()).max(50),
});

type UsuarioFormValues = z.infer<typeof usuarioSchema>;

type UsuarioFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: Usuario;
  roleOptions: string[];
  onSaved: (result: UsuarioUpdateResult) => void;
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "object" && data !== null && "message" in data) {
      const { message } = data;
      if ("errors" in data && typeof data.errors === "object" && data.errors !== null) {
        const messages = Object.values(data.errors).flatMap((value) =>
          Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [],
        );
        if (messages.length > 0) return messages.join(" ");
      }
      if (typeof message === "string") return message;
      if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
        return message.join(" ");
      }
    }
  }
  return "No se pudieron actualizar los roles. Inténtalo nuevamente.";
}

export function UsuarioForm({
  open,
  onOpenChange,
  usuario,
  roleOptions,
  onSaved,
}: UsuarioFormProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (roles: string[]) => {
      if (!usuario) throw new Error("Selecciona un usuario antes de actualizar.");
      return updateRoles(usuario.id, roles);
    },
    onSuccess: async (result) => {
      if (!result.sessionRevoked) {
        await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      }
      onSaved(result);
    },
  });
  const resetMutation = mutation.reset;
  const {
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { isSubmitting },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { roles: [] },
  });
  const selectedRoles = useWatch({ control, name: "roles" });

  useEffect(() => {
    reset({ roles: usuario?.roles ?? [] });
    resetMutation();
  }, [open, reset, resetMutation, usuario]);

  function toggleRole(role: string, checked: boolean) {
    const roles = selectedRoles ?? [];
    const nextRoles = checked
      ? [...roles, role]
      : roles.filter((current) => current !== role);
    setValue("roles", nextRoles, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!mutation.isPending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar roles del usuario</DialogTitle>
          <DialogDescription>
            {usuario
              ? `Selecciona los roles que tendrá ${usuario.name}. Los cambios revocan sus tokens de acceso actuales.`
              : "Selecciona los roles del usuario."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values.roles))}
          noValidate
        >
          {mutation.error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {getErrorMessage(mutation.error)}
            </p>
          )}

          <fieldset className="space-y-3">
            <legend className="admin-label">Roles</legend>
            {roleOptions.length === 0 ? (
              <p className="text-sm text-[#64748B]">No hay roles disponibles para asignar.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {roleOptions.map((role) => (
                  <label
                    key={role}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-[#F4F7FB] px-3.5 py-2.5 text-sm font-medium text-[#172B3A] transition hover:border-[#287FB5]/40"
                  >
                    <input
                      type="checkbox"
                      checked={(selectedRoles ?? []).includes(role)}
                      onChange={(event) => toggleRole(role, event.currentTarget.checked)}
                      className="admin-checkbox"
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || isSubmitting}>
              {mutation.isPending ? "Guardando..." : "Actualizar roles"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
