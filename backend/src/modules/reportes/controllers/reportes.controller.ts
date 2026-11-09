import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { ListReporteMatriculasDto } from '../dtos/list-reporte-matriculas.dto';
import { ReportesService } from '../services/reportes.service';

@Controller('reportes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Get('matriculas')
  @RequirePermissions('reportes.ver')
  matriculas(@Query() query: ListReporteMatriculasDto) {
    return this.reportes.matriculas(query);
  }
}
