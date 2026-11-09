import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { OrderQueryDto } from '../../../common/pagination/pagination';

export const ESTADOS_ESTUDIANTE = ['activo', 'inactivo'] as const;

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

export const ESTUDIANTES_SORT_FIELDS = [
  'apellidos',
  'nombres',
  'dni',
  'created_at',
] as const;

export class ListEstudiantesDto extends OrderQueryDto {
  @IsOptional()
  @IsIn(ESTUDIANTES_SORT_FIELDS)
  sort?: (typeof ESTUDIANTES_SORT_FIELDS)[number];

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
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(ESTADOS_ESTUDIANTE)
  estado?: (typeof ESTADOS_ESTUDIANTE)[number];

  @IsOptional()
  @Transform(parseBoolean)
  @IsBoolean()
  eliminados?: boolean;
}
