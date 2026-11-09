import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { MatriculasController } from './controllers/matriculas.controller';
import { MatriculaPagosService } from './services/matricula-pagos.service';
import { MatriculasService } from './services/matriculas.service';

@Module({
  imports: [PrismaModule],
  controllers: [MatriculasController],
  providers: [
    MatriculasService,
    MatriculaPagosService,
    JwtAuthGuard,
    JwtStrategy,
    PermissionsGuard,
  ],
})
export class MatriculasModule {}
