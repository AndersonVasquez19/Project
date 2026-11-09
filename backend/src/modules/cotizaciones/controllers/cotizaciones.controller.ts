import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import type { JwtClaims } from '../../auth/services/auth.service';
import { CreateCotizacionDto } from '../dtos/create-cotizacion.dto';
import { ListCotizacionesDto } from '../dtos/list-cotizaciones.dto';
import { UpdateCotizacionDto } from '../dtos/update-cotizacion.dto';
import { CotizacionesService } from '../services/cotizaciones.service';

type AuthenticatedRequest = Request & { auth: JwtClaims };

@Controller('cotizaciones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CotizacionesController {
  constructor(private readonly cotizaciones: CotizacionesService) {}

  @Get()
  @RequirePermissions('cotizaciones.ver')
  findAll(@Query() query: ListCotizacionesDto) {
    return this.cotizaciones.findAll(query);
  }

  @Post()
  @RequirePermissions('cotizaciones.crear')
  create(
    @Body() dto: CreateCotizacionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.cotizaciones.create(dto, request.auth.sub);
  }

  @Patch(':id')
  @RequirePermissions('cotizaciones.editar')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCotizacionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.cotizaciones.update(id, dto, request.auth.sub);
  }
}
