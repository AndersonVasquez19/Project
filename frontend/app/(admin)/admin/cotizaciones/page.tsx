import { can } from "@/lib/permissions";
import { getPermissions } from "@/lib/server/identity";
import { CotizacionesPageClient } from "./page-client";

export default async function CotizacionesPage() {
  const permissions = await getPermissions();

  return (
    <CotizacionesPageClient
      canView={can(permissions, "cotizaciones.ver")}
      canCreate={can(permissions, "cotizaciones.crear")}
      canEdit={can(permissions, "cotizaciones.editar")}
    />
  );
}
