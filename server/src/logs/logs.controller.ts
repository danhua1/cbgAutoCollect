import { Controller, Get, Query } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  findAll(@Query('limit') limit?: string) {
    return this.logsService.findAll(limit ? Number(limit) : 100);
  }
}
