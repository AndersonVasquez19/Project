import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { OrderQueryDto } from './pagination';

/** Listados que antes devolvían hasta 200 filas sin paginar: mantienen 200 por defecto. */
export class LargePageQueryDto extends OrderQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
