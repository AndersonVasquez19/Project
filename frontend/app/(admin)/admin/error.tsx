"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    // `digest` permite cruzar el fallo con los logs del servidor.
    console.error(error);
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error
      ? String((error as Error & { digest?: unknown }).digest)
      : null;

  return (
    <section
      className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center"
      role="alert"
    >
      <AlertTriangle aria-hidden="true" className="mx-auto mb-3 size-8 text-red-700" />
      <h1 className="text-xl font-bold text-[#172B3A]">
        Algo salió mal en esta sección
      </h1>
      <p className="mt-2 text-sm text-[#64748B]">
        No pudimos mostrar esta pantalla. Puedes intentarlo de nuevo; si el
        problema continúa, avisa a una persona administradora.
      </p>
      {digest && (
        <p className="mt-2 text-xs text-[#64748B]">Código de referencia: {digest}</p>
      )}
      <Button
        type="button"
        className="admin-btn-primary mt-5"
        onClick={() => retry()}
      >
        Reintentar
      </Button>
    </section>
  );
}
