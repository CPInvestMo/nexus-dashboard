-- Additive NAEL task workflow support. No existing table or production record is rewritten.
CREATE TABLE IF NOT EXISTS task_sources (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK(source_type IN ('GOOGLE_SHEET','URL','DOCUMENT','MANUAL')),
  source_ref TEXT NOT NULL,
  source_label TEXT,
  source_row TEXT,
  observed_at TEXT,
  is_authoritative INTEGER NOT NULL DEFAULT 0 CHECK(is_authoritative IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS task_evidence (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK(evidence_type IN ('LINK','NOTE','FILE')),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  verified_state TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK(verified_state IN ('UNKNOWN','PENDING','VERIFIED','REJECTED')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_task_sources_task ON task_sources(task_id,created_at);
CREATE INDEX IF NOT EXISTS idx_task_evidence_task ON task_evidence(task_id,created_at);
