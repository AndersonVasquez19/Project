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
import { CreateCursoDto } from '../dtos/create-curso.dto';
import { ListCursosDto } from '../dtos/list-cursos.dto';
import { UpdateCursoDto } from '../dtos/update-curso.dto';
import { CursosService } from '../services/cursos.service';

@Controller('cursos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CursosController {
  constructor(private readonly cursos: CursosService) {}

  @Get()
  @RequirePermissions('cursos.ver')
  findAll(@Query() query: ListCursosDto) {
    return this.cursos.findAll(query);
  }

  @Post()
  @RequirePermissions('cursos.crear')
  create(@Body() dto: CreateCursoDto) {
    return this.cursos.create(dto);
  }

  @Put(':id')
  @RequirePermissions('cursos.editar')
  update(@Param('id') id: string, @Body() dto: UpdateCursoDto) {
    return this.cursos.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('cursos.eliminar')
  archive(@Param('id') id: string) {
    return this.cursos.archive(id);
  }

  @Patch(':id/restore')
  @RequirePermissions('cursos.restaurar')
  restore(@Param('id') id: string) {
    return this.cursos.restore(id);
  }
}
