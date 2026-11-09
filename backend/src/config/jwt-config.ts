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

export function getJwtTtl(config: ConfigService): number {
  return Number(config.get<string>('JWT_TTL') ?? 900);
}
