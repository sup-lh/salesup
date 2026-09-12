import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { AuthModule } from '@server/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PermissionController],
})
export class PermissionModule {}
