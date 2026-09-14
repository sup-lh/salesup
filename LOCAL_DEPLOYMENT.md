---
name: salesup-local-deployment
description: 在新克隆的 SalesUp 仓库中判断本机条件，初始化本地开发环境，启动完整服务，创建账号，按需导入演示数据，并通过健康检查与登录完成验收。仅适用于本地开发和演示，不用于公网生产部署。
---

# SalesUp 本地部署 Agent 工作协议

## 目标

接手一个新克隆的 SalesUp 仓库后，将其可靠地启动为可访问、可登录、可继续开发的本地环境。执行者可以是开发者，也可以是 AI 编程 Agent。

完成不等于“容器命令没有报错”。只有 Web、API、PostgreSQL、MinIO 均正常，健康接口通过，并至少验证一个账号能够登录，任务才算完成。

## 适用边界

- 默认使用 Docker Compose 启动完整链路，宿主机只需 Git 和 Docker Desktop。
- 默认环境为 `NODE_ENV=development`，访问地址为 `http://localhost:8080`。
- 需要前后端热更新时，才切换到“基础设施容器 + 宿主机 Node.js”模式。
- 本协议不授权清空数据卷、覆盖已有 `.env.docker`、修改用户已有密码、开放公网端口或执行生产上线。
- 公网部署必须另行使用 `infra/docker-compose.production.yml`，并配置域名、HTTPS、强密钥和备份。

## 开始前必须读取

依次检查以下文件，不要根据通用经验猜测项目命令：

1. `README.md`：项目结构和命令入口。
2. `.env.docker.example`：本地环境变量模板。
3. `infra/docker-compose.yml`：本地服务、端口、依赖和数据卷。
4. 本文件：部署决策、执行顺序和验收标准。

## 决策逻辑

### 选择运行模式

优先选择完整 Docker 模式，除非用户明确要求热更新开发。

| 场景 | 运行方式 | 应用入口 |
| --- | --- | --- |
| 首次验收、朋友本机使用、AI 自动部署 | 完整 Docker Compose | `http://localhost:8080` |
| 修改前端或后端并实时查看 | PostgreSQL/MinIO 使用 Docker，React/NestJS 在宿主机运行 | `http://localhost:5173` |
| 公网或正式生产 | 停止执行本协议，转入生产部署设计 | HTTPS 域名 |

### 判断是否初始化数据

- `.env.docker` 不存在：从模板复制。
- `.env.docker` 已存在：保留原文件，只检查必要变量，不得覆盖。
- 空数据库或明确需要演示环境：创建管理员并导入演示数据。
- 已有业务数据：不要自动执行管理员重置；演示数据仅在用户确认需要时导入。
- 无法确认数据库是否为空：先查询 `users` 和核心业务表数量，再决定，禁止用删除数据重新开始。

## 标准执行流程：完整 Docker 模式

### 1. 获取仓库

私有仓库需要 GitHub 协作者权限和可用的 SSH Key：

```bash
git clone git@github.com:sup-lh/salesup.git
cd salesup
```

进入仓库后确认分支和工作区：

```bash
git status --short --branch
```

如果工作区已有改动，视为用户数据；继续操作时不得覆盖或丢弃这些改动。

### 2. 检查宿主机

```bash
docker --version
docker compose version
docker info
```

判断规则：

- 命令不存在：停止并说明需要安装 Docker Desktop。
- `docker info` 失败：提示启动 Docker Desktop，然后重新检查。
- 端口 `5432`、`8080`、`9000` 或 `9001` 被占用：先识别占用者。属于本项目的容器则复用；属于其他程序则修改 `.env.docker` 的对应端口，不要结束不明进程。

### 3. 准备本地环境

仅在文件不存在时复制：

```bash
test -f .env.docker || cp .env.docker.example .env.docker
```

必须确认：

```env
NODE_ENV=development
APP_BASE_URL=http://localhost:8080
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<local-admin-password>
ADMIN_DISPLAY_NAME=系统管理员
DEMO_PASSWORD=<local-demo-password>
```

新复制的模板已经包含本地默认值。对于旧的 `.env.docker`，只补充缺失变量，不要整文件覆盖；如果已有数据，还要先确认是否允许重置同名管理员密码。`.env.docker` 只用于本机且已被 Git 忽略，不得把真实密码、Session Secret 或生产凭据提交到仓库。

### 4. 构建并启动

有 Node.js 时可使用项目命令：

```bash
npm run docker:up
```

没有 Node.js 时执行等价命令：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml up -d --build
```

API 镜像启动时会自动运行幂等数据库迁移，不需要在宿主机重复执行 `npm run db:migrate`。

### 5. 等待服务就绪

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml ps
```

PostgreSQL、MinIO、API 应显示为 `healthy`，Web 应显示为 `running`。服务尚在启动时应短间隔重新查询，而不是立即判定失败。

