import { forwardCursosRequest } from "@/lib/server/cursos-api";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardCursosRequest(
    request,
    `/cursos/${encodeURIComponent(id)}/restore`,
  );
}
