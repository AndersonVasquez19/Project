import { IsIn, IsOptional } from 'class-validator';

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

/** Metadatos de paginación comunes a todos los listados. */
export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function pageMeta(page: number, limit: number, total: number): PageMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

/** Parámetros `order` compartidos; cada DTO añade su propio `sort` con lista blanca. */
export class OrderQueryDto {
  @IsOptional()
  @IsIn(SORT_ORDERS)
  order?: SortOrder;
}

/** `page` y `limit` con tope configurable por listado. */
export function pagingDefaults(
  query: { page?: number; limit?: number },
  defaultLimit: number,
): { page: number; limit: number; skip: number } {
  const page = query.page ?? 1;
  const limit = query.limit ?? defaultLimit;
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Convierte `sort`/`order` en un `orderBy` de Prisma usando solo columnas de la
 * lista blanca. `fields` asigna cada nombre público a los criterios reales.
 * Siempre añade el desempate de `fallback` para que la paginación sea estable.
 */
export function resolveOrderBy<T>(
  sort: string | undefined,
  order: SortOrder | undefined,
  fields: Record<string, (direction: SortOrder) => T[]>,
  fallback: T[],
  tiebreaker: T[] = [],
): T[] {
  const build = sort ? fields[sort] : undefined;
  if (!build) {
    return fallback;
  }
  return [...build(order ?? 'asc'), ...tiebreaker];
}
