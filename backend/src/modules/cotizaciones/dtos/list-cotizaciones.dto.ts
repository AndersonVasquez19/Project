import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { LargePageQueryDto } from '../../../common/pagination/page-query';

export const ESTADOS_COTIZACION = [
  'recibida',
  'en_seguimiento',
  'cotizada',
  'cerrada',
  'descartada',
] as const;

function trimToUndefined({ value }: { value: unknown }): unknown {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export const COTIZACIONES_SORT_FIELDS = [
  'recibida_at',
  'estado',
  'codigo',
] as const;

export class ListCotizacionesDto extends LargePageQueryDto {
  @IsOptional()
  @IsIn(COTIZACIONES_SORT_FIELDS)
  sort?: (typeof COTIZACIONES_SORT_FIELDS)[number];

  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @Transform(trimToUndefined)
  @IsIn(ESTADOS_COTIZACION)
  estado?: (typeof ESTADOS_COTIZACION)[number];
}
