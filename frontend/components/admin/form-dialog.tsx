"use client";

import type { FormEventHandler, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Normalmente `handleSubmit(onSubmit)` de react-hook-form. */
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  /** Solo lectura: oculta el botón de guardar. */
  hideSubmit?: boolean;
  /** Error general de la API (los de campo van en cada FormField). */
  error?: string | null;
  className?: string;
  children: ReactNode;
};

/** Diálogo de formulario con cabecera, error general, y botones Cancelar/Guardar. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitLabel,
  pendingLabel = "Guardando...",
  pending = false,
  hideSubmit = false,
  error,
  className = "sm:max-w-lg",
  children,
}: FormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          {error && (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          )}

          {children}

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            {!hideSubmit && (
              <Button type="submit" disabled={pending}>
                {pending ? pendingLabel : submitLabel}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
