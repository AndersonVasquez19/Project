import { forwardAcademicRequest } from "@/lib/server/academic-api";

export function GET(request: Request) {
  return forwardAcademicRequest(request, "/roles", "roles");
}

export function POST(request: Request) {
  return forwardAcademicRequest(request, "/roles", "roles");
}
