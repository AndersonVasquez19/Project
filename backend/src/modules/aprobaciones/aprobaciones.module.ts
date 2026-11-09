import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { AprobacionesController } from './controllers/aprobaciones.controller';
import { AprobacionesService } from './services/aprobaciones.service';

@Module({
  imports: [PrismaModule],
  controllers: [AprobacionesController],
  providers: [AprobacionesService, JwtAuthGuard, JwtStrategy, PermissionsGuard],
})
export class AprobacionesModule {}
