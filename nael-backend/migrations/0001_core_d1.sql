-- NAEL Command Center: Cloudflare D1 / SQLite authoritative schema v1
-- All timestamps are UTC ISO-8601. No customer data or secrets are seeded here.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT,
 role TEXT NOT NULL CHECK(role IN ('OWNER','ADMIN','EDITOR','VIEWER')),
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS projects (
 id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE CHECK(slug IN ('matchpro','crystal-power','freelancing','qatar','branding','finance','other')),
 name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','PAUSED','BLOCKED','COMPLETED','ARCHIVED')),
 last_verified_progress TEXT, primary_blocker TEXT, next_action TEXT,
 expected_revenue_json TEXT CHECK(expected_revenue_json IS NULL OR json_valid(expected_revenue_json)),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS agents (
 id TEXT PRIMARY KEY, name TEXT NOT NULL,
 tier TEXT NOT NULL CHECK(tier IN ('CENTRAL_MANAGER','PROJECT_MANAGER','SPECIALIST','MONITOR')),
 project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
 connected_tools_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(connected_tools_json)),
 permissions_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(permissions_json)),
 execution_state TEXT NOT NULL DEFAULT 'IDLE' CHECK(execution_state IN ('IDLE','QUEUED','RUNNING','FAILED','DISABLED')),
 last_execution_at TEXT, last_error TEXT, next_run_at TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS tasks (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id),
 title TEXT NOT NULL, owner TEXT, assigned_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
 priority_rank INTEGER NOT NULL DEFAULT 6 CHECK(priority_rank BETWEEN 1 AND 6),
 task_state TEXT NOT NULL DEFAULT 'NEW' CHECK(task_state IN ('NEW','READY','IN_PROGRESS','BLOCKED','AWAITING_APPROVAL','COMPLETED','FAILED','CANCELLED')),
 schedule_id TEXT, last_attempt_at TEXT, last_success_at TEXT,
 actual_result TEXT, blocker TEXT, next_action TEXT,
 requires_approval INTEGER NOT NULL DEFAULT 0 CHECK(requires_approval IN (0,1)),
 idempotency_key TEXT UNIQUE,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS automation_schedules (
 id TEXT PRIMARY KEY, agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
 task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
 cron_or_interval TEXT NOT NULL,
 schedule_state TEXT NOT NULL DEFAULT 'PAUSED' CHECK(schedule_state IN ('ACTIVE','PAUSED','DISABLED')),
 next_run_at TEXT, last_run_at TEXT, updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 CHECK(agent_id IS NOT NULL OR task_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_task ON automation_schedules(task_id) WHERE task_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS execution_runs (
 execution_id TEXT PRIMARY KEY, target_type TEXT NOT NULL CHECK(target_type IN ('TASK','AGENT','SYNC','DEPLOY','APPROVAL_ACTION')),
 target_id TEXT NOT NULL, idempotency_key TEXT NOT NULL,
 execution_state TEXT NOT NULL DEFAULT 'QUEUED' CHECK(execution_state IN ('QUEUED','RUNNING','SUCCEEDED','FAILED','TIMED_OUT','CANCELLED')),
 requested_by TEXT REFERENCES users(id), started_at TEXT, finished_at TEXT,
 output_json TEXT CHECK(output_json IS NULL OR json_valid(output_json)),
 error_json TEXT CHECK(error_json IS NULL OR json_valid(error_json)),
 evidence_ref TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(target_type,target_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS approvals (
 id TEXT PRIMARY KEY, action_type TEXT NOT NULL CHECK(action_type IN ('OUTBOUND_MSG','PUBLISH','SPEND','SUBSCRIPTION','DEPLOY_RISK','BOOKING','CONTRACT','FINANCIAL_TX')),
 target_entity TEXT NOT NULL, payload_json TEXT NOT NULL CHECK(json_valid(payload_json)), scope TEXT NOT NULL,
 financial_amount INTEGER CHECK(financial_amount IS NULL OR financial_amount >= 0), currency TEXT,
 status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','EXECUTED','FAILED')),
 requested_by TEXT REFERENCES users(id), decided_by TEXT REFERENCES users(id),
 requested_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 decided_at TEXT, execution_id TEXT REFERENCES execution_runs(execution_id),
 idempotency_key TEXT NOT NULL UNIQUE,
 CHECK((financial_amount IS NULL AND currency IS NULL) OR (financial_amount IS NOT NULL AND currency IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS integration_connections (
 id TEXT PRIMARY KEY, service_name TEXT NOT NULL, account_identity TEXT,
 scopes_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(scopes_json)),
 is_connected INTEGER NOT NULL DEFAULT 0 CHECK(is_connected IN (0,1)),
 is_authorized INTEGER NOT NULL DEFAULT 0 CHECK(is_authorized IN (0,1)),
 is_reachable INTEGER NOT NULL DEFAULT 0 CHECK(is_reachable IN (0,1)),
 is_tested INTEGER NOT NULL DEFAULT 0 CHECK(is_tested IN (0,1)),
 is_operational INTEGER NOT NULL DEFAULT 0 CHECK(is_operational IN (0,1)),
 last_read_at TEXT, last_write_at TEXT, last_sync_at TEXT, last_error TEXT,
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 CHECK(is_operational = 0 OR (is_connected=1 AND is_authorized=1 AND is_reachable=1 AND is_tested=1))
);
CREATE TABLE IF NOT EXISTS opportunities (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id),
 task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
 pipeline TEXT NOT NULL CHECK(pipeline IN ('RENT','SALE','FREELANCE','JOB','PARTNERSHIP','OTHER')),
 title TEXT NOT NULL, stage TEXT NOT NULL DEFAULT 'POTENTIAL' CHECK(stage IN ('POTENTIAL','QUALIFIED','CONTRACTED','INVOICED','RECEIVED','LOST','CANCELLED')),
 source_ref TEXT, original_source_at TEXT, last_verified_at TEXT,
 expected_amount_minor INTEGER CHECK(expected_amount_minor IS NULL OR expected_amount_minor>=0),
 currency TEXT, details_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(details_json)),
 dedupe_key TEXT UNIQUE, updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS financial_records (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id),
 opportunity_id TEXT REFERENCES opportunities(id), task_id TEXT REFERENCES tasks(id),
 amount_minor INTEGER NOT NULL CHECK(amount_minor>=0), currency TEXT NOT NULL,
 stage TEXT NOT NULL CHECK(stage IN ('POTENTIAL','CONTRACTED','INVOICED','RECEIVED')),
 booked_at TEXT NOT NULL, verified_at TEXT, proof_ref TEXT,
 external_reference TEXT UNIQUE, description TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS audit_logs (
 id TEXT PRIMARY KEY, actor TEXT NOT NULL,
 action_name TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
 execution_id TEXT REFERENCES execution_runs(execution_id),
 outcome TEXT NOT NULL CHECK(outcome IN ('REQUESTED','ALLOWED','DENIED','QUEUED','SUCCEEDED','FAILED','CANCELLED')),
 details_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(details_json)),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS documents (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id),
 name TEXT NOT NULL, source_ref TEXT NOT NULL, visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK(visibility IN ('PRIVATE','TEAM','PUBLIC')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_project_state ON tasks(project_id,task_state,priority_rank);
CREATE INDEX IF NOT EXISTS idx_runs_target ON execution_runs(target_type,target_id,created_at);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type,entity_id,created_at);
CREATE INDEX IF NOT EXISTS idx_opportunity_project ON opportunities(project_id,pipeline,stage);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status,requested_at);
CREATE INDEX IF NOT EXISTS idx_financial_project ON financial_records(project_id,stage,currency);
-- Sensitive credentials and OAuth secrets must NEVER be stored in these JSON fields.
