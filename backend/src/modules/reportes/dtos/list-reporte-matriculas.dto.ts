import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ESTADOS_MATRICULA } from '../../matriculas/dtos/list-matriculas.dto';

function trimToUndefined({ value }: { value: unknown }): unknown {
  return typeof value === 'string' && value.trim() === ''
    ? undefined
    : typeof value === 'string'
      ? value.trim()
      : value;
}

export class ListReporteMatriculasDto {
  @IsOptional()
  @Transform(trimToUndefined)
  @IsDateString({ strict: true })
  desde?: string;

  @IsOptional()
  @Transform(trimToUndefined)
  @IsDateString({ strict: true })
  hasta?: string;

  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @Matches(/^[1-9]\d*$/)
  curso_id?: string;

  @IsOptional()
  @Transform(trimToUndefined)
  @IsIn(ESTADOS_MATRICULA)
  estado?: (typeof ESTADOS_MATRICULA)[number];
}
