import { proxyToApi } from "@/lib/server/api-proxy";

export function forwardCursosRequest(request: Request, resourcePath: string) {
  return proxyToApi(request, resourcePath, "cursos");
}
