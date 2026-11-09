import { apiClient } from "@/services/apiClient";
import type {
  Matricula,
  MatriculaInput,
  MatriculaPagosResponse,
  CreateMatriculaPagoInput,
  MatriculasPage,
  MatriculasQuery,
} from "@/types/matricula";

const resource = "/matriculas";

export async function getAll(query: MatriculasQuery): Promise<MatriculasPage> {
  const { data } = await apiClient.get<MatriculasPage>(resource, {
    params: query,
  });
  return data;
}

export async function create(input: MatriculaInput): Promise<Matricula> {
  const { data } = await apiClient.post<Matricula>(resource, input);
  return data;
}

export async function update(
  id: string,
  input: MatriculaInput,
): Promise<Matricula> {
  const { data } = await apiClient.put<Matricula>(
    `${resource}/${encodeURIComponent(id)}`,
    input,
  );
  return data;
}

export async function archive(id: string): Promise<Matricula> {
  const { data } = await apiClient.delete<Matricula>(
    `${resource}/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function annul(id: string): Promise<Matricula> {
  const { data } = await apiClient.patch<Matricula>(
    `${resource}/${encodeURIComponent(id)}/anular`,
  );
  return data;
}

export async function restore(id: string): Promise<Matricula> {
  const { data } = await apiClient.patch<Matricula>(
    `${resource}/${encodeURIComponent(id)}/restore`,
  );
  return data;
}

export async function getPayments(
  id: string,
): Promise<MatriculaPagosResponse> {
  const { data } = await apiClient.get<MatriculaPagosResponse>(
    `${resource}/${encodeURIComponent(id)}/pagos`,
  );
  return data;
}

export async function createPayment(
  id: string,
  input: CreateMatriculaPagoInput,
): Promise<MatriculaPagosResponse["data"][number]> {
  const { data } = await apiClient.post<{
    data: MatriculaPagosResponse["data"][number];
    resumen: MatriculaPagosResponse["resumen"];
  }>(`${resource}/${encodeURIComponent(id)}/pagos`, input);
  return data.data;
}
