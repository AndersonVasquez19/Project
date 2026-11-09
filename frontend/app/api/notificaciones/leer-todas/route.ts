import { forwardAcademicRequest } from "@/lib/server/academic-api";

export function PATCH(request: Request) {
  return forwardAcademicRequest(
    request,
    "/notificaciones/leer-todas",
    "notificaciones",
  );
}
