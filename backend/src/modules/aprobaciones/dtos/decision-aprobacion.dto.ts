import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class DecisionAprobacionDto {
  @IsIn(['aprobada', 'rechazada'])
  estado!: 'aprobada' | 'rechazada';

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsString()
  @MaxLength(2000)
  comentario?: string | null;
}
