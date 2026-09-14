# SalesUp 部署与本地开发指南

本文档面向第一次拿到仓库的人，也可作为 AI 编程 Agent 的执行说明。默认目标是：在本机以开发者模式启动完整环境，并导入可登录的演示数据。

## 1. 前置条件

- Git 2.30+
- Docker Desktop（启动后确认 `docker info` 可执行）
- macOS、Linux 或 Windows + WSL2

首次本地 Docker 部署不需要安装 Node.js；只有运行 `npm run dev`、类型检查或测试时才需要 Node.js 22+ 和 npm 10+。

## 2. 获取代码

仓库为私有仓库时，先让仓库管理员在 GitHub `Settings → Collaborators` 添加你的账号，然后使用 SSH 或 HTTPS 克隆：

```bash
git clone git@github.com:sup-lh/salesup.git
cd salesup
```

## 3. 一键本地启动（推荐）

在项目根目录执行：

```bash
npm run docker:bootstrap
```

如果本机没有 Node.js，直接执行等价命令：

```bash
./scripts/bootstrap-local.sh
```

脚本会自动完成：

1. 首次复制 `.env.docker.example` 为 `.env.docker`。
2. 使用开发者模式构建并启动 PostgreSQL、MinIO、NestJS API 和 Nginx Web。
3. 等待 `/api/health/ready` 通过。
4. 创建管理员账号（已有账号不会覆盖密码）。
5. 导入课程、任务、新人、商机、辅导和通知等演示数据。

访问 `http://localhost:8080`。默认本地账号来自 `.env.docker`：

| 角色 | 用户名 | 密码 |
| --- | --- | --- |
| 管理员 | `admin` | `SalesUp-Admin-2026!` |
| 经理 | `demo-manager` | `Demo-SalesUp-2026!` |
| 导师 | `demo-mentor-li` | `Demo-SalesUp-2026!` |
| 新人 | `demo-zhang-yue` | `Demo-SalesUp-2026!` |

本地多人共享时，先编辑 `.env.docker` 中的 `POSTGRES_PASSWORD`、MinIO 密码、`SESSION_SECRET` 和管理员密码；该文件已被 Git 忽略，不能提交。

如果数据库里已经存在 `ADMIN_USERNAME` 对应的账号，脚本只会补齐管理员角色，不会重置密码；需要改密码时，请在系统内修改或显式运行 `npm run db:create-admin`。

## 4. 日常开发

查看服务：

```bash
npm run docker:ps
docker compose --env-file .env.docker -f infra/docker-compose.yml logs -f api
```

停止并保留数据：

```bash
npm run docker:down
```

拉取代码并重建：

```bash
git pull
npm run docker:up
```

清空本地数据库和对象存储（不可逆）：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml down -v
```

## 5. 纯 Node 开发模式

需要热更新时，先启动 PostgreSQL 和 MinIO，再在另一个终端执行：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml up -d postgres minio
npm install
npm run db:migrate
npm run db:create-admin
npm run db:seed-demo
npm run dev
```

前端地址为 `http://localhost:5173`，Vite 会把 `/api` 代理到 `http://localhost:3000`。

## 6. AI Agent 执行清单

Agent 在新机器上应按以下顺序执行，不要猜测账号或跳过健康检查：

```text
1. git clone <repository> && cd salesup
2. 确认 docker info 成功
3. 执行 ./scripts/bootstrap-local.sh
4. 检查 docker compose ... ps 中四个服务为 running/healthy
5. 请求 http://localhost:8080/api/health/ready，确认 status=ok
6. 打开 http://localhost:8080，并使用本文件列出的账号登录
```

遇到失败时优先查看：

```bash
docker compose --env-file .env.docker -f infra/docker-compose.yml logs api postgres minio
```

## 7. 生产部署边界

本指南的默认流程是本地开发模式，不适合直接暴露到公网。生产环境必须使用 `infra/docker-compose.production.yml`，注入强密码和至少 32 位随机 `SESSION_SECRET`，配置 HTTPS、域名、备份，并确保 PostgreSQL 和 MinIO 不对公网开放。生产环境不要执行 `seed-demo.mjs`。
