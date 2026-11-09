import { getJwtSecret } from './jwt-config';
import { ConfigService } from '@nestjs/config';
import { getDatabaseUrl } from './database-config';

function assertProductionSafety(
  environment: Record<string, unknown>,
  config: ConfigService,
): void {
  const databaseUser = decodeURIComponent(
    new URL(getDatabaseUrl(config)).username,
  );
  if (databaseUser.toLowerCase() === 'root') {
    throw new Error(
      'En producción la API no debe conectarse a MySQL como root. Crea un usuario con permisos mínimos (ver prisma/manual-migrations/create-app-db-user.sql).',
    );
  }

  const origins = environment.CORS_ORIGINS;
  if (typeof origins !== 'string' || !origins.trim()) {
    throw new Error('En producción debes definir CORS_ORIGINS explícitamente.');
  }
}

export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const config = new ConfigService(environment);
  getDatabaseUrl(config);
  getJwtSecret(config);

  const ttl = Number(environment.JWT_TTL ?? 900);
  if (!Number.isSafeInteger(ttl) || ttl < 60) {
    throw new Error('JWT_TTL debe ser un entero de al menos 60 segundos.');
  }

  if (environment.NODE_ENV === 'production') {
    assertProductionSafety(environment, config);
  }

  return environment;
}
