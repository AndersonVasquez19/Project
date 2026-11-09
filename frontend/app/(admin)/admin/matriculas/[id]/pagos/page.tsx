import { cookies } from "next/headers";
import { decodeAuthToken } from "@/lib/auth";
import { MatriculaPagosPageClient } from "./page-client";

export default async function MatriculaPagosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, token] = await Promise.all([
    params,
    cookies().then((store) => store.get("horus_access_token")?.value),
  ]);
  const identity = token ? decodeAuthToken(token) : null;

  return (
    <MatriculaPagosPageClient
      matriculaId={id}
      canRegister={Boolean(identity?.permissions.includes("matriculas.editar"))}
    />
  );
}
