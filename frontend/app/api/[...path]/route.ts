import { NextResponse } from "next/server";
import { proxyToApi } from "@/lib/server/api-proxy";
import { matchApiRoute } from "@/lib/server/api-routes";

type Context = { params: Promise<{ path: string[] }> };

/**
 * Único proxy (BFF) del panel hacia la API NestJS. Solo reenvía las rutas de
 * la lista de permitidos (lib/server/api-routes.ts); las de autenticación
 * (/api/auth/*) tienen sus propias rutas porque gestionan la cookie.
 */
async function handle(request: Request, { params }: Context) {
  const { path } = await params;
  const route = matchApiRoute(request.method, path);

  if (!route) {
    return NextResponse.json(
      { message: "Recurso no encontrado." },
      { status: 404 },
    );
  }

  // Solo las lecturas llevan query string (filtros, página, orden).
  const search = request.method === "GET" ? new URL(request.url).search : "";
  return proxyToApi(request, `${route.path}${search}`, route.label);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
