import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CATEGORIAS_CURSO, ESTADOS_CURSO } from './list-cursos.dto';

export const MODALIDADES_CURSO = ['presencial', 'virtual', 'hibrido'] as const;

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function parseNumber({ value }: { value: unknown }): unknown {
  return typeof value === 'string' && value.trim() !== ''
    ? Number(value)
    : value;
}

export class CreateCursoDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @Transform(trimString)
  @IsIn(CATEGORIAS_CURSO)
  categoria!: (typeof CATEGORIAS_CURSO)[number];

  @Transform(parseNumber)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  duracion_horas!: number;

  @Transform(parseNumber)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(99999999.99)
  precio!: number;

  @Transform(trimString)
  @IsIn(MODALIDADES_CURSO)
  modalidad!: (typeof MODALIDADES_CURSO)[number];

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  horario!: string;

  @Transform(parseNumber)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  cupos_maximos!: number;

  @Transform(trimString)
  @IsIn(ESTADOS_CURSO)
  estado!: (typeof ESTADOS_CURSO)[number];
}
