import {
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  it('does not allow modifying the protected administrator role', async () => {
    const tx = {
      roles: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1n,
          name: 'admin',
          guard_name: 'web',
        }),
      },
    };
    const prisma = {
      permissions: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new RolesService(prisma as unknown as PrismaService);

    await expect(
      service.update('1', { name: 'admin', permissionIds: [] }, '9'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects permission identifiers that do not exist before writing a role', async () => {
    const prisma = {
      permissions: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(),
    };
    const service = new RolesService(prisma as unknown as PrismaService);

    await expect(
      service.create({ name: 'soporte', permissionIds: ['2'] }, '9'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('prevents deleting roles that are assigned to users', async () => {
    const tx = {
      roles: {
        findUnique: jest.fn().mockResolvedValue({
          id: 2n,
          name: 'coordinador',
          guard_name: 'web',
        }),
        delete: jest.fn(),
      },
      model_has_roles: { count: jest.fn().mockResolvedValue(1) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = new RolesService(prisma as unknown as PrismaService);

    await expect(service.remove('2', '9')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.roles.delete).not.toHaveBeenCalled();
  });
});
