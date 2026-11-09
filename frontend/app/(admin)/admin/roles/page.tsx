import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { RolesPageClient } from "./page-client";

export default async function RolesPage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;

  return (
    <RolesPageClient
      canManage={Boolean(
        identity?.roles.includes("admin") &&
          identity.permissions.includes("roles.editar"),
      )}
    />
  );
}
