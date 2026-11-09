import { AccessDenied } from "@/components/admin/access-denied";
import { can } from "@/lib/permissions";
import { getIdentity } from "@/lib/server/identity";
import { RolesPageClient } from "./page-client";

export default async function RolesPage() {
  const identity = await getIdentity();
  const permissions = identity?.permissions ?? [];

  if (!can(permissions, "roles.ver")) {
    return <AccessDenied message="No tienes permiso para ver los roles." />;
  }

  return (
    <RolesPageClient
      canManage={Boolean(
        identity?.roles.includes("admin") && can(permissions, "roles.editar"),
      )}
    />
  );
}
