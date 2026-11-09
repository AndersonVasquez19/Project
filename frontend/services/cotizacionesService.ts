import { apiClient } from "@/services/apiClient";
import type {
  CotizacionesResponse,
  CreateCotizacionInput,
  EstadoCotizacion,
  UpdateCotizacionInput,
} from "@/types/cotizacion";

export async function getAll(query: {
  search?: string;
  estado?: EstadoCotizacion;
}): Promise<CotizacionesResponse> {
  const { data } = await apiClient.get<CotizacionesResponse>(
    "/cotizaciones",
    { params: query },
  );
  return data;
}

export async function create(
  input: CreateCotizacionInput,
): Promise<unknown> {
  const { data } = await apiClient.post("/cotizaciones", input);
  return data;
}

export async function update(
  id: string,
  input: UpdateCotizacionInput,
): Promise<CotizacionesResponse["data"][number]> {
  const { data } = await apiClient.patch<CotizacionesResponse["data"][number]>(
    `/cotizaciones/${encodeURIComponent(id)}`,
    input,
  );
  return data;
}
