import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { OrderQueryDto } from '../../../common/pagination/pagination';

export const ESTADOS_MATRICULA = ['pendiente', 'pagada', 'anulada'] as const;

function parseBoolean({ value }: { value: unknown }): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true || value === 'true' || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === '0') {
    return false;
  }
  return value;
}

export const MATRICULAS_SORT_FIELDS = [
  'fecha_matricula',
  'estado',
  'created_at',
] as const;

export class ListMatriculasDto extends OrderQueryDto {
  @IsOptional()
  @IsIn(MATRICULAS_SORT_FIELDS)
  sort?: (typeof MATRICULAS_SORT_FIELDS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsIn(ESTADOS_MATRICULA)
  estado?: (typeof ESTADOS_MATRICULA)[number];

  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d*$/)
  curso_id?: string;

  @IsOptional()
  @Transform(parseBoolean)
  @IsBoolean()
  eliminados?: boolean;
}
