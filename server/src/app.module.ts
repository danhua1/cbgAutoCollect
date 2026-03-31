import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AutomationModule } from './automation/automation.module';
import { LogsModule } from './logs/logs.module';
import { CommonModule } from './common/common.module';
import { LoggerModule } from './common/logger.module';

@Module({
  imports: [CommonModule, LoggerModule, AccountsModule, AutomationModule, LogsModule],
})
export class AppModule {}
