CREATE TABLE IF NOT EXISTS agenda_bookings (
  id TEXT PRIMARY KEY NOT NULL,
  starts_at INTEGER NOT NULL UNIQUE,
  local_day TEXT NOT NULL,
  local_time TEXT NOT NULL,
  owner_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS agenda_bookings_owner ON agenda_bookings(owner_hash, starts_at);


CREATE TABLE IF NOT EXISTS site_pageviews (
  local_day TEXT NOT NULL,
  page_path TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (local_day, page_path)
);


CREATE TABLE IF NOT EXISTS portal_users (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('client','collaborator')), status TEXT NOT NULL CHECK(status IN ('active','pending')), created_at TEXT NOT NULL, privacy_version TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS portal_collaborators (email TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('pending','active')), created_at TEXT NOT NULL, approved_at TEXT, approved_by TEXT);

CREATE TABLE IF NOT EXISTS portal_contracts (id TEXT PRIMARY KEY NOT NULL, collaborator_email TEXT NOT NULL REFERENCES portal_collaborators(email), title TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE, sha256 TEXT NOT NULL, created_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS portal_cases (id TEXT PRIMARY KEY NOT NULL, client_id TEXT NOT NULL REFERENCES portal_users(id), collaborator_id TEXT NOT NULL REFERENCES portal_users(id), title TEXT NOT NULL, service_key TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents>0), status TEXT NOT NULL DEFAULT 'pending', payment_status TEXT NOT NULL DEFAULT 'not_collected', patient_confirmed_at TEXT, incident_open INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);

CREATE INDEX IF NOT EXISTS portal_cases_client ON portal_cases(client_id);

CREATE INDEX IF NOT EXISTS portal_cases_collaborator ON portal_cases(collaborator_id);

CREATE TABLE IF NOT EXISTS portal_events (id TEXT PRIMARY KEY NOT NULL,case_id TEXT NOT NULL REFERENCES portal_cases(id),actor_id TEXT NOT NULL,kind TEXT NOT NULL,note TEXT NOT NULL,created_at TEXT NOT NULL);


CREATE TABLE IF NOT EXISTS portal_admin_attempts (actor_id TEXT PRIMARY KEY NOT NULL,window_id INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0);


