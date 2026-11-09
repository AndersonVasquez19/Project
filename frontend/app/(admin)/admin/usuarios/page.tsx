import { AccessDenied } from "@/components/admin/access-denied";
import { can } from "@/lib/permissions";
import { getPermissions } from "@/lib/server/identity";
import { UsuariosPageClient } from "./page-client";

export default async function UsuariosPage() {
  const permissions = await getPermissions();

  if (!can(permissions, "usuarios.ver")) {
    return <AccessDenied message="No tienes permiso para ver los usuarios." />;
  }

  return <UsuariosPageClient permissions={permissions} />;
}
