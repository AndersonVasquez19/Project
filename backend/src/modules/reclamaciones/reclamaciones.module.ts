import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { ReclamacionesController } from './controllers/reclamaciones.controller';
import { ReclamacionesService } from './services/reclamaciones.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReclamacionesController],
  providers: [
    ReclamacionesService,
    JwtAuthGuard,
    JwtStrategy,
    PermissionsGuard,
  ],
})
export class ReclamacionesModule {}
