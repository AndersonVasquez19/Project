import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

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

export class ListCotizacionesDto {
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
