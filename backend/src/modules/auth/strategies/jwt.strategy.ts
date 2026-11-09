import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtClaims } from '../services/auth.service';

@Injectable()
export class JwtStrategy {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async authenticate(authorization?: string): Promise<JwtClaims> {
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      throw new UnauthorizedException('Falta el token Bearer.');
    }

    let claims: JwtClaims;
    try {
      claims = await this.jwt.verifyAsync<JwtClaims>(token, {
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('El token no es válido o ha expirado.');
    }

    if (
      !claims.sub ||
      !/^[1-9]\d*$/.test(claims.sub) ||
      !Number.isSafeInteger(claims.ver)
    ) {
      throw new UnauthorizedException('El token no es válido.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(claims.sub) },
      select: { jwtVersion: true },
    });
    if (!user || user.jwtVersion !== claims.ver) {
      throw new UnauthorizedException('El token no es válido o fue revocado.');
    }

    return claims;
  }
}
