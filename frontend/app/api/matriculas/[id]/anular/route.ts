import { forwardAcademicRequest } from "@/lib/server/academic-api";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardAcademicRequest(
    request,
    `/matriculas/${encodeURIComponent(id)}/anular`,
    "matrículas",
  );
}
