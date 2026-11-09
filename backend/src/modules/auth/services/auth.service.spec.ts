import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const secret = 'a-test-secret-with-at-least-thirty-two-bytes';
  const user = {
    id: 42n,
    name: 'Admin de prueba',
    email: 'admin@example.test',
    password: '',
    jwtVersion: 3,
    emailVerifiedAt: null,
  };
  let prisma: {
    user: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      create: jest.Mock;
    };
    $queryRaw: jest.Mock;
  };
  let service: AuthService;
  let jwt: JwtService;

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(user),
        findUnique: jest.fn().mockResolvedValue(user),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
      },
      $queryRaw: jest.fn((query: TemplateStringsArray) => {
        const sql = query.join(' ');
        if (sql.includes('FROM roles')) {
          return Promise.resolve([{ name: 'admin' }]);
        }
        if (sql.includes('FROM permissions')) {
          return Promise.resolve([
            { name: 'servicios.ver' },
            { name: 'servicios.editar' },
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
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt,
      new ConfigService({
        JWT_TTL: '900',
        JWT_ISSUER: 'http://localhost:4000',
      }),
    );
  });

  it('accepts Laravel bcrypt hashes and returns the compatible JWT response', async () => {
    const bcryptHash = await bcrypt.hash('correct horse battery staple', 4);
    user.password = bcryptHash.replace('$2b$', '$2y$');

    const response = await service.login({
      email: 'admin@example.test',
      password: 'correct horse battery staple',
    });
    const claims = await jwt.verifyAsync<Record<string, unknown>>(
      response.access_token,
      {
        secret,
        issuer: 'http://localhost:4000',
        audience: 'http://localhost:4000',
        algorithms: ['HS256'],
      },
    );

    expect(response.user).toEqual({
      id: 42,
      name: 'Admin de prueba',
      email: 'admin@example.test',
    });
    expect(response.token_type).toBe('Bearer');
    expect(response.expires_in).toBe(900);
    expect(claims).toMatchObject({
      sub: '42',
      name: 'Admin de prueba',
      email: 'admin@example.test',
      role: 'admin',
      roles: ['admin'],
      permissions: ['servicios.ver', 'servicios.editar'],
      ver: 3,
      iss: 'http://localhost:4000',
      aud: 'http://localhost:4000',
    });
    expect(claims).toHaveProperty('jti');
    expect(claims).toHaveProperty('nbf');
    expect(claims).toHaveProperty('exp');
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: { equals: 'admin@example.test' },
        },
      }),
    );
  });

  it('rejects invalid credentials without disclosing whether the email exists', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.test', password: 'incorrect' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.user.findFirst).toHaveBeenCalledTimes(1);
  });

  it('does not issue tokens for unverified accounts when verification is required', async () => {
    const bcryptHash = await bcrypt.hash('correct horse battery staple', 4);
    user.password = bcryptHash;
    const verifiedService = new AuthService(
      prisma as unknown as PrismaService,
      jwt,
      new ConfigService({
        JWT_TTL: '900',
        JWT_ISSUER: 'http://localhost:4000',
        REQUIRE_VERIFIED_EMAIL: 'true',
      }),
    );

    await expect(
      verifiedService.login({
        email: 'admin@example.test',
        password: 'correct horse battery staple',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  describe('register', () => {
    const data = {
      name: 'Usuario Nuevo',
      email: 'nuevo@example.test',
      password: 'una-contrasena-segura-123',
    };

    let openService: AuthService;

    beforeEach(() => {
      openService = new AuthService(
        prisma as unknown as PrismaService,
        jwt,
        new ConfigService({
          JWT_TTL: '900',
          JWT_ISSUER: 'http://localhost:4000',
          ALLOW_PUBLIC_REGISTRATION: 'true',
        }),
      );
    });

    it('is closed by default and never touches the database', async () => {
      prisma.user.create = jest.fn();

      await expect(service.register(data)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('creates a hashed user without assigning any role', async () => {
      prisma.user.create = jest.fn().mockResolvedValue({ id: 7n });

      await expect(openService.register(data)).resolves.toEqual({
        message: 'Cuenta creada correctamente.',
      });

      const [call] = prisma.user.create.mock.calls[0] as [
        { data: { password: string; createdAt: Date; updatedAt: Date } },
      ];
      expect(call.data).toMatchObject({
        name: data.name,
        email: data.email,
        createdAt: expect.any(Date) as Date,
        updatedAt: expect.any(Date) as Date,
      });
      expect(call.data.password).not.toBe(data.password);
      await expect(
        bcrypt.compare(data.password, call.data.password),
      ).resolves.toBe(true);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('rejects a duplicated email with a 422', async () => {
      prisma.user.create = jest.fn().mockRejectedValue({ code: 'P2002' });

      await expect(openService.register(data)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('rejects passwords longer than 72 bytes before hashing', async () => {
      prisma.user.create = jest.fn();

      await expect(
        openService.register({ ...data, password: 'ñ'.repeat(40) }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  it('revokes a token only when its jwt_version is still current', async () => {
    await expect(
      service.logout({
        sub: '42',
        name: 'Admin de prueba',
        email: 'admin@example.test',
        role: 'admin',
        roles: ['admin'],
        permissions: [],
        ver: 3,
      }),
    ).resolves.toBe(true);
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 42n, jwtVersion: 3 },
      data: { jwtVersion: { increment: 1 } },
    });

    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.logout({
        sub: '42',
        name: 'Admin de prueba',
        email: 'admin@example.test',
        role: 'admin',
        roles: ['admin'],
        permissions: [],
        ver: 3,
      }),
    ).resolves.toBe(false);
  });
});
