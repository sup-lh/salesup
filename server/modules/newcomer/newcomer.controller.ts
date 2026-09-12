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
import type { Request } from 'express';
import { Can, NeedLogin } from '@server/common/auth/auth.decorators';
import { NewcomerService } from './newcomer.service';
import type {
  CreateNewcomerByUserRequest,
  CreateNewcomerRequest,
  UpdateNewcomerRequest,
} from '@shared/api.interface';

@Controller('api/newcomers')
export class NewcomerController {
  constructor(private readonly newcomerService: NewcomerService) {}

  @Can('manage', 'Newcomer')
  @Get()
  async listNewcomers(
    @Query('keyword') keyword?: string,
    @Query('stage') stage?: string,
    @Query('assessmentStatus') assessmentStatus?: string,
    @Query('offset') offset?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedOffset = offset ? Number(offset) : 0;
    const parsedPageSize = pageSize ? Number(pageSize) : 20;
    return this.newcomerService.listNewcomers(
      keyword,
      stage,
      assessmentStatus,
      Number.isFinite(parsedOffset) ? parsedOffset : 0,
      Number.isFinite(parsedPageSize) ? parsedPageSize : 20,
    );
  }

  @Can('manage', 'Newcomer')
  @Get(':id')
  async getNewcomerDetail(@Param('id') id: string) {
    return this.newcomerService.getNewcomerDetail(id);
  }

  @Can('create', 'NewcomerSelf')
  @NeedLogin()
  @Post()
  async createNewcomer(@Req() req: Request, @Body() dto: CreateNewcomerRequest) {
    const userId: string = req.userContext?.userId ?? '';
    return this.newcomerService.createNewcomer(dto, userId);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Post('admin')
  async createNewcomerForUser(
    @Req() req: Request,
    @Body() dto: CreateNewcomerByUserRequest,
  ) {
    const operatorId: string = req.userContext?.userId ?? '';
    return this.newcomerService.createNewcomerForUser(dto, operatorId);
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Patch(':id')
  async updateNewcomer(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateNewcomerRequest,
  ) {
    const userId: string = req.userContext?.userId ?? '';
    return this.newcomerService.updateNewcomer(id, dto, userId);
  }

  @Can('manage', 'Newcomer')
  @Get('defense-admin/overview')
  async getDefenseOverview() {
    return this.newcomerService.getDefenseOverview();
  }

  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Delete(':id')
  async deleteNewcomer(@Param('id') id: string) {
    await this.newcomerService.deleteNewcomer(id);
  }
}
