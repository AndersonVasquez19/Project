import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';
import type { Permission } from '../permissions';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

/** Un permiso inexistente (typo) ya no compila: ver common/permissions.ts. */
export function RequirePermissions(...permissions: Permission[]) {
  return applyDecorators(
    SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions),
    ApiExtension('x-permissions', permissions),
  );
}
