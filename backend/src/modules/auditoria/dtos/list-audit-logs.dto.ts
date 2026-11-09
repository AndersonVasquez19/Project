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

export const AUDITLOGS_SORT_FIELDS = ['created_at', 'action'] as const;

export class ListAuditLogsDto extends OrderQueryDto {
  @IsOptional()
  @IsIn(AUDITLOGS_SORT_FIELDS)
  sort?: (typeof AUDITLOGS_SORT_FIELDS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
