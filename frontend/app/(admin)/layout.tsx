import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  getAccessToken,
  getIdentity,
  getSessionStatus,
} from "@/lib/server/identity";

const STAFF_ROLES = new Set(["admin", "coordinador", "secretaria"]);

export const metadata: Metadata = {
  title: {
    default: "Panel de Control",
    template: "%s | Horus Group SRL",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [token, user] = await Promise.all([getAccessToken(), getIdentity()]);

  if (!token || !user) {
    redirect("/login?motivo=sesion");
  }

  // decodeAuthToken solo lee las claims; la API valida firma y revocación.
  const session = await getSessionStatus(token);
  if (session === "invalid") {
    redirect("/login?motivo=sesion");
  }
  if (session === "unavailable") {
    redirect("/login?motivo=servicio");
  }

  if (!user.roles.some((role) => STAFF_ROLES.has(role))) {
    redirect("/login?motivo=sin-acceso");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
