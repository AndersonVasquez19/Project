import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';
import { ESTADOS_COTIZACION } from './list-cotizaciones.dto';

export class UpdateCotizacionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  revision!: number;

  @IsIn(ESTADOS_COTIZACION)
  estado!: (typeof ESTADOS_COTIZACION)[number];

  @IsOptional()
  @IsDateString({ strict: true })
  proximo_seguimiento?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d*$/)
  responsable_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  nota?: string | null;
}
