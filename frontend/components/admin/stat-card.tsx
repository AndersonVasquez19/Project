import Link from "next/link";

const iconBoxClasses: Record<string, string> = {
  navy: "bg-[#0A2540] text-[#19A7A1] shadow-sm shadow-[#0A2540]/15 ring-1 ring-[#0A2540]",
  ink: "bg-[#0A2540] text-[#19A7A1] shadow-sm shadow-[#0A2540]/15 ring-1 ring-[#0A2540]",
  teal: "bg-[#19A7A1]/12 text-[#0F766E] ring-1 ring-[#19A7A1]/30",
  emerald: "bg-[#19A7A1]/12 text-[#0F766E] ring-1 ring-[#19A7A1]/30",
  sky: "bg-[#287FB5]/12 text-[#176B9A] ring-1 ring-[#287FB5]/25",
};

type StatCardProps = {
  title: string;
  value: string | number;
  icon: string;
  description?: string | null;
  badge?: string | null;
  variant?: string;
  href?: string | null;
};

export function StatCard({
  title,
  value,
  icon,
  description = null,
  badge = null,
  variant = "blue",
  href = null,
}: StatCardProps) {
  const iconBox =
    iconBoxClasses[variant] ??
    "bg-[#176B9A]/10 text-[#176B9A] ring-1 ring-[#176B9A]/20";

  return (
    <article className="admin-stat-card flex flex-col justify-between">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            {title}
          </p>
          <p className="mt-2.5 text-2xl font-bold tracking-tight text-[#172B3A] sm:text-[1.7rem]">
            {value}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBox}`}>
          <i className={`fa-solid ${icon} text-base`} aria-hidden="true" />
        </span>
      </div>

      {(description || badge || href) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] pt-3">
          {description && (
            <p className="text-xs font-medium text-[#64748B]">{description}</p>
          )}
          {badge && (
            <span className="inline-flex items-center rounded-full border border-[#19A7A1]/30 bg-[#19A7A1]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0F766E]">
              {badge}
            </span>
          )}
          {href && (
            <Link
              href={href}
              className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#176B9A] transition hover:text-[#0A2540] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#176B9A]"
            >
              <span>Gestionar</span>
              <i
                className="fa-solid fa-arrow-right text-[10px] text-[#19A7A1]"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
