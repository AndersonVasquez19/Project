import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { CursosController } from './controllers/cursos.controller';
import { CursosService } from './services/cursos.service';

@Module({
  imports: [PrismaModule],
  controllers: [CursosController],
  providers: [CursosService, JwtAuthGuard, JwtStrategy, PermissionsGuard],
})
export class CursosModule {}