CREATE TABLE IF NOT EXISTS scp_marketplace_listings (
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

CREATE INDEX IF NOT EXISTS scp_marketplace_feed ON scp_marketplace_listings(kind,status,sector,city,created_at);

CREATE INDEX IF NOT EXISTS scp_marketplace_owner ON scp_marketplace_listings(owner_id,created_at);

CREATE TABLE IF NOT EXISTS scp_marketplace_interests (
  id TEXT PRIMARY KEY NOT NULL,
  demand_id TEXT NOT NULL REFERENCES scp_marketplace_listings(id),
  specialist_id TEXT NOT NULL REFERENCES portal_users(id),
  offer_id TEXT NOT NULL REFERENCES scp_marketplace_listings(id),
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested','selected','matched','withdrawn')),
  created_at TEXT NOT NULL,
  UNIQUE(demand_id,specialist_id)
);

CREATE INDEX IF NOT EXISTS scp_marketplace_interests_demand ON scp_marketplace_interests(demand_id,status,created_at);

CREATE TABLE IF NOT EXISTS scp_marketplace_cases (
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

CREATE INDEX IF NOT EXISTS scp_marketplace_cases_titular ON scp_marketplace_cases(titular_id,created_at);

CREATE INDEX IF NOT EXISTS scp_marketplace_cases_specialist ON scp_marketplace_cases(specialist_id,created_at);

CREATE TABLE IF NOT EXISTS scp_marketplace_events (
  id TEXT PRIMARY KEY NOT NULL,
  case_id TEXT NOT NULL REFERENCES scp_marketplace_cases(id),
  actor_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS scp_marketplace_events_case ON scp_marketplace_events(case_id,created_at);

CREATE TABLE IF NOT EXISTS scp_private_reviews (
  id TEXT PRIMARY KEY NOT NULL,
  case_id TEXT NOT NULL REFERENCES scp_marketplace_cases(id),
  titular_id TEXT NOT NULL REFERENCES portal_users(id),
  specialist_id TEXT NOT NULL REFERENCES portal_users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE(case_id,titular_id)
);

CREATE INDEX IF NOT EXISTS scp_private_reviews_specialist ON scp_private_reviews(specialist_id,created_at);

CREATE TABLE IF NOT EXISTS scp_specialist_internal_notes (
  id TEXT PRIMARY KEY NOT NULL,
  specialist_id TEXT NOT NULL REFERENCES portal_users(id),
  admin_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS scp_specialist_internal_notes_specialist ON scp_specialist_internal_notes(specialist_id,created_at);


CREATE TABLE IF NOT EXISTS scp_marketplace_admin_notes (
  id TEXT PRIMARY KEY NOT NULL,
  case_id TEXT NOT NULL REFERENCES scp_marketplace_cases(id),
  admin_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS scp_marketplace_admin_notes_case ON scp_marketplace_admin_notes(case_id,created_at);


CREATE TABLE IF NOT EXISTS scp_module_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL
);

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

CREATE INDEX IF NOT EXISTS scp_user_profiles_role_status ON scp_user_profiles(role,account_status,verification_status);

CREATE TABLE IF NOT EXISTS scp_listing_specs (
  listing_id TEXT PRIMARY KEY NOT NULL REFERENCES scp_marketplace_listings(id) ON DELETE CASCADE,
  urgency_mode TEXT CHECK (urgency_mode IS NULL OR urgency_mode IN ('under_24h','scheduled')),
  requested_at TEXT,
  location_key TEXT NOT NULL,
  time_slot_key TEXT NOT NULL,
  budget_cents INTEGER CHECK (budget_cents IS NULL OR budget_cents > 0),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS scp_listing_specs_match ON scp_listing_specs(location_key,time_slot_key,budget_cents);

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

CREATE INDEX IF NOT EXISTS scp_service_matches_demand ON scp_service_matches(demand_id,status,matched_at);

CREATE INDEX IF NOT EXISTS scp_service_matches_specialist ON scp_service_matches(specialist_id,status,matched_at);

CREATE TABLE IF NOT EXISTS scp_service_workflows (
  case_id TEXT PRIMARY KEY NOT NULL REFERENCES scp_marketplace_cases(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'CONEXION_CONFIRMADA' CHECK (state IN ('CONEXION_CONFIRMADA','VISTO','ACEPTADO','PAGO_PENDIENTE','HELD_IN_ESCROW','EN_CURSO','ENTREGADO','VALIDACION_TITULAR','INCIDENCIA_REPORTADA','REASIGNACION_PENDIENTE','REASIGNADO','CONFORMIDAD_OK','INCIDENCIA_SIN_SOLUCION','REFUND_PENDING','REFUNDED','CERRADO','CANCELADO')),
  is_subscribed_snapshot INTEGER NOT NULL DEFAULT 0 CHECK (is_subscribed_snapshot IN (0,1)),
  refund_policy_version TEXT NOT NULL DEFAULT 'scp-refund-v1',
  refund_percent INTEGER CHECK (refund_percent IS NULL OR refund_percent IN (90,100)),
  active_assignment_id TEXT,
  updated_at TEXT NOT NULL
);

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

CREATE INDEX IF NOT EXISTS scp_service_assignments_case ON scp_service_assignments(case_id,sequence);

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

CREATE INDEX IF NOT EXISTS scp_service_incidents_case ON scp_service_incidents(case_id,created_at);

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

CREATE TABLE IF NOT EXISTS scp_provider_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received' CHECK (processing_status IN ('received','processed','ignored','failed')),
  received_at TEXT NOT NULL,
  processed_at TEXT,
  PRIMARY KEY(provider,event_id)
);

CREATE TABLE IF NOT EXISTS scp_publication_fee_rules (
  id TEXT PRIMARY KEY NOT NULL,
  listing_kind TEXT NOT NULL CHECK (listing_kind IN ('demand','offer')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

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

INSERT INTO scp_module_migrations(version,applied_at) VALUES (1,CURRENT_TIMESTAMP::text) ON CONFLICT(version) DO NOTHING;


CREATE TABLE IF NOT EXISTS portal_storage_aliases (object_key TEXT PRIMARY KEY NOT NULL, bucket_name TEXT NOT NULL, source_path TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text);

INSERT INTO storage.buckets (id, name, public) VALUES ('scp-portal-private', 'scp-portal-private', false) ON CONFLICT (id) DO UPDATE SET public = false;

-- This bucket is accessed only by the server-side service-role API. Do not add anon/authenticated object policies.
