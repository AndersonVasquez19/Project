import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

function trimToNull({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || null;
}

export class CreateCotizacionDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  contacto_nombre!: string;

  @IsOptional()
  @Transform(trimToNull)
  @IsEmail()
  @MaxLength(254)
  contacto_email?: string | null;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @Matches(/^[+\d() .-]{7,30}$/)
  contacto_telefono?: string | null;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  necesidad_cliente!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d*$/)
  servicio_id?: string;
}
