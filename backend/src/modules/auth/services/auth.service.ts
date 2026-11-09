import {
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { getJwtIssuer, getJwtTtl } from '../../../config/jwt-config';
import { PrismaService } from '../../../prisma/prisma.service';
import type { LoginDto } from '../dtos/login.dto';
import type { RegisterDto } from '../dtos/register.dto';

const USER_MODEL_TYPE = 'App\\Models\\User';
const INVALID_CREDENTIALS = 'Las credenciales no son válidas.';
// Computed in the background so it does not block startup. Login awaits it
// only when the email does not exist, keeping the timing equalised.
const dummyHashPromise = bcrypt.hash(randomBytes(32).toString('hex'), 12);

type NameRecord = { name: string };
export type JwtClaims = {
  sub: string;
  name: string;
  email: string;
  role: string | null;
  roles: string[];
  permissions: string[];
  ver: number;
  iat?: number;
  nbf?: number;
  exp?: number;
  jti?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(credentials: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: credentials.email } },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        jwtVersion: true,
        emailVerifiedAt: true,
      },
    });

    const passwordMatches = await bcrypt.compare(
      credentials.password,
      user ? this.compatibleBcryptHash(user.password) : await dummyHashPromise,
    );
    const verificationRequired =
      this.config.get<string>('REQUIRE_VERIFIED_EMAIL') === 'true';

    if (
      !user ||
      !passwordMatches ||
      (verificationRequired && !user.emailVerifiedAt)
    ) {
      throw new UnprocessableEntityException({
        message: INVALID_CREDENTIALS,
      });
    }

    const roles = await this.prisma.$queryRaw<NameRecord[]>`
      SELECT DISTINCT r.name
      FROM roles r
      INNER JOIN model_has_roles mhr
        ON mhr.role_id = r.id
      WHERE r.guard_name = 'web'
        AND mhr.model_type = ${USER_MODEL_TYPE}
        AND mhr.model_id = ${user.id}
      ORDER BY r.name
    `;
    const permissions = await this.prisma.$queryRaw<NameRecord[]>`
      SELECT DISTINCT p.name
      FROM permissions p
      LEFT JOIN role_has_permissions rhp
        ON rhp.permission_id = p.id
      LEFT JOIN roles r
        ON r.id = rhp.role_id
       AND r.guard_name = p.guard_name
      LEFT JOIN model_has_roles mhr
        ON mhr.role_id = r.id
       AND mhr.model_type = ${USER_MODEL_TYPE}
       AND mhr.model_id = ${user.id}
      LEFT JOIN model_has_permissions mhp
        ON mhp.permission_id = p.id
       AND mhp.model_type = ${USER_MODEL_TYPE}
       AND mhp.model_id = ${user.id}
      WHERE p.guard_name = 'web'
        AND (mhr.model_id IS NOT NULL OR mhp.model_id IS NOT NULL)
      ORDER BY p.name
    `;
    return this.issueTokenResponse(
      user,
      roles.map(({ name }) => name),
      permissions.map(({ name }) => name),
    );
  }

  async register(data: RegisterDto) {
    if (this.config.get<string>('ALLOW_PUBLIC_REGISTRATION') !== 'true') {
      throw new ForbiddenException({
        message:
          'El registro público está deshabilitado. Solicita tu cuenta a un administrador.',
      });
    }

    if (Buffer.byteLength(data.password, 'utf8') > 72) {
      throw new UnprocessableEntityException({
        message: 'Revisa los datos ingresados.',
        errors: { password: ['La contraseña no puede superar los 72 bytes.'] },
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const now = new Date();

    try {
      await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        },
        select: { id: true },
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new UnprocessableEntityException({
          message: 'No se pudo crear la cuenta.',
          errors: { email: ['Este correo no está disponible.'] },
        });
      }
      throw error;
    }

    return { message: 'Cuenta creada correctamente.' };
  }

  private async issueTokenResponse(
    user: {
      id: bigint;
      name: string;
      email: string;
      jwtVersion: number;
    },
    roleNames: string[],
    permissions: string[],
  ) {
    const id = Number(user.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new Error('El identificador de usuario no es un entero seguro.');
    }

    const issuer = getJwtIssuer(this.config);
    const expiresIn = getJwtTtl(this.config);
    const accessToken = await this.jwt.signAsync(
      {
        name: user.name,
        email: user.email,
        role: roleNames.length === 1 ? roleNames[0] : null,
        roles: roleNames,
        permissions,
        ver: user.jwtVersion,
      },
      {
        algorithm: 'HS256',
        issuer,
        audience: issuer,
        subject: String(user.id),
        jwtid: randomBytes(16).toString('hex'),
        notBefore: 0,
        expiresIn,
      },
    );

    return {
      user: { id, name: user.name, email: user.email },
      access_token: accessToken,
      token_type: 'Bearer' as const,
      expires_in: expiresIn,
    };
  }

  async me(claims: JwtClaims) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(claims.sub) },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('El token no es válido o fue revocado.');
    }

    const id = Number(user.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new Error('El identificador de usuario no es un entero seguro.');
    }

    return { user: { id, name: user.name, email: user.email } };
  }

  async logout(claims: JwtClaims): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: { id: BigInt(claims.sub), jwtVersion: claims.ver },
      data: { jwtVersion: { increment: 1 } },
    });

    return result.count === 1;
  }

  private compatibleBcryptHash(hash: string): string {
    return hash.startsWith('$2y$') ? `$2b$${hash.slice(4)}` : hash;
  }
}