若 API 未健康，读取日志：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml logs --tail=200 api postgres minio
```

### 6. 判断数据状态

迁移完成后读取现有数据量：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT (SELECT count(*) FROM users), (SELECT count(*) FROM newcomer);"'
```

结果解释：

- `0|0`：空库，可以创建本地管理员；需要展示系统时再导入演示数据。
- 用户表已有记录、业务表为空：先列出现有用户名，避免覆盖同名管理员。
- 业务表已有记录：视为已有环境，默认不初始化账号、不导入演示数据。
- 查询失败：先检查 API 迁移日志，不得以删除数据卷作为修复手段。

需要确认账号时执行只读查询：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT username, display_name, status FROM users ORDER BY created_at;"'
```

### 7. 初始化账号与演示数据

只在空库或明确需要重置本地管理员时执行：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml exec -T \
  api node server/database/migrations/create-admin.mjs
```

该命令使用 `.env.docker` 中的 `ADMIN_USERNAME`、`ADMIN_PASSWORD` 和 `ADMIN_DISPLAY_NAME`。同名管理员已存在时会更新其密码，因此不得在不确认影响的情况下对已有环境执行。

本地演示环境按需导入数据：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml exec -T \
  api node server/database/migrations/seed-demo.mjs
```

演示种子可重复执行，会补齐或更新固定演示记录。不要在生产环境执行。

默认本地账号：

| 角色 | 用户名 | 密码来源 |
| --- | --- | --- |
| 管理员 | `admin` | `.env.docker` 的 `ADMIN_PASSWORD` |
| 经理 | `demo-manager` | `.env.docker` 的 `DEMO_PASSWORD` |
| 导师 | `demo-mentor-li` | `.env.docker` 的 `DEMO_PASSWORD` |
| 新人 | `demo-zhang-yue` | `.env.docker` 的 `DEMO_PASSWORD` |

### 8. 验收

先验证完整依赖链：

```bash
curl -fsS http://localhost:8080/api/health/ready
```

期望结果：

```json
{"status":"ok","checks":{"database":"ok","storage":"ok"}}
```

然后验证页面和登录：

1. 打开 `http://localhost:8080`，确认不是 Nginx 错误页或空白页。
2. 使用管理员或任一演示账号登录。
3. 确认登录后能进入对应角色页面，浏览器未因 Secure Cookie 陷入反复登录。
4. 再次运行 Compose `ps`，确认没有容器处于重启循环。

AI Agent 应把实际健康结果、成功登录的账号角色、应用地址和任何剩余警告报告给用户；不能只回复“已经启动”。

## 热更新开发模式

仅在需要修改代码并实时预览时使用。此模式要求 Node.js 22+ 和 npm 10+。

启动基础设施：

```bash
test -f .env.docker || cp .env.docker.example .env.docker
docker compose --env-file .env.docker -f infra/docker-compose.yml up -d postgres minio
```

把本地环境变量加载到当前终端，再安装依赖和初始化数据库：

```bash
set -a
source .env.docker
set +a
npm install
npm run db:migrate
```

根据前文的数据判断逻辑，按需执行：

```bash
npm run db:create-admin
npm run db:seed-demo
```

启动 React 与 NestJS：

```bash
npm run dev
```

前端访问 `http://localhost:5173`，Vite 会把 `/api` 代理到 `http://localhost:3000`。

## 故障处理顺序

按依赖链从底层向上排查：

1. Docker daemon 是否运行。
2. PostgreSQL 与 MinIO 是否健康。
3. API 是否完成迁移并通过就绪检查。
4. Nginx 是否能访问 API。
5. 浏览器 Cookie 和角色权限是否正常。

常见判断：

- 登录接口成功但浏览器仍未登录：检查 `NODE_ENV` 是否错误地设为 `production`；本地 HTTP 下不能使用 Secure Cookie。
- API 连接数据库失败：检查容器内 `DATABASE_URL` 是否指向 `postgres:5432`，宿主机模式是否指向 `localhost:5432`。
- MinIO 检查失败：检查凭据是否与 Compose 中的 `MINIO_ROOT_*` 一致。
- 容器名冲突：先用 `docker ps -a` 判断是否为本项目旧容器，不得直接删除未知容器或数据卷。
- 修改 `.env.docker` 后没有生效：重新执行 Compose `up -d --build`，并核对容器实际环境与日志。

## 停止与数据保护

正常停止并保留数据：

```bash
npm run docker:down
```

或：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml down
```

PostgreSQL 和 MinIO 使用 Docker 命名卷。除非用户明确要求清空本地数据并确认不可恢复，否则禁止执行：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml down -v
```

## 完成标准

以下条件必须全部满足：

- `.env.docker` 存在且为开发模式，未污染 Git。
- 四个服务已启动，数据库、对象存储和 API 健康。
- `/api/health/ready` 返回 `status=ok`。
- 管理员或演示账号至少有一个实际登录成功。
- 应用地址、账号来源和停止命令已交付给用户。
- 未删除或覆盖已有数据、环境文件与用户代码改动。
