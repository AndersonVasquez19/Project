import { forwardAcademicRequest } from "@/lib/server/academic-api";

export function GET(request: Request) {
  const search = new URL(request.url).search;
  return forwardAcademicRequest(request, `/estudiantes${search}`, "estudiantes");
}

export function POST(request: Request) {
  return forwardAcademicRequest(request, "/estudiantes", "estudiantes");
}
