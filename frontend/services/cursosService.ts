import { parseResponse } from "@/lib/api/contract";
import { cursoSchema, cursosPageSchema } from "@/lib/api/curso";
import { apiClient } from "@/services/apiClient";
import type { Curso, CursoInput, CursosPage, CursosQuery } from "@/types/curso";

const resource = "/cursos";
const label = "cursos";

export async function getAll(query: CursosQuery): Promise<CursosPage> {
  const { data } = await apiClient.get<unknown>(resource, { params: query });
  return parseResponse(cursosPageSchema, data, label);
}

export async function create(input: CursoInput): Promise<Curso> {
  const { data } = await apiClient.post<unknown>(resource, input);
  return parseResponse(cursoSchema, data, label);
}

export async function update(id: string, input: CursoInput): Promise<Curso> {
  const { data } = await apiClient.put<unknown>(
    `${resource}/${encodeURIComponent(id)}`,
    input,
  );
  return parseResponse(cursoSchema, data, label);
}

export async function archive(id: string): Promise<Curso> {
  const { data } = await apiClient.delete<unknown>(
    `${resource}/${encodeURIComponent(id)}`,
  );
  return parseResponse(cursoSchema, data, label);
}

export async function restore(id: string): Promise<Curso> {
  const { data } = await apiClient.patch<unknown>(
    `${resource}/${encodeURIComponent(id)}/restore`,
  );
  return parseResponse(cursoSchema, data, label);
}
