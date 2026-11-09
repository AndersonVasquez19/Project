import { forwardAcademicRequest } from "@/lib/server/academic-api";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardAcademicRequest(
    request,
    `/estudiantes/${encodeURIComponent(id)}`,
    "estudiantes",
  );
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardAcademicRequest(
    request,
    `/estudiantes/${encodeURIComponent(id)}`,
    "estudiantes",
  );
}
