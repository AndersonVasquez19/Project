import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { AuditoriaPageClient } from "./page-client";

export default async function AuditoriaPage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;

  return (
    <AuditoriaPageClient
      canView={Boolean(identity?.permissions.includes("auditoria.ver"))}
    />
  );
}
