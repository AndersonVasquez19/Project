import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { ChatAdvisorDto } from '../dtos/chat-advisor.dto';
import { AsistenteService } from '../services/asistente.service';

/** 0, vacío o inválido = sin límite propio (aplican solo las cuotas de Google). */
function chatLimitPerMinute(): number {
  const configured = Number(process.env.ASISTENTE_MAX_CONSULTAS_POR_MINUTO);
  return Number.isInteger(configured) && configured > 0
    ? configured
    : Number.MAX_SAFE_INTEGER;
}

@Controller('asistente')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AsistenteController {
  constructor(private readonly asistente: AsistenteService) {}

  @Get('estado')
  @RequirePermissions('asistente.ver')
  status() {
    return this.asistente.status();
  }

  // Sin límite por defecto. Si defines ASISTENTE_MAX_CONSULTAS_POR_MINUTO se
  // aplica por usuario. ThrottlerGuard va después de JwtAuthGuard para poder
  // identificar al usuario autenticado.
  @Post('chat')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    ip: { limit: chatLimitPerMinute, ttl: 60_000 },
    credential: { limit: chatLimitPerMinute, ttl: 60_000 },
  })
  @RequirePermissions('asistente.ver')
  chat(@Body() dto: ChatAdvisorDto) {
    return this.asistente.chat(dto);
  }
}
