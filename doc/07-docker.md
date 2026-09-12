# 07. Docker 基础设施

## 当前范围

当前 Compose 启动独立版完整链路：

- PostgreSQL 16。
- MinIO 对象存储。
- NestJS API（容器启动时自动执行幂等迁移）。
- Nginx Web 静态站点，并将 `/api/*` 反向代理到 API。

MinIO 使用官方 `quay.io/minio/minio` 镜像。当前 OrbStack 配置的 Docker Hub 镜像源会拒绝 `minio/minio`，因此不要改回 Docker Hub 地址。

基础设施配置统一位于 `infra/`：Compose 文件在 `infra/` 根目录，镜像定义位于 `infra/docker/`，Nginx 配置位于 `infra/nginx/`。API 和 Web 镜像完全独立构建，NestJS 不再打包或托管前端静态文件。

## 启动

1. 复制 `.env.docker.example` 为 `.env.docker`。
2. 执行 `npm run docker:up`。
3. 执行 `npm run docker:ps`。

需要演示数据时执行 `npm run db:seed-demo`。演示账号统一使用 `Demo-SalesUp-2026!`，生产环境不要执行该脚本。

默认地址：

- PostgreSQL：localhost:5432
- MinIO API：http://localhost:9000
- MinIO 控制台：http://localhost:9001
- 应用入口：http://localhost:8080

## 停止

`npm run docker:down`

停止不会删除数据卷。PostgreSQL 与 MinIO 的实时数据使用 Docker 命名卷，不写入源码目录。清理本地开发数据前，必须明确执行 `docker compose --env-file .env.docker -f infra/docker-compose.yml down -v`。

备份脚本默认将可恢复文件写入项目根目录的 `backups/postgres/` 和 `backups/minio/`。该目录不会提交到 Git。

## 生产注意事项

- 必须替换示例密码。
- 不要把 .env.docker 提交到 Git。
- PostgreSQL 和 MinIO 不应直接暴露到公网。
- 生产环境应使用备份、TLS、密钥管理和限制后的网络访问。
