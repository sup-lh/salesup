# 独立化迁移文档

本目录记录当前妙搭应用脱离飞书/妙搭后的独立化迁移方案、阶段边界、决策依据和执行状态。

## 文档导航

- [本地部署与 AI Agent 指南](../DEPLOYMENT.md)
- [现状审计](./00-current-state.md)
- [数据库表清单](./00-table-inventory.md)
- [目标架构](./01-target-architecture.md)
- [数据库迁移](./02-database-migration.md)
- [数据库基础 SQL 草案](./sql/README.md)
- [认证与权限](./03-auth-rbac.md)
- [平台能力替换](./04-platform-decoupling.md)
- [前端迁移](./05-frontend-migration.md)
- [部署与验证](./06-deployment.md)
- [Docker 基础设施](./07-docker.md)
- [决策记录](./DECISIONS.md)
- [执行计划](./PLAN.md)
- [待办清单](./TODO.md)

## 当前原则

1. 保留 React + NestJS + Drizzle 的技术路线。
2. React 只访问后端 API，不直接连接 PostgreSQL。
3. 先建立独立基础设施，再逐步替换妙搭依赖。
4. 不直接执行 table.sql；它需要补齐自定义类型、Schema 和数据迁移。
5. 迁移过程中保持业务 API 尽量稳定，降低页面重写范围。

## 状态约定

- 未开始：尚未处理。
- 进行中：正在实现或验证。
- 已完成：代码、文档和验证均完成。
- 阻塞：需要外部信息或用户决策。
