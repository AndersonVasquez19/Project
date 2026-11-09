"use client";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";

type Props = {
  open: boolean;
  pending: boolean;
  action: "annul" | "archive";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function MatriculaActionConfirm({
  open,
  pending,
  action,
  onOpenChange,
  onConfirm,
}: Props) {
  const isAnnul = action === "annul";

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      pending={pending}
      destructive
      title={isAnnul ? "¿Anular esta matrícula?" : "¿Eliminar esta matrícula?"}
      description={
        isAnnul
          ? "La matrícula dejará de ocupar un cupo. Esta operación se volverá a validar en el servidor."
          : "La matrícula se eliminará lógicamente y se conservará su historial."
      }
      confirmLabel={isAnnul ? "Anular matrícula" : "Eliminar"}
      pendingLabel="Procesando..."
    />
  );
}
