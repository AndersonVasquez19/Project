import { parseResponse } from "@/lib/api/contract";
import {
  matriculaSchema,
  matriculasPageSchema,
  pagoCreadoSchema,
  pagosSnapshotSchema,
} from "@/lib/api/matricula";
import { apiClient } from "@/services/apiClient";
import type {
  CreateMatriculaPagoInput,
  Matricula,
  MatriculaInput,
  MatriculaPago,
  MatriculaPagosResponse,
  MatriculasPage,
  MatriculasQuery,
} from "@/types/matricula";

const resource = "/matriculas";
const label = "matrículas";

export async function getAll(query: MatriculasQuery): Promise<MatriculasPage> {
  const { data } = await apiClient.get<unknown>(resource, { params: query });
  return parseResponse(matriculasPageSchema, data, label);
}

export async function create(input: MatriculaInput): Promise<Matricula> {
  const { data } = await apiClient.post<unknown>(resource, input);
  return parseResponse(matriculaSchema, data, label);
}

export async function update(
  id: string,
  input: MatriculaInput,
): Promise<Matricula> {
  const { data } = await apiClient.put<unknown>(
    `${resource}/${encodeURIComponent(id)}`,
    input,
  );
  return parseResponse(matriculaSchema, data, label);
}

export async function archive(id: string): Promise<Matricula> {
  const { data } = await apiClient.delete<unknown>(
    `${resource}/${encodeURIComponent(id)}`,
  );
  return parseResponse(matriculaSchema, data, label);
}

export async function annul(id: string): Promise<Matricula> {
  const { data } = await apiClient.patch<unknown>(
    `${resource}/${encodeURIComponent(id)}/anular`,
  );
  return parseResponse(matriculaSchema, data, label);
}

export async function restore(id: string): Promise<Matricula> {
  const { data } = await apiClient.patch<unknown>(
    `${resource}/${encodeURIComponent(id)}/restore`,
  );
  return parseResponse(matriculaSchema, data, label);
}

export async function getPayments(
  id: string,
): Promise<MatriculaPagosResponse> {
  const { data } = await apiClient.get<unknown>(
    `${resource}/${encodeURIComponent(id)}/pagos`,
  );
  return parseResponse(pagosSnapshotSchema, data, "pagos");
}

export async function createPayment(
  id: string,
  input: CreateMatriculaPagoInput,
): Promise<MatriculaPago> {
  const { data } = await apiClient.post<unknown>(
    `${resource}/${encodeURIComponent(id)}/pagos`,
    input,
  );
  return parseResponse(pagoCreadoSchema, data, "pagos").data;
}
