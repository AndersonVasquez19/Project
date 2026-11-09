import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { ESTADOS_ESTUDIANTE } from './list-estudiantes.dto';

function trimStringOrNull({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

@ValidatorConstraint({ name: 'notFutureDate', async: false })
class NotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return true;
    }

    const datePart = value.slice(0, 10);
    const parsed = new Date(`${datePart}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      return false;
    }

    const now = new Date();
    const today = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    return parsed.getTime() <= today;
  }

  defaultMessage(): string {
    return 'La fecha de nacimiento no puede ser futura.';
  }
}

export class CreateEstudianteDto {
  @Transform(trimStringOrNull)
  @IsString()
  @Matches(/^\d{8}$/)
  dni!: string;

  @Transform(trimStringOrNull)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres!: string;

  @Transform(trimStringOrNull)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellidos!: string;

  @IsOptional()
  @Transform(trimStringOrNull)
  @IsEmail()
  @MaxLength(150)
  email?: string | null;

  @IsOptional()
  @Transform(trimStringOrNull)
  @IsString()
  @MaxLength(20)
  telefono?: string | null;

  @IsOptional()
  @Transform(trimStringOrNull)
  @IsDateString({ strict: true })
  @Validate(NotFutureDateConstraint)
  fecha_nacimiento?: string | null;

  @IsOptional()
  @Transform(trimStringOrNull)
  @IsString()
  @MaxLength(255)
  direccion?: string | null;

  @Transform(trimStringOrNull)
  @IsIn(ESTADOS_ESTUDIANTE)
  estado!: (typeof ESTADOS_ESTUDIANTE)[number];
}
