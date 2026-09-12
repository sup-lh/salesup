CREATE TABLE workspace_aadktftwa24hw.newcomer (

id uuid NOT NULL DEFAULT gen_random_uuid(),

name character varying(100) NOT NULL,

position character varying(50) NOT NULL,

hire_date date NOT NULL,

mentor workspace_aadktftwa24hw.user_profile NULL,

goal_contract text NULL,

status character varying(50) NOT NULL DEFAULT 'active'::character varying,

first_deal_date date NULL,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

user_id workspace_aadktftwa24hw.user_profile NULL,

CONSTRAINT newcomer_pkey PRIMARY KEY (id)

) TABLESPACE pg_default;

COMMENT ON COLUMN workspace_aadktftwa24hw.newcomer.user_id IS '新人本人账号，用于工作台按当前登录用户匹配';

COMMENT ON COLUMN workspace_aadktftwa24hw.newcomer.status IS 'active在培/converted已转正/left已离职';

COMMENT ON COLUMN workspace_aadktftwa24hw.newcomer.position IS '销售代表/客户经理/销售顾问';

CREATE TABLE workspace_aadktftwa24hw.challenge_task (

id uuid NOT NULL DEFAULT gen_random_uuid(),

stage character varying(50) NOT NULL,

title character varying(255) NOT NULL,

category character varying(100) NOT NULL,

standard character varying(255) NOT NULL,

due_day integer NOT NULL,

sort integer NOT NULL DEFAULT 0,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

unlock_next_stage boolean NOT NULL DEFAULT false,

CONSTRAINT challenge_task_pkey PRIMARY KEY (id)

) TABLESPACE pg_default;

COMMENT ON COLUMN workspace_aadktftwa24hw.challenge_task.stage IS 'onboarding融入期/practice实战期/independent独立期/consolidation巩固期';

CREATE TABLE workspace_aadktftwa24hw.task_record (

id uuid NOT NULL DEFAULT gen_random_uuid(),

newcomer_id uuid NOT NULL,

task_id uuid NOT NULL,

completed_at timestamp(3) with time zone NULL,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

CONSTRAINT task_record_pkey PRIMARY KEY (id),

CONSTRAINT task_record_newcomer_id_fkey FOREIGN KEY (newcomer_id) REFERENCES workspace_aadktftwa24hw.newcomer (id),

CONSTRAINT task_record_task_id_fkey FOREIGN KEY (task_id) REFERENCES workspace_aadktftwa24hw.challenge_task (id)

) TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS uq_task_record_newcomer_task ON workspace_aadktftwa24hw.task_record USING btree (newcomer_id, task_id) TABLESPACE pg_default;

CREATE TABLE workspace_aadktftwa24hw.course (

id uuid NOT NULL DEFAULT gen_random_uuid(),

title character varying(100) NOT NULL,

key_points character varying(500) NOT NULL,

requirement character varying(255) NOT NULL,

sort integer NOT NULL DEFAULT 0,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

CONSTRAINT course_pkey PRIMARY KEY (id)

) TABLESPACE pg_default;

CREATE TABLE workspace_aadktftwa24hw.course_item (

id uuid NOT NULL DEFAULT gen_random_uuid(),

course_id uuid NOT NULL,

title character varying(255) NOT NULL,

sort integer NOT NULL DEFAULT 0,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

CONSTRAINT course_item_pkey PRIMARY KEY (id),

CONSTRAINT course_item_course_id_fkey FOREIGN KEY (course_id) REFERENCES workspace_aadktftwa24hw.course (id)

) TABLESPACE pg_default;

CREATE TABLE workspace_aadktftwa24hw.course_quiz (

id uuid NOT NULL DEFAULT gen_random_uuid(),

course_id uuid NOT NULL,

question character varying(500) NOT NULL,

options text[] NOT NULL,

answer character varying(255) NOT NULL,

sort integer NOT NULL DEFAULT 0,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

CONSTRAINT course_quiz_pkey PRIMARY KEY (id),

CONSTRAINT course_quiz_course_id_fkey FOREIGN KEY (course_id) REFERENCES workspace_aadktftwa24hw.course (id)

) TABLESPACE pg_default;

