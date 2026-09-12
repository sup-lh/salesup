# 独立化迁移 TODO

## 当前优先级

- [x] 确认不迁移现有妙搭业务数据，从空数据库开始。
- [x] 决定文件迁移目标：MinIO。
- [x] 决定通知替代方案：站内通知。
- [x] 获取独立 PostgreSQL 连接信息（本地 Docker：localhost:5432）。
- [x] 创建 PostgreSQL + MinIO Docker Compose。
- [x] 安装 postgres Node.js 驱动。

## 代码改造

- [x] 移除后端 PlatformModule、平台装饰器、数据库令牌和双模式兼容分支。
- [x] 将 Vite 和 TypeScript 配置切换为独立工具链。
- [x] 新增本地用户目录 API，统一用户搜索和回显类型。
- [x] 用本地 DataTable 替换妙搭表格。
- [x] 移除 package.json 和 lockfile 中的 @lark-apaas/* 依赖。

- [x] 新增 server/database 模块。
- [x] 新增独立 Drizzle 数据库 Schema 和 provider。
- [x] 新增 server/modules/auth。
- [x] 新增独立 Session 中间件。
- [x] 新增独立 RBAC Guard。
- [x] 新增 UserDirectoryService。
- [x] 新增 StorageService（MinIO）和上传/删除 API。
- [x] 新增 NotificationService。
- [x] 替换平台前端 HTTP 客户端。
- [x] 替换平台前端认证上下文。
- [x] 替换课程材料上传和外链（MinIO + 普通链接）。
- [x] 管理员账号页改为本地用户管理。
- [x] 角色成员编辑改为本地用户搜索，移除部门和群聊选择。
- [x] 替换或下线剩余飞书专属组件（通用表格、旧业务用户展示组件）。

## 数据库改造

- [x] 从 table.sql 提取业务表清单。
- [x] 设计独立 users/sessions/roles 表。
- [x] 形成独立版基础表 SQL 草案。
- [x] 独立 DDL 移除 user_profile 依赖。
- [x] 独立 DDL 移除 current_setting('app.user_id') 默认值。
- [x] 生成独立 DDL。
- [x] 增加独立业务 DDL 生成器。
- [x] 生成独立业务 DDL 并完成平台类型残留扫描。
- [x] 增加可重复执行的数据库迁移入口。
- [x] 在 PostgreSQL 空库执行独立 DDL。
- [x] 新增独立认证模块骨架和 Session/RBAC 基础接口。
- [x] 增加首个管理员账号初始化脚本。
- [x] 增加独立模式兼容桥，支持旧业务 Service 渐进切库。
- [x] 不编写历史数据映射和导入脚本。
- [x] 编写并执行角色、权限和管理员账号种子脚本。
- [x] 验证索引、外键和唯一约束（迁移后 PostgreSQL catalog 检查）。

## 已完成

- [x] 创建 doc/ 文档目录。
- [x] 创建分阶段迁移文档。
- [x] 创建 PLAN.md 和 TODO.md。
- [x] 完成当前项目的平台耦合审计。
- [x] 完成 table.sql 表清单提取。

## 验证

- [x] 核心认证单元测试通过（密码哈希、环境校验已覆盖；Session/Guard/权限/审计仍建议补充专项套件）。
- [ ] 空库迁移、认证、RBAC、通知和存储 API 集成测试通过（已完成手工健康/迁移验证，自动化 API 套件待补）。
- [ ] 新人、导师、经理、管理员四类角色浏览器验收通过（需在具备种子账号的目标环境执行）。
- [x] PostgreSQL 和 MinIO 备份恢复脚本和隔离演练流程已提供。

- [x] npm install 依赖已可用。
- [x] 客户端类型检查通过。
- [x] 服务端类型检查通过。
- [x] 在 OrbStack 中启动并验证 PostgreSQL/MinIO；已完成 MinIO 实际上传验证。
- [x] 手工 API 集成验证通过（401、登录、/me、角色、权限、通知）。
- [ ] 四类角色浏览器验收通过。
- [x] API/Web/Nginx Docker Compose 启动验证通过。
- [ ] 空库初始化和备份恢复演练通过（脚本与流程已提供）。
