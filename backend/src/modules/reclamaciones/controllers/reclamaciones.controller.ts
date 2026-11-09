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
import { AddReclamacionNoteDto } from '../dtos/add-reclamacion-note.dto';
import { ListReclamacionesDto } from '../dtos/list-reclamaciones.dto';
import { ReclamacionesService } from '../services/reclamaciones.service';

type AuthenticatedRequest = Request & { auth: JwtClaims };

@Controller('reclamaciones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReclamacionesController {
  constructor(private readonly reclamaciones: ReclamacionesService) {}

  @Get()
  @RequirePermissions('reclamaciones.ver')
  findAll(@Query() query: ListReclamacionesDto) {
    return this.reclamaciones.findAll(query);
  }

  @Post(':id/notas')
  @RequirePermissions('reclamaciones.editar')
  addNote(
    @Param('id') id: string,
    @Body() dto: AddReclamacionNoteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reclamaciones.addNote(id, dto, request.auth.sub);
  }

  @Patch(':id/asignar')
  @RequirePermissions('reclamaciones.editar')
  assignToSelf(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.reclamaciones.assignToSelf(id, request.auth.sub);
  }
}
