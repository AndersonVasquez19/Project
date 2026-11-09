import { forwardAcademicRequest } from "@/lib/server/academic-api";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardAcademicRequest(
    request,
    `/reclamaciones/${encodeURIComponent(id)}/notas`,
    "reclamaciones",
  );
}
