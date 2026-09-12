import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/database.module';
import {
  challengeTask,
  course,
  defenseApplication,
  examResult,
  newcomer,
  stageCatalog,
  taskRecord,
} from '@server/database/schema';
import { NotificationService } from '@server/modules/notifications/notification.service';
import type {
  DefenseApplicationItem,
  DefenseApplicationStatus,
  DefensePrerequisiteStatus,
} from '@shared/newcomer';

@Injectable()
export class DefenseService {
  private readonly logger = new Logger(DefenseService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    @Optional() private readonly notificationService?: NotificationService,
  ) {}

  /** 检查当前新人转正面试前置条件 */
  async checkEligibility(newcomerId: string): Promise<DefensePrerequisiteStatus> {
    // 1. 查询所有 has_defense=true 的阶段
    const defenseStages = await this.db
      .select({ code: stageCatalog.code })
      .from(stageCatalog)
      .where(eq(stageCatalog.hasDefense, true));

    const stageCodes = defenseStages.map((s) => s.code);

    if (stageCodes.length === 0) {
      // 没有阶段参与转正考核 → 视作阶段条件已完成
      return {
        stagesCompleted: true,
        coursesPassed: await this.checkCoursesPassed(newcomerId),
        hasPendingApplication: false,
        applicationStatus: null,
      };
    }

    // 2. 查询这些阶段下的所有闯关任务
    const defenseTasks = await this.db
      .select({ id: challengeTask.id, stage: challengeTask.stage })
      .from(challengeTask)
      .where(inArray(challengeTask.stage, stageCodes));

    const taskIds = defenseTasks.map((t) => t.id);

    if (taskIds.length === 0) {
      return {
        stagesCompleted: true,
        coursesPassed: await this.checkCoursesPassed(newcomerId),
        hasPendingApplication: false,
        applicationStatus: null,
      };
    }

    // 3. 查询该新人已完成的闯关任务记录
    const completedRecords = await this.db
      .select({ taskId: taskRecord.taskId })
      .from(taskRecord)
      .where(
        and(
          eq(taskRecord.newcomerId, newcomerId),
          inArray(taskRecord.taskId, taskIds),
        ),
      );

    const completedTaskIds = new Set(completedRecords.map((r) => r.taskId));
    const stagesCompleted = taskIds.every((tid) => completedTaskIds.has(tid));

    // 4. 考核中心全部通过
    const coursesPassed = await this.checkCoursesPassed(newcomerId);

    // 5. 检查已有面试申请
    const existingApp = await this.db
      .select({ status: defenseApplication.status })
      .from(defenseApplication)
      .where(
        and(
          eq(defenseApplication.newcomerId, newcomerId),
          inArray(defenseApplication.status, ['pending', 'scheduled']),
        ),
      )
      .limit(1);

    const hasPendingApplication = existingApp.length > 0;
    const applicationStatus = (existingApp[0]?.status ?? null) as DefenseApplicationStatus | null;

    return { stagesCompleted, coursesPassed, hasPendingApplication, applicationStatus };
  }

  /** 检查考核中心所有课程是否全部通过（分数≥80） */
  private async checkCoursesPassed(newcomerId: string): Promise<boolean> {
    const allCourses = await this.db
      .select({ id: course.id })
      .from(course);

    if (allCourses.length === 0) return true;

    const results = await this.db
      .select({
        courseId: examResult.courseId,
        passed: examResult.passed,
      })
      .from(examResult)
      .where(
        and(
          eq(examResult.newcomerId, newcomerId),
          eq(examResult.passed, true),
        ),
      );

    const passedCourseIds = new Set(results.map((r) => r.courseId));
    return allCourses.every((c) => passedCourseIds.has(c.id));
  }

  /** 提交转正面试申请 */
  async applyForDefense(
    newcomerId: string,
    applicationUrl: string,
  ): Promise<{ id: string }> {
    // 校验前置条件
    const eligibility = await this.checkEligibility(newcomerId);
    if (!eligibility.stagesCompleted || !eligibility.coursesPassed) {
      throw new BadRequestException('前置条件未满足，无法提交转正面试申请');
    }
    if (eligibility.hasPendingApplication) {
      throw new ConflictException('已存在待处理的面试申请');
    }

    const [created] = await this.db
      .insert(defenseApplication)
      .values({ newcomerId })
      .returning({ id: defenseApplication.id });

    // 独立版使用站内通知，不阻断面试申请主流程。
    try {
      const [newcomerInfo] = await this.db
        .select({
          name: newcomer.name,
          hireDate: newcomer.hireDate,
          stage: newcomer.status,
        })
        .from(newcomer)
        .where(eq(newcomer.id, newcomerId))
        .limit(1);

      if (newcomerInfo) {
        if (!this.notificationService) throw new Error('站内通知模块未启用');
        const delivered = await this.notificationService.notifyRole('admin', {
          type: 'defense_application',
          title: '收到新的转正面试申请',
          body: `${newcomerInfo.name} 已提交转正面试申请，入职日期 ${newcomerInfo.hireDate}，当前阶段 ${newcomerInfo.stage}`,
          link: applicationUrl,
        });
        const success = delivered.length > 0;
        const notifiedUserId = delivered[0]?.userId ?? null;

        await this.db
          .update(defenseApplication)
          .set({
            notifiedTo: notifiedUserId,
            notifiedAt: sql`CURRENT_TIMESTAMP` as unknown as Date,
            notifyFailed: !success,
          })
          .where(eq(defenseApplication.id, created.id));

        if (!success) {
          this.logger.error(`[defense] notify failed for application ${created.id}, plugin returned success=false`);
        }
      }
    } catch (notifyError: unknown) {
      this.logger.error(`[defense] notify error for application ${created.id}: ${notifyError instanceof Error ? notifyError.message : String(notifyError)}`);
      // 标记发送失败
      await this.db
        .update(defenseApplication)
        .set({ notifyFailed: true })
        .where(eq(defenseApplication.id, created.id));
    }

    return { id: created.id };
  }

  /** 获取转正面试申请列表（管理侧） */
  async listApplications(): Promise<DefenseApplicationItem[]> {
    const rows = await this.db
      .select({
        id: defenseApplication.id,
        newcomerId: defenseApplication.newcomerId,
        newcomerName: newcomer.name,
        status: defenseApplication.status,
        comment: defenseApplication.comment,
        createdAt: defenseApplication.createdAt,
        notifiedAt: defenseApplication.notifiedAt,
        notifyFailed: defenseApplication.notifyFailed,
      })
      .from(defenseApplication)
      .innerJoin(
        newcomer,
        eq(defenseApplication.newcomerId, newcomer.id),
      )
      .orderBy(defenseApplication.createdAt);

    return rows.map((row) => ({
      id: row.id,
      newcomerId: row.newcomerId,
      newcomerName: row.newcomerName,
      status: row.status as DefenseApplicationStatus,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
      notifiedAt: row.notifiedAt ? row.notifiedAt.toISOString() : null,
      notifyFailed: row.notifyFailed,
    }));
  }

  /** 审核转正面试申请 */
  async reviewApplication(
    id: string,
    status: 'scheduled' | 'approved' | 'rejected',
    comment?: string,
  ): Promise<void> {
    const patch: Partial<typeof defenseApplication.$inferInsert> = {
      status,
    };
    if (comment !== undefined) {
      patch.comment = comment;
    }

    const updated = await this.db
      .update(defenseApplication)
      .set(patch)
      .where(eq(defenseApplication.id, id))
      .returning({ id: defenseApplication.id });

    if (updated.length === 0) {
      throw new NotFoundException('面试申请不存在');
    }
  }
}
