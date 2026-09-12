# 05. 前端迁移

## 保留部分

- 页面路由。
- 业务 API 文件结构。
- 表单、表格、图表和布局。
- 业务领域类型。
- React Query 和现有 UI 组件。

## 替换部分

### HTTP 客户端

已集中替换 axiosForBackend 为自有 Axios 实例，保留 /api/* 路径，减少页面级修改。

### 应用壳

已替换 AppContainer、ErrorRender、useAppInfo 和平台日志，使用普通 React Error Boundary、独立 AuthProvider 和本地日志适配。

### 登录权限

替换 useAuth、useCan、<Can>、useCurrentUserProfile，新增 /api/auth/login、/api/auth/logout、/api/auth/me、AuthProvider、PermissionGate。

### 文件和链接

后端 multipart 上传接口已就绪；前端 Dataloom/UniversalLink 页面组件仍需逐页替换。链接目标应统一为普通 a 标签或自有 ExternalLink 组件。

## 兼容原则

优先保持现有 API 响应结构和路由路径。先替换底层客户端和认证上下文，再逐个处理特殊平台组件。
