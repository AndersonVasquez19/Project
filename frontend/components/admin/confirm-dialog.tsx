"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  /** Texto del botón mientras `pending` (p. ej. "Archivando..."). */
  pendingLabel?: string;
  pending?: boolean;
  /** Acción destructiva: botón rojo. */
  destructive?: boolean;
};

/** Único diálogo de confirmación del panel (archivar, anular, restaurar, eliminar…). */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  pendingLabel,
  pending = false,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // No se cierra mientras la acción está en curso.
        if (!pending) onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={
              destructive ? "bg-red-600 text-white hover:bg-red-700" : undefined
            }
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? (pendingLabel ?? "Procesando...") : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
