import { forwardServiciosRequest } from "@/lib/server/servicios-api";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardServiciosRequest(
    request,
    `/servicios-tecnologicos/${encodeURIComponent(id)}/archive`,
  );
}
