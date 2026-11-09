"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  getAll,
  markAllRead,
  markRead,
} from "@/services/notificacionesService";

function safeInternalLink(value: string | null): string | null {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

function displayDate(value: string | null): string {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : date.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

export function NotificacionesPageClient() {
  const queryClient = useQueryClient();
  const notifications = useQuery({
    queryKey: ["notificaciones"],
    queryFn: getAll,
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
  const oneMutation = useMutation({
    mutationFn: markRead,
    onSuccess: refresh,
  });
  const allMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: refresh,
  });
  const error =
    notifications.error ?? oneMutation.error ?? allMutation.error;
  const data = notifications.data?.data ?? [];

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#176B9A]">
            Operación interna
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-3xl">
            <Bell aria-hidden="true" /> Notificaciones
          </h1>
          <p className="mt-2 text-sm text-[#64748B]">
            {notifications.data?.no_leidas ?? 0} sin leer
          </p>
        </div>
        {(notifications.data?.no_leidas ?? 0) > 0 && (
          <Button
            type="button"
            variant="outline"
            disabled={allMutation.isPending}
            onClick={() => allMutation.mutate()}
          >
            Marcar todas como leídas
          </Button>
        )}
      </header>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {getApiErrorMessage(error, "No se pudieron cargar las notificaciones.")}
        </p>
      )}

      {notifications.isPending ? (
        <p className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-10 text-center text-sm text-[#64748B]" role="status">
          Cargando notificaciones…
        </p>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-4 py-12 text-center">
          <Bell aria-hidden="true" className="mx-auto size-8 text-[#94A3B8]" />
          <p className="mt-3 font-medium text-[#172B3A]">Estás al día</p>
          <p className="mt-1 text-sm text-[#64748B]">No tienes notificaciones pendientes.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#E2E8F0] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
          {data.map((notification) => {
            const href = safeInternalLink(notification.vinculo);
            return (
              <li
                key={notification.id}
                className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between ${
                  notification.leida ? "bg-white" : "bg-[#F1F8FC]"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!notification.leida && (
                      <span className="size-2 rounded-full bg-[#176B9A]" aria-label="Sin leer" />
                    )}
                    <h2 className="font-semibold text-[#172B3A]">{notification.titulo}</h2>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#475569]">
                    {notification.mensaje}
                  </p>
                  <p className="mt-2 text-xs text-[#64748B]">
                    {displayDate(notification.created_at)} · {notification.tipo}
                  </p>
                  {href && (
                    <Link
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#176B9A] hover:underline"
                      href={href}
                    >
                      Ver detalle <ExternalLink aria-hidden="true" className="size-3.5" />
                    </Link>
                  )}
                </div>
                {!notification.leida && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={oneMutation.isPending}
                    onClick={() => oneMutation.mutate(notification.id)}
                  >
                    <Check aria-hidden="true" /> Leída
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
