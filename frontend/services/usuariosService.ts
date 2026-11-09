import { apiClient } from "@/services/apiClient";
import type {
  Usuario,
  UsuarioUpdateResult,
  UsuariosPage,
  UsuariosQuery,
} from "@/types/usuario";

const resource = "/usuarios";

export interface UsuarioCreateInput {
  name: string;
  email: string;
  password: string;
  roles: string[];
}

export async function createUser(input: UsuarioCreateInput): Promise<Usuario> {
  const { data } = await apiClient.post<Usuario>(resource, input);
  return data;
}

export async function getAll(query: UsuariosQuery): Promise<UsuariosPage> {
  const { data } = await apiClient.get<UsuariosPage>(resource, {
    params: query,
  });
  return data;
}

export async function updateRoles(
  id: string,
  roles: string[],
): Promise<UsuarioUpdateResult> {
  const { data } = await apiClient.put<UsuarioUpdateResult>(
    `${resource}/${encodeURIComponent(id)}`,
    { roles },
  );
  return data;
}
