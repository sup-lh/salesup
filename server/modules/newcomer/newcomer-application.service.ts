import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/database.module';
import { UserDirectoryService } from '@server/modules/auth/user-directory.service';
import {
  challengeTask,
  newcomer,
  newcomerApplication,
  taskRecord,
} from '@server/database/schema';
import type {
  CreateNewcomerApplicationRequest,
  NewcomerApplicationItem,
  NewcomerApplicationListResponse,
  ReviewNewcomerApplicationRequest,
} from '@shared/api.interface';

type ApplicationRow = typeof newcomerApplication.$inferSelect;

type PositionCn = '销售顾问';

const POSITION_TO_DB: Record<PositionCn, string> = {
  销售顾问: 'sales_consultant',
};
const POSITION_FROM_DB: Record<string, PositionCn> = {
  sales_consultant: '销售顾问',
};

@Injectable()
export class NewcomerApplicationService {
  private readonly logger = new Logger(NewcomerApplicationService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly directory: UserDirectoryService,
  ) {}

  private toApplicationItem(row: ApplicationRow): NewcomerApplicationItem {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      position: POSITION_FROM_DB[row.position] ?? '销售顾问',
      hireDate: row.hireDate,
      mentorId: row.mentor,
      goalContract: row.goalContract ?? '',
      status: row.status as NewcomerApplicationItem['status'],
      reviewComment: row.reviewComment,
      reviewedById: row.reviewedBy,
      reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async submitApplication(
    dto: CreateNewcomerApplicationRequest,
    userId: string,
  ): Promise<{ id: string }> {
    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('请求参数不合法');
    }
    if (!dto.position || !POSITION_TO_DB[dto.position]) {
      throw new BadRequestException('岗位必填且必须为：销售顾问');
    }
    if (!dto.hireDate || !/^\d{4}-\d{2}-\d{2}$/.test(dto.hireDate)) {
      throw new BadRequestException('入职日期必填且格式应为 YYYY-MM-DD');
    }

    const [bound] = await this.db
      .select({ id: newcomer.id })
      .from(newcomer)
      .where(eq(newcomer.userId, userId))
      .limit(1);
    if (bound) {
      throw new ConflictException('当前账号已关联新人档案，无需申请');
    }

    const [pending] = await this.db
      .select({ id: newcomerApplication.id })
      .from(newcomerApplication)
      .where(
        and(
          eq(newcomerApplication.userId, userId),
          eq(newcomerApplication.status, 'pending'),
        ),
      )
      .limit(1);
    if (pending) {
      throw new ConflictException('已提交过入职申请，请等待管理员处理');
    }

    const [user] = await this.directory.listUsersByIds([userId]);
    const name: string = user?.name?.zh_cn ?? user?.name?.en_us ?? '';
    if (name === '') {
      throw new BadRequestException('无法获取当前账号姓名，请联系管理员');
    }

    const [created] = await this.db
      .insert(newcomerApplication)
      .values({
        userId,
        name,
        position: POSITION_TO_DB[dto.position],
        hireDate: dto.hireDate,
        goalContract: dto.goalContract?.trim() || null,
      })
      .returning({ id: newcomerApplication.id });
    if (!created) throw new BadRequestException('提交申请失败');

    this.logger.log(`新人入职申请已提交 id=${created.id} userId=${userId}`);
    return { id: created.id };
  }

  async listApplications(): Promise<NewcomerApplicationListResponse> {
    const rows = await this.db
      .select()
      .from(newcomerApplication)
      .orderBy(desc(newcomerApplication.createdAt))
      .limit(200);

    const [{ pending }] = await this.db
      .select({ pending: sql<number>`count(*)` })
      .from(newcomerApplication)
      .where(eq(newcomerApplication.status, 'pending'));

    return {
      items: rows.map((row: ApplicationRow) => this.toApplicationItem(row)),
      pendingCount: Number(pending),
    };
  }

  async getMyApplication(
    userId: string,
  ): Promise<NewcomerApplicationItem | null> {
    const rows = await this.db
      .select()
      .from(newcomerApplication)
      .where(eq(newcomerApplication.userId, userId))
      .orderBy(desc(newcomerApplication.createdAt))
      .limit(1);
    if (rows.length === 0) return null;
    return this.toApplicationItem(rows[0]);
  }

  async approveApplication(
    applicationId: string,
    operatorId: string,
  ): Promise<{ newcomerId: string }> {
    const newcomerId = await this.db.transaction(async (tx) => {
      const [app] = await tx
        .select()
        .from(newcomerApplication)
        .where(eq(newcomerApplication.id, applicationId))
        .limit(1);
      if (!app) throw new NotFoundException('申请不存在');
      if (app.status !== 'pending') {
        throw new BadRequestException('该申请已处理，请勿重复操作');
      }

      const [bound] = await tx
        .select({ id: newcomer.id })
        .from(newcomer)
        .where(eq(newcomer.userId, app.userId))
        .limit(1);
      if (bound) {
        throw new ConflictException('该申请人已关联新人档案');
      }

      const [created] = await tx
        .insert(newcomer)
        .values({
          name: app.name,
          position: app.position,
          hireDate: app.hireDate,
          mentor: app.mentor,
          goalContract: app.goalContract,
          userId: app.userId,
        })
        .returning({ id: newcomer.id });
      if (!created) throw new BadRequestException('录入新人档案失败');

      const tasks = await tx
        .select({ id: challengeTask.id })
        .from(challengeTask);
      if (tasks.length > 0) {
        await tx
          .insert(taskRecord)
          .values(
            tasks.map((t: { id: string }) => ({
              newcomerId: created.id,
              taskId: t.id,
            })),
          );
      }

      await tx
        .update(newcomerApplication)
        .set({
          status: 'approved',
          reviewedBy: operatorId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
          updatedBy: operatorId,
        })
        .where(eq(newcomerApplication.id, applicationId));

      return created.id;
    });

    this.logger.log(
      `入职申请通过并建档 id=${applicationId} newcomerId=${newcomerId} operator=${operatorId}`,
    );
    return { newcomerId };
  }

  async rejectApplication(
    applicationId: string,
    dto: ReviewNewcomerApplicationRequest,
    operatorId: string,
  ): Promise<{ id: string }> {
    const [updated] = await this.db
      .update(newcomerApplication)
      .set({
        status: 'rejected',
        reviewComment: dto?.comment?.trim() || null,
        reviewedBy: operatorId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: operatorId,
      })
      .where(
        and(
          eq(newcomerApplication.id, applicationId),
          eq(newcomerApplication.status, 'pending'),
        ),
      )
      .returning({ id: newcomerApplication.id });
    if (!updated) {
      const [existing] = await this.db
        .select({ id: newcomerApplication.id })
        .from(newcomerApplication)
        .where(eq(newcomerApplication.id, applicationId))
        .limit(1);
      if (!existing) throw new NotFoundException('申请不存在');
      throw new BadRequestException('该申请已处理，请勿重复操作');
    }

    this.logger.log(
      `入职申请已拒绝 id=${applicationId} operator=${operatorId}`,
    );
    return { id: updated.id };
  }
}
