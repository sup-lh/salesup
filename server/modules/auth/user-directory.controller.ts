import { Controller, Get, Query } from '@nestjs/common';
import { NeedLogin } from '@server/common/auth/auth.decorators';
import { UserDirectoryService } from './user-directory.service';

@Controller('api/directory/users')
export class UserDirectoryController {
  constructor(private readonly directory: UserDirectoryService) {}

  @NeedLogin()
  @Get()
  search(
    @Query('q') query?: string,
    @Query('ids') ids?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const userIds = ids?.split(',').map((id) => id.trim()).filter(Boolean);
    return userIds?.length
      ? this.directory.findByIds(userIds)
      : this.directory.search(query, Number(page) || 1, Number(pageSize) || 20);
  }
}
