import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { NotificacionesController } from './controllers/notificaciones.controller';
import { NotificacionesService } from './services/notificaciones.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotificacionesController],
  providers: [NotificacionesService, JwtAuthGuard, JwtStrategy],
})
export class NotificacionesModule {}
