import { parseResponse } from "@/lib/api/contract";
import {
  usuarioActualizadoSchema,
  usuarioSchema,
  usuariosPageSchema,
} from "@/lib/api/usuario";
import { apiClient } from "@/services/apiClient";
import type {
  Usuario,
  UsuarioUpdateResult,
  UsuariosPage,
  UsuariosQuery,
} from "@/types/usuario";

const resource = "/usuarios";
const label = "usuarios";

export interface UsuarioCreateInput {
  name: string;
  email: string;
  password: string;
  roles: string[];
}

export async function createUser(input: UsuarioCreateInput): Promise<Usuario> {
  const { data } = await apiClient.post<unknown>(resource, input);
  return parseResponse(usuarioSchema, data, label);
}

export async function getAll(query: UsuariosQuery): Promise<UsuariosPage> {
  const { data } = await apiClient.get<unknown>(resource, { params: query });
  return parseResponse(usuariosPageSchema, data, label);
}

export async function updateRoles(
  id: string,
  roles: string[],
): Promise<UsuarioUpdateResult> {
  const { data } = await apiClient.put<unknown>(
    `${resource}/${encodeURIComponent(id)}`,
    { roles },
  );
  return parseResponse(usuarioActualizadoSchema, data, label);
}
