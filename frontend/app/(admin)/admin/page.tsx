import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { DashboardPageClient } from "./dashboard-page-client";

export default async function AdminHomePage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;

  return <DashboardPageClient userName={identity?.name ?? "Equipo Horus"} />;
}
