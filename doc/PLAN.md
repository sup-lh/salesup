# 独立化迁移执行计划

## 总目标

将当前妙搭应用迁移为可独立运行的 React + NestJS + PostgreSQL 系统，保留核心业务，移除飞书/妙搭运行时依赖。

## 阶段 0：基线与冻结

状态：已完成

- [x] 创建迁移文档目录。
- [x] 完成当前代码和 table.sql 审计。
- [x] 明确不让 React 直连数据库。
- [x] 明确暂不切换 Spring。
- [x] 形成独立化默认决策，见 DECISIONS.md。
- [x] 提取 table.sql 的表清单和迁移重点。
- [x] 确认 PostgreSQL、MinIO 和站内通知作为独立版基础设施。
- [x] 确认独立版从空数据库开始，不迁移历史业务数据。

交付物：审计文档、迁移边界、决策记录。

## 阶段 1：独立数据库基础

状态：已完成（数据库基础与独立认证闭环已验证）

- [x] 建立独立 PostgreSQL 连接配置。
- [x] 建立 Drizzle DatabaseModule 和 provider。
- [x] 将 DRIZZLE_DATABASE 替换为自有数据库 token（兼容桥）。
- [x] 生成独立 DDL，不直接执行原始 table.sql。
- [x] 设计 users、sessions、roles、permissions 等基础表。
- [x] 完成独立数据库基础表和字段映射设计。
- [x] 形成 users、roles、permissions、sessions 基础表 SQL 草案。
- [x] 创建 PostgreSQL + MinIO Docker Compose 基础设施。
- [x] 新增独立 Drizzle 数据库 Schema 和 provider（暂未接管现有业务模块）。
- [x] 安装独立 PostgreSQL 驱动并通过客户端/服务端类型检查。
- [x] 编写可重复生成的独立业务 DDL 生成器。
- [x] 生成独立业务 DDL 并扫描移除妙搭 Schema、用户类型和上下文默认值。
- [x] 增加按顺序执行基础表和业务表的迁移入口。
- [x] 验证独立业务 DDL 在 PostgreSQL 空库执行。
- [x] 新增独立认证模块和 Session/RBAC 接口。
- [x] 使用独立请求上下文字段，避免与旧妙搭 SDK 类型冲突。
- [x] 增加首个管理员账号初始化脚本。
- [x] 增加独立模式下旧业务数据库令牌和用户类型的兼容桥。
- [x] 将现有业务路由切换到独立认证 Guard（兼容旧 metadata key）。

交付物：可重复执行的迁移、初始化和回滚脚本。

## 阶段 2：认证与权限

状态：已完成（浏览器前 API 已验证）

- [x] 增加登录、登出、当前用户接口。
- [x] 增加 Session 中间件和 req.userContext 兼容桥。
- [x] 实现登录和密码安全策略。
- [x] 实现自有 NeedLogin Guard。
- [x] 实现自有 Can Guard。
- [x] 实现独立 RoleService，兼容回退 AuthorizationSDK。
- [x] 完成空库登录、/me、角色和权限 API 验证；自动化测试待补。

交付物：独立登录、RBAC 和审计能力。

## 阶段 3：平台适配层

状态：已完成（独立运行时已接管）

- [x] 用 UserDirectoryService 兼容替换 AuthNPaasService。
- [x] 新增 StorageService 和 multipart 上传/删除 API，第一版使用 MinIO。
- [x] 用站内通知替换转正申请飞书消息 capability。
- [x] 删除或改造飞书内容源类型。
- [x] 处理用户、部门、群聊选择器（角色成员仅本地用户）。

交付物：平台能力替换完成，业务 Service 不再直接依赖妙搭 SDK。

## 阶段 4：前端壳和 API

状态：已完成（独立 Vite + 本地组件已接管）

- [x] 替换 axiosForBackend。
- [x] 替换 AppContainer 和 ErrorRender。
- [x] 实现 AuthProvider、PermissionGate 和当前用户 Hook。
- [x] 替换文件上传和外链组件（MinIO multipart 上传）。
- [x] 下线平台专属管理员页面并接入本地账号接口。

交付物：前端可脱离妙搭 SDK 独立运行。

## 阶段 5：部署和初始化

状态：进行中（生产构建已完成，浏览器四角色验收和恢复演练待在目标环境执行）

- [x] 编写 PostgreSQL + MinIO Docker Compose。
- [x] 在 OrbStack 中启动并验证 PostgreSQL/MinIO 容器；MinIO 使用官方 Quay 镜像。
- [x] 将独立 API 和 Web 服务加入 Docker Compose。
- [x] 配置生产环境变量和 Secret 模板、生产 Compose 和启动校验。
- [x] 确认不导入妙搭历史业务数据。
- [x] 执行角色、权限和管理员账号种子。
- [x] 做 API、浏览器和恢复演练脚本；实际浏览器四角色验收需在部署环境运行。
- [x] 删除 @lark-apaas/* 依赖。

## 收尾实施边界（2026-09-12）

- 保留本地账号、Session 和 RBAC，本轮不接入 SSO/OIDC。
- 交付边界为仓库达到上线标准，不操作未提供的外部生产服务器。
- 删除平台双模式，独立 PostgreSQL + MinIO 成为唯一运行时。
- 验收覆盖新人、导师、经理和系统管理员四个内置角色。

交付物：独立部署版本和上线检查报告。

## 执行规则

1. 每个阶段先改文档，再改代码。
2. 每完成一个模块，立即做类型检查或最小可运行验证。
3. 不进行不可逆数据库操作，除非已有备份和明确回滚方案。
4. 在阶段 2 完成前，不删除现有妙搭认证依赖。
