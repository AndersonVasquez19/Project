import { AccessDenied } from "@/components/admin/access-denied";
import { can } from "@/lib/permissions";
import { getPermissions } from "@/lib/server/identity";
import { EstudiantesPageClient } from "./page-client";

export default async function EstudiantesPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "estudiantes.ver")) {
    return <AccessDenied message="No tienes permiso para ver los estudiantes." />;
  }

  return <EstudiantesPageClient permissions={permissions} />;
}
