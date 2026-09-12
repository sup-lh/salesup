/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { boolean, date, foreignKey, index, integer, numeric, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const defenseApplication = pgTable("defense_application", {
  id: uuid("id").primaryKey().defaultRandom(),
  newcomerId: uuid("newcomer_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  comment: text("comment"),
  notifiedTo: uuid("notified_to"),
  notifiedAt: customTimestamptz("notified_at", { precision: 3 }),
  notifyFailed: boolean("notify_failed").notNull().default(false),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  foreignKey({
    columns: [table.newcomerId],
    foreignColumns: [newcomer.id],
    name: "defense_application_newcomer_id_fkey",
  }),
]);

export const stageCatalog = pgTable("stage_catalog", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  sort: integer("sort").notNull().default(0),
  startDay: integer("start_day").notNull().default(1),
  endDay: integer("end_day").notNull().default(30),
  standard: varchar("standard", { length: 500 }),
  hasDefense: boolean("has_defense").notNull().default(false),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  uniqueIndex("idx_stage_catalog_code").on(table.code),
]);

export const newcomerApplication = pgTable("newcomer_application", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  position: varchar("position", { length: 50 }).notNull(),
  hireDate: date("hire_date").notNull(),
  mentor: uuid("mentor"),
  goalContract: text("goal_contract"),
  status: varchar("status", { length: 50 }).notNull().default('pending'),
  reviewComment: text("review_comment"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: customTimestamptz("reviewed_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  index("idx_newcomer_application_status").on(table.status),
  // Complex index: CREATE INDEX idx_newcomer_application_user_id ON newcomer_application USING btree (((user_id).user_id)),
]);

export const kbItem = pgTable("kb_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(),
  url: text("url").notNull(),
  description: text("description"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
});

export const opportunity = pgTable("opportunity", {
  id: uuid("id").primaryKey().defaultRandom(),
  newcomerId: uuid("newcomer_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  customer: varchar("customer", { length: 255 }).notNull(),
  amount: numeric("amount").notNull().default('0'),
  stage: varchar("stage", { length: 50 }).notNull(),
  expectedDate: date("expected_date"),
  remark: text("remark"),
  materials: text("materials"),
  recordDate: date("record_date").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  index("idx_opportunity_newcomer_id").on(table.newcomerId),
  foreignKey({
    columns: [table.newcomerId],
    foreignColumns: [newcomer.id],
    name: "opportunity_newcomer_id_fkey",
  }),
]);

export const courseMaterial = pgTable("course_material", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  index("idx_course_material_course_id").on(table.courseId),
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [course.id],
    name: "course_material_course_id_fkey",
  }),
]);

export const authzRolePermissions = pgTable("authz_role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleKey: varchar("role_key", { length: 100 }).notNull(),
  permissionId: uuid("permission_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  uniqueIndex("authz_role_permissions_role_key_permission_id_key").on(table.roleKey, table.permissionId),
  foreignKey({
    columns: [table.permissionId],
    foreignColumns: [authzPermissions.id],
    name: "authz_role_permissions_permission_id_fkey",
  }).onDelete("cascade"),
]);

export const authzPermissions = pgTable("authz_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: varchar("action", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  description: text("description"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 6 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 6 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  uniqueIndex("authz_permissions_action_subject_key").on(table.action, table.subject),
]);

export const assessmentRecord = pgTable("assessment_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  newcomerId: uuid("newcomer_id").notNull(),
  node: varchar("node", { length: 10 }).notNull(),
  result: varchar("result", { length: 20 }).notNull(),
  assessComment: text("assess_comment").notNull(),
  recordDate: date("record_date").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  foreignKey({
    columns: [table.newcomerId],
    foreignColumns: [newcomer.id],
    name: "assessment_record_newcomer_id_fkey",
  }),
]);

