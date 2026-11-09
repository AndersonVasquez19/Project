// Descarga el contrato OpenAPI de una API en marcha y lo guarda en openapi.json.
//   1) API_DOCS_ENABLED=true npm run start:dev   (o node dist/main)
//   2) npm run openapi:export
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.API_URL ?? `http://127.0.0.1:${process.env.PORT ?? 4000}`;
const response = await fetch(`${base}/api/docs-json`);
if (!response.ok) {
  console.error(
    `No se pudo leer ${base}/api/docs-json (${response.status}). ¿Está la API en marcha con API_DOCS_ENABLED=true?`,
  );
  process.exit(1);
}

const document = await response.json();
const target = join(import.meta.dirname, '..', 'openapi.json');
writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Contrato guardado en ${target} (${Object.keys(document.paths).length} rutas).`);
