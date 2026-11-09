import { SearchX } from "lucide-react";
import Link from "next/link";

export default function AdminNotFound() {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
      <SearchX aria-hidden="true" className="mx-auto mb-3 size-8 text-[#176B9A]" />
      <h1 className="text-xl font-bold text-[#172B3A]">Página no encontrada</h1>
      <p className="mt-2 text-sm text-[#64748B]">
        La sección que buscas no existe o fue movida.
      </p>
      <Link href="/admin" className="admin-btn-primary mt-5">
        Volver al panel
      </Link>
    </section>
  );
}
