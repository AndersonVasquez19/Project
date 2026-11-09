"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardCheck, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  create,
  decide,
  getAll,
} from "@/services/aprobacionesService";

function displayDate(value: string | null): string {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : date.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

export function AprobacionesPageClient({
  canView,
  canCreate,
  canDecide,
}: {
  canView: boolean;
  canCreate: boolean;
  canDecide: boolean;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("solicitud");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});
  const approvals = useQuery({
    queryKey: ["aprobaciones"],
    queryFn: getAll,
    enabled: canView,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["aprobaciones"] });
  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: async () => {
      setTitle("");
      setType("solicitud");
      setDescription("");
      setReference("");
      await refresh();
    },
  });
  const decisionMutation = useMutation({
    mutationFn: ({
      id,
      estado,
      comentario,
    }: {
      id: string;
      estado: "aprobada" | "rechazada";
      comentario: string;
    }) => decide(id, { estado, comentario: comentario.trim() || null }),
    onSuccess: refresh,
  });
  const error =
    approvals.error ?? createMutation.error ?? decisionMutation.error;

  if (!canView) {
    return (
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-[#172B3A]">Acceso restringido</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          No tienes permiso para consultar aprobaciones.
        </p>
      </section>
    );
  }

  const items = approvals.data?.data ?? [];
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
          Operación interna
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
          <ClipboardCheck aria-hidden="true" /> Aprobaciones
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Solicitudes internas con resolución registrada en auditoría.
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getApiErrorMessage(error, "No fue posible completar la operación.")}
        </p>
      )}

      {canCreate && (
        <form
          className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)]"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate({
              titulo: title.trim(),
              tipo: type,
              descripcion: description.trim() || null,
              referencia: reference.trim() || null,
            });
          }}
        >
          <h2 className="flex items-center gap-2 font-semibold text-[#172B3A]">
            <Plus aria-hidden="true" /> Nueva solicitud
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="approval-title">Título</Label>
              <Input
                id="approval-title"
                required
                minLength={3}
                maxLength={255}
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approval-type">Tipo</Label>
              <Input
                id="approval-type"
                maxLength={255}
                value={type}
                onChange={(event) => setType(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approval-reference">Referencia (opcional)</Label>
              <Input
                id="approval-reference"
                maxLength={255}
                value={reference}
                onChange={(event) => setReference(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="approval-description">Descripción (opcional)</Label>
              <textarea
                id="approval-description"
                className="admin-textarea"
                maxLength={5000}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
              />
            </div>
          </div>
          <Button
            type="submit"
            className="admin-btn-primary"
            disabled={createMutation.isPending || title.trim().length < 3}
          >
            {createMutation.isPending ? "Enviando…" : "Enviar solicitud"}
          </Button>
        </form>
      )}

      {approvals.isPending ? (
        <p className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-10 text-center text-sm text-[#64748B]" role="status">
          Cargando solicitudes…
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-4 py-10 text-center text-sm text-[#64748B]">
          No hay solicitudes de aprobación registradas.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#64748B]">
                    {item.tipo} · {displayDate(item.created_at)}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[#172B3A]">{item.titulo}</h2>
                  <p className="mt-1 text-sm text-[#64748B]">
                    Solicitante: {item.solicitante?.nombre ?? "No disponible"}
                    {item.referencia ? ` · Ref. ${item.referencia}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.estado === "pendiente"
                    ? "bg-amber-50 text-amber-800"
                    : item.estado === "aprobada"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-red-50 text-red-800"
                }`}>
                  {item.estado}
                </span>
              </div>
              {item.descripcion && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#334155]">
                  {item.descripcion}
                </p>
              )}
              {item.comentario && (
                <p className="mt-3 rounded-lg bg-[#F8FAFC] p-3 text-sm text-[#475569]">
                  Comentario: {item.comentario}
                  {item.aprobador ? ` · ${item.aprobador.nombre}` : ""}
                </p>
              )}
              {canDecide && item.estado === "pendiente" && (
                <div className="mt-4 space-y-2 border-t border-[#E2E8F0] pt-4">
                  <Label htmlFor={`approval-comment-${item.id}`}>
                    Comentario de resolución (opcional)
                  </Label>
                  <textarea
                    id={`approval-comment-${item.id}`}
                    className="admin-textarea"
                    maxLength={2000}
                    rows={2}
                    value={comments[item.id] ?? ""}
                    onChange={(event) =>
                      setComments((current) => ({
                        ...current,
                        [item.id]: event.currentTarget.value,
                      }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={decisionMutation.isPending}
                      onClick={() =>
                        decisionMutation.mutate({
                          id: item.id,
                          estado: "aprobada",
                          comentario: comments[item.id] ?? "",
                        })
                      }
                    >
                      <Check aria-hidden="true" /> Aprobar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={decisionMutation.isPending}
                      onClick={() =>
                        decisionMutation.mutate({
                          id: item.id,
                          estado: "rechazada",
                          comentario: comments[item.id] ?? "",
                        })
                      }
                    >
                      <X aria-hidden="true" /> Rechazar
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
