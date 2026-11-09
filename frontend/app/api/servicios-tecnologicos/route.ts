import { forwardServiciosRequest } from "@/lib/server/servicios-api";

export function GET(request: Request) {
  const search = new URL(request.url).search;
  return forwardServiciosRequest(request, `/servicios-tecnologicos${search}`);
}

export function POST(request: Request) {
  return forwardServiciosRequest(request, "/servicios-tecnologicos");
}
