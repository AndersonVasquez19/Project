import { forwardCursosRequest } from "@/lib/server/cursos-api";

export function GET(request: Request) {
  const search = new URL(request.url).search;
  return forwardCursosRequest(request, `/cursos${search}`);
}

export function POST(request: Request) {
  return forwardCursosRequest(request, "/cursos");
}
