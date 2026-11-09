export default function AdminLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="space-y-2">
        <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-14 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
    </div>
  );
}
