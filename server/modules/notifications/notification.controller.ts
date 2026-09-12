import { Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';

import { NeedLogin } from '@server/common/auth/auth.decorators';
import type { IndependentRequest } from '@server/common/auth/auth.types';
import { NotificationService } from './notification.service';

@Controller('api/notifications')
@NeedLogin()
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  list(@Req() request: IndependentRequest, @Query('unread') unread?: string) {
    return this.notifications.listForUser(request.independentUserContext!.userId, unread === 'true');
  }

  @Patch(':id/read')
  markRead(@Req() request: IndependentRequest, @Param('id') id: string) {
    return this.notifications.markRead(request.independentUserContext!.userId, id);
  }

  @Post('read-all')
  markAllRead(@Req() request: IndependentRequest) {
    return this.notifications.markAllRead(request.independentUserContext!.userId);
  }
}
