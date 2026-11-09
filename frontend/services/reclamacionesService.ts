import { apiClient } from "@/services/apiClient";
import type { ReclamacionesResponse } from "@/types/reclamacion";

export async function getAll(query: {
  search?: string;
  estado?: string;
}): Promise<ReclamacionesResponse> {
  const { data } = await apiClient.get<ReclamacionesResponse>(
    "/reclamaciones",
    { params: query },
  );
  return data;
}

export async function addNote(
  id: string,
  nota: string,
): Promise<{ id: string; guardada: true }> {
  const { data } = await apiClient.post<{ id: string; guardada: true }>(
    `/reclamaciones/${encodeURIComponent(id)}/notas`,
    { nota },
  );
  return data;
}

export async function assignToSelf(
  id: string,
): Promise<{ id: string; asignada: true }> {
  const { data } = await apiClient.patch<{ id: string; asignada: true }>(
    `/reclamaciones/${encodeURIComponent(id)}/asignar`,
  );
  return data;
}
