import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function getJwtSecret(config: ConfigService): Buffer | string {
  const configuredSecret = config.get<string>('JWT_SECRET');

  if (!configuredSecret) {
    throw new InternalServerErrorException(
      'Configura JWT_SECRET para emitir tokens.',
    );
  }

  const secret = configuredSecret.startsWith('base64:')
    ? Buffer.from(configuredSecret.slice(7), 'base64')
    : configuredSecret;

  if (Buffer.byteLength(secret) < 32) {
    throw new InternalServerErrorException(
      'La clave JWT debe contener al menos 32 bytes.',
    );
  }

  return secret;
}

export function getJwtIssuer(config: ConfigService): string {
  return (
    config.get<string>('JWT_ISSUER') ??
    config.get<string>('APP_URL') ??
    'http://localhost'
  );
}

/** Vida de cada token = tiempo de inactividad tolerado (se renueva con la actividad). */
export const DEFAULT_JWT_TTL = 1800;
/** Duración máxima de una sesión aunque haya actividad continua. */
export const DEFAULT_SESSION_MAX_AGE = 28_800;

export function getJwtTtl(config: ConfigService): number {
  return Number(config.get<string>('JWT_TTL') ?? DEFAULT_JWT_TTL);
}

export function getSessionMaxAge(config: ConfigService): number {
  return Number(
    config.get<string>('SESSION_MAX_AGE') ?? DEFAULT_SESSION_MAX_AGE,
  );
}
