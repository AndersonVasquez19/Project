import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { ConfiguracionController } from './controllers/configuracion.controller';
import { ConfiguracionService } from './services/configuracion.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConfiguracionController],
  providers: [
    ConfiguracionService,
    JwtAuthGuard,
    JwtStrategy,
    PermissionsGuard,
  ],
})
export class ConfiguracionModule {}
