-- Esquema relacional estructurado para Servicios Canal Puente (SCP)
-- Listo para migración directa a Supabase / PostgreSQL

create type scp_role as enum ('titular', 'especialista', 'admin');
create type scp_sector as enum (
  'tramites',
  'salud',
  'inmobiliaria',
  'academia',
  'bienestar',
  'proteccion_animal',
  'comunicacion',
  'asociacion'
);
create type scp_request_status as enum (
  '1. Solicitud recibida',
  '2. Estudio y opciones',
  '3. Presupuesto aceptado',
  '4. En ejecución',
  '5. Cierre y valoración'
);
create type scp_validation_status as enum ('En revisión por SCP', 'Validado', 'Rechazado');
create type scp_escrow_status as enum ('Pendiente de depósito', 'En custodia SCP', 'Liberado al especialista');

create table if not exists public.scp_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  full_name text not null,
  phone text not null,
  role scp_role not null default 'titular',
  city text not null default 'Madrid',
  membership_tier text not null default 'Estándar',
  created_at timestamptz not null default now()
);

create table if not exists public.scp_specialists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.scp_users(id) on delete cascade,
  company_name text,
  sector scp_sector not null,
  specialty text not null,
  license_number text not null,
  rc_insurance_policy text not null,
  city text not null,
  modality text not null,
  orientative_rate numeric(10,2) not null default 95,
  discount_percent integer not null check (discount_percent between 0 and 25),
  quality_pledge_accepted boolean not null default true,
  bio text not null,
  validation_status scp_validation_status not null default 'En revisión por SCP',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.scp_service_requests (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  titular_id uuid references public.scp_users(id) on delete cascade,
  sector scp_sector not null,
  title text not null,
  description text not null,
  city text not null,
  modality text not null,
  estimated_budget numeric(10,2) not null,
  applied_discount_percent integer not null default 25,
  status scp_request_status not null default '1. Solicitud recibida',
  assigned_specialist_id uuid references public.scp_specialists(id),
  specialist_proposal text,
  proposed_final_amount numeric(10,2),
  escrow_status scp_escrow_status not null default 'Pendiente de depósito',
  titular_rating integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
