import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { CotizacionesController } from './controllers/cotizaciones.controller';
import { CotizacionesService } from './services/cotizaciones.service';

@Module({
  imports: [PrismaModule],
  controllers: [CotizacionesController],
  providers: [CotizacionesService, JwtAuthGuard, JwtStrategy, PermissionsGuard],
})
export class CotizacionesModule {}
