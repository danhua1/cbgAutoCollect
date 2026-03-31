import { Injectable } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service';
import { LogsService } from '../logs/logs.service';
import { CollectService } from './collect.service';
import { RunFavoriteDto } from './dto-run-favorite.dto';

@Injectable()
export class AutomationService {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly logsService: LogsService,
    private readonly collectService: CollectService,
  ) {}

  async runFavorite(dto: RunFavoriteDto) {
    const accounts = await this.accountsService.findByIds(dto.accountIds);

    if (!accounts.length) {
      throw new Error('No accounts available to run the favorite task.');
    }

    const results = [];

    for (const account of accounts) {
      const credentials = this.accountsService.decryptCredentials(account);

      try {
        const result = await this.collectService.favoriteItem(
          {
            id: account.id,
            name: account.name,
            ...credentials,
          },
          dto.url,
          {
            headless: dto.headless,
          },
        );

        results.push(result);
        await this.logsService.record({
          action: 'favorite_run',
          success: true,
          accountId: account.id,
          targetUrl: dto.url,
          message: `${account.name} collection completed`,
          detail: result,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const result = {
          accountId: account.id,
          accountName: account.name,
          status: 'failed',
          error: message,
        };

        results.push(result);
        await this.logsService.record({
          action: 'favorite_run',
          success: false,
          accountId: account.id,
          targetUrl: dto.url,
          message,
          detail: result,
        });
      }
    }

    return {
      ok: results.every((item) => item.status !== 'failed'),
      url: dto.url,
      results,
    };
  }
}
