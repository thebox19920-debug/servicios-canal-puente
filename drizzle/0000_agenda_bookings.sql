CREATE TABLE agenda_bookings (
  id TEXT PRIMARY KEY NOT NULL,
  starts_at INTEGER NOT NULL UNIQUE,
  local_day TEXT NOT NULL,
  local_time TEXT NOT NULL,
  owner_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX agenda_bookings_owner ON agenda_bookings(owner_hash, starts_at);
