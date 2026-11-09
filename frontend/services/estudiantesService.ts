import { apiClient } from "@/services/apiClient";
import type {
  Estudiante,
  EstudianteInput,
  EstudiantesPage,
  EstudiantesQuery,
} from "@/types/estudiante";

const resource = "/estudiantes";

export async function getAll(
  query: EstudiantesQuery,
): Promise<EstudiantesPage> {
  const { data } = await apiClient.get<EstudiantesPage>(resource, {
    params: query,
  });
  return data;
}

export async function create(input: EstudianteInput): Promise<Estudiante> {
  const { data } = await apiClient.post<Estudiante>(resource, input);
  return data;
}

export async function update(
  id: string,
  input: EstudianteInput,
): Promise<Estudiante> {
  const { data } = await apiClient.put<Estudiante>(
    `${resource}/${encodeURIComponent(id)}`,
    input,
  );
  return data;
}

export async function archive(id: string): Promise<Estudiante> {
  const { data } = await apiClient.delete<Estudiante>(
    `${resource}/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function restore(id: string): Promise<Estudiante> {
  const { data } = await apiClient.patch<Estudiante>(
    `${resource}/${encodeURIComponent(id)}/restore`,
  );
  return data;
}
