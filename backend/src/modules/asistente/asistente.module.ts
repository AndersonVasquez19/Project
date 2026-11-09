import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { AsistenteController } from './controllers/asistente.controller';
import { AsistenteService } from './services/asistente.service';

@Module({
  controllers: [AsistenteController],
  providers: [AsistenteService, JwtAuthGuard, JwtStrategy, PermissionsGuard],
})
export class AsistenteModule {}
