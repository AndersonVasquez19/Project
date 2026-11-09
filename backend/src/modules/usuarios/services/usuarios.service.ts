import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { writeAudit } from '../../../common/audit/write-audit';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUsuarioDto } from '../dtos/create-usuario.dto';
import { ListUsuariosDto } from '../dtos/list-usuarios.dto';
import { UpdateUsuarioDto } from '../dtos/update-usuario.dto';

const USER_MODEL_TYPE = 'App\\Models\\User';
const ADMIN_ROLE = 'admin';
const USER_EDIT_PERMISSION = 'usuarios.editar';
const ROLE_ASSIGN_PERMISSION = 'usuarios.asignar-roles';
const USER_CREATE_PERMISSION = 'usuarios.crear';

type UsuarioRow = {
  id: bigint;
  name: string;
  email: string;
  roles: string[];
};

export type Usuario = Omit<UsuarioRow, 'id'> & { id: string };
export type UsuarioUpdateResult = Usuario & { sessionRevoked: boolean };

type RolePermissionRow = {
  name: string;
  role_has_permissions: Array<{ permissions: { name: string } }>;
};

function toResponse(row: UsuarioRow): Usuario {
  return { ...row, id: row.id.toString() };
}

function uniqueNames(values: string[]): string[] {
  return [...new Set(values)];
}

