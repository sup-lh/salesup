# 销售新人培养管理系统

基于 React、NestJS、PostgreSQL 与 MinIO 的销售新人培养管理系统。项目采用单仓库管理，前端、后端、共享契约与部署配置保持独立边界。

## 系统模块

- 新人端：工作台、闯关任务、课程考核、知识库、转正答辩。
- 管理端：新人管理、任务与阶段配置、课程与题库、带教复盘、商机、答辩和数据看板。
- 系统能力：本地账号、Session、角色权限、通知、文件存储和健康检查。
- 部署服务：Nginx Web、NestJS API、PostgreSQL、MinIO。

## 目录结构

```text
.
├── client/                  # React 前端应用
├── server/                  # NestJS API 与领域模块
├── shared/                  # 前后端共享 TypeScript 契约
├── infra/
│   ├── docker/              # Web/API 镜像定义
│   ├── nginx/               # Web 网关配置
│   ├── docker-compose.yml
│   └── docker-compose.production.yml
├── scripts/                 # 构建、迁移、备份与恢复脚本
├── backups/                 # 本地备份输出，不提交 Git
└── doc/                     # 架构、迁移与毕业设计文档
```

PostgreSQL 和 MinIO 的实时数据由 Docker 命名卷管理，不存放在源码目录中。

## 本地部署

```bash
cp .env.docker.example .env.docker
npm run docker:up
npm run docker:ps
```

容器启动时会自动执行数据库迁移。首次启动后还需要根据数据库状态决定是否创建管理员和导入演示数据。

完整的模块说明、部署逻辑、验收标准和故障处理见 [PROJECT_DEPLOYMENT.md](./PROJECT_DEPLOYMENT.md)。该文档可直接交给 AI Agent 执行。

停止容器执行 `npm run docker:down`，该命令不会删除数据卷。
