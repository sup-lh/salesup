# 00. 当前状态审计

## 结论

当前项目已经是 React + NestJS 的前后端分离应用，但运行时深度依赖妙搭/飞书平台。业务模块大部分可以复用，不建议因为脱离妙搭而重写成 Spring。

## 可复用部分

- React 页面、表单、表格和业务交互。
- NestJS 业务模块及大部分 Service 查询逻辑。
- Drizzle ORM 查询模式。
- shared/ 下的领域类型和 API DTO。
- 新人、阶段、任务、课程、考试、辅导、转正、机会点、知识库和看板业务。
- 现有权限 action/subject 命名，例如 manage:Newcomer。

## 必须替换部分

### 后端

- PlatformModule 和 configureApp。
- DRIZZLE_DATABASE 注入令牌。
- AuthNPaasService 用户目录查询。
- AuthorizationSDK 角色和成员管理。
- @Can、@NeedLogin 以及 req.userContext 的平台实现。
- CapabilityService 和飞书消息 capability。
- 妙搭生成的 view fallback 中的平台数据注入。

### 前端

- @lark-apaas/client-toolkit 的认证、用户、日志、HTTP、文件和应用壳。
- useAuth、useCan、<Can>、useCurrentUserProfile、useAppInfo。
- Dataloom 文件存储。
- 飞书用户、部门、群聊和用户选择器。
- 飞书文档、妙记等内容源。

## 数据库审计

table.sql 包含约 19 张业务/权限表、索引和外键，但不是完整独立 PostgreSQL 恢复包：

- 对象位于 workspace_aadktftwa24hw Schema。
- 使用妙搭自定义 user_profile 类型。
- 默认值依赖 current_setting('app.user_id')。
- 文件中没有 CREATE SCHEMA、CREATE TYPE、INSERT 或 COPY 数据段。

因此它应作为迁移参考，不应直接在新数据库执行。

## 当前风险

1. 若先删除平台依赖，NestJS 依赖注入会在启动时失败。
2. 若直接改数据库字段，现有业务查询和数据映射会同时失效。
3. 若保留管理员页面但删除 AuthorizationSDK，角色管理路由无法启动。
4. 若删除 Dataloom 而不提供替代存储，文件上传功能会失效。
5. 现有导出文件没有业务数据，不能单独完成数据迁移。
