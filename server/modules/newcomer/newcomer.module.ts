import { Module } from '@nestjs/common';
// 新人管理模块：档案 CRUD + 节点考核留档 + 入职申请审批（已由 app.module.ts 注册）
import { NewcomerController } from './newcomer.controller';
import { AssessmentRecordController } from './assessment-record.controller';
import { NewcomerApplicationController } from './newcomer-application.controller';
import { DefenseController } from './defense.controller';
import { NewcomerService } from './newcomer.service';
import { NewcomerApplicationService } from './newcomer-application.service';
import { DefenseService } from './defense.service';

@Module({
  controllers: [
    NewcomerController,
    AssessmentRecordController,
    NewcomerApplicationController,
    DefenseController,
  ],
  providers: [NewcomerService, NewcomerApplicationService, DefenseService],
})
export class NewcomerModule {}
