CREATE TABLE scp_marketplace_listings (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL REFERENCES portal_users(id),
  kind TEXT NOT NULL CHECK (kind IN ('demand','offer')),
  title TEXT NOT NULL,
  sector TEXT NOT NULL,
  city TEXT NOT NULL,
  details TEXT NOT NULL,
  availability TEXT NOT NULL DEFAULT '',
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal','soon','urgent')),
  fixed_price_cents INTEGER CHECK (fixed_price_cents IS NULL OR fixed_price_cents > 0),
  public_name TEXT NOT NULL DEFAULT '',
  shared_with_verified INTEGER NOT NULL DEFAULT 0 CHECK (shared_with_verified IN (0,1)),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','published','matched','paused','closed','rejected')),
  response_deadline TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX scp_marketplace_feed ON scp_marketplace_listings(kind,status,sector,city,created_at);
--> statement-breakpoint
CREATE INDEX scp_marketplace_owner ON scp_marketplace_listings(owner_id,created_at);
--> statement-breakpoint
CREATE TABLE scp_marketplace_interests (
  id TEXT PRIMARY KEY NOT NULL,
  demand_id TEXT NOT NULL REFERENCES scp_marketplace_listings(id),
  specialist_id TEXT NOT NULL REFERENCES portal_users(id),
  offer_id TEXT NOT NULL REFERENCES scp_marketplace_listings(id),
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested','selected','matched','withdrawn')),
  created_at TEXT NOT NULL,
  UNIQUE(demand_id,specialist_id)
);
--> statement-breakpoint
CREATE INDEX scp_marketplace_interests_demand ON scp_marketplace_interests(demand_id,status,created_at);
--> statement-breakpoint
CREATE TABLE scp_marketplace_cases (
  id TEXT PRIMARY KEY NOT NULL,
  demand_id TEXT NOT NULL REFERENCES scp_marketplace_listings(id),
  offer_id TEXT NOT NULL REFERENCES scp_marketplace_listings(id),
  titular_id TEXT NOT NULL REFERENCES portal_users(id),
  specialist_id TEXT NOT NULL REFERENCES portal_users(id),
  title TEXT NOT NULL,
  sector TEXT NOT NULL,
  specialist_price_cents INTEGER NOT NULL CHECK (specialist_price_cents > 0),
  scp_fee_cents INTEGER NOT NULL CHECK (scp_fee_cents > 0),
  total_price_cents INTEGER NOT NULL CHECK (total_price_cents > 0),
  status TEXT NOT NULL DEFAULT 'connection_pending' CHECK (status IN ('connection_pending','awaiting_payment','funds_protected','in_progress','holder_validation','incident','closed','rejected')),
  payment_status TEXT NOT NULL DEFAULT 'provider_unconfigured' CHECK (payment_status IN ('provider_unconfigured','pending','held','released','refunded','failed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX scp_marketplace_cases_titular ON scp_marketplace_cases(titular_id,created_at);
--> statement-breakpoint
CREATE INDEX scp_marketplace_cases_specialist ON scp_marketplace_cases(specialist_id,created_at);
--> statement-breakpoint
CREATE TABLE scp_marketplace_events (
  id TEXT PRIMARY KEY NOT NULL,
  case_id TEXT NOT NULL REFERENCES scp_marketplace_cases(id),
  actor_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX scp_marketplace_events_case ON scp_marketplace_events(case_id,created_at);
--> statement-breakpoint
CREATE TABLE scp_private_reviews (
  id TEXT PRIMARY KEY NOT NULL,
  case_id TEXT NOT NULL REFERENCES scp_marketplace_cases(id),
  titular_id TEXT NOT NULL REFERENCES portal_users(id),
  specialist_id TEXT NOT NULL REFERENCES portal_users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE(case_id,titular_id)
);
--> statement-breakpoint
CREATE INDEX scp_private_reviews_specialist ON scp_private_reviews(specialist_id,created_at);
--> statement-breakpoint
CREATE TABLE scp_specialist_internal_notes (
  id TEXT PRIMARY KEY NOT NULL,
  specialist_id TEXT NOT NULL REFERENCES portal_users(id),
  admin_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX scp_specialist_internal_notes_specialist ON scp_specialist_internal_notes(specialist_id,created_at);
