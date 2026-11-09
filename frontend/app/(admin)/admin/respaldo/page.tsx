import { Database, ShieldAlert } from "lucide-react";
import { AccessDenied } from "@/components/admin/access-denied";
import { hasPermission } from "@/lib/server/identity";

export default async function RespaldoPage() {
  if (!(await hasPermission("respaldo.ver"))) {
    return (
      <AccessDenied message="No tienes permiso para consultar la configuración de respaldos." />
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
          Sistema y seguridad
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
          <Database aria-hidden="true" /> Respaldos
        </h1>
      </header>
      <div
        className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
        role="status"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-amber-800"
          />
          <div>
            <h2 className="font-semibold text-amber-950">
              Respaldos automáticos aún no habilitados
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Esta instalación no tiene un destino de respaldo ni una política
              de retención y restauración verificados. No se han creado,
              descargado ni restaurado copias desde Horus.
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
        <h2 className="font-semibold text-[#172B3A]">
          Antes de habilitar este módulo
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#475569]">
          <li>Definir un destino privado, cifrado y separado del servidor MySQL.</li>
          <li>Establecer frecuencia, retención y responsables autorizados.</li>
          <li>Probar la restauración en un entorno aislado antes de confiar en una copia.</li>
          <li>Guardar credenciales fuera de la aplicación y nunca descargarlas al navegador.</li>
        </ul>
      </div>
    </section>
  );
}
