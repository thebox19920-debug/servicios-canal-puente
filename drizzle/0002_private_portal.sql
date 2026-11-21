CREATE TABLE portal_users (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('client','collaborator')), status TEXT NOT NULL CHECK(status IN ('active','pending')), created_at TEXT NOT NULL, privacy_version TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE portal_collaborators (email TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','active')), created_at TEXT NOT NULL, approved_at TEXT, approved_by TEXT);
--> statement-breakpoint
CREATE TABLE portal_contracts (id TEXT PRIMARY KEY NOT NULL, collaborator_email TEXT NOT NULL REFERENCES portal_collaborators(email), title TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE, sha256 TEXT NOT NULL, created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE portal_cases (id TEXT PRIMARY KEY NOT NULL, client_id TEXT NOT NULL REFERENCES portal_users(id), collaborator_id TEXT NOT NULL REFERENCES portal_users(id), title TEXT NOT NULL, service_key TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents>0), status TEXT NOT NULL DEFAULT 'pending', payment_status TEXT NOT NULL DEFAULT 'not_collected', patient_confirmed_at TEXT, incident_open INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX portal_cases_client ON portal_cases(client_id);
--> statement-breakpoint
CREATE INDEX portal_cases_collaborator ON portal_cases(collaborator_id);
--> statement-breakpoint
CREATE TABLE portal_events (id TEXT PRIMARY KEY NOT NULL,case_id TEXT NOT NULL REFERENCES portal_cases(id),actor_id TEXT NOT NULL,kind TEXT NOT NULL,note TEXT NOT NULL,created_at TEXT NOT NULL);
