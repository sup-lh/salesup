-- 独立版基础表草案
-- 独立版基础迁移。由 server/database/migrations/run.mjs 按幂等方式执行。

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(100) NOT NULL,
  email varchar(255),
  password_hash text NOT NULL,
  display_name varchar(100) NOT NULL,
  avatar_url text,
  status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_username_unique UNIQUE (username),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'disabled'))
);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key varchar(50) NOT NULL,
  name varchar(100) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT roles_role_key_unique UNIQUE (role_key)
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action varchar(50) NOT NULL,
  subject varchar(100) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT permissions_action_subject_unique UNIQUE (action, subject)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash varchar(128) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sessions_token_hash_unique UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action varchar(100) NOT NULL,
  resource varchar(100),
  resource_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL DEFAULT 'info',
  title varchar(200) NOT NULL,
  body text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read_at, created_at DESC);

INSERT INTO roles (role_key, name, description)
VALUES
  ('admin', '系统管理员', '管理系统配置、用户、角色和全部业务数据'),
  ('manager', '经理', '管理新人、任务、课程和数据看板'),
  ('mentor', '导师', '负责带教、复盘和新人辅导'),
  ('newcomer', '新人', '访问个人任务、课程和转正流程')
ON CONFLICT (role_key) DO NOTHING;

INSERT INTO permissions (action, subject, description)
VALUES
  ('read', 'Workbench', '访问工作台'),
  ('read', 'Challenge', '查看闯关任务'),
  ('create', 'TaskRecord', '提交任务完成记录'),
  ('read', 'Course', '查看课程和考核'),
  ('create', 'CourseLearning', '提交课程学习记录'),
  ('create', 'ExamResult', '提交考试结果'),
  ('create', 'NewcomerSelf', '提交新人自助申请'),
  ('manage', 'Newcomer', '管理新人资料和培养流程'),
  ('manage', 'Task', '管理任务模板'),
  ('manage', 'Coaching', '管理带教和复盘'),
  ('read', 'Dashboard', '查看数据看板'),
  ('read', 'KnowledgeBase', '查看销售知识库'),
  ('manage', 'KnowledgeBase', '管理销售知识库'),
  ('manage', 'Permission', '管理角色和权限')
ON CONFLICT (action, subject) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON (
  r.role_key = 'admin'
  OR (r.role_key = 'manager' AND p.subject IN ('Dashboard', 'Newcomer', 'Task', 'Course', 'Coaching', 'KnowledgeBase'))
  OR (r.role_key = 'mentor' AND p.subject IN ('Workbench', 'Challenge', 'Course', 'Coaching'))
  OR (r.role_key = 'newcomer' AND p.action IN ('read', 'create') AND p.subject IN ('Workbench', 'Challenge', 'Course', 'TaskRecord', 'CourseLearning', 'ExamResult', 'NewcomerSelf', 'KnowledgeBase'))
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
