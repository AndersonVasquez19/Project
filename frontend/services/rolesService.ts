import { apiClient } from "@/services/apiClient";
import type { RoleInput, RolesResponse, SystemRole } from "@/types/role";

const resource = "/roles";

export async function getAll(): Promise<RolesResponse> {
  const { data } = await apiClient.get<RolesResponse>(resource);
  return data;
}

export async function create(input: RoleInput): Promise<SystemRole> {
  const { data } = await apiClient.post<SystemRole>(resource, input);
  return data;
}

export async function update(
  id: string,
  input: RoleInput,
): Promise<SystemRole> {
  const { data } = await apiClient.put<SystemRole>(
    `${resource}/${encodeURIComponent(id)}`,
    input,
  );
  return data;
}

export async function remove(id: string): Promise<void> {
  await apiClient.delete(`${resource}/${encodeURIComponent(id)}`);
}
