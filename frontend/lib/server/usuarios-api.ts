import { proxyToApi } from "@/lib/server/api-proxy";

export function forwardUsuariosRequest(request: Request, resourcePath: string) {
  return proxyToApi(request, resourcePath, "usuarios");
}
