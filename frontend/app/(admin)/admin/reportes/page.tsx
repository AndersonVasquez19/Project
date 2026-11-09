import { hasPermission } from "@/lib/server/identity";
import { ReportesPageClient } from "./page-client";

export default async function ReportesPage() {
  return <ReportesPageClient canView={await hasPermission("reportes.ver")} />;
}
