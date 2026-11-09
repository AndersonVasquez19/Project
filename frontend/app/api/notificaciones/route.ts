import { forwardAcademicRequest } from "@/lib/server/academic-api";

export function GET(request: Request) {
  return forwardAcademicRequest(request, "/notificaciones", "notificaciones");
}

