import { forwardAcademicRequest } from "@/lib/server/academic-api";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardAcademicRequest(
    request,
    `/matriculas/${encodeURIComponent(id)}/pagos`,
    "pagos de matrícula",
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardAcademicRequest(
    request,
    `/matriculas/${encodeURIComponent(id)}/pagos`,
    "pagos de matrícula",
  );
}
