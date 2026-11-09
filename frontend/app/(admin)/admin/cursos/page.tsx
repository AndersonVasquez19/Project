import { AccessDenied } from "@/components/admin/access-denied";
import { can } from "@/lib/permissions";
import { getPermissions } from "@/lib/server/identity";
import { CursosPageClient } from "./page-client";

export default async function CursosPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "cursos.ver")) {
    return <AccessDenied message="No tienes permiso para ver los cursos." />;
  }

  return <CursosPageClient permissions={permissions} />;
}
