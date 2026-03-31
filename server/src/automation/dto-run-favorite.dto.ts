import { ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class RunFavoriteDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  accountIds?: number[];

  @IsOptional()
  @IsBoolean()
  headless?: boolean;
}
