import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { ReportesController } from './controllers/reportes.controller';
import { ReportesService } from './services/reportes.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportesController],
  providers: [ReportesService, JwtAuthGuard, JwtStrategy, PermissionsGuard],
})
export class ReportesModule {}
