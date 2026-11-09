import { AccessDenied } from "@/components/admin/access-denied";
import { can } from "@/lib/permissions";
import { getPermissions } from "@/lib/server/identity";
import { ServiciosPageClient } from "./page-client";

export default async function ServiciosPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "servicios.ver")) {
    return <AccessDenied message="No tienes permiso para ver los servicios." />;
  }

  return <ServiciosPageClient permissions={permissions} />;
}
