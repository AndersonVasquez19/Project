"use client";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";

type Props = {
  open: boolean;
  pending: boolean;
  action: "annul" | "archive";
  /** Nombre del estudiante, para dejar claro sobre qué matrícula se actúa. */
  subject?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function MatriculaActionConfirm({
  open,
  pending,
  action,
  subject,
  onOpenChange,
  onConfirm,
}: Props) {
  const isAnnul = action === "annul";
  const of = subject ? " de " + subject : "";

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
          ? "La matrícula" + of + " dejará de ocupar un cupo. Esta operación se volverá a validar en el servidor."
          : "La matrícula" + of + " se eliminará lógicamente y se conservará su historial."
      }
      confirmLabel={isAnnul ? "Anular matrícula" : "Eliminar"}
      pendingLabel="Procesando..."
    />
  );
}
