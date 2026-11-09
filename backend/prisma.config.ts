import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { defineConfig } from 'prisma/config';
import { getDatabaseUrl } from './src/config/database-config';

/**
 * URL que usa la CLI de Prisma (migrate, db push, db pull...).
 *
 * - MIGRATION_DATABASE_URL: cuenta administradora con permisos DDL. Úsala solo
 *   al migrar; la app en ejecución usa un usuario sin DDL (ver
 *   prisma/manual-migrations/create-app-db-user.sql).
 * - Si no existe, se usa la misma configuración que la app (DATABASE_URL o DB_*).
 * - `prisma generate` no se conecta, así que no falla si no hay configuración.
 */
function resolveDatasourceUrl(): string {
  if (process.env.MIGRATION_DATABASE_URL) {
    return process.env.MIGRATION_DATABASE_URL;
  }

  try {
    return getDatabaseUrl(new ConfigService(process.env));
  } catch {
    return '';
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: resolveDatasourceUrl(),
  },
});
