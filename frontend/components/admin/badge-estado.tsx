import { cn } from "cn";

const estados: Record<string, { label: string; classes: string; dot: string }> = {
  activo: {
    label: "Activo",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  pagada: {
    label: "Pagada",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  aprobado: {
    label: "Aprobado",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  completado: {
    label: "Completado",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  publicada: {
    label: "Publicada",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  atendida: {
    label: "Atendida",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  inactivo: {
    label: "Inactivo",
    classes: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  pendiente: {
    label: "Pendiente",
    classes: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  en_proceso: {
    label: "En proceso",
    classes: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  en_revision: {
    label: "En revisión",
    classes: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  recibida: {
    label: "Recibida",
    classes: "border-sky-200 bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
  },
  programada: {
    label: "Programada",
    classes: "border-sky-200 bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
  },
  borrador: {
    label: "Borrador",
    classes: "border-[#E2E8F0] bg-[#F4F7FB] text-[#64748B]",
    dot: "bg-[#64748B]",
  },
  archivado: {
    label: "Archivado",
    classes: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  anulada: {
    label: "Anulada",
    classes: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  rechazado: {
    label: "Rechazado",
    classes: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  cancelado: {
    label: "Cancelado",
    classes: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  abierto: {
    label: "Abierto",
    classes: "border-sky-200 bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
  },
  respondido: {
    label: "Respondido",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  concluido_por_acuerdo: {
    label: "Concluido por acuerdo",
    classes: "border-teal-200 bg-teal-50 text-teal-800",
    dot: "bg-[#19A7A1]",
  },
};

type BadgeEstadoProps = {
  estado: string;
  className?: string;
};

export function BadgeEstado({ estado, className }: BadgeEstadoProps) {
  const config = estados[estado] ?? {
    label: estado.charAt(0).toUpperCase() + estado.slice(1),
    classes: "border-[#E2E8F0] bg-[#F4F7FB] text-[#64748B]",
    dot: "bg-[#64748B]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        config.classes,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dot)} aria-hidden="true" />
      {config.label}
    </span>
  );
}
