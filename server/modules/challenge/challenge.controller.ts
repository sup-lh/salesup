import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Can, NeedLogin } from '@server/common/auth/auth.decorators';
import type { Request } from 'express';
import { ChallengeService } from './challenge.service';
import type {
  CreateChallengeTaskRequest,
  TaskCheckinRequest,
  UpdateChallengeTaskRequest,
} from '@shared/api.interface';

@Controller('api')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Can('read', 'Challenge')
  @Get('challenge-records')
  async getChallengeRecords(
    @Req() req: Request,
    @Query('filter') filter?: string,
  ) {
    return this.challengeService.getChallengeRecords(
      req.userContext?.userId ?? '',
      filter,
    );
  }

  @Can('manage', 'Newcomer')
  @Get('challenge-records/admin/:newcomerId')
  async getChallengeRecordsByNewcomerId(
    @Req() req: Request,
    @Param('newcomerId') newcomerId: string,
    @Query('filter') filter?: string,
  ) {
    return this.challengeService.getChallengeRecords(
      req.userContext?.userId ?? '',
      filter,
      newcomerId,
    );
  }

  @Can('manage', 'Newcomer')
  @Get('challenge-tasks')
  async getTaskTemplates() {
    return this.challengeService.getTaskTemplates();
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Post('challenge-tasks')
  async createTaskTemplate(@Body() body: CreateChallengeTaskRequest) {
    return this.challengeService.createTaskTemplate(body);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Patch('challenge-tasks/:taskId')
  async updateTaskTemplate(
    @Param('taskId') taskId: string,
    @Body() body: UpdateChallengeTaskRequest,
  ) {
    await this.challengeService.updateTaskTemplate(taskId, body);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Delete('challenge-tasks/:taskId')
  async deleteTaskTemplate(@Param('taskId') taskId: string) {
    await this.challengeService.deleteTaskTemplate(taskId);
  }

  @Can('create', 'TaskRecord')
  @NeedLogin()
  @Post('task-records')
  async checkinTask(@Req() req: Request, @Body() body: TaskCheckinRequest) {
    return this.challengeService.checkinTask(
      req.userContext.userId,
      body.recordId,
    );
  }

  @Can('create', 'TaskRecord')
  @NeedLogin()
  @Post('task-records/:recordId/cancel')
  async uncheckinTask(
    @Req() req: Request,
    @Param('recordId') recordId: string,
  ) {
    return this.challengeService.uncheckinTask(
      req.userContext.userId,
      recordId,
    );
  }
}
