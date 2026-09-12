# 02. 数据库迁移

## 目标

把妙搭 PostgreSQL 结构迁移为独立 PostgreSQL 可执行的版本，并建立可重复运行的迁移脚本与数据导入流程。

本项目当前采用空库初始化策略，不迁移妙搭历史业务数据。因此本阶段只需要生成独立 DDL 和基础种子，不需要用户数据映射或历史数据导入。

## 原始结构问题

table.sql 中的以下对象属于妙搭运行时约定：

- workspace_aadktftwa24hw Schema。
- user_profile 复合类型。
- current_setting('app.user_id')。

独立数据库不应继续依赖这些隐式运行时能力。

## 推荐目标模型

新增基础表：

    users
    sessions
    roles
    permissions
    user_roles
    role_permissions

业务表中的用户字段统一使用 uuid 外键或明确的文本用户标识：user_id、mentor、coach、reviewed_by、created_by、updated_by、notified_to。

## 迁移策略

### 阶段 A：冻结原始参考

- 保留 table.sql 不修改。
- 记录表、字段、索引和外键清单。
- 单独获取现有业务数据导出。

### 阶段 B：生成独立 DDL

- 创建 public 或明确的业务 Schema。
- 删除 user_profile 自定义类型依赖。
- 删除 current_setting('app.user_id') 默认值。
- 将系统字段的写入交给应用层或数据库触发器。

### 阶段 C：初始化种子

- 创建初始角色和权限。
- 创建首个管理员账号的安全初始化流程。
- 将新业务的文件记录保存为 MinIO object key。

### 阶段 D：验证

- 外键完整性。
- 用户字段无孤儿值。
- 关键业务查询结果与原系统对比。
- 事务和唯一索引行为一致。

## 暂不执行的操作

不执行历史数据迁移，不覆盖任何原数据库，也不把 table.sql 直接导入新库。

## 独立 DDL 生成

使用 db:generate-independent-ddl 从原始 table.sql 生成
server/database/migrations/0002-business-independent.sql。生成过程会：

- 将妙搭 Schema 转为默认 PostgreSQL Schema。
- 将 user_profile 替换为 uuid。
- 删除 current_setting('app.user_id') 默认值。
- 保留业务表、索引、外键和注释。
- 不生成任何历史数据语句。
