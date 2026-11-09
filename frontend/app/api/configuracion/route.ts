import { forwardAcademicRequest } from "@/lib/server/academic-api";

export function GET(request: Request) {
  return forwardAcademicRequest(request, "/configuracion", "configuración");
}

export function PUT(request: Request) {
  return forwardAcademicRequest(request, "/configuracion", "configuración");
}
