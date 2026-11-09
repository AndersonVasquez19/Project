import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PluginMetadataGenerator } from '@nestjs/cli/lib/compiler/plugins/plugin-metadata-generator';
import { ReadonlyVisitor } from '@nestjs/swagger/plugin';

// El builder SWC no ejecuta el plugin de Swagger; este script genera
// src/metadata.ts con los tipos de DTO leyendo el código con el compilador de TS.
const srcDir = join(__dirname, '..', 'src');
const generator = new PluginMetadataGenerator();
generator.generate({
  visitors: [
    new ReadonlyVisitor({ introspectComments: true, pathToSource: srcDir }),
  ],
  outputDir: srcDir,
  watch: false,
  tsconfigPath: 'tsconfig.build.json',
});

// Archivo generado: sus import() no llevan extensión (rechazada por nodenext).
const file = join(srcDir, 'metadata.ts');
const content = readFileSync(file, 'utf8');
if (!content.startsWith('// @ts-nocheck')) {
  writeFileSync(file, `// @ts-nocheck\n${content}`);
}
