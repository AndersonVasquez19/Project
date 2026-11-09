import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import metadata from '../../metadata';

/**
 * La documentación OpenAPI solo se publica si API_DOCS_ENABLED=true y no es
 * producción: describe rutas y permisos internos.
 */
export function swaggerEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.API_DOCS_ENABLED === 'true' && env.NODE_ENV !== 'production';
}

export function buildOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Horus API')
    .setDescription(
      'API del panel administrativo. Cada operación indica en x-permissions los permisos que exige.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();

  return SwaggerModule.createDocument(app, config);
}

export async function setupSwagger(app: INestApplication): Promise<void> {
  // El builder SWC no ejecuta el plugin de Swagger: se cargan los tipos de DTO
  // generados con `npm run openapi:metadata`.
  await SwaggerModule.loadPluginMetadata(metadata);

  SwaggerModule.setup('api/docs', app, buildOpenApiDocument(app), {
    jsonDocumentUrl: 'api/docs-json',
  });
}
