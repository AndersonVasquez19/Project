export interface PermissionOption {
  id: string;
  name: string;
}

export interface SystemRole {
  id: string;
  name: string;
  permissionIds: string[];
  assignedUsers: number;
  protected: boolean;
}

export interface RolesResponse {
  data: SystemRole[];
  permissions: PermissionOption[];
}

export interface RoleInput {
  name: string;
  permissionIds: string[];
}

/** Respuesta de crear/editar un rol (la edición indica si revocó sesiones). */
export interface RoleSaved {
  id: string;
  name: string;
  permissionIds: string[];
  sessionRevoked?: boolean;
}
