import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { JwtClaims } from '../../auth/services/auth.service';
import { DashboardService } from '../services/dashboard.service';

type AuthenticatedRequest = Request & { auth: JwtClaims };

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  getSummary(@Req() request: AuthenticatedRequest) {
    return this.dashboard.getSummary(request.auth.permissions);
  }
}
