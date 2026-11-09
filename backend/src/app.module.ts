import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { credentialTracker, ipTracker } from './common/throttler/trackers';
import { validateEnvironment } from './config/validate-environment';
import { getJwtIssuer, getJwtSecret } from './config/jwt-config';
import { AuthModule } from './modules/auth/auth.module';
import { CursosModule } from './modules/cursos/cursos.module';
import { EstudiantesModule } from './modules/estudiantes/estudiantes.module';
import { MatriculasModule } from './modules/matriculas/matriculas.module';
import { ServiciosModule } from './modules/servicios/servicios.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { RolesModule } from './modules/roles/roles.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { AprobacionesModule } from './modules/aprobaciones/aprobaciones.module';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { CotizacionesModule } from './modules/cotizaciones/cotizaciones.module';
import { ReclamacionesModule } from './modules/reclamaciones/reclamaciones.module';
import { AsistenteModule } from './modules/asistente/asistente.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const issuer = getJwtIssuer(config);

        return {
          secret: getJwtSecret(config),
          signOptions: {
            algorithm: 'HS256' as const,
            issuer,
            audience: issuer,
          },
          verifyOptions: {
            algorithms: ['HS256'] as const,
            issuer,
            audience: issuer,
          },
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'ip',
        ttl: 60_000,
        limit: 30,
        getTracker: ipTracker,
      },
      {
        name: 'credential',
        ttl: 60_000,
        limit: 5,
        getTracker: credentialTracker,
      },
    ]),
    PrismaModule,
    AuthModule,
    CursosModule,
    EstudiantesModule,
    MatriculasModule,
    ServiciosModule,
    UsuariosModule,
    RolesModule,
    DashboardModule,
    ReportesModule,
    NotificacionesModule,
    AprobacionesModule,
    ConfiguracionModule,
    AuditoriaModule,
    CotizacionesModule,
    ReclamacionesModule,
    AsistenteModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