COMMENT ON COLUMN workspace_aadktftwa24hw.course_quiz.options IS '@type { options: string[] }';

CREATE TABLE workspace_aadktftwa24hw.course_learning (

id uuid NOT NULL DEFAULT gen_random_uuid(),

newcomer_id uuid NOT NULL,

item_id uuid NOT NULL,

learned_at timestamp(3) with time zone NULL,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

CONSTRAINT course_learning_pkey PRIMARY KEY (id),

CONSTRAINT course_learning_newcomer_id_fkey FOREIGN KEY (newcomer_id) REFERENCES workspace_aadktftwa24hw.newcomer (id),

CONSTRAINT course_learning_item_id_fkey FOREIGN KEY (item_id) REFERENCES workspace_aadktftwa24hw.course_item (id)

) TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS uq_course_learning_newcomer_item ON workspace_aadktftwa24hw.course_learning USING btree (newcomer_id, item_id) TABLESPACE pg_default;

CREATE TABLE workspace_aadktftwa24hw.exam_result (

id uuid NOT NULL DEFAULT gen_random_uuid(),

newcomer_id uuid NOT NULL,

course_id uuid NOT NULL,

passed boolean NOT NULL DEFAULT false,

score integer NULL,

taken_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

CONSTRAINT exam_result_pkey PRIMARY KEY (id),

CONSTRAINT exam_result_newcomer_id_fkey FOREIGN KEY (newcomer_id) REFERENCES workspace_aadktftwa24hw.newcomer (id),

CONSTRAINT exam_result_course_id_fkey FOREIGN KEY (course_id) REFERENCES workspace_aadktftwa24hw.course (id)

) TABLESPACE pg_default;

CREATE TABLE workspace_aadktftwa24hw.coaching_record (

id uuid NOT NULL DEFAULT gen_random_uuid(),

newcomer_id uuid NOT NULL,

type character varying(50) NOT NULL,

coach workspace_aadktftwa24hw.user_profile NULL,

record_date date NOT NULL,

duration_hours numeric(4, 1) NOT NULL DEFAULT 0,

content text NOT NULL,

improvement text NULL,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

materials text NULL,

CONSTRAINT coaching_record_pkey PRIMARY KEY (id),

CONSTRAINT coaching_record_newcomer_id_fkey FOREIGN KEY (newcomer_id) REFERENCES workspace_aadktftwa24hw.newcomer (id)

) TABLESPACE pg_default;

COMMENT ON COLUMN workspace_aadktftwa24hw.coaching_record.type IS 'visit陪访/1on1一对一辅导';

CREATE TABLE workspace_aadktftwa24hw.review_record (

id uuid NOT NULL DEFAULT gen_random_uuid(),

newcomer_id uuid NOT NULL,

type character varying(50) NOT NULL,

opportunity character varying(255) NOT NULL,

summary text NOT NULL,

lessons text NOT NULL,

sharer workspace_aadktftwa24hw.user_profile NULL,

record_date date NOT NULL,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

materials text NULL,

CONSTRAINT review_record_pkey PRIMARY KEY (id),

CONSTRAINT review_record_newcomer_id_fkey FOREIGN KEY (newcomer_id) REFERENCES workspace_aadktftwa24hw.newcomer (id)

) TABLESPACE pg_default;

COMMENT ON COLUMN workspace_aadktftwa24hw.review_record.type IS 'win赢单复盘/loss输单复盘/case案例分享';

