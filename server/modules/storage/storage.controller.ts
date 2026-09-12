import { Controller, Delete, Get, Param, Post, Query, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';

import { Can } from '@server/common/auth/auth.decorators';
import { StorageService } from './storage.service';

@Controller('api/storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @Can('manage', 'KnowledgeBase')
  async upload(@UploadedFile() file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    if (!file) throw new BadRequestException('请选择文件');
    const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    return this.storage.upload({ key, contentType: file.mimetype, size: file.size }, file.buffer);
  }

  @Delete(':key(*)')
  @Can('manage', 'KnowledgeBase')
  delete(@Param('key') key: string) {
    return this.storage.delete(key);
  }

  @Get('download/:key(*)')
  async download(@Param('key') key: string, @Query('expires') expires?: string) {
    return { url: await this.storage.getDownloadUrl(key, Math.min(Number(expires) || 3600, 86400)) };
  }
}
