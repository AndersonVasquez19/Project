import { apiClient } from "@/services/apiClient";
import type { Curso, CursoInput, CursosPage, CursosQuery } from "@/types/curso";

const resource = "/cursos";

export async function getAll(query: CursosQuery): Promise<CursosPage> {
  const { data } = await apiClient.get<CursosPage>(resource, {
    params: query,
  });
  return data;
}

export async function create(input: CursoInput): Promise<Curso> {
  const { data } = await apiClient.post<Curso>(resource, input);
  return data;
}

export async function update(id: string, input: CursoInput): Promise<Curso> {
  const { data } = await apiClient.put<Curso>(
    `${resource}/${encodeURIComponent(id)}`,
    input,
  );
  return data;
}

export async function archive(id: string): Promise<Curso> {
  const { data } = await apiClient.delete<Curso>(
    `${resource}/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function restore(id: string): Promise<Curso> {
  const { data } = await apiClient.patch<Curso>(
    `${resource}/${encodeURIComponent(id)}/restore`,
  );
  return data;
}
