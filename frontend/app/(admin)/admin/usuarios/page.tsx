import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { UsuariosPageClient } from "./page-client";

export default async function UsuariosPage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;

  return (
    <UsuariosPageClient permissions={identity?.permissions ?? []} />
  );
}
