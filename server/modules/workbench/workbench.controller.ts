import { Controller, Get, Param, Req } from '@nestjs/common';
import { Can } from '@server/common/auth/auth.decorators';
import type { Request } from 'express';
import { WorkbenchService } from './workbench.service';

@Controller('api/workbench')
export class WorkbenchController {
  constructor(private readonly workbenchService: WorkbenchService) {}

  @Can('read', 'Workbench')
  @Get()
  async getWorkbench(@Req() req: Request) {
    return this.workbenchService.getWorkbench(req.userContext?.userId ?? '');
  }

  @Can('manage', 'Newcomer')
  @Get('admin/:newcomerId')
  async getWorkbenchByNewcomerId(
    @Req() req: Request,
    @Param('newcomerId') newcomerId: string,
  ) {
    return this.workbenchService.getWorkbench(
      req.userContext?.userId ?? '',
      newcomerId,
    );
  }
}
