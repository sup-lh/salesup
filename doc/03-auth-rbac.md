# 03. 认证与权限

## 目标

移除飞书登录和妙搭授权，建立独立用户、会话和 RBAC 能力，同时尽量保持当前 action/subject 权限表达。

## 推荐模型

    users
    roles
    permissions
    user_roles
    role_permissions
    sessions

初始角色：admin、manager、mentor、newcomer。

## 权限表达

继续使用当前字符串形式：read:Dashboard、manage:Newcomer、manage:Task、create:TaskRecord、manage:KnowledgeBase。

这样可以复用路由和页面上的业务判断，替换的是权限实现而不是业务语义。

## 会话方案

第一阶段使用服务端 Session：

1. 登录成功后创建 sessions 记录。
2. 通过 HttpOnly、Secure、SameSite Cookie 保存 session id。
3. NestJS 中间件读取 session 并填充 req.userContext。
4. Guard 根据当前用户角色和权限判断访问。

JWT/OIDC 可作为后续扩展，不作为第一阶段前置条件。

## 需要替换的代码

- AuthNPaasService → UserDirectoryService。
- AuthorizationSDK → 自有 RoleService。
- @Can / @NeedLogin → 自有装饰器和 Guard。
- useAuth / useCan / <Can> → 自有 AuthProvider 和 Permission 组件。

## 安全要求

- 数据库密码只放在后端环境变量。
- 权限必须在后端再次校验，不能只依赖前端隐藏按钮。
- 用户只能访问其角色允许的业务范围。
- 登录、登出、密码错误和权限拒绝要有审计日志。
