import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { EstudiantesPageClient } from "./page-client";

export default async function EstudiantesPage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;

  return <EstudiantesPageClient permissions={identity?.permissions ?? []} />;
}
