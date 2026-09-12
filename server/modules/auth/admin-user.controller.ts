import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { Can } from '@server/common/auth/auth.decorators';
import type { IndependentRequest } from '@server/common/auth/auth.types';
import { AdminUserService } from './admin-user.service';

@Controller('api/admin/users')
@Can('manage', 'Permission')
export class AdminUserController {
  constructor(private readonly users: AdminUserService) {}
  @Get() list(@Query('q') query?: string) { return this.users.list(query); }
  @Post() create(@Req() request: IndependentRequest, @Body() body: { username: string; displayName: string; password: string; email?: string; roleKeys?: string[] }) { return this.users.create(body, request.independentUserContext!.userId); }
  @Patch(':id') update(@Req() request: IndependentRequest, @Param('id') id: string, @Body() body: { displayName?: string; email?: string; status?: 'active' | 'disabled' }) { return this.users.update(id, body, request.independentUserContext!.userId); }
  @Post(':id/reset-password') resetPassword(@Req() request: IndependentRequest, @Param('id') id: string, @Body() body: { password: string }) { return this.users.resetPassword(id, body.password, request.independentUserContext!.userId); }
  @Post(':id/roles') assignRoles(@Req() request: IndependentRequest, @Param('id') id: string, @Body() body: { roleKeys: string[] }) { return this.users.assignRoles(id, body.roleKeys, request.independentUserContext!.userId); }
}
