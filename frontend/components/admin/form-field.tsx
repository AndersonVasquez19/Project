"use client";

import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/label";

type ControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
};

type FormFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  /** Marca el campo como obligatorio visualmente. */
  required?: boolean;
  /** Recibe las props de accesibilidad que debe llevar el control. */
  children: (control: ControlProps) => ReactNode;
};

/**
 * Etiqueta + control + error. El error queda vinculado al control con
 * aria-describedby y se anuncia con role="alert" al aparecer.
 */
export function FormField({
  label,
  error,
  hint,
  required = false,
  children,
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-horus-danger">
            *
          </span>
        )}
      </Label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
      })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-horus-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-horus-danger">
          {error}
        </p>
      )}
    </div>
  );
}
