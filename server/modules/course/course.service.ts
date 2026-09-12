import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { and, eq, inArray, asc, isNotNull, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@server/database/database.module';
import {
  course,
  courseItem,
  courseMaterial,
  courseQuiz,
  courseLearning,
  examResult,
  newcomer,
} from '@server/database/schema';
import { desc } from 'drizzle-orm';
import type {
  CourseListResponse,
  CourseMaterial,
  CourseModule,
  CourseItem,
  CourseQuiz,
  CreateCourseMaterialRequest,
  CreateCourseRequest,
  CreateCourseItemRequest,
  CreateQuizRequest,
  AdminCourseQuiz,
  AdminCourseItem,
  AdminCourseSummary,
  AdminCourseListResponse,
  AdminQuizCourse,
  ExamSubmitResponse,
  QuizBankResponse,
  UpdateCourseRequest,
} from '@shared/api.interface';

const NEWCOMER_NOT_FOUND_MSG = '未找到当前用户的新人档案，请联系管理员录入';
const EXAM_PASS_THRESHOLD = 80;

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private async findNewcomerIdByUserId(
    userId: string | undefined,
  ): Promise<string | null> {
    if (!userId) return null;
    const rows = await this.db
      .select({ id: newcomer.id })
      .from(newcomer)
      .where(eq(newcomer.userId, userId))
      .limit(1);
    return rows.length > 0 ? rows[0].id : null;
  }

  private async findNewcomerIdById(
    newcomerId: string,
  ): Promise<string | null> {
    const rows = await this.db
      .select({ id: newcomer.id })
      .from(newcomer)
      .where(eq(newcomer.id, newcomerId))
      .limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('未找到该新人的档案');
    }
    return rows[0].id;
  }

  private async requireNewcomerId(userId: string): Promise<string> {
    const newcomerId = await this.findNewcomerIdByUserId(userId);
    if (!newcomerId) throw new NotFoundException(NEWCOMER_NOT_FOUND_MSG);
    return newcomerId;
  }

  async getCourses(
    userId: string | undefined,
    newcomerId?: string,
  ): Promise<CourseListResponse> {
    const resolvedNewcomerId: string | null =
      newcomerId !== undefined
        ? await this.findNewcomerIdById(newcomerId)
        : await this.findNewcomerIdByUserId(userId);

    const courses = await this.db.select().from(course).orderBy(asc(course.sort));
    const courseIds = courses.map((c) => c.id);

    const allItems = courseIds.length
      ? await this.db
          .select()
          .from(courseItem)
          .where(inArray(courseItem.courseId, courseIds))
          .orderBy(asc(courseItem.sort))
      : [];

    const allQuizzes = courseIds.length
      ? await this.db
          .select({
            id: courseQuiz.id,
            courseId: courseQuiz.courseId,
            question: courseQuiz.question,
            options: courseQuiz.options,
            sort: courseQuiz.sort,
          })
          .from(courseQuiz)
          .where(inArray(courseQuiz.courseId, courseIds))
          .orderBy(asc(courseQuiz.sort))
      : [];

    const learnedItemIds = new Set<string>();
    const passedAtByCourse = new Map<string, string>();
    if (resolvedNewcomerId) {
      const learnings = await this.db
        .select({ itemId: courseLearning.itemId })
        .from(courseLearning)
        .where(
          and(
            eq(courseLearning.newcomerId, resolvedNewcomerId),
            isNotNull(courseLearning.learnedAt),
          ),
        );
      for (const row of learnings) {
        learnedItemIds.add(row.itemId);
      }

      const passedResults = await this.db
        .select({
          courseId: examResult.courseId,
          takenAt: examResult.takenAt,
        })
        .from(examResult)
        .where(
          and(
            eq(examResult.newcomerId, resolvedNewcomerId),
            eq(examResult.passed, true),
          ),
        );
      for (const row of passedResults) {
        if (!row.takenAt) continue;
        const iso = row.takenAt.toISOString();
        const existing = passedAtByCourse.get(row.courseId);
        if (!existing || iso > existing) {
          passedAtByCourse.set(row.courseId, iso);
        }
      }
    }

    const itemsByCourse = new Map<string, CourseItem[]>();
    for (const row of allItems) {
      const entry: CourseItem = {
        id: row.id,
        title: row.title,
        learned: learnedItemIds.has(row.id),
      };
      const list = itemsByCourse.get(row.courseId) ?? [];
      list.push(entry);
      itemsByCourse.set(row.courseId, list);
    }

    const quizzesByCourse = new Map<string, CourseQuiz[]>();
    for (const row of allQuizzes) {
      const entry: CourseQuiz = {
        id: row.id,
        question: row.question,
        options: row.options,
      };
      const list = quizzesByCourse.get(row.courseId) ?? [];
      list.push(entry);
      quizzesByCourse.set(row.courseId, list);
    }

    const allMaterials = courseIds.length
      ? await this.db
          .select()
          .from(courseMaterial)
          .where(inArray(courseMaterial.courseId, courseIds))
          .orderBy(desc(courseMaterial.createdAt))
      : [];
    const materialsByCourse = new Map<string, CourseMaterial[]>();
    for (const row of allMaterials) {
      const entry: CourseMaterial = {
        id: row.id,
        courseId: row.courseId,
        title: row.title,
        fileUrl: row.fileUrl,
        uploadedAt: row.createdAt.toISOString(),
      };
      const list = materialsByCourse.get(row.courseId) ?? [];
      list.push(entry);
      materialsByCourse.set(row.courseId, list);
    }

    const modules: CourseModule[] = courses.map((c) => {
      const items = itemsByCourse.get(c.id) ?? [];
      const learnedCount = items.filter((i) => i.learned).length;
      const progress =
        items.length > 0
          ? Math.round((learnedCount / items.length) * 100)
          : 0;
      const passedAt = passedAtByCourse.get(c.id) ?? null;
      return {
        id: c.id,
        title: c.title,
        keyPoints: c.keyPoints,
        requirement: c.requirement,
        progress,
        passed: passedAt !== null,
        passedAt,
        items,
        quizzes: quizzesByCourse.get(c.id) ?? [],
        materials: materialsByCourse.get(c.id) ?? [],
      };
    });

    return { items: modules };
  }

  async markLearning(
    userId: string,
    itemId: string,
    learned: boolean,
  ): Promise<{ success: boolean }> {
    const newcomerId = await this.requireNewcomerId(userId);

    const learnedAt = learned ? new Date() : null;
    await this.db
      .insert(courseLearning)
      .values({ newcomerId, itemId, learnedAt })
      .onConflictDoUpdate({
        target: [courseLearning.newcomerId, courseLearning.itemId],
        set: { learnedAt },
      });

    return { success: true };
  }

  async submitExam(
    userId: string,
    courseId: string,
    answers: Array<{ quizId: string; option: string }>,
  ): Promise<ExamSubmitResponse> {
    const newcomerId = await this.requireNewcomerId(userId);

    const quizzes = await this.db
      .select({
        id: courseQuiz.id,
        answer: courseQuiz.answer,
      })
      .from(courseQuiz)
      .where(eq(courseQuiz.courseId, courseId));

    if (quizzes.length === 0) {
      throw new BadRequestException('该课程暂无考核题目，无法提交');
    }

    const answerMap = new Map<string, string>();
    for (const a of answers) {
      answerMap.set(a.quizId, a.option);
    }

    let correctCount = 0;
    for (const quiz of quizzes) {
      if (answerMap.get(quiz.id) === quiz.answer) {
        correctCount += 1;
      }
    }

    const score = Math.round((correctCount / quizzes.length) * 100);
    const passed = score >= EXAM_PASS_THRESHOLD;

    await this.db.insert(examResult).values({
      newcomerId,
      courseId,
      passed,
      score,
      takenAt: new Date(),
    });

    return { passed, score };
  }

  async createMaterial(
    courseId: string,
    dto: CreateCourseMaterialRequest,
  ): Promise<{ id: string }> {
    if (!dto.title?.trim() || !dto.fileUrl?.trim()) {
      throw new BadRequestException('材料名称与文件地址不能为空');
    }

    const [target] = await this.db
      .select({ id: course.id })
      .from(course)
      .where(eq(course.id, courseId));
    if (!target) throw new NotFoundException('课程模块不存在');

    const [created] = await this.db
      .insert(courseMaterial)
      .values({ courseId, title: dto.title.trim(), fileUrl: dto.fileUrl.trim() })
      .returning({ id: courseMaterial.id });
    return { id: created.id };
  }

  async deleteMaterial(materialId: string): Promise<void> {
    const deleted = await this.db
      .delete(courseMaterial)
      .where(eq(courseMaterial.id, materialId))
      .returning({ id: courseMaterial.id });
    if (deleted.length === 0) throw new NotFoundException('材料不存在');
  }

  async listAdminCourses(): Promise<AdminCourseListResponse> {
    const courses = await this.db.select().from(course).orderBy(asc(course.sort));
    const courseIds = courses.map((c) => c.id);

    const allItems = courseIds.length
      ? await this.db
          .select({
            id: courseItem.id,
            courseId: courseItem.courseId,
            title: courseItem.title,
            sort: courseItem.sort,
          })
          .from(courseItem)
          .where(inArray(courseItem.courseId, courseIds))
          .orderBy(asc(courseItem.sort))
      : [];

    const quizRows = courseIds.length
      ? await this.db
          .select({ courseId: courseQuiz.courseId, n: sql<number>`count(*)` })
          .from(courseQuiz)
          .where(inArray(courseQuiz.courseId, courseIds))
          .groupBy(courseQuiz.courseId)
      : [];
    const quizCountByCourse = new Map<string, number>();
    for (const row of quizRows) {
      quizCountByCourse.set(row.courseId, Number(row.n));
    }

    const materialRows = courseIds.length
      ? await this.db
          .select({ courseId: courseMaterial.courseId, n: sql<number>`count(*)` })
          .from(courseMaterial)
          .where(inArray(courseMaterial.courseId, courseIds))
          .groupBy(courseMaterial.courseId)
      : [];
    const materialCountByCourse = new Map<string, number>();
    for (const row of materialRows) {
      materialCountByCourse.set(row.courseId, Number(row.n));
    }

    const itemsByCourse = new Map<string, AdminCourseItem[]>();
    for (const row of allItems) {
      const list = itemsByCourse.get(row.courseId) ?? [];
      list.push({ id: row.id, title: row.title, sort: row.sort });
      itemsByCourse.set(row.courseId, list);
    }

    const items: AdminCourseSummary[] = courses.map((c) => ({
      id: c.id,
      title: c.title,
      keyPoints: c.keyPoints,
      requirement: c.requirement,
      sort: c.sort,
      items: itemsByCourse.get(c.id) ?? [],
      quizCount: quizCountByCourse.get(c.id) ?? 0,
      materialCount: materialCountByCourse.get(c.id) ?? 0,
    }));
    return { items };
  }

  async createCourse(dto: CreateCourseRequest): Promise<{ id: string }> {
    if (!dto?.title?.trim()) throw new BadRequestException('课程名称不能为空');
    if (!dto?.keyPoints?.trim()) throw new BadRequestException('课程要点不能为空');
    if (!dto?.requirement?.trim()) {
      throw new BadRequestException('通关要求不能为空');
    }
    if (!Array.isArray(dto?.items) || dto.items.length === 0) {
      throw new BadRequestException('至少配置一个课程小节');
    }
    for (const item of dto.items) {
      if (!item?.title?.trim()) {
        throw new BadRequestException('课程小节名称不能为空');
      }
    }

    const id = await this.db.transaction(async (tx) => {
      const [{ nextSort }] = await tx
        .select({ nextSort: sql<number>`coalesce(max(${course.sort}), 0) + 1` })
        .from(course);
      const [created] = await tx
        .insert(course)
        .values({
          title: dto.title.trim(),
          keyPoints: dto.keyPoints.trim(),
          requirement: dto.requirement.trim(),
          sort:
            typeof dto.sort === 'number' && dto.sort >= 0
              ? dto.sort
              : Number(nextSort),
        })
        .returning({ id: course.id });
      if (!created) throw new BadRequestException('新建课程失败');

      await tx.insert(courseItem).values(
        dto.items.map((item, index: number) => ({
          courseId: created.id,
          title: item.title.trim(),
          sort: index + 1,
        })),
      );
      return created.id;
    });

    this.logger.log(`新建课程成功 id=${id}`);
    return { id };
  }

  async updateCourse(
    courseId: string,
    dto: UpdateCourseRequest,
    operatorId: string,
  ): Promise<{ id: string }> {
    const [existing] = await this.db
      .select({ id: course.id })
      .from(course)
      .where(eq(course.id, courseId));
    if (!existing) throw new NotFoundException('课程模块不存在');

    const patch: Partial<typeof course.$inferInsert> = {};
    if (dto.title !== undefined) {
      if (!dto.title.trim()) throw new BadRequestException('课程名称不能为空');
      patch.title = dto.title.trim();
    }
    if (dto.keyPoints !== undefined) {
      if (!dto.keyPoints.trim()) throw new BadRequestException('课程要点不能为空');
      patch.keyPoints = dto.keyPoints.trim();
    }
    if (dto.requirement !== undefined) {
      if (!dto.requirement.trim()) {
        throw new BadRequestException('通关要求不能为空');
      }
      patch.requirement = dto.requirement.trim();
    }
    if (dto.sort !== undefined) {
      if (!Number.isFinite(dto.sort) || dto.sort < 0) {
        throw new BadRequestException('排序必须为非负数字');
      }
      patch.sort = dto.sort;
    }
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const [updated] = await this.db
      .update(course)
      .set(patch)
      .where(eq(course.id, courseId))
      .returning({ id: course.id });
    if (!updated) throw new NotFoundException('课程模块不存在');

    this.logger.log(`更新课程成功 id=${courseId} operator=${operatorId}`);
    return { id: updated.id };
  }

  async deleteCourse(courseId: string): Promise<void> {
    const deleted = await this.db.transaction(async (tx) => {
      const items = await tx
        .select({ id: courseItem.id })
        .from(courseItem)
        .where(eq(courseItem.courseId, courseId));
      if (items.length > 0) {
        await tx.delete(courseLearning).where(
          inArray(
            courseLearning.itemId,
            items.map((i) => i.id),
          ),
        );
      }
      await tx.delete(courseItem).where(eq(courseItem.courseId, courseId));
      await tx.delete(courseMaterial).where(eq(courseMaterial.courseId, courseId));
      await tx.delete(courseQuiz).where(eq(courseQuiz.courseId, courseId));
      await tx.delete(examResult).where(eq(examResult.courseId, courseId));
      return tx
        .delete(course)
        .where(eq(course.id, courseId))
        .returning({ id: course.id });
    });
    if (deleted.length === 0) throw new NotFoundException('课程模块不存在');
    this.logger.log(`删除课程成功 id=${courseId}`);
  }

  async createCourseItem(
    courseId: string,
    dto: CreateCourseItemRequest,
  ): Promise<{ id: string }> {
    if (!dto?.title?.trim()) {
      throw new BadRequestException('课程小节名称不能为空');
    }
    const [existing] = await this.db
      .select({ id: course.id })
      .from(course)
      .where(eq(course.id, courseId));
    if (!existing) throw new NotFoundException('课程模块不存在');

    const [{ nextSort }] = await this.db
      .select({ nextSort: sql<number>`coalesce(max(${courseItem.sort}), 0) + 1` })
      .from(courseItem)
      .where(eq(courseItem.courseId, courseId));

    const [created] = await this.db
      .insert(courseItem)
      .values({
        courseId,
        title: dto.title.trim(),
        sort: Number(nextSort),
      })
      .returning({ id: courseItem.id });
    if (!created) throw new BadRequestException('新增课程小节失败');
    return { id: created.id };
  }

  async deleteCourseItem(itemId: string): Promise<void> {
    const deleted = await this.db.transaction(async (tx) => {
      await tx.delete(courseLearning).where(eq(courseLearning.itemId, itemId));
      return tx
        .delete(courseItem)
        .where(eq(courseItem.id, itemId))
        .returning({ id: courseItem.id });
    });
    if (deleted.length === 0) throw new NotFoundException('课程小节不存在');
    this.logger.log(`删除课程小节成功 id=${itemId}`);
  }

  async getQuizBank(): Promise<QuizBankResponse> {
    const courses = await this.db
      .select({ id: course.id, title: course.title })
      .from(course)
      .orderBy(asc(course.sort));
    const courseIds = courses.map((c) => c.id);

    const allQuizzes = courseIds.length
      ? await this.db
          .select()
          .from(courseQuiz)
          .where(inArray(courseQuiz.courseId, courseIds))
          .orderBy(asc(courseQuiz.sort))
      : [];

    const quizzesByCourse = new Map<string, AdminCourseQuiz[]>();
    for (const row of allQuizzes) {
      const entry: AdminCourseQuiz = {
        id: row.id,
        question: row.question,
        options: row.options,
        answer: row.answer,
        sort: row.sort,
      };
      const list = quizzesByCourse.get(row.courseId) ?? [];
      list.push(entry);
      quizzesByCourse.set(row.courseId, list);
    }

    const items: AdminQuizCourse[] = courses.map((c) => ({
      id: c.id,
      title: c.title,
      quizzes: quizzesByCourse.get(c.id) ?? [],
    }));
    return { items };
  }

  async createQuiz(dto: CreateQuizRequest): Promise<{ id: string }> {
    const question = dto.question?.trim() ?? '';
    const options = (dto.options ?? [])
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (!question) throw new BadRequestException('题干不能为空');
    if (options.length < 2) throw new BadRequestException('至少需要两个非空选项');
    if (!options.includes(dto.answer)) {
      throw new BadRequestException('正确答案必须在选项之中');
    }

    const [target] = await this.db
      .select({ id: course.id })
      .from(course)
      .where(eq(course.id, dto.courseId));
    if (!target) throw new NotFoundException('课程模块不存在');

    const [sortRow] = await this.db
      .select({ maxSort: sql<number>`coalesce(max(${courseQuiz.sort}), 0)` })
      .from(courseQuiz)
      .where(eq(courseQuiz.courseId, dto.courseId));
    const nextSort = Number(sortRow?.maxSort ?? 0) + 1;

    const [created] = await this.db
      .insert(courseQuiz)
      .values({
        courseId: dto.courseId,
        question,
        options,
        answer: dto.answer,
        sort: nextSort,
      })
      .returning({ id: courseQuiz.id });
    return { id: created.id };
  }

  async deleteQuiz(quizId: string): Promise<void> {
    const deleted = await this.db
      .delete(courseQuiz)
      .where(eq(courseQuiz.id, quizId))
      .returning({ id: courseQuiz.id });
    if (deleted.length === 0) throw new NotFoundException('考题不存在');
  }
}
