import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LogsService } from './logs.service';

@ApiTags('logs')
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @ApiOperation({ summary: '获取操作日志列表' })
  @ApiQuery({ name: 'limit', required: false, description: '返回条数，默认 100' })
  @Get()
  findAll(@Query('limit') limit?: string) {
    return this.logsService.findAll(limit ? Number(limit) : 100);
  }
}
