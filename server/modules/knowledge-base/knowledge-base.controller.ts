import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Can, NeedLogin } from '@server/common/auth/auth.decorators';
import { KnowledgeBaseService } from './knowledge-base.service';
import type { CreateKbItemRequest } from '@shared/api.interface';

@Controller('api')
export class KnowledgeBaseController {
  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Can('read', 'KnowledgeBase')
  @Get('kb-items')
  async listItems() {
    return this.knowledgeBaseService.listItems();
  }

  @Can('manage', 'KnowledgeBase')
  @NeedLogin()
  @Post('kb-items')
  async createItem(@Body() body: CreateKbItemRequest) {
    return this.knowledgeBaseService.createItem(body);
  }

  @Can('manage', 'KnowledgeBase')
  @NeedLogin()
  @Delete('kb-items/:itemId')
  async deleteItem(@Param('itemId') itemId: string) {
    await this.knowledgeBaseService.deleteItem(itemId);
  }
}
