# 06. 部署与验证

## 第一阶段部署形态

    infra/docker-compose.yml (local)
    infra/docker-compose.production.yml (production)
      ├── postgres
      ├── minio
      ├── api
      └── web/nginx

## 必需环境变量

    DATABASE_URL
    SESSION_SECRET
    APP_BASE_URL
    STORAGE_DRIVER
    STORAGE_BUCKET
    STORAGE_ENDPOINT
    STORAGE_ACCESS_KEY
    STORAGE_SECRET_KEY

生产环境不提交 .env，使用服务器密钥管理或部署平台的 Secret。

## 验证层次

1. TypeScript 类型检查。
2. 单元测试：认证、权限、核心领域规则。
3. API 集成测试：登录、权限、业务 CRUD。
4. 数据迁移回归：关键查询和统计结果。
5. 浏览器验收：新人、导师、经理、管理员四类角色。
6. 备份恢复演练：`scripts/backup-postgres.sh`、`scripts/restore-postgres.sh`、`scripts/backup-minio.sh`、`scripts/restore-minio.sh`。

## 上线门槛

- 无任何运行时 @lark-apaas import。
- 无浏览器直连数据库。
- 数据库迁移可重复执行。
- Session、权限拒绝和审计日志可验证。
- 文件上传和下载可用。
- 飞书通知删除或替换完成。
- 生产 Compose 不暴露数据库和对象存储端口，API 仅通过内部网络访问。
- `SESSION_SECRET`、数据库和存储凭据由外部 Secret 注入，不能使用示例默认值。

## 恢复演练

1. 使用 `infra/docker-compose.production.yml` 启动一次 disposable 环境。
2. 运行 `DATABASE_URL=... scripts/backup-postgres.sh` 和 `STORAGE_* scripts/backup-minio.sh`。
3. 在隔离数据库执行 `DATABASE_URL=... scripts/restore-postgres.sh ./backups/postgres/<file>.dump`。
4. 设置 `RESTORE_CONFIRM=RESTORE_MINIO` 后执行 `scripts/restore-minio.sh ./backups/minio/<bucket>`。
5. 调用 `/api/health/ready`、登录、上传下载接口并核对业务记录。
6. 销毁 disposable 环境，保留演练日志和校验摘要。
