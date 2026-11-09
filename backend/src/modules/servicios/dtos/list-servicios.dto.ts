import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { OrderQueryDto } from '../../../common/pagination/pagination';

export const SERVICIOS_SORT_FIELDS = [
  'nombre',
  'codigo',
  'categoria',
  'estado',
  'created_at',
] as const;

export class ListServiciosDto extends OrderQueryDto {
  @IsOptional()
  @IsIn(SERVICIOS_SORT_FIELDS)
  sort?: (typeof SERVICIOS_SORT_FIELDS)[number];

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
}