CREATE TABLE workspace_aadktftwa24hw.assessment_record (

id uuid NOT NULL DEFAULT gen_random_uuid(),

newcomer_id uuid NOT NULL,

node character varying(10) NOT NULL,

result character varying(20) NOT NULL,

assess_comment text NOT NULL DEFAULT ''::text,

record_date date NOT NULL,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

CONSTRAINT assessment_record_pkey PRIMARY KEY (id),

CONSTRAINT assessment_record_newcomer_id_fkey FOREIGN KEY (newcomer_id) REFERENCES workspace_aadktftwa24hw.newcomer (id)

) TABLESPACE pg_default;

COMMENT ON COLUMN workspace_aadktftwa24hw.assessment_record.result IS 'pass通过/improve待改进/fail不通过';

COMMENT ON COLUMN workspace_aadktftwa24hw.assessment_record.node IS 'd30/d60/d90';

CREATE TABLE workspace_aadktftwa24hw.authz_permissions (

id uuid NOT NULL DEFAULT gen_random_uuid(),

action character varying(100) NOT NULL,

subject character varying(100) NOT NULL,

description text NULL DEFAULT ''::text,

_created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL,

_updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL,

CONSTRAINT authz_permissions_pkey PRIMARY KEY (id),

CONSTRAINT authz_permissions_action_subject_key UNIQUE (action, subject)

) TABLESPACE pg_default;

CREATE TABLE workspace_aadktftwa24hw.authz_role_permissions (

id uuid NOT NULL DEFAULT gen_random_uuid (),

role_key character varying(100) NOT NULL,

permission_id uuid NOT NULL,

_created_at timestamp

with

time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL,

_updated_at timestamp

with

time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL,

CONSTRAINT authz_role_permissions_pkey PRIMARY KEY (id),

CONSTRAINT authz_role_permissions_role_key_permission_id_key UNIQUE (role_key, permission_id),

CONSTRAINT authz_role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES workspace_aadktftwa24hw.authz_permissions (id) ON DELETE CASCADE

) TABLESPACE pg_default;

CREATE TABLE workspace_aadktftwa24hw.course_material (

id uuid NOT NULL DEFAULT gen_random_uuid(),

course_id uuid NOT NULL,

title character varying(255) NOT NULL,

file_url text NOT NULL,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

CONSTRAINT course_material_pkey PRIMARY KEY (id),

CONSTRAINT course_material_course_id_fkey FOREIGN KEY (course_id) REFERENCES workspace_aadktftwa24hw.course (id)

) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_course_material_course_id ON workspace_aadktftwa24hw.course_material USING btree (course_id) TABLESPACE pg_default;

CREATE TABLE workspace_aadktftwa24hw.opportunity (

id uuid NOT NULL DEFAULT gen_random_uuid(),

newcomer_id uuid NOT NULL,

name character varying(255) NOT NULL,

customer character varying(255) NOT NULL,

amount numeric(14, 2) NOT NULL DEFAULT '0'::numeric,

stage character varying(50) NOT NULL,

expected_date date NULL,

remark text NULL,

materials text NULL,

record_date date NOT NULL,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

CONSTRAINT opportunity_pkey PRIMARY KEY (id),

CONSTRAINT opportunity_newcomer_id_fkey FOREIGN KEY (newcomer_id) REFERENCES workspace_aadktftwa24hw.newcomer (id)

) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_opportunity_newcomer_id ON workspace_aadktftwa24hw.opportunity USING btree (newcomer_id) TABLESPACE pg_default;

CREATE TABLE workspace_aadktftwa24hw.kb_item (

id uuid NOT NULL DEFAULT gen_random_uuid(),

title character varying(255) NOT NULL,

category character varying(100) NOT NULL,

source_type character varying(50) NOT NULL,

url text NOT NULL,

description text NULL,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

CONSTRAINT kb_item_pkey PRIMARY KEY (id)

) TABLESPACE pg_default;

