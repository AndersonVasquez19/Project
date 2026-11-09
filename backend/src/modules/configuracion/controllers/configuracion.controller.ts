import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import type { JwtClaims } from '../../auth/services/auth.service';
import { SaveSettingDto } from '../dtos/save-setting.dto';
import { ConfiguracionService } from '../services/configuracion.service';

type AuthenticatedRequest = Request & { auth: JwtClaims };

@Controller('configuracion')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConfiguracionController {
  constructor(private readonly configuracion: ConfiguracionService) {}

  @Get()
  @RequirePermissions('configuracion.ver')
  findAll() {
    return this.configuracion.findAll();
  }

  @Put()
  @RequirePermissions('configuracion.editar')
  save(@Body() dto: SaveSettingDto, @Req() request: AuthenticatedRequest) {
    return this.configuracion.save(dto, request.auth.sub);
  }
}
