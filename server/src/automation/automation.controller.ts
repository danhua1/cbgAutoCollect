import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AutomationService } from './automation.service';
import { RunFavoriteDto } from './dto-run-favorite.dto';

@ApiTags('automation')
@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @ApiOperation({ summary: '执行收藏任务' })
  @Post('favorite')
  runFavorite(@Body() dto: RunFavoriteDto) {
    return this.automationService.runFavorite(dto);
  }
}
