import { parseResponse } from "@/lib/api/contract";
import { rolGuardadoSchema, rolesResponseSchema } from "@/lib/api/rol";
import { apiClient } from "@/services/apiClient";
import type { RoleInput, RolesResponse, RoleSaved } from "@/types/role";

const resource = "/roles";
const label = "roles";

export async function getAll(): Promise<RolesResponse> {
  const { data } = await apiClient.get<unknown>(resource);
  return parseResponse(rolesResponseSchema, data, label);
}

export async function create(input: RoleInput): Promise<RoleSaved> {
  const { data } = await apiClient.post<unknown>(resource, input);
  return parseResponse(rolGuardadoSchema, data, label);
}

export async function update(id: string, input: RoleInput): Promise<RoleSaved> {
  const { data } = await apiClient.put<unknown>(
    `${resource}/${encodeURIComponent(id)}`,
    input,
  );
  return parseResponse(rolGuardadoSchema, data, label);
}

export async function remove(id: string): Promise<void> {
  await apiClient.delete(`${resource}/${encodeURIComponent(id)}`);
}
