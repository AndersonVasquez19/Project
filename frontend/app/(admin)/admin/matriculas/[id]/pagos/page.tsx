import { AccessDenied } from "@/components/admin/access-denied";
import { can } from "@/lib/permissions";
import { getPermissions } from "@/lib/server/identity";
import { MatriculaPagosPageClient } from "./page-client";

export default async function MatriculaPagosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, permissions] = await Promise.all([params, getPermissions()]);

  if (!can(permissions, "matriculas.ver")) {
    return <AccessDenied message="No tienes permiso para ver los pagos." />;
  }

  return (
    <MatriculaPagosPageClient
      matriculaId={id}
      canRegister={can(permissions, "matriculas.editar")}
    />
  );
}
