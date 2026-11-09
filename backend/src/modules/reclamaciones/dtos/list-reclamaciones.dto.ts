import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

function trimToUndefined({ value }: { value: unknown }): unknown {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export class ListReclamacionesDto {
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
