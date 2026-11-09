import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { ReclamacionesPageClient } from "./page-client";

export default async function ReclamacionesPage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;
  const permissions = identity?.permissions ?? [];

  return (
    <ReclamacionesPageClient
      canView={permissions.includes("reclamaciones.ver")}
      canEdit={permissions.includes("reclamaciones.editar")}
    />
  );
}
