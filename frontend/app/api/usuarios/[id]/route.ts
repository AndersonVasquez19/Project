import { forwardUsuariosRequest } from "@/lib/server/usuarios-api";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardUsuariosRequest(
    request,
    `/usuarios/${encodeURIComponent(id)}`,
  );
}
