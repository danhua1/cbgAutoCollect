import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ description: '账号名称', example: '账号A' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: '加密后的登录账号或原始账号', example: 'U2FsdGVkX1...' })
  @IsString()
  username!: string;

  @ApiProperty({ description: '加密后的登录密码或原始密码', example: 'U2FsdGVkX1...' })
  @IsString()
  password!: string;

  @ApiPropertyOptional({ description: '备注', example: '主力收藏账号' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;

  @ApiPropertyOptional({ description: '是否设为默认账号', example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
