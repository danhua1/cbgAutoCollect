import { ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RunFavoriteDto {
  @ApiProperty({ description: '需要收藏的商品 URL' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ description: '执行账号 ID 列表', type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  accountIds?: number[];

  @ApiPropertyOptional({ description: '是否启用无头模式', example: false })
  @IsOptional()
  @IsBoolean()
  headless?: boolean;
}
