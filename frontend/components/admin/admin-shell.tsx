"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import type { AdminIdentity } from "@/lib/auth";
import { apiClient } from "@/services/apiClient";

type AdminShellProps = {
  user: AdminIdentity;
  children: ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    function closeSidebar(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", closeSidebar);
    return () => window.removeEventListener("keydown", closeSidebar);
  }, []);

  async function logout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setLogoutError(null);
    try {
      await apiClient.post("/auth/logout");
      router.replace("/login");
      router.refresh();
    } catch (error: unknown) {
      const responseData =
        axios.isAxiosError(error) && typeof error.response?.data === "object"
          ? error.response.data
          : null;
      const message =
        responseData && "message" in responseData && typeof responseData.message === "string"
          ? responseData.message
          : "No se pudo cerrar la sesión. Inténtalo nuevamente.";
      setLogoutError(message);
      setLoggingOut(false);
    }
  }

  return (
    <div className="admin-surface min-h-screen overflow-x-hidden font-sans text-[#172B3A] antialiased">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[#0A2540]/60 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú de navegación"
        />
      )}

      <AdminSidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => void logout()}
        loggingOut={loggingOut}
      />

      <div className="flex min-h-screen min-w-0 flex-col md:pl-[72px] xl:pl-[260px]">
        <AdminTopbar
          user={user}
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen((open) => !open)}
          onLogout={() => void logout()}
          loggingOut={loggingOut}
        />
        <main
          id="admin-main-content"
          className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {logoutError && (
            <div
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {logoutError}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
