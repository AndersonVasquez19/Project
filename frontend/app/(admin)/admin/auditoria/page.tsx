import { hasPermission } from "@/lib/server/identity";
import { AuditoriaPageClient } from "./page-client";

export default async function AuditoriaPage() {
  return <AuditoriaPageClient canView={await hasPermission("auditoria.ver")} />;
}
