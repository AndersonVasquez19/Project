import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtClaims } from '../../modules/auth/services/auth.service';
import { JwtStrategy } from '../../modules/auth/strategies/jwt.strategy';

type AuthenticatedRequest = Request & { auth: JwtClaims };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtStrategy: JwtStrategy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.auth = await this.jwtStrategy.authenticate(
      request.headers.authorization,
    );
    return true;
  }
}
