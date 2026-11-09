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

export const USUARIOS_SORT_FIELDS = ['name', 'email'] as const;

export class ListUsuariosDto extends OrderQueryDto {
  @IsOptional()
  @IsIn(USUARIOS_SORT_FIELDS)
  sort?: (typeof USUARIOS_SORT_FIELDS)[number];

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
