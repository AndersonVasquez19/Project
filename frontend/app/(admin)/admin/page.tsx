import { getIdentity } from "@/lib/server/identity";
import { DashboardPageClient } from "./dashboard-page-client";

export default async function AdminHomePage() {
  const identity = await getIdentity();

  return (
    <DashboardPageClient
      userName={identity?.name ?? "Equipo Horus"}
      permissions={identity?.permissions ?? []}
    />
  );
}
