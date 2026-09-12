import { and, asc, count, desc, eq, gte } from 'drizzle-orm';
import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/database.module';
import { UserDirectoryService } from '@server/modules/auth/user-directory.service';
import {
  challengeTask,
  coachingRecord,
  course,
  examResult,
  newcomer,
  taskRecord,
} from '@server/database/schema';
import {
  GROWTH_STAGES,
  STAGE_DAY_RANGES,
  STAGE_STANDARDS,
  resolveGrowthStage,
} from '@shared/common';
import type { GrowthStage } from '@shared/common';
import type {
  MentorInfo,
  PassStatusItem,
  TodayTaskItem,
  WorkbenchResponse,
} from '@shared/api.interface';

const EMPTY_WORKBENCH_RESPONSE: WorkbenchResponse = {
  newcomer: null,
  stageProgress: [],
  todayTasks: [],
  passStatus: [],
  mentor: null,
};

/** 通关映射：key + 展示文案 + 依赖的课程标题 */
const PASS_GROUPS: Array<{
  key: string;
  label: string;
  courseTitles: string[];
}> = [
  {
    key: 'product',
    label: '产品知识通关',
    courseTitles: ['产品认知', '行业认知'],
  },
  { key: 'script', label: '话术通关', courseTitles: ['销售方法论'] },
  { key: 'tool', label: '工具使用', courseTitles: ['工具与流程'] },
];

const COACHING_TYPE_LABELS: Record<string, string> = {
  visit: '陪访',
  '1on1': '1v1辅导',
};

const POSITION_FROM_DB: Record<string, string> = {
  sales_consultant: '销售顾问',
};

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

interface CurrentNewcomer {
  id: string;
  name: string;
  position: string;
  hireDate: string;
  mentor: string | null;
}

interface JoinedTaskRow {
  recordId: string;
  stage: string;
  title: string;
  standard: string;
  dueDay: number;
  unlockNextStage: boolean;
  completedAt: Date | null;
}

interface ExamRow {
  courseId: string;
  passed: boolean;
  takenAt: Date;
}

