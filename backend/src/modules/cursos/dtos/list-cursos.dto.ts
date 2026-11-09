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

export const CATEGORIAS_CURSO = [
  'tecnologia',
  'educacion',
  'salud',
  'gestion',
  'otros',
] as const;

export const ESTADOS_CURSO = ['activo', 'inactivo', 'archivado'] as const;

export const CURSOS_SORT_FIELDS = [
  'nombre',
  'codigo',
  'precio',
  'created_at',
] as const;

export class ListCursosDto extends OrderQueryDto {
  @IsOptional()
  @IsIn(CURSOS_SORT_FIELDS)
  sort?: (typeof CURSOS_SORT_FIELDS)[number];

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
  @IsIn(CATEGORIAS_CURSO)
  categoria?: (typeof CATEGORIAS_CURSO)[number];

  @IsOptional()
  @IsIn(ESTADOS_CURSO)
  estado?: (typeof ESTADOS_CURSO)[number];

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined || value === null
      ? undefined
      : value === true || value === 'true' || value === '1',
  )
  @IsBoolean()
  eliminados?: boolean;
}
