import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { MatriculasPageClient } from "./page-client";

export default async function MatriculasPage() {
  const token = (await cookies()).get("horus_access_token")?.value;
  const identity = token ? decodeAuthToken(token) : null;

  return <MatriculasPageClient permissions={identity?.permissions ?? []} />;
}
