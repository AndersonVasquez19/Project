import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { EstudiantesController } from './controllers/estudiantes.controller';
import { EstudiantesService } from './services/estudiantes.service';

@Module({
  imports: [PrismaModule],
  controllers: [EstudiantesController],
  providers: [EstudiantesService, JwtAuthGuard, JwtStrategy, PermissionsGuard],
})
export class EstudiantesModule {}
