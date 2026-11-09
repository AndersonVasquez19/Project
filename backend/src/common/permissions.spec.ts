import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PERMISSIONS } from './permissions';

const BACKEND_ROOT = join(__dirname, '..', '..');
const PERMISSION_LITERAL = /'([a-z]+\.[a-z-]+)'/g;

function walk(dir: string, suffix: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return walk(path, suffix);
    }
    return path.endsWith(suffix) ? [path] : [];
  });
}

function literalsIn(source: string): string[] {
  return [...source.matchAll(PERMISSION_LITERAL)].map((match) => match[1]);
}

describe('permission catalogue', () => {
  it('has no duplicates', () => {
    expect(new Set(PERMISSIONS).size).toBe(PERMISSIONS.length);
  });

  it('contains every permission required by a controller', () => {
    const used = walk(join(BACKEND_ROOT, 'src', 'modules'), '.controller.ts')
      .map((file) => readFileSync(file, 'utf8'))
      .flatMap((source) =>
        [...source.matchAll(/RequirePermissions\(([^)]*)\)/g)].flatMap(
          (match) => literalsIn(match[1]),
        ),
      );

    expect(used.length).toBeGreaterThan(0);
    const catalogue: readonly string[] = PERMISSIONS;
    expect(used.filter((name) => !catalogue.includes(name))).toEqual([]);
  });

  it('is seeded by the manual migrations', () => {
    const sql = walk(join(BACKEND_ROOT, 'prisma', 'manual-migrations'), '.sql')
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    const missing = PERMISSIONS.filter((name) => !sql.includes(`'${name}'`));
    expect(missing).toEqual([]);
  });

  it('matches the frontend catalogue', () => {
    const file = join(BACKEND_ROOT, '..', 'frontend', 'lib', 'permissions.ts');
    if (!existsSync(file)) {
      return; // backend desplegado solo
    }

    const source = readFileSync(file, 'utf8');
    const block = source.slice(
      source.indexOf('PERMISSIONS = ['),
      source.indexOf('] as const'),
    );
    const frontend = [...block.matchAll(/"([a-z]+\.[a-z-]+)"/g)].map(
      (match) => match[1],
    );

    expect([...frontend].sort()).toEqual([...PERMISSIONS].sort());
  });
});
