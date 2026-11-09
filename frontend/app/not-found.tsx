import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F4F7FB] p-6">
      <div className="max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-[#172B3A]">Página no encontrada</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          La dirección que abriste no existe.
        </p>
        <Link href="/admin" className="admin-btn-primary mt-5">
          Ir al panel
        </Link>
      </div>
    </main>
  );
}
