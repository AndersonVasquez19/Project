import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { JwtClaims } from '../../auth/services/auth.service';
import { NotificacionesService } from '../services/notificaciones.service';

type AuthenticatedRequest = Request & { auth: JwtClaims };

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(private readonly notificaciones: NotificacionesService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.notificaciones.findForUser(request.auth.sub);
  }

  @Patch(':id/leer')
  markRead(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.notificaciones.markRead(id, request.auth.sub);
  }

  @Patch('leer-todas')
  markAllRead(@Req() request: AuthenticatedRequest) {
    return this.notificaciones.markAllRead(request.auth.sub);
  }
}
