import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Can, NeedLogin } from '@server/common/auth/auth.decorators';
import { NewcomerService } from './newcomer.service';
import type { CreateAssessmentRequest } from '@shared/api.interface';

@Controller('api/assessment-records')
export class AssessmentRecordController {
  constructor(private readonly newcomerService: NewcomerService) {}

  @Can('manage', 'Assessment')
  @NeedLogin()
  @Post()
  async createAssessment(@Req() req: Request, @Body() dto: CreateAssessmentRequest) {
    const userId: string = req.userContext?.userId ?? '';
    return this.newcomerService.createAssessment(dto, userId);
  }
}
