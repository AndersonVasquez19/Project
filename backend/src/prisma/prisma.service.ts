import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from '../config/database-config';

// Prisma 7 exige un adaptador de driver. Se parte de la misma URL validada
// (DATABASE_URL o DB_*) para mantener una única fuente de configuración.
function createAdapter(config: ConfigService): PrismaMariaDb {
  const url = new URL(getDatabaseUrl(config));

  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: 10,
    connectTimeout: 5_000,
    idleTimeout: 300,
    // DB_SSL=true añade ?sslaccept=strict en getDatabaseUrl: exige TLS con
    // validación de certificado.
    ...(url.searchParams.get('sslaccept') === 'strict' ? { ssl: true } : {}),
  });
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    super({ adapter: createAdapter(config) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
