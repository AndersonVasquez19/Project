export interface Usuario {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface UsuarioUpdateResult extends Usuario {
  sessionRevoked: boolean;
}

export interface UsuariosQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface UsuariosPage {
  data: Usuario[];
  assignableRoles: string[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