CREATE TABLE workspace_aadktftwa24hw.newcomer_application (

id uuid NOT NULL DEFAULT gen_random_uuid(),

user_id workspace_aadktftwa24hw.user_profile NOT NULL,

name character varying(100) NOT NULL,

position character varying(50) NOT NULL,

hire_date date NOT NULL,

mentor workspace_aadktftwa24hw.user_profile NULL,

goal_contract text NULL,

status character varying(50) NOT NULL DEFAULT 'pending'::character varying,

review_comment text NULL,

reviewed_by workspace_aadktftwa24hw.user_profile NULL,

reviewed_at timestamp(3) with time zone NULL,

_created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

_updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

_updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE

WHEN (

current_setting('app.user_id'::text, true) = ''::text

) THEN NULL::workspace_aadktftwa24hw.user_profile

ELSE (

concat(

'(',

current_setting('app.user_id'::text, true),

')'

)

)::workspace_aadktftwa24hw.user_profile

END,

CONSTRAINT newcomer_application_pkey PRIMARY KEY (id)

) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_newcomer_application_status ON workspace_aadktftwa24hw.newcomer_application USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_newcomer_application_user_id ON workspace_aadktftwa24hw.newcomer_application USING btree (((user_id).user_id)) TABLESPACE pg_default;




CREATE TABLE workspace_aadktftwa24hw.stage_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying(50) NOT NULL,
  name character varying(100) NOT NULL,
  sort integer NOT NULL DEFAULT 0,
  start_day integer NOT NULL DEFAULT 1,
  end_day integer NOT NULL DEFAULT 30,
  standard character varying(500) NULL DEFAULT ''::character varying,
  _created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE
    WHEN (
      current_setting('app.user_id'::text, true) = ''::text
    ) THEN NULL::workspace_aadktftwa24hw.user_profile
    ELSE (
      concat(
        '(',
        current_setting('app.user_id'::text, true),
        ')'
      )
    )::workspace_aadktftwa24hw.user_profile
  END,
  _updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE
    WHEN (
      current_setting('app.user_id'::text, true) = ''::text
    ) THEN NULL::workspace_aadktftwa24hw.user_profile
    ELSE (
      concat(
        '(',
        current_setting('app.user_id'::text, true),
        ')'
      )
    )::workspace_aadktftwa24hw.user_profile
  END,
  has_defense boolean NOT NULL DEFAULT false,
  CONSTRAINT stage_catalog_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stage_catalog_code ON workspace_aadktftwa24hw.stage_catalog USING btree (code) TABLESPACE pg_default;


CREATE TABLE workspace_aadktftwa24hw.defense_application (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  newcomer_id uuid NOT NULL,
  status character varying(20) NOT NULL DEFAULT 'pending'::character varying,
  comment text NULL,
  _created_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE
    WHEN (
      current_setting('app.user_id'::text, true) = ''::text
    ) THEN NULL::workspace_aadktftwa24hw.user_profile
    ELSE (
      concat(
        '(',
        current_setting('app.user_id'::text, true),
        ')'
      )
    )::workspace_aadktftwa24hw.user_profile
  END,
  _updated_at timestamp(3) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by workspace_aadktftwa24hw.user_profile NULL DEFAULT CASE
    WHEN (
      current_setting('app.user_id'::text, true) = ''::text
    ) THEN NULL::workspace_aadktftwa24hw.user_profile
    ELSE (
      concat(
        '(',
        current_setting('app.user_id'::text, true),
        ')'
      )
    )::workspace_aadktftwa24hw.user_profile
  END,
  notified_to workspace_aadktftwa24hw.user_profile NULL,
  notified_at timestamp(3) with time zone NULL,
  notify_failed boolean NOT NULL DEFAULT false,
  CONSTRAINT defense_application_pkey PRIMARY KEY (id),
  CONSTRAINT defense_application_newcomer_id_fkey FOREIGN KEY (newcomer_id) REFERENCES workspace_aadktftwa24hw.newcomer (id)
) TABLESPACE pg_default;

