import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { ListAuditLogsDto } from '../dtos/list-audit-logs.dto';
import { AuditoriaService } from '../services/auditoria.service';

@Controller('auditoria')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditoriaController {
  constructor(private readonly auditoria: AuditoriaService) {}

  @Get()
  @RequirePermissions('auditoria.ver')
  findAll(@Query() query: ListAuditLogsDto) {
    return this.auditoria.findAll(query);
  }
}