export const reviewRecord = pgTable("review_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  newcomerId: uuid("newcomer_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  opportunity: varchar("opportunity", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  lessons: text("lessons").notNull(),
  sharer: uuid("sharer"),
  recordDate: date("record_date").notNull(),
  materials: text("materials"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  foreignKey({
    columns: [table.newcomerId],
    foreignColumns: [newcomer.id],
    name: "review_record_newcomer_id_fkey",
  }),
]);

export const coachingRecord = pgTable("coaching_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  newcomerId: uuid("newcomer_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  coach: uuid("coach"),
  recordDate: date("record_date").notNull(),
  durationHours: numeric("duration_hours").notNull().default('0'),
  content: text("content").notNull(),
  improvement: text("improvement"),
  materials: text("materials"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  foreignKey({
    columns: [table.newcomerId],
    foreignColumns: [newcomer.id],
    name: "coaching_record_newcomer_id_fkey",
  }),
]);

export const examResult = pgTable("exam_result", {
  id: uuid("id").primaryKey().defaultRandom(),
  newcomerId: uuid("newcomer_id").notNull(),
  courseId: uuid("course_id").notNull(),
  passed: boolean("passed").notNull().default(false),
  score: integer("score"),
  takenAt: customTimestamptz("taken_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  foreignKey({
    columns: [table.newcomerId],
    foreignColumns: [newcomer.id],
    name: "exam_result_newcomer_id_fkey",
  }),
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [course.id],
    name: "exam_result_course_id_fkey",
  }),
]);

export const courseLearning = pgTable("course_learning", {
  id: uuid("id").primaryKey().defaultRandom(),
  newcomerId: uuid("newcomer_id").notNull(),
  itemId: uuid("item_id").notNull(),
  learnedAt: customTimestamptz("learned_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  uniqueIndex("uq_course_learning_newcomer_item").on(table.newcomerId, table.itemId),
  foreignKey({
    columns: [table.newcomerId],
    foreignColumns: [newcomer.id],
    name: "course_learning_newcomer_id_fkey",
  }),
  foreignKey({
    columns: [table.itemId],
    foreignColumns: [courseItem.id],
    name: "course_learning_item_id_fkey",
  }),
]);

export const courseQuiz = pgTable("course_quiz", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull(),
  question: varchar("question", { length: 500 }).notNull(),
  options: text("options").array().notNull(),
  answer: varchar("answer", { length: 255 }).notNull(),
  sort: integer("sort").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [course.id],
    name: "course_quiz_course_id_fkey",
  }),
]);

export const courseItem = pgTable("course_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  sort: integer("sort").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [course.id],
    name: "course_item_course_id_fkey",
  }),
]);

export const course = pgTable("course", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 100 }).notNull(),
  keyPoints: varchar("key_points", { length: 500 }).notNull(),
  requirement: varchar("requirement", { length: 255 }).notNull(),
  sort: integer("sort").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
});

export const taskRecord = pgTable("task_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  newcomerId: uuid("newcomer_id").notNull(),
  taskId: uuid("task_id").notNull(),
  completedAt: customTimestamptz("completed_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
}, (table) => [
  uniqueIndex("uq_task_record_newcomer_task").on(table.newcomerId, table.taskId),
  foreignKey({
    columns: [table.newcomerId],
    foreignColumns: [newcomer.id],
    name: "task_record_newcomer_id_fkey",
  }),
  foreignKey({
    columns: [table.taskId],
    foreignColumns: [challengeTask.id],
    name: "task_record_task_id_fkey",
  }),
]);

export const challengeTask = pgTable("challenge_task", {
  id: uuid("id").primaryKey().defaultRandom(),
  stage: varchar("stage", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  standard: varchar("standard", { length: 255 }).notNull(),
  dueDay: integer("due_day").notNull(),
  sort: integer("sort").notNull().default(0),
  unlockNextStage: boolean("unlock_next_stage").notNull().default(false),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
});

export const newcomer = pgTable("newcomer", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  position: varchar("position", { length: 50 }).notNull(),
  hireDate: date("hire_date").notNull(),
  mentor: uuid("mentor"),
  goalContract: text("goal_contract"),
  status: varchar("status", { length: 50 }).notNull().default('active'),
  firstDealDate: date("first_deal_date"),
  userId: uuid("user_id"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: uuid("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: uuid("_updated_by"),
});

// table aliases
export const assessmentRecordTable = assessmentRecord;
export const authzPermissionsTable = authzPermissions;
export const authzRolePermissionsTable = authzRolePermissions;
export const challengeTaskTable = challengeTask;
export const coachingRecordTable = coachingRecord;
export const courseTable = course;
export const courseItemTable = courseItem;
export const courseLearningTable = courseLearning;
export const courseMaterialTable = courseMaterial;
export const courseQuizTable = courseQuiz;
export const defenseApplicationTable = defenseApplication;
export const examResultTable = examResult;
export const kbItemTable = kbItem;
export const newcomerTable = newcomer;
export const newcomerApplicationTable = newcomerApplication;
export const opportunityTable = opportunity;
export const reviewRecordTable = reviewRecord;
export const stageCatalogTable = stageCatalog;
export const taskRecordTable = taskRecord;
