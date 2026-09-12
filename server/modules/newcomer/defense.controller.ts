import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { DefenseService } from './defense.service';
import type { DefensePrerequisiteStatus } from '@shared/newcomer';
import { NeedLogin, Can } from '@server/common/auth/auth.decorators';

@Controller('api/defense')
export class DefenseController {
  constructor(private readonly defenseService: DefenseService) {}

  /** 检查转正面试前置条件 */
  @NeedLogin()
  @Get('eligibility/:newcomerId')
  async checkEligibility(
    @Param('newcomerId') newcomerId: string,
  ): Promise<DefensePrerequisiteStatus> {
    return this.defenseService.checkEligibility(newcomerId);
  }

  /** 提交转正面试申请 */
  @NeedLogin()
  @Post('apply')
  async applyForDefense(
    @Body('newcomerId') newcomerId: string,
    @Req() req: Request,
  ): Promise<{ id: string }> {
    const basePath: string = process.env.CLIENT_BASE_PATH ?? '';
    const host: string = (req as any).headers?.host ?? 'localhost';
    const applicationUrl: string = `https://${host}${basePath}/defense-admin`;
    return this.defenseService.applyForDefense(newcomerId, applicationUrl);
  }

  /** 获取转正面试申请列表（管理侧） */
  @Can('manage', 'Newcomer')
  @Get('admin/applications')
  async listApplications() {
    return this.defenseService.listApplications();
  }

  /** 审核转正面试申请（管理侧） */
  @Can('manage', 'Newcomer')
  @Patch('admin/applications/:id')
  async reviewApplication(
    @Param('id') id: string,
    @Body('status') status: 'scheduled' | 'approved' | 'rejected',
    @Body('comment') comment?: string,
  ): Promise<void> {
    return this.defenseService.reviewApplication(id, status, comment);
  }
}
