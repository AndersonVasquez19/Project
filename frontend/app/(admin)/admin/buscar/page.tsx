import { getPermissions } from "@/lib/server/identity";
import { BuscarPageClient } from "./page-client";

export default async function BuscarPage() {
  return <BuscarPageClient permissions={await getPermissions()} />;
}
