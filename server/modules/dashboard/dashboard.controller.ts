import { Controller, Get, Query } from '@nestjs/common';
import { Can } from '@server/common/auth/auth.decorators';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Can('read', 'Dashboard')
  @Get('statistics')
  async getStatistics(@Query('period') period?: string) {
    return this.dashboardService.getStatistics(period);
  }
}
