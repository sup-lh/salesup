# 04. 平台能力替换

## 用户目录

当前多个 Service 通过 AuthNPaasService.listUsersByIds 查询用户名称和头像。独立版新增 UserDirectoryService，从本地 users 表查询。

受影响模块：NewcomerService、CoachingReviewService、NewcomerApplicationService、WorkbenchService。

## 文件存储

当前使用 Dataloom 和默认 bucket。独立版已实现统一接口：upload、delete、getDownloadUrl，并提供 `/api/storage/upload` 和 `/api/storage/:key`。

第一版统一使用 MinIO。开发环境和独立部署环境都通过 StorageService 访问 MinIO，未来可以替换为 S3/OSS 兼容服务。旧页面调用 Dataloom 的部分仍待迁移。

## 通知

转正面试申请当前调用飞书消息 capability。独立版抽象为 NotificationService，第一版写入站内通知，不再调用飞书消息。

## 内容来源

将 feishu_doc 和 minutes 替换为通用来源：upload、link、document、video。

历史飞书链接可以作为普通 URL 保留，不再让业务判断依赖 feishu.cn。

## 应删除或下线的功能

- 飞书部门、群聊和用户搜索。
- 妙搭角色成员管理 SDK。
- 飞书云文档/妙记专属上传与预览。
- 妙搭 capability 配置。
- 平台运行时信息注入。
