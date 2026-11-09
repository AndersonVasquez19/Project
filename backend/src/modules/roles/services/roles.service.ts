import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { writeAudit } from '../../../common/audit/write-audit';
import { PrismaService } from '../../../prisma/prisma.service';
import { SaveRoleDto } from '../dtos/save-role.dto';

const WEB_GUARD = 'web';
const ADMIN_ROLE = 'admin';
const USER_MODEL_TYPE = 'App\\Models\\User';

function parseId(value: string): bigint {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new UnprocessableEntityException(
      'El identificador del rol no es válido.',
    );
  }
  return BigInt(value);
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const [roles, permissions] = await Promise.all([
      this.prisma.roles.findMany({
        where: { guard_name: WEB_GUARD },
        select: {
          id: true,
          name: true,
          role_has_permissions: {
            select: { permission_id: true },
            orderBy: { permission_id: 'asc' },
          },
          _count: { select: { model_has_roles: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.permissions.findMany({
        where: { guard_name: WEB_GUARD },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      data: roles.map((role) => ({
        id: role.id.toString(),
        name: role.name,
        permissionIds: role.role_has_permissions.map(({ permission_id }) =>
          permission_id.toString(),
        ),
        assignedUsers: role._count.model_has_roles,
        protected: role.name === ADMIN_ROLE,
      })),
      permissions: permissions.map(({ id, name }) => ({
        id: id.toString(),
        name,
      })),
    };
  }

  async create(dto: SaveRoleDto, actorValue: string) {
    const actorId = parseId(actorValue);
    const permissionIds = dto.permissionIds.map((id) => BigInt(id));
    const permissions = await this.prisma.permissions.findMany({
      where: { guard_name: WEB_GUARD, id: { in: permissionIds } },
      select: { id: true },
    });
    if (permissions.length !== permissionIds.length) {
      throw new UnprocessableEntityException({
        message: 'Revisa los datos ingresados.',
        errors: {
          permissionIds: ['La lista contiene permisos no disponibles.'],
        },
      });
    }

    try {
      const role = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.roles.create({
          data: { name: dto.name.trim(), guard_name: WEB_GUARD },
          select: { id: true, name: true },
        });
        if (permissionIds.length > 0) {
          await transaction.role_has_permissions.createMany({
            data: permissionIds.map((permission_id) => ({
              role_id: created.id,
              permission_id,
            })),
          });
        }
        await writeAudit(transaction, {
          userId: actorId,
          action: 'roles.creado',
          modelType: 'roles',
          modelId: created.id,
          changes: { nombre: created.name, permisos: dto.permissionIds },
        });
        return created;
      });

      return {
        id: role.id.toString(),
        name: role.name,
        permissionIds: dto.permissionIds,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un rol con ese nombre.');
      }
      throw error;
    }
  }

  async update(idValue: string, dto: SaveRoleDto, actorValue: string) {
    const id = parseId(idValue);
    const actorId = parseId(actorValue);
    const permissionIds = dto.permissionIds.map((value) => BigInt(value));
    const permissions = await this.prisma.permissions.findMany({
      where: { guard_name: WEB_GUARD, id: { in: permissionIds } },
      select: { id: true },
    });
    if (permissions.length !== permissionIds.length) {
      throw new UnprocessableEntityException({
        message: 'Revisa los datos ingresados.',
        errors: {
          permissionIds: ['La lista contiene permisos no disponibles.'],
        },
      });
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const role = await transaction.roles.findUnique({
          where: { id },
          select: { id: true, name: true, guard_name: true },
        });
        if (!role || role.guard_name !== WEB_GUARD) {
          throw new NotFoundException('No se encontró el rol.');
        }
        if (role.name === ADMIN_ROLE) {
          throw new ForbiddenException(
            'El rol administrador está protegido y no se puede modificar.',
          );
        }

        const memberRows = await transaction.model_has_roles.findMany({
          where: { role_id: id, model_type: USER_MODEL_TYPE },
          select: { model_id: true },
        });
        const memberIds = memberRows.map(({ model_id }) => model_id);

        const updated = await transaction.roles.update({
          where: { id },
          data: { name: dto.name.trim() },
          select: { id: true, name: true },
        });
        await transaction.role_has_permissions.deleteMany({
          where: { role_id: id },
        });
        if (permissionIds.length > 0) {
          await transaction.role_has_permissions.createMany({
            data: permissionIds.map((permission_id) => ({
              role_id: id,
              permission_id,
            })),
          });
        }
        if (memberIds.length > 0) {
          await transaction.user.updateMany({
            where: { id: { in: memberIds } },
            data: { jwtVersion: { increment: 1 } },
          });
        }
        await writeAudit(transaction, {
          userId: actorId,
          action: 'roles.actualizado',
          modelType: 'roles',
          modelId: id,
          changes: {
            nombre_anterior: role.name,
            nombre: updated.name,
            permisos: dto.permissionIds,
            usuarios_afectados: memberIds.length,
          },
        });

        return {
          id: updated.id.toString(),
          name: updated.name,
          permissionIds: dto.permissionIds,
          sessionRevoked: memberIds.length > 0,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un rol con ese nombre.');
      }
      throw error;
    }
  }

  async remove(idValue: string, actorValue: string) {
    const id = parseId(idValue);
    const actorId = parseId(actorValue);

    return this.prisma.$transaction(async (transaction) => {
      const role = await transaction.roles.findUnique({
        where: { id },
        select: { id: true, name: true, guard_name: true },
      });
      if (!role || role.guard_name !== WEB_GUARD) {
        throw new NotFoundException('No se encontró el rol.');
      }
      if (role.name === ADMIN_ROLE) {
        throw new ForbiddenException(
          'El rol administrador no se puede eliminar.',
        );
      }

      const assigned = await transaction.model_has_roles.count({
        where: { role_id: id },
      });
      if (assigned > 0) {
        throw new ConflictException(
          'No se puede eliminar un rol asignado a usuarios.',
        );
      }

      await transaction.role_has_permissions.deleteMany({
        where: { role_id: id },
      });
      await transaction.roles.delete({ where: { id } });
      await writeAudit(transaction, {
        userId: actorId,
        action: 'roles.eliminado',
        modelType: 'roles',
        modelId: id,
        changes: { nombre: role.name },
      });
      return { id: id.toString(), deleted: true };
    });
  }
}
