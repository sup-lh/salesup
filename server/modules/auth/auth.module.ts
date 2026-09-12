import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuthMiddleware } from '@server/common/auth/auth.middleware';
import { CanGuard, NeedLoginGuard } from '@server/common/auth/auth.guards';
import { DatabaseModule } from '@server/database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PermissionService } from './permission.service';
import { UserDirectoryService } from './user-directory.service';
import { UserDirectoryController } from './user-directory.controller';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController, AdminUserController, UserDirectoryController, AuditController],
  providers: [
    AuthService,
    PermissionService,
    UserDirectoryService,
    AdminUserService,
    AuditService,
    NeedLoginGuard,
    CanGuard,
    { provide: APP_GUARD, useExisting: NeedLoginGuard },
    { provide: APP_GUARD, useExisting: CanGuard },
  ],
  exports: [AuthService, PermissionService, UserDirectoryService, AdminUserService, AuditService, NeedLoginGuard, CanGuard],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
