import {
  Body,
  Controller,
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
import { CreateServicioDto } from '../dtos/create-servicio.dto';
import { ListServiciosDto } from '../dtos/list-servicios.dto';
import { UpdateServicioDto } from '../dtos/update-servicio.dto';
import { ServiciosService } from '../services/servicios.service';

@Controller('servicios-tecnologicos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServiciosController {
  constructor(private readonly servicios: ServiciosService) {}

  @Get()
  @RequirePermissions('servicios.ver')
  findAll(@Query() query: ListServiciosDto) {
    return this.servicios.findAll(query);
  }

  @Post()
  @RequirePermissions('servicios.crear')
  create(@Body() dto: CreateServicioDto) {
    return this.servicios.create(dto);
  }

  @Put(':id')
  @RequirePermissions('servicios.editar')
  update(@Param('id') id: string, @Body() dto: UpdateServicioDto) {
    return this.servicios.update(id, dto);
  }

  @Patch(':id/archive')
  @RequirePermissions('servicios.editar')
  archive(@Param('id') id: string) {
    return this.servicios.archive(id);
  }
}
