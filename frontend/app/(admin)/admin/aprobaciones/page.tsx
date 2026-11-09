import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { AprobacionesPageClient } from "./page-client";

export default async function AprobacionesPage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;
  const permissions = identity?.permissions ?? [];

  return (
    <AprobacionesPageClient
      canView={permissions.includes("aprobaciones.ver")}
      canCreate={permissions.includes("aprobaciones.crear")}
      canDecide={permissions.includes("aprobaciones.editar")}
    />
  );
}
