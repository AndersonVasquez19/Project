import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import type { JwtClaims } from '../../auth/services/auth.service';
import { CreateAprobacionDto } from '../dtos/create-aprobacion.dto';
import { DecisionAprobacionDto } from '../dtos/decision-aprobacion.dto';
import { AprobacionesService } from '../services/aprobaciones.service';

type AuthenticatedRequest = Request & { auth: JwtClaims };

@Controller('aprobaciones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AprobacionesController {
  constructor(private readonly aprobaciones: AprobacionesService) {}

  @Get()
  @RequirePermissions('aprobaciones.ver')
  findAll() {
    return this.aprobaciones.findAll();
  }

  @Post()
  @RequirePermissions('aprobaciones.crear')
  create(
    @Body() dto: CreateAprobacionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.aprobaciones.create(dto, request.auth.sub);
  }

  @Patch(':id/decision')
  @RequirePermissions('aprobaciones.editar')
  decide(
    @Param('id') id: string,
    @Body() dto: DecisionAprobacionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.aprobaciones.decide(id, dto, request.auth.sub);
  }
}
