import { forwardAcademicRequest } from "@/lib/server/academic-api";

export function GET(request: Request) {
  const search = new URL(request.url).search;
  return forwardAcademicRequest(request, `/matriculas${search}`, "matrículas");
}

export function POST(request: Request) {
  return forwardAcademicRequest(request, "/matriculas", "matrículas");
}
