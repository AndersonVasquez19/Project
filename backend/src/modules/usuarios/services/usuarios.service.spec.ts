import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsuariosService } from './usuarios.service';

function partial<T extends object>(value: T): T {
  const matcher: unknown = expect.objectContaining(value);
  return matcher as T;
}

describe('UsuariosService', () => {
  const prisma = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    roles: { findMany: jest.fn() },
    model_has_roles: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  let service: UsuariosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsuariosService(prisma as unknown as PrismaService);
  });

  it('paginates users and limits assignable roles to the actor authority', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 8n, name: 'Ana', email: 'ana@example.test' },
    ]);
    prisma.user.count.mockResolvedValue(1);
    prisma.roles.findMany.mockResolvedValue([
      {
        name: 'admin',
        role_has_permissions: [{ permissions: { name: 'usuarios.editar' } }],
      },
      {
        name: 'coordinador',
        role_has_permissions: [{ permissions: { name: 'cursos.ver' } }],
      },
      {
        name: 'secretaria',
        role_has_permissions: [{ permissions: { name: 'matriculas.ver' } }],
      },
    ]);
    prisma.model_has_roles.findMany.mockResolvedValue([
      {
        model_id: 8n,
        roles: { name: 'coordinador', guard_name: 'web' },
      },
    ]);

    await expect(
      service.findAll(
        { page: 1, limit: 10, search: ' Ana ' },
        ['cursos.ver', 'usuarios.asignar-roles'],
        false,
      ),
    ).resolves.toEqual({
      data: [
        {
          id: '8',
          name: 'Ana',
          email: 'ana@example.test',
          roles: ['coordinador'],
        },
      ],
      assignableRoles: ['coordinador'],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        where: {
          OR: [{ name: { contains: 'Ana' } }, { email: { contains: 'Ana' } }],
        },
      }),
    );
  });

  it('rejects invalid IDs without opening a transaction', async () => {
    await expect(service.update('0', '1', { roles: [] })).rejects.toThrow(
      'El identificador del usuario no es válido.',
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('creates an internal account with a hash and selected roles', async () => {
    let hashedPassword: string | undefined;
    const transaction = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ name: 'admin' }])
        .mockResolvedValueOnce([
          { name: 'usuarios.crear' },
          { name: 'usuarios.asignar-roles' },
        ]),
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 5n }),
        create: jest
          .fn()
          .mockImplementation((args: { data: { password: string } }) => {
            hashedPassword = args.data.password;
            return Promise.resolve({
              id: 9n,
              name: 'Nueva persona',
              email: 'new@example.test',
            });
          }),
      },
      roles: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 2n, name: 'secretaria', role_has_permissions: [] },
          ]),
      },
      model_has_roles: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      audit_logs: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(
      service.create(
        {
          name: 'Nueva persona',
          email: 'NEW@example.test',
          password: 'secure-password-123',
          roles: ['secretaria'],
        },
        '5',
      ),
    ).resolves.toEqual({
      id: '9',
      name: 'Nueva persona',
      email: 'new@example.test',
      roles: ['secretaria'],
    });

    if (!hashedPassword) {
      throw new Error('No se guardó una contraseña para la cuenta.');
    }
    expect(await bcrypt.compare('secure-password-123', hashedPassword)).toBe(
      true,
    );
    expect(hashedPassword).not.toBe('secure-password-123');
    expect(transaction.model_has_roles.createMany).toHaveBeenCalledWith({
      data: [
        {
          model_id: 9n,
          model_type: 'App\\Models\\User',
          role_id: 2n,
        },
      ],
    });
  });

  it('rejects passwords that bcrypt would truncate without opening a transaction', async () => {
    await expect(
      service.create(
        {
          name: 'Nueva persona',
          email: 'new@example.test',
          password: 'é'.repeat(37),
          roles: ['secretaria'],
        },
        '5',
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('requires current edit and role-assignment permissions inside the transaction', async () => {
    const transaction = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ name: 'coordinador' }])
        .mockResolvedValueOnce([{ name: 'coordinador' }])
        .mockResolvedValueOnce([]),
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 5n,
          name: 'Actor',
          email: 'actor@example.test',
        }),
      },
      roles: { findMany: jest.fn() },
      model_has_roles: { deleteMany: jest.fn(), createMany: jest.fn() },
      audit_logs: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(
      service.update('5', '5', { roles: ['coordinador'] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(transaction.roles.findMany).not.toHaveBeenCalled();
  });

  it('allows a non-admin to submit an unchanged self-role list as a no-op', async () => {
    const transaction = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ name: 'coordinador' }])
        .mockResolvedValueOnce([{ name: 'coordinador' }])
        .mockResolvedValueOnce([
          { name: 'usuarios.editar' },
          { name: 'usuarios.asignar-roles' },
        ]),
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 5n,
          name: 'Actor',
          email: 'actor@example.test',
        }),
        update: jest.fn(),
      },
      roles: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 3n, name: 'coordinador' }]),
      },
      model_has_roles: { deleteMany: jest.fn(), createMany: jest.fn() },
      audit_logs: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(
      service.update('5', '5', { roles: ['coordinador'] }),
    ).resolves.toMatchObject({ roles: ['coordinador'], sessionRevoked: false });
    expect(transaction.model_has_roles.deleteMany).not.toHaveBeenCalled();
    expect(transaction.user.update).not.toHaveBeenCalled();
  });

  it('does not allow the last administrator to lose the admin role', async () => {
    const transaction = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ name: 'admin' }])
        .mockResolvedValueOnce([{ name: 'admin' }])
        .mockResolvedValueOnce([
          { name: 'usuarios.editar' },
          { name: 'usuarios.asignar-roles' },
        ])
        .mockResolvedValueOnce([{ total: 1n }]),
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 5n,
          name: 'Admin',
          email: 'admin@example.test',
        }),
      },
      roles: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 2n, name: 'coordinador' }]),
      },
      model_has_roles: { deleteMany: jest.fn(), createMany: jest.fn() },
      audit_logs: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(
      service.update('8', '5', { roles: ['coordinador'] }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(transaction.model_has_roles.deleteMany).not.toHaveBeenCalled();
  });

  it('replaces user roles and revokes that user JWTs atomically', async () => {
    const transaction = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ name: 'admin' }])
        .mockResolvedValueOnce([{ name: 'coordinador' }])
        .mockResolvedValueOnce([
          { name: 'usuarios.editar' },
          { name: 'usuarios.asignar-roles' },
        ]),
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 5n,
            name: 'Admin',
            email: 'admin@example.test',
          })
          .mockResolvedValueOnce({
            id: 8n,
            name: 'Ana',
            email: 'ana@example.test',
          }),
        update: jest.fn().mockResolvedValue({}),
      },
      roles: {
        findMany: jest.fn().mockResolvedValue([{ id: 3n, name: 'secretaria' }]),
      },
      model_has_roles: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      audit_logs: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );

    await expect(
      service.update('8', '5', { roles: ['secretaria'] }),
    ).resolves.toMatchObject({
      id: '8',
      roles: ['secretaria'],
      sessionRevoked: false,
    });
    expect(transaction.audit_logs.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: 5n,
        action: 'usuarios.roles_actualizados',
        model_id: 8n,
      }) as unknown,
    });
    expect(transaction.model_has_roles.deleteMany).toHaveBeenCalled();
    expect(transaction.model_has_roles.createMany).toHaveBeenCalledWith({
      data: [
        {
          model_type: 'App\\Models\\User',
          model_id: 8n,
          role_id: 3n,
        },
      ],
    });
    expect(transaction.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 8n },
        data: partial({
          jwtVersion: { increment: 1 },
        }),
      }),
    );
  });
});
