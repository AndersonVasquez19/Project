import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService, type JwtClaims } from './auth.service';

describe('AuthService.refresh (sesión deslizante)', () => {
  const secret = 'a-test-secret-with-at-least-thirty-two-bytes';
  const issuer = 'http://localhost:4000';
  const user = {
    id: 42n,
    name: 'Ana',
    email: 'ana@example.test',
    jwtVersion: 3,
  };
  const now = () => Math.floor(Date.now() / 1000);

  let prisma: { user: { findUnique: jest.Mock }; $queryRaw: jest.Mock };
  let jwt: JwtService;
  let service: AuthService;

  function build(env: Record<string, string> = {}) {
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt,
      new ConfigService({
        JWT_TTL: '1800',
        SESSION_MAX_AGE: '28800',
        JWT_ISSUER: issuer,
        ...env,
      }),
    );
  }

  function claims(overrides: Partial<JwtClaims> = {}): JwtClaims {
    return {
      sub: '42',
      name: 'Ana',
      email: 'ana@example.test',
      role: 'admin',
      roles: ['admin'],
      permissions: ['cursos.ver'],
      ver: 3,
      auth_time: now() - 600,
      iat: now() - 600,
      ...overrides,
    };
  }

  async function decode(token: string) {
    return jwt.verifyAsync<JwtClaims & { exp: number }>(token, {
      secret,
      issuer,
      audience: issuer,
      algorithms: ['HS256'],
    });
  }

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      $queryRaw: jest.fn((query: TemplateStringsArray) => {
        const sql = query.join(' ');
        if (sql.includes('FROM roles')) {
          return Promise.resolve([{ name: 'coordinador' }]);
        }
        if (sql.includes('FROM permissions')) {
          return Promise.resolve([
            { name: 'cursos.ver' },
            { name: 'cursos.editar' },
          ]);
        }
        return Promise.resolve([]);
      }),
    };
    jwt = new JwtService({
      secret,
      signOptions: { algorithm: 'HS256' },
      verifyOptions: { algorithms: ['HS256'] },
    });
    build();
  });

  it('emite un token nuevo con la vida completa y conserva el inicio de sesión', async () => {
    const authTime = now() - 600;
    const response = await service.refresh(claims({ auth_time: authTime }));
    const token = await decode(response.access_token);

    expect(response.expires_in).toBe(1800);
    expect(token.auth_time).toBe(authTime);
    expect(token.exp - now()).toBeGreaterThan(1790);
    expect(token.ver).toBe(3);
  });

  it('relee roles y permisos vigentes en vez de copiar los del token anterior', async () => {
    const response = await service.refresh(
      claims({ roles: ['admin'], permissions: ['cursos.ver'] }),
    );
    const token = await decode(response.access_token);

    expect(token.roles).toEqual(['coordinador']);
    expect(token.permissions).toEqual(['cursos.ver', 'cursos.editar']);
  });

  it('recorta la vida del token para no superar el tope absoluto', async () => {
    // A 100 s de agotar las 8 h de sesión.
    const response = await service.refresh(
      claims({ auth_time: now() - (28_800 - 100) }),
    );

    expect(response.expires_in).toBeLessThanOrEqual(100);
    expect(response.expires_in).toBeGreaterThan(90);
  });

  it('rechaza renovar una sesión que ya superó la duración máxima', async () => {
    const attempt = service.refresh(claims({ auth_time: now() - 28_801 }));

    await expect(attempt).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(attempt).rejects.toMatchObject({
      response: { code: 'SESSION_EXPIRED' },
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('usa iat como inicio de sesión en tokens anteriores sin auth_time', async () => {
    const response = await service.refresh(
      claims({ auth_time: undefined, iat: now() - (28_800 - 50) }),
    );

    expect(response.expires_in).toBeLessThanOrEqual(50);
  });

  it('rechaza si la sesión fue revocada o el usuario ya no existe', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ ...user, jwtVersion: 4 });
    await expect(service.refresh(claims())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.refresh(claims())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('el inicio de sesión también respeta el tope si JWT_TTL fuera mayor', async () => {
    build({ JWT_TTL: '3600', SESSION_MAX_AGE: '3600' });
    const response = await service.refresh(claims({ auth_time: now() - 3000 }));

    expect(response.expires_in).toBeLessThanOrEqual(600);
  });
});
