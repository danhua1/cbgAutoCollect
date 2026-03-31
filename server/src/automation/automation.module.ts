import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { LogsModule } from '../logs/logs.module';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { CollectService } from './collect.service';

@Module({
  imports: [AccountsModule, LogsModule],
  controllers: [AutomationController],
  providers: [AutomationService, CollectService],
})
export class AutomationModule {}
