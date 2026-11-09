import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import type { JwtClaims } from '../../auth/services/auth.service';
import { ListUsuariosDto } from '../dtos/list-usuarios.dto';
import { CreateUsuarioDto } from '../dtos/create-usuario.dto';
import { UpdateUsuarioDto } from '../dtos/update-usuario.dto';
import { UsuariosService } from '../services/usuarios.service';

type AuthenticatedRequest = Request & { auth: JwtClaims };

@Controller('usuarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @RequirePermissions('usuarios.ver')
  findAll(
    @Query() query: ListUsuariosDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usuarios.findAll(
      query,
      request.auth.permissions,
      request.auth.roles.includes('admin'),
    );
  }

  @Post()
  @RequirePermissions('usuarios.crear')
  create(@Body() dto: CreateUsuarioDto, @Req() request: AuthenticatedRequest) {
    return this.usuarios.create(dto, request.auth.sub);
  }

  @Put(':id')
  @RequirePermissions('usuarios.editar')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usuarios.update(id, request.auth.sub, dto);
  }
}
