import { forwardAcademicRequest } from "@/lib/server/academic-api";

export function GET(request: Request) {
  const search = new URL(request.url).search;
  return forwardAcademicRequest(
    request,
    `/reportes/matriculas${search}`,
    "reportes",
  );
}
