import { parseResponse } from "@/lib/api/contract";
import { estudianteSchema, estudiantesPageSchema } from "@/lib/api/estudiante";
import { apiClient } from "@/services/apiClient";
import type {
  Estudiante,
  EstudianteInput,
  EstudiantesPage,
  EstudiantesQuery,
} from "@/types/estudiante";

const resource = "/estudiantes";
const label = "estudiantes";

export async function getAll(
  query: EstudiantesQuery,
): Promise<EstudiantesPage> {
  const { data } = await apiClient.get<unknown>(resource, { params: query });
  return parseResponse(estudiantesPageSchema, data, label);
}

export async function create(input: EstudianteInput): Promise<Estudiante> {
  const { data } = await apiClient.post<unknown>(resource, input);
  return parseResponse(estudianteSchema, data, label);
}

export async function update(
  id: string,
  input: EstudianteInput,
): Promise<Estudiante> {
  const { data } = await apiClient.put<unknown>(
    `${resource}/${encodeURIComponent(id)}`,
    input,
  );
  return parseResponse(estudianteSchema, data, label);
}

export async function archive(id: string): Promise<Estudiante> {
  const { data } = await apiClient.delete<unknown>(
    `${resource}/${encodeURIComponent(id)}`,
  );
  return parseResponse(estudianteSchema, data, label);
}

export async function restore(id: string): Promise<Estudiante> {
  const { data } = await apiClient.patch<unknown>(
    `${resource}/${encodeURIComponent(id)}/restore`,
  );
  return parseResponse(estudianteSchema, data, label);
}
