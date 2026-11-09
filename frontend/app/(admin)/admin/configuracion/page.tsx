import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { ConfiguracionPageClient } from "./page-client";

export default async function ConfiguracionPage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;

  return (
    <ConfiguracionPageClient
      canView={Boolean(identity?.permissions.includes("configuracion.ver"))}
      canEdit={Boolean(
        identity?.permissions.includes("configuracion.editar"),
      )}
    />
  );
}
