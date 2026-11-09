import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { AuditoriaController } from './controllers/auditoria.controller';
import { AuditoriaService } from './services/auditoria.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuditoriaController],
  providers: [AuditoriaService, JwtAuthGuard, JwtStrategy, PermissionsGuard],
})
export class AuditoriaModule {}
