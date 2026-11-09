import { forwardCursosRequest } from "@/lib/server/cursos-api";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardCursosRequest(request, `/cursos/${encodeURIComponent(id)}`);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardCursosRequest(request, `/cursos/${encodeURIComponent(id)}`);
}
