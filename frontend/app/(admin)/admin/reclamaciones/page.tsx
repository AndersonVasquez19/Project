import { can } from "@/lib/permissions";
import { getPermissions } from "@/lib/server/identity";
import { ReclamacionesPageClient } from "./page-client";

export default async function ReclamacionesPage() {
  const permissions = await getPermissions();

  return (
    <ReclamacionesPageClient
      canView={can(permissions, "reclamaciones.ver")}
      canEdit={can(permissions, "reclamaciones.editar")}
    />
  );
}
