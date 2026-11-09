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
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CreateEstudianteDto } from '../dtos/create-estudiante.dto';
import { ListEstudiantesDto } from '../dtos/list-estudiantes.dto';
import { UpdateEstudianteDto } from '../dtos/update-estudiante.dto';
import { EstudiantesService } from '../services/estudiantes.service';

@Controller('estudiantes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EstudiantesController {
  constructor(private readonly estudiantes: EstudiantesService) {}

  @Get()
  @RequirePermissions('estudiantes.ver')
  findAll(@Query() query: ListEstudiantesDto) {
    return this.estudiantes.findAll(query);
  }

  @Post()
  @RequirePermissions('estudiantes.crear')
  create(@Body() dto: CreateEstudianteDto) {
    return this.estudiantes.create(dto);
  }

  @Put(':id')
  @RequirePermissions('estudiantes.editar')
  update(@Param('id') id: string, @Body() dto: UpdateEstudianteDto) {
    return this.estudiantes.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('estudiantes.eliminar')
  archive(@Param('id') id: string) {
    return this.estudiantes.archive(id);
  }

  @Patch(':id/restore')
  @RequirePermissions('estudiantes.restaurar')
  restore(@Param('id') id: string) {
    return this.estudiantes.restore(id);
  }
}
