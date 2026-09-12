import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Can, NeedLogin } from '@server/common/auth/auth.decorators';
import type { Request } from 'express';
import { CoachingReviewService } from './coaching-review.service';
import type {
  CreateCoachingRequest,
  CreateCoachingSelfRequest,
  CreateReviewRequest,
} from '@shared/api.interface';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parseOffset(value?: string): number {
  const parsed = Number.parseInt(value ?? '0', 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function parsePageSize(value?: string): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
}

@Controller('api')
export class CoachingReviewController {
  constructor(private readonly coachingReviewService: CoachingReviewService) {}

  @Can('manage', 'Coaching')
  @Get('coaching-records')
  async listCoachingRecords(
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('offset') offset?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.coachingReviewService.listCoachingRecords({
      type,
      startDate,
      endDate,
      offset: parseOffset(offset),
      pageSize: parsePageSize(pageSize),
    });
  }

  @Can('manage', 'Coaching')
  @NeedLogin()
  @Post('coaching-records')
  async createCoachingRecord(
    @Req() req: Request,
    @Body() body: CreateCoachingRequest,
  ) {
    return this.coachingReviewService.createCoachingRecord(
      body,
      req.userContext.userId,
    );
  }

  @Can('create', 'CoachingSelf')
  @NeedLogin()
  @Post('coaching-records/self')
  async createCoachingSelfRecord(
    @Req() req: Request,
    @Body() body: CreateCoachingSelfRequest,
  ) {
    return this.coachingReviewService.createCoachingSelfRecord(
      body,
      req.userContext.userId,
    );
  }

  @Can('manage', 'Coaching')
  @Get('review-records')
  async listReviewRecords(
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('offset') offset?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.coachingReviewService.listReviewRecords({
      type,
      startDate,
      endDate,
      offset: parseOffset(offset),
      pageSize: parsePageSize(pageSize),
    });
  }

  @Can('manage', 'Coaching')
  @NeedLogin()
  @Post('review-records')
  async createReviewRecord(
    @Req() req: Request,
    @Body() body: CreateReviewRequest,
  ) {
    return this.coachingReviewService.createReviewRecord(
      body,
      req.userContext.userId,
    );
  }
}
