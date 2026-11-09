import { can } from "@/lib/permissions";
import { getPermissions } from "@/lib/server/identity";
import { ConfiguracionPageClient } from "./page-client";

export default async function ConfiguracionPage() {
  const permissions = await getPermissions();

  return (
    <ConfiguracionPageClient
      canView={can(permissions, "configuracion.ver")}
      canEdit={can(permissions, "configuracion.editar")}
    />
  );
}
