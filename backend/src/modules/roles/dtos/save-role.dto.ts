import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class SaveRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^(?=.*[\p{L}\p{N}])[\p{L}\p{N}_. -]+$/u)
  name!: string;

  @IsArray()
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[1-9]\d*$/, { each: true })
  permissionIds!: string[];
}
