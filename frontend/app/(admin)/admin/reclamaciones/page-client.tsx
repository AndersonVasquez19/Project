"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AlertTriangle, BookOpenCheck, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  addNote,
  assignToSelf,
  getAll,
} from "@/services/reclamacionesService";

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

function isOverdue(deadline: string, closedAt: string | null): boolean {
  const todayInLima = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
  }).format(new Date());
  return (
    !closedAt &&
    deadline < todayInLima
  );
}

export function ReclamacionesPageClient({
  canView,
  canEdit,
}: {
  canView: boolean;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const deferredSearch = useDeferredValue(search.trim());
  const claims = useQuery({
    queryKey: ["reclamaciones", deferredSearch, state],
    queryFn: () =>
      getAll({
        search: deferredSearch || undefined,
        estado: state || undefined,
      }),
    enabled: canView,
    placeholderData: keepPreviousData,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["reclamaciones"] });
  const noteMutation = useMutation({
    mutationFn: ({ id, nota }: { id: string; nota: string }) =>
      addNote(id, nota),
    onSuccess: async (_result, variables) => {
      setNotes((current) => ({ ...current, [variables.id]: "" }));
      await refresh();
    },
  });
  const assignMutation = useMutation({
    mutationFn: assignToSelf,
    onSuccess: refresh,
  });
  const error = claims.error ?? noteMutation.error ?? assignMutation.error;

  if (!canView) {
    return (
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-[#172B3A]">Acceso restringido</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          No tienes permiso para consultar reclamaciones.
        </p>
      </section>
    );
  }

  const data = claims.data?.data ?? [];
  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
          Comercial y atención
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
          <BookOpenCheck aria-hidden="true" /> Libro de Reclamaciones
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B]">
          Revisa casos y plazos, asigna responsables y agrega notas internas. Esta pantalla no envía respuestas al reclamante.
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getApiErrorMessage(error, "No fue posible completar la operación.")}
        </p>
      )}

      <div className="grid gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
          <Input
            className="pl-10"
            aria-label="Buscar reclamaciones"
            placeholder="Número, nombre, documento o correo"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
        </div>
        <select
          className="admin-select"
          aria-label="Filtrar por estado"
          value={state}
          onChange={(event) => setState(event.currentTarget.value)}
        >
          <option value="">Todos los estados</option>
          <option value="abierto">Abierto</option>
          <option value="en_revision">En revisión</option>
          <option value="respondido">Respondido</option>
          <option value="cerrado">Cerrado</option>
        </select>
      </div>

      {claims.isPending ? (
        <p className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-10 text-center text-sm text-[#64748B]" role="status">
          Cargando reclamaciones…
        </p>
      ) : data.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-4 py-10 text-center text-sm text-[#64748B]">
          No hay reclamaciones que coincidan con los filtros.
        </p>
      ) : (
        <div className="space-y-4">
          {data.map((claim) => {
            const overdue = isOverdue(claim.fecha_limite, claim.respondida_at);
            return (
              <article
                key={claim.id}
                className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(10,37,64,0.04)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B]">
                      Reclamo {claim.numero} · {claim.tipo}
                    </p>
                    <h2 className="mt-1 font-semibold text-[#172B3A]">
                      {claim.nombres} {claim.apellidos}
                    </h2>
                    <p className="text-sm text-[#64748B]">
                      {claim.tipo_documento}: {claim.numero_documento} · Recibido {displayDate(claim.recibida_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {overdue && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
                        <AlertTriangle aria-hidden="true" className="size-3.5" /> Plazo vencido
                      </span>
                    )}
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-[#334155] ring-1 ring-[#E2E8F0]">
                      {claim.estado.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                  <div className="space-y-4">
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <div><dt className="text-xs text-[#64748B]">Correo</dt><dd className="break-all font-medium text-[#172B3A]">{claim.email}</dd></div>
                      <div><dt className="text-xs text-[#64748B]">Teléfono</dt><dd className="font-medium text-[#172B3A]">{claim.telefono}</dd></div>
                      <div><dt className="text-xs text-[#64748B]">Canal de respuesta</dt><dd className="font-medium capitalize text-[#172B3A]">{claim.canal_respuesta}</dd></div>
                      <div><dt className="text-xs text-[#64748B]">Fecha límite</dt><dd className={`font-medium ${overdue ? "text-red-700" : "text-[#172B3A]"}`}>{claim.fecha_limite}</dd></div>
                    </dl>
                    <div>
                      <h3 className="text-sm font-semibold text-[#172B3A]">Detalle</h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#475569]">{claim.detalle}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#172B3A]">Pedido</h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#475569]">{claim.pedido}</p>
                    </div>
                    {claim.respuesta && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <h3 className="text-sm font-semibold text-emerald-900">Respuesta guardada</h3>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-emerald-900">{claim.respuesta}</p>
                        <p className="mt-2 text-xs text-emerald-800">
                          {claim.respondida_at ? displayDate(claim.respondida_at) : ""}
                        </p>
                      </div>
                    )}
                  </div>

                  <aside className="space-y-4 rounded-xl bg-[#F8FAFC] p-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#64748B]">Responsable</p>
                      <p className="mt-1 font-medium text-[#172B3A]">{claim.responsable?.nombre ?? "Sin asignar"}</p>
                      {canEdit && claim.responsable_id === null && (
                        <Button
                          className="mt-2"
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={assignMutation.isPending}
                          onClick={() => assignMutation.mutate(claim.id)}
                        >
                          Asignarme el caso
                        </Button>
                      )}
                    </div>
                    {canEdit && (
                      <form
                        className="space-y-2 border-t border-[#E2E8F0] pt-4"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const note = notes[claim.id]?.trim() ?? "";
                          if (note.length >= 2) {
                            noteMutation.mutate({ id: claim.id, nota: note });
                          }
                        }}
                      >
                        <Label htmlFor={`claim-note-${claim.id}`}>Nota interna</Label>
                        <textarea
                          id={`claim-note-${claim.id}`}
                          className="admin-textarea"
                          rows={3}
                          maxLength={2000}
                          value={notes[claim.id] ?? ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [claim.id]: event.currentTarget.value,
                            }))
                          }
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          disabled={noteMutation.isPending || (notes[claim.id]?.trim().length ?? 0) < 2}
                        >
                          Guardar nota
                        </Button>
                      </form>
                    )}
                    {claim.historial.length > 0 && (
                      <div className="border-t border-[#E2E8F0] pt-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Actividad reciente</h3>
                        <ul className="mt-2 space-y-3">
                          {claim.historial.map((entry) => (
                            <li key={entry.id} className="text-xs text-[#475569]">
                              <p className="font-medium text-[#172B3A]">{entry.evento.replace("_", " ")}</p>
                              {entry.nota && <p className="mt-0.5 whitespace-pre-wrap">{entry.nota}</p>}
                              <p className="mt-0.5">{entry.actor} · {displayDate(entry.created_at)}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </aside>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="text-xs text-[#64748B]">
        Por privacidad, solo usuarios autorizados pueden consultar datos de reclamantes. Se muestran hasta {claims.data?.limite ?? 200} casos.
      </p>
    </section>
  );
}
