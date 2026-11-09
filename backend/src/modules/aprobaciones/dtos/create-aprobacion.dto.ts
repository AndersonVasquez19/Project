import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

function trimToNull({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || null;
}

export class CreateAprobacionDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  titulo!: string;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(255)
  tipo?: string | null;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(5000)
  descripcion?: string | null;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(255)
  referencia?: string | null;
}
