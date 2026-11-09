import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateUsuarioDto {
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value)
      ? value.map((role: unknown) =>
          typeof role === 'string' ? role.trim() : role,
        )
      : value,
  )
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  roles!: string[];
}
