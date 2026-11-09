import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { LargePageQueryDto } from '../../../common/pagination/page-query';

function trimToUndefined({ value }: { value: unknown }): unknown {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export const RECLAMACIONES_SORT_FIELDS = [
  'fecha_limite',
  'recibida_at',
  'estado',
] as const;

export class ListReclamacionesDto extends LargePageQueryDto {
  @IsOptional()
  @IsIn(RECLAMACIONES_SORT_FIELDS)
  sort?: (typeof RECLAMACIONES_SORT_FIELDS)[number];

  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @Transform(trimToUndefined)
  @IsString()
  @MaxLength(255)
  estado?: string;
}
