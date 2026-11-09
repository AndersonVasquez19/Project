import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import type { JwtClaims } from '../../auth/services/auth.service';
import { SaveRoleDto } from '../dtos/save-role.dto';
import { RolesService } from '../services/roles.service';

type AuthenticatedRequest = Request & { auth: JwtClaims };

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @RequirePermissions('roles.ver')
  findAll() {
    return this.roles.findAll();
  }

  @Post()
  @RequirePermissions('roles.editar')
  create(@Body() dto: SaveRoleDto, @Req() request: AuthenticatedRequest) {
    this.requireAdministrator(request);
    return this.roles.create(dto, request.auth.sub);
  }

  @Put(':id')
  @RequirePermissions('roles.editar')
  update(
    @Param('id') id: string,
    @Body() dto: SaveRoleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    this.requireAdministrator(request);
    return this.roles.update(id, dto, request.auth.sub);
  }

  @Delete(':id')
  @RequirePermissions('roles.editar')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    this.requireAdministrator(request);
    return this.roles.remove(id, request.auth.sub);
  }

  private requireAdministrator(request: AuthenticatedRequest): void {
    if (!request.auth.roles.includes('admin')) {
      throw new ForbiddenException(
        'Solo una persona administradora puede modificar roles.',
      );
    }
  }
}
