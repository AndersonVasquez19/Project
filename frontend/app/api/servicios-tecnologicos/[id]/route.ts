import { forwardServiciosRequest } from "@/lib/server/servicios-api";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardServiciosRequest(
    request,
    `/servicios-tecnologicos/${encodeURIComponent(id)}`,
  );
}
