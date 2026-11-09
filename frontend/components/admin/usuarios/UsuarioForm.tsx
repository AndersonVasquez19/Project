"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FormDialog } from "@/components/admin/form-dialog";
import { RolePicker } from "@/components/admin/usuarios/RolePicker";
import { getApiErrorMessage } from "@/lib/api-error";
import { notify } from "@/lib/toast";
import { updateRoles } from "@/services/usuariosService";
import type { Usuario, UsuarioUpdateResult } from "@/types/usuario";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: Usuario;
  roleOptions: string[];
  onSaved: (result: UsuarioUpdateResult) => void;
};

/** Edita los roles de un usuario. Quien lo abre debe montarlo con `key` por usuario. */
export function UsuarioForm({
  open,
  onOpenChange,
  usuario,
  roleOptions,
  onSaved,
}: Props) {
  const queryClient = useQueryClient();
  // null = sin cambios todavía: se muestran los roles actuales del usuario.
  const [draft, setDraft] = useState<string[] | null>(null);
  const roles = draft ?? usuario?.roles ?? [];

  const mutation = useMutation({
    mutationFn: (next: string[]) => {
      if (!usuario) throw new Error("Selecciona un usuario antes de actualizar.");
      return updateRoles(usuario.id, next);
    },
    onSuccess: async (result) => {
      if (!result.sessionRevoked) {
        await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      }
      notify.success("Roles de " + result.name + " actualizados.");
      onSaved(result);
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setDraft(null);
          mutation.reset();
        }
        onOpenChange(next);
      }}
      title="Editar roles del usuario"
      description={
        usuario
          ? "Selecciona los roles que tendrá " + usuario.name + ". Los cambios revocan sus tokens de acceso actuales."
          : "Selecciona los roles del usuario."
      }
      submitLabel="Actualizar roles"
      pending={mutation.isPending}
      error={
        mutation.error
          ? getApiErrorMessage(mutation.error, "No se pudieron actualizar los roles.")
          : null
      }
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(roles);
      }}
    >
      <RolePicker options={roleOptions} value={roles} onChange={setDraft} />
    </FormDialog>
  );
}
