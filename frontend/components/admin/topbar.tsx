"use client";

import { Menu } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminIdentity } from "@/lib/auth";
import { adminPageTitle } from "./navigation";

type AdminTopbarProps = {
  user: AdminIdentity;
  sidebarOpen: boolean;
  onMenuClick: () => void;
  onLogout: () => void;
  loggingOut: boolean;
};

export function AdminTopbar({
  user,
  sidebarOpen,
  onMenuClick,
  onLogout,
  loggingOut,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roleLabel = user.role ?? (user.roles.join(", ") || "Sin rol asignado");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-[#E2E8F0] bg-white/95 px-4 shadow-[0_1px_3px_rgba(10,37,64,0.04)] backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-expanded={sidebarOpen}
          aria-controls="admin-sidebar"
          aria-label="Abrir menú de navegación"
          className="admin-icon-btn md:hidden"
        >
          <Menu aria-hidden="true" size={18} />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="hidden h-2 w-2 shrink-0 rounded-full bg-[#19A7A1] sm:inline-block"
              aria-hidden="true"
            />
            <p className="truncate text-sm font-semibold text-[#172B3A]">
              {adminPageTitle(pathname)}
            </p>
          </div>
          <p className="hidden text-xs text-[#64748B] sm:block">
            Sistema de gestión académica y corporativa
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <form
          action="/admin/buscar"
          method="get"
          role="search"
          className="hidden items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F4F7FB] px-3.5 py-2 transition focus-within:border-[#176B9A] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#176B9A]/15 lg:flex"
        >
          <label htmlFor="topbar-global-search" className="sr-only">
            Buscar en el sistema
          </label>
          <i
            className="fa-solid fa-magnifying-glass text-xs text-[#64748B]"
            aria-hidden="true"
          />
          <input
            key={`${pathname}?${searchParams.toString()}`}
            id="topbar-global-search"
            type="search"
            name="q"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Buscar en el sistema..."
            className="w-56 border-0 bg-transparent text-sm text-[#172B3A] placeholder:text-[#64748B] focus:outline-none"
          />
        </form>

        <span className="hidden items-center gap-1.5 rounded-full border border-[#176B9A]/20 bg-[#176B9A]/10 px-3 py-1.5 text-xs font-semibold text-[#176B9A] sm:inline-flex">
          <i
            className="fa-solid fa-building-shield text-[11px] text-[#19A7A1]"
            aria-hidden="true"
          />
          Horus Group SRL
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Menú de usuario: ${user.name}`}
            className="flex items-center gap-2.5 rounded-full border border-[#E2E8F0] bg-[#F4F7FB] py-1 pl-1 pr-3 outline-none transition focus-visible:ring-2 focus-visible:ring-[#176B9A]/30"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A2540] text-xs font-bold text-white ring-2 ring-[#19A7A1]/40">
              {user.name.slice(0, 1).toLocaleUpperCase()}
            </span>
            <span className="hidden max-w-36 truncate text-xs font-semibold text-[#172B3A] sm:block">
              {user.name}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 rounded-xl border border-[#E2E8F0] bg-white p-2 text-[#172B3A] shadow-xl"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2">
                <span className="block truncate text-sm font-semibold text-[#172B3A]">
                  {user.name}
                </span>
                <span className="mt-1 block truncate text-xs font-normal text-[#64748B]">
                  {user.email}
                </span>
                <span className="mt-2 inline-flex rounded-full border border-[#19A7A1]/30 bg-[#19A7A1]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0F766E]">
                  {roleLabel}
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[#E2E8F0]" />
            <DropdownMenuItem
              disabled={loggingOut}
              onClick={onLogout}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-red-700 focus:bg-red-50 focus:text-red-800"
            >
              <i
                className="fa-solid fa-right-from-bracket mr-2 text-xs"
                aria-hidden="true"
              />
              {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
