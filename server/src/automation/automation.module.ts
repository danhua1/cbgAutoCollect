import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { CommonModule } from '../common/common.module';
import { LogsModule } from '../logs/logs.module';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { CollectService } from './collect.service';

@Module({
  imports: [CommonModule, AccountsModule, LogsModule],
  controllers: [AutomationController],
  providers: [AutomationService, CollectService],
})
export class AutomationModule {}
