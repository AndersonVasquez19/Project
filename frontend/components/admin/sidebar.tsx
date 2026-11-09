"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cn } from "cn";
import type { AdminIdentity } from "@/lib/auth";
import { adminNavGroups } from "./navigation";

type SidebarProps = {
  user: AdminIdentity;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  loggingOut: boolean;
};

export function AdminSidebar({
  user,
  open,
  onClose,
  onLogout,
  loggingOut,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      id="admin-sidebar"
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-[260px] -translate-x-full flex-col border-r border-white/10 bg-[#0A2540] text-slate-300 shadow-xl shadow-[#0A2540]/20 transition-transform duration-200 md:w-[72px] md:translate-x-0 xl:w-[260px]",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
      aria-label="Navegación administrativa"
    >
      <Link
        href="/admin"
        onClick={onClose}
        className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#19A7A1] md:justify-center md:px-2 xl:justify-start xl:px-5"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#19A7A1]"
          aria-hidden="true"
        >
          <ShieldCheck size={22} />
        </span>
        <span className="min-w-0 md:hidden xl:block">
          <span className="block truncate text-sm font-bold tracking-tight text-white">
            Horus Group
          </span>
          <span className="block text-[11px] font-medium text-[#19A7A1]">
            Panel Corporativo
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {adminNavGroups.map((group) => (
          <section key={group.heading}>
            <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 first:pt-0 md:hidden xl:block">
              {group.heading}
            </p>
            {group.items
              .filter(
                (item) =>
                  (!item.permission || user.permissions.includes(item.permission)) &&
                  (!item.adminOnly || user.roles.includes("admin")),
              )
              .map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    onClick={onClose}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19A7A1]",
                      active
                        ? "bg-gradient-to-r from-[#176B9A] to-[#287FB5] font-semibold text-white shadow-sm shadow-[#0A2540]/40 ring-1 ring-[#19A7A1]/40"
                        : "text-slate-300 hover:bg-[#176B9A]/25 hover:text-white",
                    )}
                  >
                    {active && (
                      <span
                        className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#19A7A1]"
                        aria-hidden="true"
                      />
                    )}
                    <i
                      className={cn(
                        "fa-solid w-5 shrink-0 text-center transition-colors",
                        item.icon,
                        active
                          ? "text-[#19A7A1]"
                          : "text-slate-400 group-hover:text-[#19A7A1]",
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate md:hidden xl:inline">{item.label}</span>
                  </Link>
                );
              })}
          </section>
        ))}

        <div className="my-4 border-t border-white/10" />

        <button
          type="button"
          title="Cerrar sesión"
          onClick={onLogout}
          disabled={loggingOut}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-[#176B9A]/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19A7A1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <i
            className="fa-solid fa-right-from-bracket w-5 shrink-0 text-center text-slate-400 transition-colors group-hover:text-[#19A7A1]"
            aria-hidden="true"
          />
          <span className="truncate md:hidden xl:inline">
            {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
          </span>
        </button>
      </nav>
    </aside>
  );
}
