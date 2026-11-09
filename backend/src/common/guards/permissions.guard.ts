import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { JwtClaims } from '../../modules/auth/services/auth.service';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

type AuthenticatedRequest = Request & { auth?: JwtClaims };

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const permissions = request.auth?.permissions;
    if (
      !permissions ||
      !required.every((permission) => permissions.includes(permission))
    ) {
      throw new ForbiddenException('No tienes permiso para esta acción.');
    }

    return true;
  }
}
