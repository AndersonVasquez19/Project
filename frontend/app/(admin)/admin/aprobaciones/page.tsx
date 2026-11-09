import { can } from "@/lib/permissions";
import { getPermissions } from "@/lib/server/identity";
import { AprobacionesPageClient } from "./page-client";

export default async function AprobacionesPage() {
  const permissions = await getPermissions();

  return (
    <AprobacionesPageClient
      canView={can(permissions, "aprobaciones.ver")}
      canCreate={can(permissions, "aprobaciones.crear")}
      canDecide={can(permissions, "aprobaciones.editar")}
    />
  );
}
