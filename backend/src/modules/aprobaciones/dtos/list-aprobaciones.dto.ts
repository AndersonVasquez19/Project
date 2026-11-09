import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { LargePageQueryDto } from '../../../common/pagination/page-query';

export const ESTADOS_APROBACION = [
  'pendiente',
  'aprobada',
  'rechazada',
] as const;
export const APROBACIONES_SORT_FIELDS = ['created_at', 'estado'] as const;

function trimToUndefined({ value }: { value: unknown }): unknown {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export class ListAprobacionesDto extends LargePageQueryDto {
  @IsOptional()
  @Transform(trimToUndefined)
  @IsIn(ESTADOS_APROBACION)
  estado?: (typeof ESTADOS_APROBACION)[number];

  @IsOptional()
  @IsIn(APROBACIONES_SORT_FIELDS)
  sort?: (typeof APROBACIONES_SORT_FIELDS)[number];
}
