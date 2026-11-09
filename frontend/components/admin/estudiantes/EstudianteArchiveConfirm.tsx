"use client";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";

type Props = {
  open: boolean;
  pending: boolean;
  studentName?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function EstudianteArchiveConfirm({
  open,
  pending,
  studentName,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      pending={pending}
      destructive
      title="¿Desactivar este estudiante?"
      description={
        studentName
          ? `“${studentName}” se eliminará lógicamente. Sus matrículas e historial se conservarán.`
          : "El estudiante se eliminará lógicamente y sus matrículas se conservarán."
      }
      confirmLabel="Desactivar"
      pendingLabel="Desactivando..."
    />
  );
}
