"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      richColors
      duration={4000}
      toastOptions={{ classNames: { toast: "font-sans text-sm" } }}
    />
  );
}
