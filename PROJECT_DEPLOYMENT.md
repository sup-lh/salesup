---
name: salesup-project-deployment
description: 识别 SalesUp 的系统模块与运行依赖，在新克隆的仓库中完成本地 Docker 部署、数据初始化、健康检查、登录验收和故障处理。仅处理项目模块与部署，不包含 UI、编码、热更新或功能开发指导。
---

# SalesUp 项目模块与部署协议

## 任务目标

接手 SalesUp 仓库后，先理解系统模块和依赖关系，再将完整系统部署为可访问、可登录的本地实例。

只有以下条件全部满足才算部署完成：

- Web、API、PostgreSQL、MinIO 均已运行。
- API 就绪检查返回 `status=ok`。
- 数据库已经迁移，账号与演示数据状态明确。
- 至少一个账号实际登录成功。
- 没有覆盖已有配置、业务数据或数据卷。

## 适用边界

本协议只处理：

- 系统模块识别。
- Docker Compose 本地部署。
- 环境变量、数据库迁移、账号和演示数据初始化。
- 健康检查、登录验收、日志排错、停止与数据保护。

本协议不处理：

- UI 风格、组件、页面视觉和交互动效。
- 功能设计、代码修改、依赖升级、测试编写或热更新开发。
- 公网暴露、云服务器购买、域名、证书或正式生产上线。
- 未经确认的数据清理、账号重置或数据卷删除。

如果用户要求生产上线，应停止套用本地流程，改用 `infra/docker-compose.production.yml`，并单独确认域名、HTTPS、密钥管理、备份和网络策略。

## 项目模块

### 业务模块

| 模块 | 主要职责 | 后端位置 |
| --- | --- | --- |
| 新人工作台 | 汇总个人培养进度、任务和关键提醒 | `server/modules/workbench` |
| 闯关任务 | 阶段任务、完成记录和解锁规则 | `server/modules/challenge` |
| 课程考核 | 课程、小节、资料、题目和考试结果 | `server/modules/course` |
| 带教复盘 | 辅导记录与业务复盘 | `server/modules/coaching-review` |
| 新人管理 | 新人档案、申请、考核记录和培养状态 | `server/modules/newcomer` |
| 转正答辩 | 答辩申请、排期和审批结果 | `server/modules/newcomer/defense*` |
| 商机管理 | 客户商机、金额、阶段和预计日期 | `server/modules/opportunity` |
| 数据看板 | 新人成长和管理统计 | `server/modules/dashboard` |
| 销售知识库 | 行业资料、销售方法和案例 | `server/modules/knowledge-base` |
| 阶段配置 | 培养阶段、天数和通关标准 | `server/modules/stage` |
| 通知中心 | 用户通知、已读状态和提醒 | `server/modules/notifications` |

### 系统模块

| 模块 | 主要职责 | 后端位置 |
| --- | --- | --- |
| 认证与账号 | 登录、登出、Session、密码和用户管理 | `server/modules/auth` |
| 角色与权限 | RBAC、角色配置和接口权限判断 | `server/modules/permission`、`server/modules/role-manager` |
| 数据库 | PostgreSQL 连接、Schema 和迁移 | `server/database` |
| 文件存储 | MinIO 文件上传、下载和存储检查 | `server/modules/storage` |
| 健康检查 | API 存活、数据库与对象存储就绪检查 | `server/modules/health` |

### 部署模块

| 服务 | 作用 | 默认本地端口 |
| --- | --- | --- |
| `web` | Nginx 托管 React 静态文件并代理 `/api` | `8080` |
| `api` | NestJS 业务 API；启动时自动执行幂等迁移 | 仅 Compose 内部 `3000` |
| `postgres` | 业务数据库 | `5432` |
| `minio` | 对象存储与管理控制台 | `9000`、`9001` |

依赖顺序：PostgreSQL 与 MinIO 健康后启动 API，API 健康后启动 Web。

## 部署前读取

按顺序读取：

1. 本文件：模块、决策和验收标准。
2. `.env.docker.example`：本地环境变量模板。
3. `infra/docker-compose.yml`：服务、端口、依赖和数据卷。
4. `infra/docker/Dockerfile.api`：API 构建和迁移入口。
5. `infra/nginx/default.conf`：Web 与 API 的代理关系。

若实际文件与本文档不一致，以当前 Compose 和代码为准，并在交付结果中指出差异。

## 部署决策

### 环境文件

- `.env.docker` 不存在：从 `.env.docker.example` 复制。
- `.env.docker` 已存在：保留原文件，只检查变量，不得整体覆盖。
- 本地通过 HTTP 访问时保持 `NODE_ENV=development`，否则登录 Cookie 可能因 Secure 属性无法写入。
- `.env.docker` 已被 Git 忽略，严禁提交真实凭据。

### 数据初始化

- 空数据库：创建管理员；需要展示完整系统时导入演示数据。
- 已有用户但没有业务数据：先列出账号，确认同名管理员是否允许重置。
- 已有业务数据：默认不创建管理员、不导入演示数据。
- 无法确认：先执行只读查询，禁止通过清空数据重新开始。

### 端口冲突

- 端口由本项目已有容器占用：复用或正常重建本项目容器。
- 端口由其他程序占用：调整 `.env.docker` 中对应端口。
- 不得停止或删除来源不明的进程、容器和数据卷。

## 标准部署流程

### 1. 克隆仓库

私有仓库需要 GitHub 协作者权限和可用的 SSH Key：

```bash
git clone git@github.com:sup-lh/salesup.git
cd salesup
```

### 2. 检查 Docker

```bash
docker --version
docker compose version
docker info
```

