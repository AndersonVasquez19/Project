import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { decodeAuthToken } from "@/lib/auth";
import { verifySession } from "@/lib/server/session";

const ACCESS_TOKEN_COOKIE = "horus_access_token";
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
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const user = token ? decodeAuthToken(token) : null;

  if (!token || !user) {
    redirect("/login?motivo=sesion");
  }

  // decodeAuthToken solo lee las claims; la API valida firma y revocación.
  const session = await verifySession(token);
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
