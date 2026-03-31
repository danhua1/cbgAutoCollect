import { Body, Controller, Post } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { RunFavoriteDto } from './dto-run-favorite.dto';

@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('favorite')
  runFavorite(@Body() dto: RunFavoriteDto) {
    return this.automationService.runFavorite(dto);
  }
}
