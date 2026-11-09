import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../permissions';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

/** Un permiso inexistente (typo) ya no compila: ver common/permissions.ts. */
export function RequirePermissions(...permissions: Permission[]) {
  return SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
}
