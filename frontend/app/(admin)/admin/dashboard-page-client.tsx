"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { StatCard } from "@/components/admin/stat-card";
import { can, type Permission } from "@/lib/permissions";
import { getSummary } from "@/services/dashboardService";

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body: unknown = error.response?.data;
    if (typeof body === "object" && body !== null && "message" in body) {
      const { message } = body;
      if (typeof message === "string") return message;
    }
  }
  return "No fue posible cargar el resumen del sistema. Inténtalo nuevamente.";
}

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const SHORTCUTS: ReadonlyArray<readonly [string, string, string, Permission]> = [
  ["Registrar estudiante", "/admin/estudiantes", "fa-user-plus", "estudiantes.crear"],
  ["Crear matrícula", "/admin/matriculas", "fa-clipboard-check", "matriculas.crear"],
  ["Gestionar cursos", "/admin/cursos", "fa-book-open", "cursos.ver"],
];

export function DashboardPageClient({
  userName,
  permissions,
}: {
  userName: string;
  permissions: readonly string[];
}) {
  const summaryQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getSummary,
    staleTime: 30_000,
  });
  const counts = summaryQuery.data?.counts;
  const cards = [
    { key: "students", title: "Estudiantes", icon: "fa-user-graduate", href: "/admin/estudiantes", variant: "sky" },
    { key: "courses", title: "Cursos activos", icon: "fa-book-open", href: "/admin/cursos", variant: "navy" },
    { key: "enrollments", title: "Matrículas", icon: "fa-clipboard-check", href: "/admin/matriculas", variant: "teal" },
    { key: "pendingEnrollments", title: "Por revisar", icon: "fa-hourglass-half", href: "/admin/matriculas", variant: "amber" },
    { key: "services", title: "Servicios", icon: "fa-network-wired", href: "/admin/servicios", variant: "sky" },
    { key: "users", title: "Usuarios", icon: "fa-users", href: "/admin/usuarios", variant: "emerald" },
  ] as const;
  const visibleCards = cards.filter((card) => counts?.[card.key] !== null && counts?.[card.key] !== undefined);

  return (
    <section className="space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A2540] via-[#123C5A] to-[#176B9A] px-6 py-7 text-white shadow-[0_20px_50px_-25px_rgba(10,37,64,0.55)] sm:px-8 sm:py-9">
        <div className="absolute -right-10 -top-20 size-64 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7CE1D8]">
            Resumen operativo
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Bienvenido, {userName}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
            Una vista rápida de la actividad y los datos que tienes permiso para gestionar.
          </p>
        </div>
      </header>

      {summaryQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {errorMessage(summaryQuery.error)}
          <button
            type="button"
            className="ml-2 font-semibold underline"
            onClick={() => void summaryQuery.refetch()}
          >
            Reintentar
          </button>
        </div>
      )}

      {summaryQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl bg-white ring-1 ring-[#E2E8F0]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCards.map((card) => (
            <StatCard
              key={card.key}
              title={card.title}
              value={counts?.[card.key] ?? "—"}
              icon={card.icon}
              variant={card.variant}
              href={card.href}
            />
          ))}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
            <div>
              <h2 className="font-semibold text-[#172B3A]">Matrículas recientes</h2>
              <p className="mt-1 text-xs text-[#64748B]">Últimos movimientos registrados</p>
            </div>
            <Link href="/admin/matriculas" className="text-xs font-semibold text-[#176B9A] hover:underline">
              Ver todas
            </Link>
          </div>
          {!summaryQuery.isPending && summaryQuery.data?.recentEnrollments.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#64748B]">
              No hay matrículas recientes para mostrar.
            </p>
          ) : (
            <ul className="divide-y divide-[#E2E8F0]">
              {summaryQuery.data?.recentEnrollments.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#172B3A]">{item.student}</p>
                    <p className="mt-1 truncate text-xs text-[#64748B]">{item.course}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <span className="rounded-full bg-[#F4F7FB] px-2.5 py-1 text-[#475569]">{item.status}</span>
                    <time className="text-[#64748B]" dateTime={item.date}>{formatDate(item.date)}</time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_2px_10px_rgba(10,37,64,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#176B9A]">
            Accesos directos
          </p>
          <div className="mt-4 grid gap-2">
            {SHORTCUTS.filter(([, , , permission]) =>
              can(permissions, permission),
            ).map(([label, href, icon]) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] px-3.5 py-3 text-sm font-medium text-[#172B3A] transition hover:border-[#176B9A]/40 hover:bg-[#F4F7FB]"
              >
                <i className={`fa-solid ${icon} w-5 text-center text-[#176B9A]`} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
          <p className="mt-5 rounded-xl bg-[#F4F7FB] p-3 text-xs leading-5 text-[#64748B]">
            Los indicadores se limitan a tus permisos actuales. Si falta información, consulta con una persona administradora.
          </p>
        </aside>
      </div>
    </section>
  );
}
