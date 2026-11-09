import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { CotizacionesPageClient } from "./page-client";

export default async function CotizacionesPage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;
  const permissions = identity?.permissions ?? [];

  return (
    <CotizacionesPageClient
      canView={permissions.includes("cotizaciones.ver")}
      canCreate={permissions.includes("cotizaciones.crear")}
      canEdit={permissions.includes("cotizaciones.editar")}
    />
  );
}
