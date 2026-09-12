# 01. 目标架构

## 推荐架构

    浏览器 React
        ↓ HTTPS + HttpOnly Cookie
    NestJS 模块化单体 API
        ├── AuthModule
        ├── PermissionModule
        ├── DatabaseModule
        ├── UserDirectoryModule
        ├── StorageModule
        └── 现有业务模块
                ↓
            独立 PostgreSQL

    文件：MinIO 对象存储
    部署：Docker Compose + Nginx

## 关键决策

### 保留 NestJS

当前业务已经大量实现于 NestJS。切换 Spring 会重写 Controller、Service、ORM、认证、权限和平台适配层，但不会减少独立化工作的核心复杂度。

### 后端访问数据库

React 不持有数据库凭据，也不直接访问 PostgreSQL。所有查询、事务和权限过滤均在 NestJS 完成。

### 先做模块化单体

当前规模不需要微服务。模块边界已经存在，先独立部署和验证，再根据真实负载拆分。

### 兼容式迁移

先建立自有适配器，让业务模块继续使用接近当前的接口；等功能验证后，再删除妙搭包和兼容代码。

## 目标请求链路

    登录
      → session cookie
      → AuthGuard 填充 req.userContext
      → PermissionGuard 校验 action/subject
      → Service 执行领域规则
      → Drizzle 查询 PostgreSQL

## 不在第一阶段处理

- 微服务拆分。
- 移动端专用 API。
- 多租户。
- 全量重构前端组件。
- 复杂 OAuth/OIDC 集成。