- 命令不存在：停止，说明需要安装 Docker Desktop。
- `docker info` 失败：停止，提示启动 Docker Desktop。
- 三项成功后才能继续。

### 3. 准备环境文件

```bash
test -f .env.docker || cp .env.docker.example .env.docker
```

确认至少包含：

```env
NODE_ENV=development
APP_BASE_URL=http://localhost:8080
POSTGRES_DB=newcomer
POSTGRES_USER=newcomer
POSTGRES_PASSWORD=<local-database-password>
MINIO_ROOT_USER=<local-storage-user>
MINIO_ROOT_PASSWORD=<local-storage-password>
STORAGE_BUCKET=newcomer
SESSION_SECRET=<local-session-secret>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<local-admin-password>
ADMIN_DISPLAY_NAME=系统管理员
DEMO_PASSWORD=<local-demo-password>
```

模板里的默认值只适用于本机演示。如果系统将被其他人访问，先更换数据库、MinIO、Session、管理员和演示账号密码。

### 4. 解析配置

在启动前检查 Compose 能否正确解析：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml config >/dev/null
```

失败时先修复缺失变量、无效格式或路径问题，不要跳过检查。

### 5. 构建并启动

只依赖 Docker 的标准命令：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml up -d --build
```

API 容器启动时自动运行数据库迁移，无需在宿主机安装 Node.js 或重复运行迁移命令。

### 6. 等待服务就绪

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml ps
```

期望状态：

- `postgres`：healthy
- `minio`：healthy
- `api`：healthy
- `web`：running

容器处于 `starting` 时允许短间隔复查。出现 `unhealthy`、`exited` 或重启循环时，先读取日志：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml \
  logs --tail=200 api postgres minio web
```

### 7. 判断数据状态

执行只读统计：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT (SELECT count(*) FROM users), (SELECT count(*) FROM newcomer);"'
```

结果解释：

- `0|0`：空库，可初始化管理员和演示数据。
- 第一项大于 `0`、第二项等于 `0`：已有账号，初始化前先核对。
- 第二项大于 `0`：已有业务数据，默认跳过初始化。
- 表不存在：迁移未完成，检查 API 日志。

列出现有账号：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT username, display_name, status FROM users ORDER BY created_at;"'
```

### 8. 初始化空库

创建管理员：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml exec -T \
  api node server/database/migrations/create-admin.mjs
```

该命令读取 `.env.docker` 中的 `ADMIN_*`。如果同名账号已经存在，会更新密码；因此只有空库或明确允许重置时才能执行。

需要完整演示数据时执行：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml exec -T \
  api node server/database/migrations/seed-demo.mjs
```

演示数据包含新人、任务、课程、考试、带教、复盘、商机、答辩、知识库和通知。生产环境禁止执行该命令。

默认账号：

| 角色 | 用户名 | 密码来源 |
| --- | --- | --- |
| 管理员 | `admin` | `.env.docker` 的 `ADMIN_PASSWORD` |
| 经理 | `demo-manager` | `.env.docker` 的 `DEMO_PASSWORD` |
| 导师 | `demo-mentor-li` | `.env.docker` 的 `DEMO_PASSWORD` |
| 新人 | `demo-zhang-yue` | `.env.docker` 的 `DEMO_PASSWORD` |

### 9. 验收

检查完整依赖链：

```bash
curl -fsS http://localhost:8080/api/health/ready
```

期望返回：

```json
{"status":"ok","checks":{"database":"ok","storage":"ok"}}
```

然后完成登录验收：

1. 打开 `http://localhost:8080`。
2. 确认显示 SalesUp 登录页，而不是空白页或 Nginx 错误页。
3. 使用管理员或演示账号登录。
4. 确认进入对应角色的系统模块。
5. 再次检查 Compose 状态，确保容器没有重启循环。

AI Agent 的最终报告必须包含：应用地址、四个服务的状态、健康接口结果、实际验证的账号角色、是否导入演示数据，以及仍存在的警告。

## 故障处理顺序

按依赖关系从底层向上排查：

1. Docker daemon。
2. PostgreSQL。
3. MinIO。
4. 数据库迁移与 NestJS API。
5. Nginx 反向代理。
6. 登录 Cookie 与角色权限。

常见问题：

- 本地登录后仍回到登录页：确认 `NODE_ENV=development`，本地 HTTP 不能使用 Secure Cookie。
- API 无法连接数据库：容器内数据库地址必须指向 `postgres:5432`。
- MinIO 就绪失败：核对 `STORAGE_*` 与 `MINIO_ROOT_*` 凭据。
- 容器名冲突：用 `docker ps -a` 判断是否为旧的本项目容器，不得直接删除未知容器。
- 修改环境变量未生效：重新执行 `up -d --build`，然后核对日志和容器状态。
- 页面出现 502：先确认 API 是否 healthy，再检查 `infra/nginx/default.conf` 的代理目标。

## 停止与数据保护

停止服务但保留 PostgreSQL 和 MinIO 数据：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml down
```

日常更新后重新构建：

```bash
git pull
docker compose --env-file .env.docker -f infra/docker-compose.yml up -d --build
```

以下命令会删除数据库和对象存储数据卷。除非用户明确要求清空数据并确认不可恢复，否则禁止执行：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml down -v
```

## 完成标准

- 已识别业务、系统和部署模块。
- `.env.docker` 存在且适用于本地 HTTP，未提交到 Git。
- Compose 配置解析成功。
- 四个服务达到预期状态。
- `/api/health/ready` 返回 `status=ok`。
- 账号和业务数据状态明确，没有擅自覆盖。
- 至少一个账号实际登录成功。
- 应用地址、账号来源、停止命令和警告已交付。
