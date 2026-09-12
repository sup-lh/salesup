# 销售新人培养管理系统

基于 React、NestJS、PostgreSQL 与 MinIO 的前后端分离应用。项目采用单仓库管理，前端、后端、共享契约与部署配置保持独立边界。

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

## 本地开发

```bash
npm install
npm run dev
```

前端由 Vite 启动，`/api` 请求代理到本地 NestJS 服务。

## Docker 完整环境

```bash
cp .env.docker.example .env.docker
npm run docker:up
npm run docker:ps
```

应用默认地址为 `http://localhost:8080`。停止容器执行 `npm run docker:down`，该命令不会删除数据卷。

## 质量检查

```bash
npm run type:check
npm run lint
npm test -- --runInBand
npm run build:prod
```
