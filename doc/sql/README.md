# SQL 草案说明

这里的 SQL 文件是独立化迁移的设计草案，不是当前应用启动时自动执行的迁移。

## 0001-independent-foundation.sql

该文件只覆盖独立版基础设施：

- users
- roles
- permissions
- user_roles
- role_permissions
- sessions
- audit_log

它没有创建业务表，也没有导入妙搭业务数据。

正式执行前需要确认：

1. PostgreSQL 是否已启用 gen_random_uuid 所需扩展。
2. 用户名、邮箱和登录策略。
3. 角色与现有 authz 表的映射。
4. 密码哈希算法和初始管理员创建方式。
5. 是否保留 audit_log 以及日志保留周期。

## 执行顺序

设置 DATABASE_URL 后执行 npm run db:migrate。脚本会先创建独立基础表和权限种子，再执行业务 DDL。它不会导入妙搭历史数据。

初始化管理员账号时设置 ADMIN_USERNAME、ADMIN_PASSWORD、ADMIN_DISPLAY_NAME，再执行 npm run db:create-admin。密码只通过环境变量传入，脚本不会输出密码。
