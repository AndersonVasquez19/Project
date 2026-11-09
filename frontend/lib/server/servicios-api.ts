import { proxyToApi } from "@/lib/server/api-proxy";

export function forwardServiciosRequest(request: Request, resourcePath: string) {
  return proxyToApi(request, resourcePath, "servicios");
}
