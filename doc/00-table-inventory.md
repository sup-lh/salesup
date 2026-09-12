# 数据库表清单

该清单从 table.sql 的 DDL 提取，仅用于迁移规划。它不代表当前数据库中已有数据。

## 业务表

1. newcomer
2. challenge_task
3. task_record
4. course
5. course_item
6. course_quiz
7. course_learning
8. exam_result
9. coaching_record
10. review_record
11. assessment_record
12. course_material
13. opportunity
14. kb_item
15. newcomer_application
16. stage_catalog
17. defense_application

## 权限表

18. authz_permissions
19. authz_role_permissions

## 迁移重点

- newcomer 及其 user_id、mentor 字段需要映射到独立 users 表。
- 所有 _created_by、_updated_by 字段需要移除妙搭 user_profile 类型。
- task_record、course_learning 的唯一索引必须保留。
- 课程、任务、辅导、面试和机会点的外键关系需要在独立 DDL 中复现。
- authz 表可以作为权限数据迁移来源，但成员关系需要独立设计。

## 数据状态

当前 table.sql 未发现 INSERT 或 COPY 段，因此数据迁移仍需要单独导出文件。
