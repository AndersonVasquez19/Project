import { forwardUsuariosRequest } from "@/lib/server/usuarios-api";

export function GET(request: Request) {
  const search = new URL(request.url).search;
  return forwardUsuariosRequest(request, `/usuarios${search}`);
}

export function POST(request: Request) {
  return forwardUsuariosRequest(request, "/usuarios");
}
