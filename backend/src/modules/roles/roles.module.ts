import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { RolesController } from './controllers/roles.controller';
import { RolesService } from './services/roles.service';

@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService, JwtAuthGuard, JwtStrategy, PermissionsGuard],
})
export class RolesModule {}
