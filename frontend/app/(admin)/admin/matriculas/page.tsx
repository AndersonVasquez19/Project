import { AccessDenied } from "@/components/admin/access-denied";
import { can } from "@/lib/permissions";
import { getPermissions } from "@/lib/server/identity";
import { MatriculasPageClient } from "./page-client";

export default async function MatriculasPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "matriculas.ver")) {
    return <AccessDenied message="No tienes permiso para ver las matrículas." />;
  }

  return <MatriculasPageClient permissions={permissions} />;
}
