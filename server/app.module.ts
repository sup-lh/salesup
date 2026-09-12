import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { PermissionModule } from './modules/permission/permission.module';
import { RoleManagerModule } from './modules/role-manager/role-manager.module';
import { WorkbenchModule } from './modules/workbench/workbench.module';
import { ChallengeModule } from './modules/challenge/challenge.module';
import { CourseModule } from './modules/course/course.module';
import { CoachingReviewModule } from './modules/coaching-review/coaching-review.module';
import { NewcomerModule } from './modules/newcomer/newcomer.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { OpportunityModule } from './modules/opportunity/opportunity.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { StageModule } from './modules/stage/stage.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { StorageModule } from './modules/storage/storage.module';
import { HealthModule } from './modules/health/health.module';
import { validateEnvironment } from './config/environment';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    DatabaseModule,
    AuthModule,
    NotificationModule,
    StorageModule,
    HealthModule,
    // ====== @route-section: business-modules START ======
    // Place all business modules here.Do NOT add fallback modules here.
    WorkbenchModule,
    ChallengeModule,
    CourseModule,
    CoachingReviewModule,
    NewcomerModule,
    DashboardModule,
    OpportunityModule,
    KnowledgeBaseModule,
    StageModule,
    PermissionModule,
    RoleManagerModule,
    // ====== @route-section: business-modules END ======
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
