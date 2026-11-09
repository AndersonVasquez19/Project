import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { AsistentePageClient } from "./page-client";

export default async function AsistentePage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;

  return (
    <AsistentePageClient
      canUse={Boolean(identity?.permissions.includes("asistente.ver"))}
    />
  );
}
