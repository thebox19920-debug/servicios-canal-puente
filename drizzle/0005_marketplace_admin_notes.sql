CREATE TABLE scp_marketplace_admin_notes (
  id TEXT PRIMARY KEY NOT NULL,
  case_id TEXT NOT NULL REFERENCES scp_marketplace_cases(id),
  admin_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX scp_marketplace_admin_notes_case ON scp_marketplace_admin_notes(case_id,created_at);
