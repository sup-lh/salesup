import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Can, NeedLogin } from '@server/common/auth/auth.decorators';
import { NewcomerApplicationService } from './newcomer-application.service';
import type {
  CreateNewcomerApplicationRequest,
  ReviewNewcomerApplicationRequest,
} from '@shared/api.interface';

@Controller('api/newcomer-applications')
export class NewcomerApplicationController {
  constructor(
    private readonly applicationService: NewcomerApplicationService,
  ) {}

  @NeedLogin()
  @Get('mine')
  async getMyApplication(@Req() req: Request) {
    const userId: string = req.userContext?.userId ?? '';
    const item = await this.applicationService.getMyApplication(userId);
    return { item };
  }

  @Can('manage', 'Newcomer')
  @Get()
  async listApplications() {
    return this.applicationService.listApplications();
  }

  @Can('create', 'NewcomerSelf')
  @NeedLogin()
  @Post()
  async submitApplication(
    @Req() req: Request,
    @Body() dto: CreateNewcomerApplicationRequest,
  ) {
    const userId: string = req.userContext?.userId ?? '';
    return this.applicationService.submitApplication(dto, userId);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Patch(':id/approve')
  async approveApplication(@Req() req: Request, @Param('id') id: string) {
    const operatorId: string = req.userContext?.userId ?? '';
    return this.applicationService.approveApplication(id, operatorId);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Patch(':id/reject')
  async rejectApplication(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ReviewNewcomerApplicationRequest,
  ) {
    const operatorId: string = req.userContext?.userId ?? '';
    return this.applicationService.rejectApplication(id, dto, operatorId);
  }
}
