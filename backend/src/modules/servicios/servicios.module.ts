import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { ServiciosController } from './controllers/servicios.controller';
import { ServiciosService } from './services/servicios.service';

@Module({
  imports: [PrismaModule],
  controllers: [ServiciosController],
  providers: [ServiciosService, JwtAuthGuard, JwtStrategy, PermissionsGuard],
})
export class ServiciosModule {}
