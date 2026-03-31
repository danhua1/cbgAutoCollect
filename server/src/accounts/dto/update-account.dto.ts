import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAccountDto } from './create-account.dto';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @ApiPropertyOptional({ description: '账号名称' })
  declare name?: string;

  @ApiPropertyOptional({ description: '加密后的登录账号或原始账号' })
  declare username?: string;

  @ApiPropertyOptional({ description: '加密后的登录密码或原始密码' })
  declare password?: string;

  @ApiPropertyOptional({ description: '备注' })
  declare remark?: string;

  @ApiPropertyOptional({ description: '是否设为默认账号' })
  declare isDefault?: boolean;
}
