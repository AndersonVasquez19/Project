import { apiClient } from "@/services/apiClient";
import type {
  AprobacionesResponse,
  CreateAprobacionInput,
  DecisionAprobacionInput,
} from "@/types/aprobacion";

export async function getAll(): Promise<AprobacionesResponse> {
  const { data } =
    await apiClient.get<AprobacionesResponse>("/aprobaciones");
  return data;
}

export async function create(
  input: CreateAprobacionInput,
): Promise<{ id: string; titulo: string; estado: string }> {
  const { data } = await apiClient.post("/aprobaciones", input);
  return data;
}

export async function decide(
  id: string,
  input: DecisionAprobacionInput,
): Promise<{ id: string; estado: string }> {
  const { data } = await apiClient.patch(
    `/aprobaciones/${encodeURIComponent(id)}/decision`,
    input,
  );
  return data;
}
