import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreateMatriculaDto } from '../dtos/create-matricula.dto';
import { CreatePagoDto } from '../dtos/create-pago.dto';
import { ListMatriculasDto } from '../dtos/list-matriculas.dto';
import { UpdateMatriculaDto } from '../dtos/update-matricula.dto';
import { MatriculaPagosService } from '../services/matricula-pagos.service';
import { MatriculasService } from '../services/matriculas.service';

type AuthenticatedRequest = Request & { auth: JwtClaims };

@Controller('matriculas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MatriculasController {
  constructor(
    private readonly matriculas: MatriculasService,
    private readonly pagos: MatriculaPagosService,
  ) {}

  @Get()
  @RequirePermissions('matriculas.ver')
  findAll(@Query() query: ListMatriculasDto) {
    return this.matriculas.findAll(query);
  }

  @Get(':id/pagos')
  @RequirePermissions('matriculas.ver')
  findPayments(@Param('id') id: string) {
    return this.pagos.findForMatricula(id);
  }

  @Post(':id/pagos')
  @RequirePermissions('matriculas.editar')
  createPayment(
    @Param('id') id: string,
    @Body() dto: CreatePagoDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.pagos.create(id, dto, request.auth.sub);
  }

  @Post()
  @RequirePermissions('matriculas.crear')
  create(
    @Body() dto: CreateMatriculaDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.matriculas.create(dto, request.auth.sub);
  }

  @Put(':id')
  @RequirePermissions('matriculas.editar')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMatriculaDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.matriculas.update(
      id,
      dto,
      request.auth.permissions,
      request.auth.sub,
    );
  }

  @Delete(':id')
  @RequirePermissions('matriculas.eliminar')
  archive(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.matriculas.archive(id, request.auth.sub);
  }

  @Patch(':id/anular')
  @RequirePermissions('matriculas.anular')
  annul(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.matriculas.annul(
      id,
      request.auth.permissions,
      request.auth.sub,
    );
  }

  @Patch(':id/restore')
  @RequirePermissions('matriculas.restaurar')
  restore(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.matriculas.restore(id, request.auth.sub);
  }
}
