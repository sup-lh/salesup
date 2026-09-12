import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Can, NeedLogin } from '@server/common/auth/auth.decorators';
import type { Request } from 'express';
import { OpportunityService } from './opportunity.service';
import type { CreateOpportunitySelfRequest } from '@shared/api.interface';

@Controller('api')
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  @Can('create', 'NewcomerSelf')
  @NeedLogin()
  @Get('opportunities/self')
  async getOpportunitySelfSummary(@Req() req: Request) {
    return this.opportunityService.getOpportunitySelfSummary(
      req.userContext.userId,
    );
  }

  @Can('create', 'NewcomerSelf')
  @NeedLogin()
  @Post('opportunities/self')
  async createOpportunitySelf(
    @Req() req: Request,
    @Body() body: CreateOpportunitySelfRequest,
  ) {
    return this.opportunityService.createOpportunitySelf(
      body,
      req.userContext.userId,
    );
  }
}
