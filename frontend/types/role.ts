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
