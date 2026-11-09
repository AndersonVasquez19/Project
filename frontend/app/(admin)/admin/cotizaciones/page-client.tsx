"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { FileText, Plus, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  create,
  getAll,
  update,
} from "@/services/cotizacionesService";
import type {
  Cotizacion,
  CreateCotizacionInput,
  EstadoCotizacion,
} from "@/types/cotizacion";

const STATES: { value: EstadoCotizacion; label: string }[] = [
  { value: "recibida", label: "Recibida" },
  { value: "en_seguimiento", label: "En seguimiento" },
  { value: "cotizada", label: "Cotizada" },
  { value: "cerrada", label: "Cerrada" },
  { value: "descartada", label: "Descartada" },
];

function displayDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

export function CotizacionesPageClient({
  canView,
  canCreate,
  canEdit,
}: {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [state, setState] = useState<EstadoCotizacion | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<CreateCotizacionInput>({
    contacto_nombre: "",
    contacto_email: "",
    contacto_telefono: "",
    necesidad_cliente: "",
  });
  const deferredSearch = useDeferredValue(search.trim());
  const quotes = useQuery({
    queryKey: ["cotizaciones", deferredSearch, state],
    queryFn: () =>
      getAll({
        search: deferredSearch || undefined,
        estado: state || undefined,
      }),
    enabled: canView,
    placeholderData: keepPreviousData,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: async () => {
      setDraft({
        contacto_nombre: "",
        contacto_email: "",
        contacto_telefono: "",
        necesidad_cliente: "",
      });
      setFormOpen(false);
      await refresh();
    },
  });
  const [edits, setEdits] = useState<
    Record<string, { estado: EstadoCotizacion; nota: string }>
  >({});
  const updateMutation = useMutation({
    mutationFn: ({
      item,
      estado,
      nota,
    }: {
      item: Cotizacion;
      estado: EstadoCotizacion;
      nota: string;
    }) => update(item.id, { revision: item.revision, estado, nota: nota.trim() || null }),
    onSuccess: refresh,
  });
  const error = quotes.error ?? createMutation.error ?? updateMutation.error;

  if (!canView) {
    return (
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-[#172B3A]">Acceso restringido</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          No tienes permiso para consultar solicitudes de cotización.
        </p>
      </section>
    );
  }

  function submitQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate({
      contacto_nombre: draft.contacto_nombre.trim(),
      contacto_email: draft.contacto_email?.trim() || null,
      contacto_telefono: draft.contacto_telefono?.trim() || null,
      necesidad_cliente: draft.necesidad_cliente.trim(),
    });
  }

  const data = quotes.data?.data ?? [];
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
            Comercial y atención
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
            <FileText aria-hidden="true" /> Solicitudes de cotización
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Seguimiento interno con revisiones optimistas e historial auditable.
          </p>
        </div>
        {canCreate && (
          <Button
            type="button"
            className="admin-btn-primary"
            onClick={() => setFormOpen((open) => !open)}
          >
            <Plus aria-hidden="true" /> Nueva solicitud
          </Button>
        )}
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getApiErrorMessage(error, "No fue posible completar la operación.")}
          {updateMutation.error && (
            <button type="button" className="ml-2 font-semibold underline" onClick={() => void quotes.refetch()}>
              Actualizar lista
            </button>
          )}
        </div>
      )}

      {formOpen && canCreate && (
        <form
          className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)]"
          onSubmit={submitQuote}
        >
          <h2 className="font-semibold text-[#172B3A]">Registrar solicitud</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quote-contact">Contacto</Label>
              <Input
                id="quote-contact"
                required
                minLength={3}
                maxLength={120}
                value={draft.contacto_nombre}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, contacto_nombre: event.currentTarget.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-email">Correo (opcional)</Label>
              <Input
                id="quote-email"
                type="email"
                maxLength={254}
                value={draft.contacto_email ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, contacto_email: event.currentTarget.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="quote-phone">Teléfono (opcional)</Label>
              <Input
                id="quote-phone"
                maxLength={30}
                value={draft.contacto_telefono ?? ""}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, contacto_telefono: event.currentTarget.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="quote-need">Necesidad del cliente</Label>
              <textarea
                id="quote-need"
                className="admin-textarea"
                required
                minLength={10}
                maxLength={10000}
                rows={4}
                value={draft.necesidad_cliente}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, necesidad_cliente: event.currentTarget.value }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="admin-btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Guardando…" : "Crear solicitud"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748B]" />
          <Input
            className="pl-10"
            aria-label="Buscar solicitudes"
            placeholder="Código, contacto o necesidad"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
        </div>
        <select
          className="admin-select"
          aria-label="Filtrar por estado"
          value={state}
          onChange={(event) => setState(event.currentTarget.value as EstadoCotizacion | "")}
        >
          <option value="">Todos los estados</option>
          {STATES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>

      {quotes.isPending ? (
        <p className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-10 text-center text-sm text-[#64748B]" role="status">
          Cargando solicitudes…
        </p>
      ) : data.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-4 py-10 text-center text-sm text-[#64748B]">
          No hay solicitudes que coincidan con los filtros.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((item) => {
            const edit = edits[item.id] ?? { estado: item.estado, nota: "" };
            return (
              <article key={item.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#64748B]">
                      {item.codigo} · {displayDate(item.recibida_at)}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-[#172B3A]">{item.contacto_nombre}</h2>
                    <p className="text-sm text-[#176B9A]">{item.servicio}</p>
                  </div>
                  <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold capitalize text-[#1D4ED8]">
                    {item.estado.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#334155]">{item.necesidad_cliente}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#64748B]">
                  {item.contacto_email && <a className="hover:underline" href={`mailto:${item.contacto_email}`}>{item.contacto_email}</a>}
                  {item.contacto_telefono && <a className="hover:underline" href={`tel:${item.contacto_telefono}`}>{item.contacto_telefono}</a>}
                  <span>Responsable: {item.responsable?.nombre ?? "Sin asignar"}</span>
                  <span>Revisión {item.revision}</span>
                </div>
                {canEdit && (
                  <div className="mt-4 grid gap-3 border-t border-[#E2E8F0] pt-4 sm:grid-cols-[220px_minmax(0,1fr)_auto] sm:items-end">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-[#334155]">Estado</span>
                      <select
                        className="admin-select"
                        value={edit.estado}
                        onChange={(event) =>
                          setEdits((current) => ({
                            ...current,
                            [item.id]: {
                              ...edit,
                              estado: event.currentTarget.value as EstadoCotizacion,
                            },
                          }))
                        }
                      >
                        {STATES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-[#334155]">Nota de seguimiento (opcional)</span>
                      <Input
                        maxLength={1000}
                        value={edit.nota}
                        onChange={(event) =>
                          setEdits((current) => ({
                            ...current,
                            [item.id]: { ...edit, nota: event.currentTarget.value },
                          }))
                        }
                      />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ item, ...edit })}
                    >
                      Guardar seguimiento
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      <p className="text-xs text-[#64748B]">
        Se muestran hasta {quotes.data?.limite ?? 200} solicitudes; usa los filtros para acotar la lista.
      </p>
    </section>
  );
}
