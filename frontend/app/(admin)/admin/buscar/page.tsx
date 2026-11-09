import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { BuscarPageClient } from "./page-client";

export default async function BuscarPage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;

  return <BuscarPageClient permissions={identity?.permissions ?? []} />;
}