function containsAll(available: string[], required: string[]): boolean {
  return required.every((permission) => available.includes(permission));
}

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: ListUsuariosDto,
    actorPermissions: string[],
    actorIsAdmin: boolean,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
        }
      : {};
    const [users, total, roles] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
      this.prisma.roles.findMany({
        where: { guard_name: 'web' },
        select: {
          name: true,
          role_has_permissions: {
            select: { permissions: { select: { name: true } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    const userIds = users.map((user) => user.id);
    const roleAssignments =
      userIds.length === 0
        ? []
        : await this.prisma.model_has_roles.findMany({
            where: {
              model_type: USER_MODEL_TYPE,
              model_id: { in: userIds },
            },
            select: {
              model_id: true,
              roles: { select: { name: true, guard_name: true } },
            },
          });
    const rolesByUser = new Map<string, string[]>();
    for (const assignment of roleAssignments) {
      if (assignment.roles.guard_name !== 'web') {
        continue;
      }

      const key = assignment.model_id.toString();
      rolesByUser.set(key, [
        ...(rolesByUser.get(key) ?? []),
        assignment.roles.name,
      ]);
    }

    const assignableRoles = roles
      .filter(({ name, role_has_permissions }) => {
        if (actorIsAdmin) {
          return true;
        }
        if (name === ADMIN_ROLE) {
          return false;
        }
        return role_has_permissions.every(({ permissions }) =>
          actorPermissions.includes(permissions.name),
        );
      })
      .map(({ name }) => name);

    return {
      data: users.map((user) =>
        toResponse({
          ...user,
          roles: rolesByUser.get(user.id.toString()) ?? [],
        }),
      ),
      assignableRoles,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    idValue: string,
    actorIdValue: string,
    dto: UpdateUsuarioDto,
  ): Promise<UsuarioUpdateResult> {
    const id = this.parseId(idValue);
    const actorId = this.parseId(actorIdValue);
    const requestedRoles = uniqueNames(dto.roles);

    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: bigint }>>`
        SELECT id
        FROM roles
        WHERE name = ${ADMIN_ROLE} AND guard_name = 'web'
        FOR UPDATE
      `;

      const idsToLock = [...new Set([id, actorId])].sort((left, right) =>
        left < right ? -1 : left > right ? 1 : 0,
      );
      await transaction.$queryRaw(Prisma.sql`
        SELECT id
        FROM users
        WHERE id IN (${Prisma.join(idsToLock)})
        ORDER BY id
        FOR UPDATE
      `);

      const [actor, target] = await Promise.all([
        transaction.user.findUnique({ where: { id: actorId } }),
        transaction.user.findUnique({ where: { id } }),
      ]);
      if (!actor) {
        throw new ForbiddenException(
          'La cuenta que autorizó esta acción ya no está disponible.',
        );
      }
      if (!target) {
        throw new NotFoundException('No se encontró el usuario.');
      }

      const actorRoles = await this.roleNames(transaction, actorId);
      const targetRoles = await this.roleNames(transaction, id);
      const changed =
        targetRoles.length !== requestedRoles.length ||
        targetRoles.some((role) => !requestedRoles.includes(role));
      const actorPermissions = await this.effectivePermissionNames(
        transaction,
        actorId,
      );
      if (!actorPermissions.includes(USER_EDIT_PERMISSION)) {
        throw new ForbiddenException('No tienes permiso para editar usuarios.');
      }
      if (!actorPermissions.includes(ROLE_ASSIGN_PERMISSION)) {
        throw new ForbiddenException('No tienes permiso para asignar roles.');
      }

      const actorIsAdmin = actorRoles.includes(ADMIN_ROLE);
      const isSelf = actorId === id;
      if (!actorIsAdmin && !isSelf) {
        if (targetRoles.includes(ADMIN_ROLE)) {
          throw new ForbiddenException(
            'No puedes modificar una cuenta administradora.',
          );
        }

        const targetPermissions = await this.effectivePermissionNames(
          transaction,
          id,
        );
        if (!containsAll(actorPermissions, targetPermissions)) {
          throw new ForbiddenException(
            'No puedes modificar una cuenta fuera de tu nivel de acceso.',
          );
        }
      }

      const roleRecords = await transaction.roles.findMany({
        where: { guard_name: 'web', name: { in: requestedRoles } },
        select: { id: true, name: true },
      });
      if (roleRecords.length !== requestedRoles.length) {
        throw new UnprocessableEntityException({
          message: 'Revisa los datos ingresados.',
          errors: { roles: ['Uno o más roles seleccionados no existen.'] },
        });
      }

      const addedRoles = requestedRoles.filter(
        (role) => !targetRoles.includes(role),
      );
      if (!actorIsAdmin) {
        if (isSelf && changed) {
          throw new ForbiddenException('No puedes cambiar tus propios roles.');
        }
        if (addedRoles.includes(ADMIN_ROLE)) {
          throw new ForbiddenException(
            'No puedes asignar el rol de administrador.',
          );
        }

        const rolePermissionMap = await this.rolePermissionNames(
          transaction,
          addedRoles,
        );
        for (const role of addedRoles) {
          const permissions = rolePermissionMap.get(role);
          if (
            permissions === undefined ||
            !containsAll(actorPermissions, permissions)
          ) {
            throw new ForbiddenException(
              'No puedes asignar un rol fuera de tu nivel de acceso.',
            );
          }
        }
      }

      const targetIsAdmin = targetRoles.includes(ADMIN_ROLE);
      if (targetIsAdmin && !requestedRoles.includes(ADMIN_ROLE)) {
        if (isSelf) {
          throw new UnprocessableEntityException({
            message: 'Revisa los datos ingresados.',
            errors: {
              roles: [
                'No puedes retirarte a ti mismo el rol de administrador.',
              ],
            },
          });
        }

        const adminCount = await transaction.$queryRaw<
          Array<{ total: bigint }>
        >`
          SELECT COUNT(DISTINCT mhr.model_id) AS total
          FROM model_has_roles mhr
          INNER JOIN roles r ON r.id = mhr.role_id
          WHERE r.name = ${ADMIN_ROLE}
            AND r.guard_name = 'web'
            AND mhr.model_type = ${USER_MODEL_TYPE}
        `;
        if ((adminCount[0]?.total ?? 0n) <= 1n) {
          throw new UnprocessableEntityException({
            message: 'Revisa los datos ingresados.',
            errors: {
              roles: [
                'No se puede retirar el rol de administrador al último administrador del sistema.',
              ],
            },
          });
        }
      }

      if (changed) {
        await transaction.model_has_roles.deleteMany({
          where: { model_type: USER_MODEL_TYPE, model_id: id },
        });
        if (roleRecords.length > 0) {
          await transaction.model_has_roles.createMany({
            data: roleRecords.map((role) => ({
              model_type: USER_MODEL_TYPE,
              model_id: id,
              role_id: role.id,
            })),
          });
        }
        await transaction.user.update({
          where: { id },
          data: {
            jwtVersion: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        await writeAudit(transaction, {
          userId: actorId,
          action: 'usuarios.roles_actualizados',
          modelType: 'users',
          modelId: id,
          changes: {
            roles_anteriores: targetRoles,
            roles_nuevos: requestedRoles,
            sesiones_revocadas: true,
          },
        });
      }

      return {
        ...toResponse({
          id: target.id,
          name: target.name,
          email: target.email,
          roles: requestedRoles,
        }),
        sessionRevoked: changed && isSelf,
      };
    });
  }

  async create(dto: CreateUsuarioDto, actorIdValue: string): Promise<Usuario> {
    const actorId = this.parseId(actorIdValue);
    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new UnprocessableEntityException({
        message: 'Revisa los datos ingresados.',
        errors: { password: ['La contraseña no puede superar 72 bytes.'] },
      });
    }

    const password = await bcrypt.hash(dto.password, 12);
    const requestedRoles = uniqueNames(dto.roles);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        await transaction.$queryRaw<Array<{ id: bigint }>>`
          SELECT id
          FROM roles
          WHERE name = ${ADMIN_ROLE} AND guard_name = 'web'
          FOR UPDATE
        `;

        const actor = await transaction.user.findUnique({
          where: { id: actorId },
          select: { id: true },
        });
        if (!actor) {
          throw new ForbiddenException(
            'La cuenta que autorizó esta acción ya no está disponible.',
          );
        }

        const [actorRoles, actorPermissions, roleRecords] = await Promise.all([
          this.roleNames(transaction, actorId),
          this.effectivePermissionNames(transaction, actorId),
          transaction.roles.findMany({
            where: { guard_name: 'web', name: { in: requestedRoles } },
            select: {
              id: true,
              name: true,
              role_has_permissions: {
                select: { permissions: { select: { name: true } } },
              },
            },
          }),
        ]);
        if (!actorPermissions.includes(USER_CREATE_PERMISSION)) {
          throw new ForbiddenException(
            'No tienes permiso para crear usuarios.',
          );
        }
        if (!actorPermissions.includes(ROLE_ASSIGN_PERMISSION)) {
          throw new ForbiddenException('No tienes permiso para asignar roles.');
        }
        if (roleRecords.length !== requestedRoles.length) {
          throw new UnprocessableEntityException({
            message: 'Revisa los datos ingresados.',
            errors: { roles: ['Uno o más roles seleccionados no existen.'] },
          });
        }

        if (!actorRoles.includes(ADMIN_ROLE)) {
          for (const role of roleRecords) {
            const rolePermissions = role.role_has_permissions.map(
              ({ permissions: permission }) => permission.name,
            );
            if (
              role.name === ADMIN_ROLE ||
              !containsAll(actorPermissions, rolePermissions)
            ) {
              throw new ForbiddenException(
                'No puedes asignar un rol fuera de tu nivel de acceso.',
              );
            }
          }
        }

        const created = await transaction.user.create({
          data: {
            name: dto.name.trim(),
            email: dto.email.trim().toLowerCase(),
            password,
            // La cuenta la crea una persona autorizada: el correo queda avalado.
            emailVerifiedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          select: { id: true, name: true, email: true },
        });
        await transaction.model_has_roles.createMany({
          data: roleRecords.map((role) => ({
            model_id: created.id,
            model_type: USER_MODEL_TYPE,
            role_id: role.id,
          })),
        });
        await writeAudit(transaction, {
          userId: actorId,
          action: 'usuarios.creado',
          modelType: 'users',
          modelId: created.id,
          changes: {
            email: created.email,
            roles: roleRecords.map(({ name }) => name),
          },
        });

        return toResponse({
          ...created,
          roles: roleRecords.map(({ name }) => name),
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe una cuenta con ese correo.');
      }
      throw error;
    }
  }

  private async roleNames(
    transaction: Prisma.TransactionClient,
    userId: bigint,
  ): Promise<string[]> {
    const rows = await transaction.$queryRaw<Array<{ name: string }>>`
      SELECT DISTINCT r.name
      FROM roles r
      INNER JOIN model_has_roles mhr ON mhr.role_id = r.id
      WHERE r.guard_name = 'web'
        AND mhr.model_type = ${USER_MODEL_TYPE}
        AND mhr.model_id = ${userId}
      ORDER BY r.name
    `;

    return rows.map(({ name }) => name);
  }

  private async effectivePermissionNames(
    transaction: Prisma.TransactionClient,
    userId: bigint,
  ): Promise<string[]> {
    const rows = await transaction.$queryRaw<Array<{ name: string }>>`
      SELECT DISTINCT p.name
      FROM permissions p
      LEFT JOIN role_has_permissions rhp ON rhp.permission_id = p.id
      LEFT JOIN roles r
        ON r.id = rhp.role_id
        AND r.guard_name = p.guard_name
      LEFT JOIN model_has_roles mhr
        ON mhr.role_id = r.id
        AND mhr.model_type = ${USER_MODEL_TYPE}
        AND mhr.model_id = ${userId}
      LEFT JOIN model_has_permissions mhp
        ON mhp.permission_id = p.id
        AND mhp.model_type = ${USER_MODEL_TYPE}
        AND mhp.model_id = ${userId}
      WHERE p.guard_name = 'web'
        AND (mhr.model_id IS NOT NULL OR mhp.model_id IS NOT NULL)
      ORDER BY p.name
    `;

    return rows.map(({ name }) => name);
  }

  private async rolePermissionNames(
    transaction: Prisma.TransactionClient,
    roleNames: string[],
  ): Promise<Map<string, string[]>> {
    if (roleNames.length === 0) {
      return new Map();
    }

    const rows: RolePermissionRow[] = await transaction.roles.findMany({
      where: { guard_name: 'web', name: { in: roleNames } },
      select: {
        name: true,
        role_has_permissions: {
          select: { permissions: { select: { name: true } } },
        },
      },
    });

    return new Map(
      rows.map(({ name, role_has_permissions }) => [
        name,
        role_has_permissions.map(({ permissions }) => permissions.name),
      ]),
    );
  }

  private parseId(value: string): bigint {
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException(
        'El identificador del usuario no es válido.',
      );
    }

    return BigInt(value);
  }
}
