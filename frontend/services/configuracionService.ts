import { apiClient } from "@/services/apiClient";
import type {
  ConfiguracionKey,
  ConfiguracionResponse,
} from "@/types/configuracion";

export async function getAll(): Promise<ConfiguracionResponse> {
  const { data } =
    await apiClient.get<ConfiguracionResponse>("/configuracion");
  return data;
}

export async function save(
  key: ConfiguracionKey,
  value: string,
): Promise<{ key: ConfiguracionKey; value: string }> {
  const { data } = await apiClient.put("/configuracion", { key, value });
  return data;
}
