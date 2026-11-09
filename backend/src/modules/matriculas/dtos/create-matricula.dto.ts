import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ESTADOS_MATRICULA } from './list-matriculas.dto';

function trimToNull({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export class CreateMatriculaDto {
  @IsString()
  @Matches(/^[1-9]\d*$/)
  estudiante_id!: string;

  @IsString()
  @Matches(/^[1-9]\d*$/)
  curso_id!: string;

  @IsDateString({ strict: true })
  fecha_matricula!: string;

  @Transform(trimToNull)
  @IsIn(ESTADOS_MATRICULA)
  estado!: (typeof ESTADOS_MATRICULA)[number];

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  observaciones?: string | null;
}
