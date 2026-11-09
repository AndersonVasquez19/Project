"use client";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";

type CursoArchiveConfirmProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
  cursoName?: string;
};

export function CursoArchiveConfirm({
  open,
  onOpenChange,
  onConfirm,
  pending,
  cursoName,
}: CursoArchiveConfirmProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      pending={pending}
      destructive
      title="¿Desactivar este curso?"
      description={
        cursoName
          ? `“${cursoName}” se ocultará de la lista principal. Podrás restaurarlo más adelante.`
          : "El curso se ocultará de la lista principal. Podrás restaurarlo más adelante."
      }
      confirmLabel="Desactivar"
      pendingLabel="Desactivando..."
    />
  );
}
