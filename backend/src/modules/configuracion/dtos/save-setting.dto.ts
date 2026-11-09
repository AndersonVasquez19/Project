import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength } from 'class-validator';

export const CONFIGURATION_KEYS = [
  'system.name',
  'system.timezone',
  'system.currency',
  'reports.company_name',
  'reports.footer',
] as const;

export class SaveSettingDto {
  @IsIn(CONFIGURATION_KEYS)
  key!: (typeof CONFIGURATION_KEYS)[number];

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(255)
  value!: string;
}
