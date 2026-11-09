import { forwardAcademicRequest } from "@/lib/server/academic-api";

export function POST(request: Request) {
  return forwardAcademicRequest(request, "/asistente/chat", "asistente");
}
