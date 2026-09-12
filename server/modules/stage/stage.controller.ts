import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Can, NeedLogin } from '@server/common/auth/auth.decorators';
import { StageService, type CreateStageDto, type UpdateStageDto } from './stage.service';

@Controller('api/stages')
export class StageController {
  private readonly logger = new Logger(StageController.name);

  constructor(private readonly stageService: StageService) {}

  /** 获取全部阶段列表 */
  @Can('manage', 'Newcomer')
  @Get()
  async list() {
    return this.stageService.list();
  }

  /** 获取阶段下拉选项 */
  @Can('manage', 'Newcomer')
  @Get('options')
  async getOptions() {
    return this.stageService.getOptions();
  }

  /** 新增阶段 */
  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Post()
  async create(@Body() body: CreateStageDto) {
    return this.stageService.create(body);
  }

  /** 更新阶段 */
  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateStageDto) {
    await this.stageService.update(id, body);
  }

  /** 删除阶段 */
  @Can('manage', 'Newcomer')
  @NeedLogin()
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.stageService.delete(id);
  }
}