@Injectable()
export class WorkbenchService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly directory: UserDirectoryService,
  ) {}

  async getWorkbench(
    userId: string,
    newcomerId?: string,
  ): Promise<WorkbenchResponse> {
    const current =
      newcomerId !== undefined
        ? await this.findNewcomerById(newcomerId)
        : await this.findCurrentNewcomer(userId);
    if (!current) {
      if (newcomerId !== undefined) {
        throw new NotFoundException('未找到该新人的档案');
      }
      return EMPTY_WORKBENCH_RESPONSE;
    }
    const { dayCount } = resolveGrowthStage(current.hireDate);

    const taskRows = await this.loadTaskRows(current.id);

    const stageRowsByIndex: JoinedTaskRow[][] = GROWTH_STAGES.map(
      (stageName: GrowthStage) =>
        taskRows.filter(
          (row: JoinedTaskRow) => this.toStage(row.stage) === stageName,
        ),
    );
    /** 阶段解锁：到达起始天数，或上一阶段全部解锁任务完成（链式传播） */
    const unlockedFlags: boolean[] = [];
    stageRowsByIndex.forEach(
      (_stageRows: JoinedTaskRow[], index: number): void => {
        if (dayCount >= STAGE_DAY_RANGES[index].startDay) {
          unlockedFlags.push(true);
          return;
        }
        if (index === 0) {
          unlockedFlags.push(false);
          return;
        }
        const prevUnlockTasks = stageRowsByIndex[index - 1].filter(
          (row: JoinedTaskRow) => row.unlockNextStage,
        );
        unlockedFlags.push(
          unlockedFlags[index - 1] &&
            prevUnlockTasks.length > 0 &&
            prevUnlockTasks.every(
              (row: JoinedTaskRow) => row.completedAt !== null,
            ),
        );
      },
    );
    const unlockedIndex = unlockedFlags.lastIndexOf(true);

    const stageProgress = GROWTH_STAGES.map(
      (
        stageName: GrowthStage,
        index: number,
      ): WorkbenchResponse['stageProgress'][number] => {
        const stageRows = stageRowsByIndex[index];
        const total = stageRows.length;
        const completedCount = stageRows.filter(
          (row: JoinedTaskRow) => row.completedAt !== null,
        ).length;
        const progress =
          total > 0 ? Math.floor((completedCount / total) * 100) : 0;
        const status: WorkbenchResponse['stageProgress'][number]['status'] =
          index < unlockedIndex
            ? '已完成'
            : index === unlockedIndex
              ? '进行中'
              : '未解锁';
        return {
          stage: stageName,
          status,
          standard: STAGE_STANDARDS[stageName],
          progress,
        };
      },
    );

    const todayTasks: TodayTaskItem[] = taskRows
      .filter(
        (row: JoinedTaskRow) =>
          row.completedAt === null && row.dueDay <= dayCount + 3,
      )
      .slice(0, 6)
      .map((row: JoinedTaskRow) => ({
        recordId: row.recordId,
        title: row.title,
        standard: row.standard,
        dueDay: row.dueDay,
        completed: false,
      }));

    const passStatus = await this.buildPassStatus(current.id);
    const mentor = await this.buildMentorInfo(current);

    return {
      newcomer: {
        id: current.id,
        name: current.name,
        position: POSITION_FROM_DB[current.position] ?? current.position,
        hireDate: current.hireDate,
        stage: GROWTH_STAGES[unlockedIndex],
        dayCount,
      },
      stageProgress,
      todayTasks,
      passStatus,
      mentor,
    };
  }

  private async buildPassStatus(
    newcomerId: string,
  ): Promise<PassStatusItem[]> {
    const courseRows = await this.db
      .select({ id: course.id, title: course.title })
      .from(course);

    const examRows: ExamRow[] = await this.db
      .select({
        courseId: examResult.courseId,
        passed: examResult.passed,
        takenAt: examResult.takenAt,
      })
      .from(examResult)
      .where(eq(examResult.newcomerId, newcomerId));

    return PASS_GROUPS.map((group) => {
      const courseIds = courseRows
        .filter((row) => group.courseTitles.includes(row.title))
        .map((row) => row.id);
      const passedRows = examRows.filter(
        (row: ExamRow) => courseIds.includes(row.courseId) && row.passed,
      );
      const passed =
        courseIds.length > 0 &&
        courseIds.every((courseId: string) =>
          passedRows.some((row: ExamRow) => row.courseId === courseId),
        );
      let passedAt: string | null = null;
      if (passed && passedRows.length > 0) {
        const latest = passedRows.reduce(
          (acc: Date, row: ExamRow) => (row.takenAt > acc ? row.takenAt : acc),
          passedRows[0].takenAt,
        );
        passedAt = latest.toISOString();
      }
      return { key: group.key, label: group.label, passed, passedAt };
    });
  }

  private async buildMentorInfo(
    current: CurrentNewcomer,
  ): Promise<MentorInfo | null> {
    if (!current.mentor) return null;

    const users = await this.directory.listUsersByIds([current.mentor]);
    const mentorUser = users[0];
    const name =
      mentorUser?.name?.zh_cn ?? mentorUser?.name?.en_us ?? '未知导师';
    const avatar = mentorUser?.avatar?.image?.large ?? null;

    const monday = this.getMondayDateString(new Date());
    const visitRows = await this.db
      .select({ value: count() })
      .from(coachingRecord)
      .where(
        and(
          eq(coachingRecord.newcomerId, current.id),
          eq(coachingRecord.type, 'visit'),
          gte(coachingRecord.recordDate, monday),
        ),
      );
    const weeklyVisits = Number(visitRows[0]?.value ?? 0);

    const recentRows = await this.db
      .select({
        type: coachingRecord.type,
        recordDate: coachingRecord.recordDate,
        content: coachingRecord.content,
      })
      .from(coachingRecord)
      .where(eq(coachingRecord.newcomerId, current.id))
      .orderBy(
        desc(coachingRecord.recordDate),
        desc(coachingRecord.createdAt),
      )
      .limit(3);

    const recentRecords = recentRows.map(
      (row: { type: string; recordDate: string; content: string }) =>
        `${COACHING_TYPE_LABELS[row.type] ?? '带教'} · ${row.recordDate} · ${this.summarize(row.content)}`,
    );

    return {
      mentorId: current.mentor,
      name,
      avatar,
      weeklyVisits,
      recentRecords,
    };
  }

  private summarize(text: string, maxLength = 60): string {
    const trimmed = text.trim();
    return trimmed.length > maxLength
      ? `${trimmed.slice(0, maxLength)}…`
      : trimmed;
  }

  /** 业务时区 Asia/Shanghai：返回本周一的 YYYY-MM-DD 日期串 */
  private getMondayDateString(now: Date): string {
    const shanghaiTime = now.getTime() + SHANGHAI_OFFSET_MS;
    const dayOfWeek = new Date(shanghaiTime).getUTCDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const mondayTime = shanghaiTime - daysSinceMonday * 86400000;
    return new Date(mondayTime).toISOString().slice(0, 10);
  }

  private toStage(dbStage: string): GrowthStage | undefined {
    const map: Record<string, GrowthStage> = {
      onboarding: '融入期',
      practice: '实战期',
      independent: '独立期',
      consolidation: '巩固期',
    };
    return map[dbStage];
  }

  private async loadTaskRows(newcomerId: string): Promise<JoinedTaskRow[]> {
    return this.db
      .select({
        recordId: taskRecord.id,
        stage: challengeTask.stage,
        title: challengeTask.title,
        standard: challengeTask.standard,
        dueDay: challengeTask.dueDay,
        unlockNextStage: challengeTask.unlockNextStage,
        completedAt: taskRecord.completedAt,
      })
      .from(taskRecord)
      .innerJoin(challengeTask, eq(taskRecord.taskId, challengeTask.id))
      .where(eq(taskRecord.newcomerId, newcomerId))
      .orderBy(asc(challengeTask.dueDay), asc(challengeTask.sort));
  }

  private async findNewcomerById(
    newcomerId: string,
  ): Promise<CurrentNewcomer | null> {
    const rows = await this.db
      .select({
        id: newcomer.id,
        name: newcomer.name,
        position: newcomer.position,
        hireDate: newcomer.hireDate,
        mentor: newcomer.mentor,
      })
      .from(newcomer)
      .where(eq(newcomer.id, newcomerId))
      .limit(1);

    return rows[0] ?? null;
  }

  private async findCurrentNewcomer(
    userId: string,
  ): Promise<CurrentNewcomer | null> {
    const rows = await this.db
      .select({
        id: newcomer.id,
        name: newcomer.name,
        position: newcomer.position,
        hireDate: newcomer.hireDate,
        mentor: newcomer.mentor,
      })
      .from(newcomer)
      .where(eq(newcomer.userId, userId))
      .limit(1);

    return rows[0] ?? null;
  }
}
