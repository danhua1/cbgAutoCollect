import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { CommonModule } from '../common/common.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [CommonModule, LogsModule],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
