CREATE TABLE IF NOT EXISTS scp_module_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS scp_user_profiles (
  auth_subject TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN','TITULAR','ESPECIALISTA')),
  account_status TEXT NOT NULL CHECK (account_status IN ('PENDING','ACTIVE','SUSPENDED','CLOSED')),
  is_subscribed INTEGER NOT NULL DEFAULT 0 CHECK (is_subscribed IN (0,1)),
  verification_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED' CHECK (verification_status IN ('NOT_REQUIRED','PENDING','IN_REVIEW','VERIFIED','REJECTED','SUSPENDED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS scp_user_profiles_role_status ON scp_user_profiles(role,account_status,verification_status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS scp_listing_specs (
  listing_id TEXT PRIMARY KEY NOT NULL REFERENCES scp_marketplace_listings(id) ON DELETE CASCADE,
  urgency_mode TEXT CHECK (urgency_mode IS NULL OR urgency_mode IN ('under_24h','scheduled')),
  requested_at TEXT,
  location_key TEXT NOT NULL,
  time_slot_key TEXT NOT NULL,
  budget_cents INTEGER CHECK (budget_cents IS NULL OR budget_cents > 0),
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS scp_listing_specs_match ON scp_listing_specs(location_key,time_slot_key,budget_cents);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS scp_service_matches (
  id TEXT PRIMARY KEY NOT NULL,
  demand_id TEXT NOT NULL REFERENCES scp_marketplace_listings(id),
  offer_id TEXT NOT NULL REFERENCES scp_marketplace_listings(id),
  specialist_id TEXT NOT NULL REFERENCES portal_users(id),
  status TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate','selected','declined','connected','expired')),
  matched_criteria_json TEXT NOT NULL DEFAULT '{}',
  matched_at TEXT NOT NULL,
  UNIQUE(demand_id,offer_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS scp_service_matches_demand ON scp_service_matches(demand_id,status,matched_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS scp_service_matches_specialist ON scp_service_matches(specialist_id,status,matched_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS scp_service_workflows (
  case_id TEXT PRIMARY KEY NOT NULL REFERENCES scp_marketplace_cases(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'CONEXION_CONFIRMADA' CHECK (state IN ('CONEXION_CONFIRMADA','VISTO','ACEPTADO','PAGO_PENDIENTE','HELD_IN_ESCROW','EN_CURSO','ENTREGADO','VALIDACION_TITULAR','INCIDENCIA_REPORTADA','REASIGNACION_PENDIENTE','REASIGNADO','CONFORMIDAD_OK','INCIDENCIA_SIN_SOLUCION','REFUND_PENDING','REFUNDED','CERRADO','CANCELADO')),
  is_subscribed_snapshot INTEGER NOT NULL DEFAULT 0 CHECK (is_subscribed_snapshot IN (0,1)),
  refund_policy_version TEXT NOT NULL DEFAULT 'scp-refund-v1',
  refund_percent INTEGER CHECK (refund_percent IS NULL OR refund_percent IN (90,100)),
  active_assignment_id TEXT,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS scp_service_assignments (
  id TEXT PRIMARY KEY NOT NULL,
  case_id TEXT NOT NULL REFERENCES scp_marketplace_cases(id) ON DELETE CASCADE,
  specialist_id TEXT NOT NULL REFERENCES portal_users(id),
  offer_id TEXT NOT NULL REFERENCES scp_marketplace_listings(id),
  sequence INTEGER NOT NULL CHECK (sequence > 0),
  status TEXT NOT NULL CHECK (status IN ('PENDING','ACTIVE','REPLACED','COMPLETED','REJECTED','CANCELLED')),
  agreed_amount_cents INTEGER NOT NULL CHECK (agreed_amount_cents > 0),
  payout_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (payout_amount_cents >= 0),
  created_at TEXT NOT NULL,
  ended_at TEXT,
  UNIQUE(case_id,sequence)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS scp_service_assignments_case ON scp_service_assignments(case_id,sequence);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS scp_service_incidents (
  id TEXT PRIMARY KEY NOT NULL,
  case_id TEXT NOT NULL REFERENCES scp_marketplace_cases(id) ON DELETE CASCADE,
  reported_by TEXT NOT NULL REFERENCES portal_users(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','UNDER_REVIEW','REASSIGNMENT_PENDING','REASSIGNED','RESOLVED','UNRESOLVED','REFUND_PENDING','REFUNDED','CLOSED')),
  resolution_note TEXT NOT NULL DEFAULT '',
  replacement_assignment_id TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS scp_service_incidents_case ON scp_service_incidents(case_id,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS scp_payment_records (
  id TEXT PRIMARY KEY NOT NULL,
  case_id TEXT NOT NULL UNIQUE REFERENCES scp_marketplace_cases(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe_connect',
  provider_payment_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency='EUR'),
  status TEXT NOT NULL DEFAULT 'provider_unconfigured' CHECK (status IN ('provider_unconfigured','requires_action','processing','held','release_pending','released','refund_pending','partially_refunded','refunded','failed','disputed')),
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS scp_payment_movements (
  id TEXT PRIMARY KEY NOT NULL,
  payment_id TEXT NOT NULL REFERENCES scp_payment_records(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('charge','hold','release','commission','refund','transfer','reversal')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status TEXT NOT NULL CHECK (status IN ('pending','succeeded','failed','reversed')),
  provider_reference TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS scp_provider_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received' CHECK (processing_status IN ('received','processed','ignored','failed')),
  received_at TEXT NOT NULL,
  processed_at TEXT,
  PRIMARY KEY(provider,event_id)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS scp_publication_fee_rules (
  id TEXT PRIMARY KEY NOT NULL,
  listing_kind TEXT NOT NULL CHECK (listing_kind IN ('demand','offer')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS scp_publication_fee_charges (
  id TEXT PRIMARY KEY NOT NULL,
  listing_id TEXT NOT NULL REFERENCES scp_marketplace_listings(id) ON DELETE CASCADE,
  payer_id TEXT NOT NULL REFERENCES portal_users(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  provider TEXT NOT NULL DEFAULT 'not_configured',
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'not_configured' CHECK (status IN ('not_configured','pending','paid','failed','refunded')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(listing_id)
);
--> statement-breakpoint
INSERT OR IGNORE INTO scp_module_migrations(version,applied_at) VALUES (1,datetime('now'));
