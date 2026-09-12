import { Module } from '@nestjs/common';
import { RoleManagerController } from './role-manager.controller';
import { IndependentRoleService } from './independent-role.service';
import { AuthModule } from '@server/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RoleManagerController],
  providers: [IndependentRoleService],
  exports: [IndependentRoleService],
})
export class RoleManagerModule {}
