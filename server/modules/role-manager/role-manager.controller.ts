import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { Can } from '@server/common/auth/auth.decorators';
import type { IndependentRequest } from '@server/common/auth/auth.types';
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  AddMembersRequest,
  RemoveMembersRequest,
  SearchMembersRequest,
} from '@shared/api.interface';
import { IndependentRoleService } from './independent-role.service';

interface ListMembersQuery {
  page?: number;
  pageSize?: number;
}

@Controller('api/role_manager')
export class RoleManagerController {
  constructor(private readonly roles: IndependentRoleService) {}

  @Can('manage', 'Permission')
  @Get('roles')
  listRoles() {
    return this.roles.list();
  }

  @Can('manage', 'Permission')
  @Get('roles/:bizID')
  getRole(@Param('bizID') bizID: string) {
    return this.roles.get(bizID);
  }

  @Can('manage', 'Permission')
  @Post('roles')
  createRole(@Req() request: IndependentRequest, @Body() dto: CreateRoleRequest) {
    return this.roles.create(dto, request.independentUserContext!.userId);
  }

  @Can('manage', 'Permission')
  @Put('roles/:bizID')
  updateRole(@Req() request: IndependentRequest, @Param('bizID') bizID: string, @Body() dto: UpdateRoleRequest) {
    return this.roles.update(bizID, dto, request.independentUserContext!.userId);
  }

  @Can('manage', 'Permission')
  @Delete('roles/:bizID')
  deleteRole(@Req() request: IndependentRequest, @Param('bizID') bizID: string) {
    return this.roles.delete(bizID, request.independentUserContext!.userId);
  }

  @Can('manage', 'Permission')
  @Get('roles/:bizID/members')
  listMembers(@Param('bizID') bizID: string, @Query() query: ListMembersQuery) {
    return this.roles.listMembers(bizID, query.page, query.pageSize);
  }

  @Can('manage', 'Permission')
  @Post('roles/:bizID/members')
  addMembers(@Req() request: IndependentRequest, @Param('bizID') bizID: string, @Body() dto: AddMembersRequest) {
    return this.roles.addMembers(bizID, dto, request.independentUserContext!.userId);
  }

  @Can('manage', 'Permission')
  @Post('roles/:bizID/members/batch_remove')
  removeMembers(@Req() request: IndependentRequest, @Param('bizID') bizID: string, @Body() dto: RemoveMembersRequest) {
    return this.roles.removeMembers(bizID, dto, request.independentUserContext!.userId);
  }

  @Can('manage', 'Permission')
  @Delete('roles/:bizID/members')
  clearMembers(@Req() request: IndependentRequest, @Param('bizID') bizID: string) {
    return this.roles.clearMembers(bizID, request.independentUserContext!.userId);
  }

  @Can('manage', 'Permission')
  @Post('search')
  search(@Body() dto: SearchMembersRequest) {
    return this.roles.search(dto.query, dto.page, dto.pageSize);
  }
}
