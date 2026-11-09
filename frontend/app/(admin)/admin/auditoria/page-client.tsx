"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { SearchInput } from "@/components/admin/search-input";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { getAll } from "@/services/auditoriaService";

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

export function AuditoriaPageClient({ canView }: { canView: boolean }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const term = useDeferredValue(search.trim());
  const logs = useQuery({
    queryKey: ["audit-logs", page, term],
    queryFn: () => getAll({ page, limit: 50, search: term || undefined }),
    enabled: canView,
    placeholderData: keepPreviousData,
  });

  if (!canView) {
    return (
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-[#172B3A]">Acceso restringido</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          No tienes permiso para consultar la auditoría.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
          Sistema y seguridad
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
          <ClipboardList aria-hidden="true" /> Auditoría
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Historial de acciones registradas. Los datos de cambios se omiten en esta vista.
        </p>
      </header>
      <SearchInput
        aria-label="Buscar en auditoría"
        placeholder="Buscar acción o módulo"
        value={search}
        onChange={(event) => {
          setSearch(event.currentTarget.value);
          setPage(1);
        }}
      />
      {logs.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getApiErrorMessage(logs.error, "No se pudo cargar la auditoría.")}
        </p>
      )}
      <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#64748B]">
            <tr>
              {["Fecha", "Usuario", "Acción", "Registro"].map((item) => (
                <th key={item} className="px-4 py-3 font-semibold">{item}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.isPending ? (
              <tr><td className="px-4 py-10 text-center text-[#64748B]" colSpan={4}>Cargando auditoría…</td></tr>
            ) : logs.data?.data.length ? (
              logs.data.data.map((log) => (
                <tr key={log.id} className="border-t border-[#E2E8F0]">
                  <td className="px-4 py-3">{displayDate(log.created_at)}</td>
                  <td className="px-4 py-3">{log.actor}</td>
                  <td className="px-4 py-3 font-medium text-[#172B3A]">{log.action}</td>
                  <td className="px-4 py-3 text-[#64748B]">
                    {[log.model_type, log.model_id].filter(Boolean).join(" · ") || "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className="px-4 py-10 text-center text-[#64748B]" colSpan={4}>No hay eventos de auditoría para mostrar.</td></tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-[#E2E8F0] px-4 py-3">
          <p className="text-sm text-[#64748B]">
            {logs.data?.meta.total ?? 0} eventos
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || logs.isFetching}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-[#64748B]">
              {logs.data?.meta.totalPages ? page : 0} / {logs.data?.meta.totalPages ?? 0}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                !logs.data?.meta.totalPages ||
                page >= logs.data.meta.totalPages ||
                logs.isFetching
              }
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
