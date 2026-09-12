# 基础设施配置

本目录集中维护 Web、API、PostgreSQL 与 MinIO 的容器化部署配置。

## 本地完整环境

在项目根目录执行：

```bash
npm run docker:up
npm run docker:ps
npm run docker:down
```

PostgreSQL 与 MinIO 使用 Docker 命名卷持久化。`docker:down` 不会删除数据；只有显式执行 `docker compose down -v` 才会删除数据卷。

## 生产配置检查

```bash
docker compose --env-file .env.production \
  -f infra/docker-compose.production.yml config
```

生产环境必须通过外部 Secret 注入密码与密钥，不应使用本地示例配置。
