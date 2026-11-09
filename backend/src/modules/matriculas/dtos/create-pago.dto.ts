import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

function trimToNull({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export const METODOS_PAGO = [
  'efectivo',
  'transferencia',
  'tarjeta',
  'yape_plin',
  'otro',
] as const;

export class CreatePagoDto {
  @IsString()
  @Matches(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/)
  monto!: string;

  @Transform(trimToNull)
  @IsIn(METODOS_PAGO)
  metodo!: (typeof METODOS_PAGO)[number];

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(100)
  referencia?: string | null;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(500)
  nota?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  fecha_pago?: string;
}
