import { ConfigService } from '@nestjs/config';

export function getDatabaseUrl(config: ConfigService): string {
  const configuredUrl = config.get<string>('DATABASE_URL');
  if (configuredUrl) {
    let url: URL;
    try {
      url = new URL(configuredUrl);
    } catch {
      throw new Error('DATABASE_URL no es una URL válida.');
    }

    if (url.protocol !== 'mysql:') {
      throw new Error('DATABASE_URL debe apuntar a MySQL.');
    }

    return configuredUrl;
  }

  const host = config.get<string>('DB_HOST');
  const database =
    config.get<string>('DB_DATABASE') ?? config.get<string>('DB_NAME');
  const username =
    config.get<string>('DB_USERNAME') ?? config.get<string>('DB_USER');
  const password = config.get<string>('DB_PASSWORD');
  const rawPort = config.get<string>('DB_PORT') ?? '3306';
  const port = Number(rawPort);

  if (
    !host ||
    !database ||
    !username ||
    password === undefined ||
    !Number.isSafeInteger(port) ||
    port < 1 ||
    port > 65_535
  ) {
    throw new Error(
      'Configura DATABASE_URL o DB_HOST, DB_PORT, DB_DATABASE (o DB_NAME), DB_USERNAME (o DB_USER) y DB_PASSWORD.',
    );
  }

  const url = new URL(
    `mysql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`,
  );
  if (config.get<string>('DB_SSL') === 'true') {
    url.searchParams.set('sslaccept', 'strict');
  }

  return url.toString();
}
