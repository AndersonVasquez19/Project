import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateServicioDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(40)
  codigo!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(120)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  categoria?: string | null;
}
