import { apiClient } from "@/services/apiClient";
import type {
  ServicioInput,
  ServicioTecnologico,
  ServiciosPage,
  ServiciosQuery,
} from "@/types/servicio";

const resource = "/servicios-tecnologicos";

export async function getAll(
  query: ServiciosQuery,
): Promise<ServiciosPage> {
  const { data } = await apiClient.get<ServiciosPage>(resource, {
    params: query,
  });
  return data;
}

export async function create(
  input: ServicioInput,
): Promise<ServicioTecnologico> {
  const { data } = await apiClient.post<ServicioTecnologico>(resource, input);
  return data;
}

export async function update(
  id: string,
  input: ServicioInput,
): Promise<ServicioTecnologico> {
  const { data } = await apiClient.put<ServicioTecnologico>(
    `${resource}/${encodeURIComponent(id)}`,
    input,
  );
  return data;
}

export async function archive(id: string): Promise<ServicioTecnologico> {
  const { data } = await apiClient.patch<ServicioTecnologico>(
    `${resource}/${encodeURIComponent(id)}/archive`,
  );
  return data;
}
