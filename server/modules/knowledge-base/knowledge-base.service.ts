import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/database.module';
import { Inject } from '@nestjs/common';
import { kbItem } from '@server/database/schema';
import { KB_SOURCE_TYPES, type CreateKbItemRequest, type KbItem, type KbItemListResponse } from '@shared/api.interface';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async listItems(): Promise<KbItemListResponse> {
    const rows = await this.db
      .select()
      .from(kbItem)
      .orderBy(asc(kbItem.category), desc(kbItem.createdAt));
    const items: KbItem[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      sourceType: row.sourceType as KbItem['sourceType'],
      url: row.url,
      description: row.description,
    }));
    return { items };
  }

  private validatePayload(dto: CreateKbItemRequest): {
    title: string;
    category: string;
    sourceType: string;
    url: string;
    description: string | null;
  } {
    const title = dto.title?.trim() ?? '';
    const category = dto.category?.trim() ?? '';
    const url = dto.url?.trim() ?? '';
    const description = dto.description?.trim() ?? '';

    if (!title) throw new BadRequestException('标题不能为空');
    if (!category) throw new BadRequestException('分类不能为空');
    if (!url) throw new BadRequestException('链接不能为空');
    if (!/^https?:\/\/.+/u.test(url)) {
      throw new BadRequestException('链接需以 http(s):// 开头');
    }
    if (!KB_SOURCE_TYPES.includes(dto.sourceType)) {
      throw new BadRequestException('内容类型不合法');
    }
    return {
      title,
      category,
      sourceType: dto.sourceType,
      url,
      description: description || null,
    };
  }

  async createItem(dto: CreateKbItemRequest): Promise<{ id: string }> {
    const payload = this.validatePayload(dto);
    const [created] = await this.db
      .insert(kbItem)
      .values(payload)
      .returning({ id: kbItem.id });
    return { id: created.id };
  }

  async deleteItem(itemId: string): Promise<void> {
    const deleted = await this.db
      .delete(kbItem)
      .where(eq(kbItem.id, itemId))
      .returning({ id: kbItem.id });
    if (deleted.length === 0) throw new NotFoundException('知识库条目不存在');
  }
}
