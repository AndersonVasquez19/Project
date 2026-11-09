import { ShieldAlert } from "lucide-react";

export function AccessDenied({
  message = "No tienes permiso para ver esta sección.",
}: {
  message?: string;
}) {
  return (
    <section
      className="mx-auto max-w-xl rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center"
      role="alert"
    >
      <ShieldAlert
        aria-hidden="true"
        className="mx-auto mb-3 size-8 text-[#176B9A]"
      />
      <h1 className="text-xl font-bold text-[#172B3A]">Acceso restringido</h1>
      <p className="mt-2 text-sm text-[#64748B]">{message}</p>
    </section>
  );
}
