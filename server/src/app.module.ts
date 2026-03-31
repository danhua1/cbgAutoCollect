import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AutomationModule } from './automation/automation.module';
import { LogsModule } from './logs/logs.module';
import { PrismaService } from './common/prisma.service';
import { CryptoService } from './common/crypto.service';

@Module({
  imports: [AccountsModule, AutomationModule, LogsModule],
  providers: [PrismaService, CryptoService],
})
export class AppModule {}
