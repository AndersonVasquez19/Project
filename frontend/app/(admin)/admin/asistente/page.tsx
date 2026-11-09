import { hasPermission } from "@/lib/server/identity";
import { AsistentePageClient } from "./page-client";

export default async function AsistentePage() {
  return <AsistentePageClient canUse={await hasPermission("asistente.ver")} />;
}
