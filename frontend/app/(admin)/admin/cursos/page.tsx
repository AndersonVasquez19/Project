import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { CursosPageClient } from "./page-client";

export default async function CursosPage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;

  return <CursosPageClient permissions={identity?.permissions ?? []} />;
}
