-- Servicios Canal Puente (SCP) · Módulo A
-- Pegar una vez en Supabase > SQL Editor > New query.
-- El cliente del navegador solo usa la clave pública (anon/publishable) y RLS.
-- Nunca se debe colocar una service_role/secret key en el navegador.

create extension if not exists pgcrypto with schema extensions;

do $$ begin
  create type public.scp_user_role as enum ('ADMIN', 'TITULAR', 'ESPECIALISTA');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.scp_profile_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.scp_listing_status as enum ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'PAUSED', 'REJECTED', 'MATCHED', 'CANCELLED');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.scp_request_urgency as enum ('UNDER_24H', 'SCHEDULED');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.scp_order_status as enum ('VISTO', 'ACEPTADO', 'EN_CURSO', 'ENTREGADO', 'CONFORMIDAD_OK', 'INCIDENCIA');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.scp_financial_status as enum ('UNPAID', 'HELD_IN_ESCROW', 'RELEASED', 'REFUNDED_100', 'REFUNDED_90');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.scp_user_role not null default 'TITULAR',
  approval_status public.scp_profile_status not null default 'PENDING',
  is_subscribed boolean not null default false,
  is_verified boolean not null default false,
  display_name text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  contact_preference text not null default '',
  identity_type text not null default '',
  identity_number text not null default '',
  address text not null default '',
  profession text not null default '',
  college text not null default '',
  college_number text not null default '',
  registration_required boolean not null default false,
  business_name text not null default '',
  legal_name text not null default '',
  tax_id text not null default '',
  business_address text not null default '',
  business_activity text not null default '',
  sector text not null default '',
  license_number text not null default '',
  requires_license boolean not null default false,
  profile_data jsonb not null default '{}'::jsonb,
  review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_flags_check check (
    (role = 'TITULAR' or is_subscribed = false)
    and (role = 'ESPECIALISTA' or is_verified = false)
  )
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  titular_id uuid not null references public.profiles(id) on delete restrict,
  sector text not null,
  service_title text not null,
  description text not null,
  urgency public.scp_request_urgency not null default 'UNDER_24H',
  scheduled_for timestamptz,
  time_window text not null default 'flexible',
  city text not null,
  service_area text not null default '',
  postal_code text not null default '',
  budget_cents bigint,
  currency char(3) not null default 'EUR',
  share_with_verified boolean not null default true,
  status public.scp_listing_status not null default 'DRAFT',
  response_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint request_schedule_check check (
    (urgency = 'UNDER_24H' and scheduled_for is null)
    or (urgency = 'SCHEDULED' and scheduled_for is not null)
  ),
  constraint request_budget_check check (budget_cents is null or budget_cents > 0),
  constraint request_published_budget_check check (status <> 'PUBLISHED' or budget_cents is not null)
);

create table if not exists public.specialist_offers (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.profiles(id) on delete restrict,
  sector text not null,
  service_title text not null,
  public_name text not null default '',
  qualifications_summary text not null default '',
  availability_slots text[] not null default array['flexible']::text[],
  available_from timestamptz,
  available_until timestamptz,
  city text not null,
  service_area text not null default '',
  coverage_km integer not null default 0,
  fixed_fee_cents bigint not null,
  currency char(3) not null default 'EUR',
  description text not null,
  status public.scp_listing_status not null default 'PENDING_REVIEW',
  admin_review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offer_fixed_fee_check check (fixed_fee_cents > 0),
  constraint offer_coverage_check check (coverage_km >= 0),
  constraint offer_availability_check check (cardinality(availability_slots) > 0),
  constraint offer_availability_dates_check check (available_until is null or available_from is null or available_until >= available_from)
);

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.service_requests(id) on delete restrict,
  offer_id uuid not null references public.specialist_offers(id) on delete restrict,
  titular_id uuid not null references public.profiles(id) on delete restrict,
  specialist_id uuid not null references public.profiles(id) on delete restrict,
  service_title text not null,
  titular_display_name text not null default '',
  specialist_display_name text not null default '',
  total_cents bigint not null,
  scp_fee_cents bigint,
  specialist_net_cents bigint,
  status public.scp_order_status not null default 'VISTO',
  financial_status public.scp_financial_status not null default 'UNPAID',
  financial_amount_cents bigint,
  refund_amount_cents bigint,
  payment_provider text not null default '',
  payment_reference text not null default '',
  paid_at timestamptz,
  financial_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_total_check check (total_cents > 0),
  constraint order_fee_check check (
    (scp_fee_cents is null and specialist_net_cents is null)
    or (scp_fee_cents is not null and specialist_net_cents is not null
        and scp_fee_cents >= 0 and specialist_net_cents >= 0
        and scp_fee_cents + specialist_net_cents = total_cents)
  )
);

create table if not exists public.service_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in ('STATUS_CHANGED', 'FINANCIAL_CHANGED', 'ADMIN_NOTE')),
  from_status public.scp_order_status,
  to_status public.scp_order_status,
  from_financial_status public.scp_financial_status,
  to_financial_status public.scp_financial_status,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.specialist_documents (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.profiles(id) on delete cascade,
  document_kind text not null check (document_kind in ('qualification', 'authorization', 'insurance', 'license', 'identity', 'business')),
  object_path text not null unique,
  file_name text not null,
  mime_type text not null default 'application/pdf',
  size_bytes bigint not null check (size_bytes between 1 and 8388608),
  created_at timestamptz not null default now()
);

create table if not exists public.specialist_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.service_orders(id) on delete restrict,
  titular_id uuid not null references public.profiles(id) on delete restrict,
  specialist_id uuid not null references public.profiles(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  private_note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists service_requests_owner_created_idx on public.service_requests (titular_id, created_at desc);
create index if not exists service_requests_match_idx on public.service_requests (status, sector, city, urgency);
create index if not exists specialist_offers_owner_created_idx on public.specialist_offers (specialist_id, created_at desc);
create index if not exists specialist_offers_match_idx on public.specialist_offers (status, sector, city, fixed_fee_cents);
create index if not exists service_orders_titular_created_idx on public.service_orders (titular_id, created_at desc);
create index if not exists service_orders_specialist_created_idx on public.service_orders (specialist_id, created_at desc);
create index if not exists service_order_events_order_created_idx on public.service_order_events (order_id, created_at);
create index if not exists specialist_documents_owner_created_idx on public.specialist_documents (specialist_id, created_at desc);
create index if not exists specialist_reviews_specialist_created_idx on public.specialist_reviews (specialist_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
drop trigger if exists requests_touch_updated_at on public.service_requests;
create trigger requests_touch_updated_at before update on public.service_requests
for each row execute function public.touch_updated_at();
drop trigger if exists offers_touch_updated_at on public.specialist_offers;
create trigger offers_touch_updated_at before update on public.specialist_offers
for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch_updated_at on public.service_orders;
create trigger orders_touch_updated_at before update on public.service_orders
for each row execute function public.touch_updated_at();

create or replace function public.set_scp_request_deadline()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'PUBLISHED'::public.scp_listing_status and new.urgency = 'UNDER_24H'::public.scp_request_urgency then
    new.response_due_at := now() + interval '24 hours';
  else
    new.response_due_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists service_request_set_deadline on public.service_requests;
create trigger service_request_set_deadline before insert or update of status, urgency on public.service_requests
for each row execute function public.set_scp_request_deadline();

create or replace function public.handle_new_scp_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_role public.scp_user_role;
begin
  -- user_metadata lo elige el usuario: solo se aceptan roles no privilegiados.
  v_role := case when new.raw_user_meta_data ->> 'scp_role' = 'ESPECIALISTA'
    then 'ESPECIALISTA'::public.scp_user_role else 'TITULAR'::public.scp_user_role end;
  insert into public.profiles (id, email, role, display_name)
  values (new.id, coalesce(new.email, ''), v_role,
          coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_scp_profile on auth.users;
create trigger on_auth_user_created_scp_profile after insert on auth.users
for each row execute function public.handle_new_scp_user();

create or replace function public.is_scp_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'ADMIN'::public.scp_user_role
      and p.approval_status = 'APPROVED'::public.scp_profile_status
  );
$$;

create or replace function public.is_scp_active_user(p_user_id uuid, p_role public.scp_user_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.role = p_role
      and p.approval_status = 'APPROVED'::public.scp_profile_status
      and (p_role <> 'ESPECIALISTA'::public.scp_user_role or p.is_verified)
      and (
        p_user_id = (select auth.uid())
        or (p_role = 'ESPECIALISTA'::public.scp_user_role and exists (
          select 1 from public.specialist_offers so
          where so.specialist_id = p_user_id and so.status = 'PUBLISHED'::public.scp_listing_status
        ))
        or (select public.is_scp_admin())
      )
  );
$$;

revoke all on function public.is_scp_admin() from public, anon;
revoke all on function public.is_scp_active_user(uuid, public.scp_user_role) from public, anon;
grant execute on function public.is_scp_admin() to authenticated, service_role;
grant execute on function public.is_scp_active_user(uuid, public.scp_user_role) to authenticated, service_role;

-- Abrir el perfil del especialista solo después de revisar los documentos por el canal privado.
create or replace function public.admin_review_profile(
  p_profile_id uuid,
  p_approval_status public.scp_profile_status,
  p_is_verified boolean default false,
  p_note text default ''
)
returns public.profiles language plpgsql security definer set search_path = '' as $$
declare v_profile public.profiles;
begin
  if not public.is_scp_admin() then raise exception 'Solo Administración SCP puede revisar perfiles.'; end if;
  if p_approval_status not in ('APPROVED'::public.scp_profile_status, 'REJECTED'::public.scp_profile_status, 'SUSPENDED'::public.scp_profile_status) then
    raise exception 'Estado de revisión no permitido.';
  end if;
  select * into v_profile from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'No existe el perfil.'; end if;
  if v_profile.role = 'ADMIN' then raise exception 'No se puede revisar una cuenta ADMIN desde este panel.'; end if;
  if v_profile.role = 'ESPECIALISTA' and p_approval_status = 'APPROVED' and not p_is_verified then
    raise exception 'Un especialista no se puede activar sin marcar su documentación como verificada.';
  end if;
  update public.profiles set approval_status = p_approval_status,
    is_verified = case when role = 'ESPECIALISTA' then (p_approval_status = 'APPROVED' and p_is_verified) else false end,
    review_note = left(coalesce(p_note, ''), 2000)
  where id = p_profile_id returning * into v_profile;
  return v_profile;
end;
$$;

create or replace function public.admin_review_offer(
  p_offer_id uuid,
  p_status public.scp_listing_status,
  p_note text default ''
)
returns public.specialist_offers language plpgsql security definer set search_path = '' as $$
declare v_offer public.specialist_offers;
begin
  if not public.is_scp_admin() then raise exception 'Solo Administración SCP puede revisar ofertas.'; end if;
  if p_status not in ('PUBLISHED'::public.scp_listing_status, 'REJECTED'::public.scp_listing_status, 'PAUSED'::public.scp_listing_status) then
    raise exception 'Estado de oferta no permitido.';
  end if;
  select * into v_offer from public.specialist_offers where id = p_offer_id for update;
  if not found then raise exception 'No existe la oferta.'; end if;
  if p_status = 'PUBLISHED'::public.scp_listing_status and not public.is_scp_active_user(v_offer.specialist_id, 'ESPECIALISTA'::public.scp_user_role) then
    raise exception 'El perfil del especialista debe estar aprobado y verificado antes de publicar.';
  end if;
  update public.specialist_offers set status = p_status, admin_review_note = left(coalesce(p_note, ''), 1500)
    where id = p_offer_id returning * into v_offer;
  return v_offer;
end;
$$;

create or replace function public.create_service_order(p_request_id uuid, p_offer_id uuid)
returns public.service_orders language plpgsql security definer set search_path = '' as $$
declare v_req public.service_requests; v_offer public.specialist_offers; v_titular public.profiles; v_specialist public.profiles; v_order public.service_orders;
begin
  if (select auth.uid()) is null then raise exception 'Inicia sesión para conectar el servicio.'; end if;
  select * into v_req from public.service_requests where id = p_request_id for update;
  select * into v_offer from public.specialist_offers where id = p_offer_id;
  if not found or v_req.id is null then raise exception 'No se encuentra la demanda o la oferta.'; end if;
  if v_req.titular_id <> (select auth.uid()) then raise exception 'Solo el Usuario Titular propietario de la demanda puede conectar una oferta.'; end if;
  if not public.is_scp_active_user(v_req.titular_id, 'TITULAR'::public.scp_user_role) then raise exception 'El perfil Titular debe estar aprobado.'; end if;
  if v_req.status <> 'PUBLISHED'::public.scp_listing_status or not v_req.share_with_verified then raise exception 'La demanda no está publicada para especialistas.'; end if;
  if v_offer.status <> 'PUBLISHED'::public.scp_listing_status or not public.is_scp_active_user(v_offer.specialist_id, 'ESPECIALISTA'::public.scp_user_role) then
    raise exception 'La oferta no está publicada por un especialista verificado.';
  end if;
  if v_offer.sector <> v_req.sector or lower(trim(v_offer.city)) <> lower(trim(v_req.city)) then raise exception 'No coincide el sector y la ciudad.'; end if;
  if v_req.budget_cents is null or v_offer.fixed_fee_cents > v_req.budget_cents then raise exception 'La tarifa supera el presupuesto cerrado.'; end if;
  if not ('flexible' = any(v_offer.availability_slots) or v_req.time_window = any(v_offer.availability_slots)) then raise exception 'No coincide la disponibilidad horaria.'; end if;
  if v_req.urgency = 'SCHEDULED'::public.scp_request_urgency and v_offer.available_from is not null and v_req.scheduled_for < v_offer.available_from then
    raise exception 'La fecha solicitada es anterior a la disponibilidad de la oferta.';
  end if;
  if v_req.urgency = 'SCHEDULED'::public.scp_request_urgency and v_offer.available_until is not null and v_req.scheduled_for > v_offer.available_until then
    raise exception 'La fecha solicitada queda fuera de la disponibilidad de la oferta.';
  end if;
  select * into v_titular from public.profiles where id = v_req.titular_id;
  select * into v_specialist from public.profiles where id = v_offer.specialist_id;
  insert into public.service_orders (
    request_id, offer_id, titular_id, specialist_id, service_title,
    titular_display_name, specialist_display_name, total_cents, status, financial_status
  ) values (
    v_req.id, v_offer.id, v_req.titular_id, v_offer.specialist_id, v_offer.service_title,
    coalesce(nullif(v_titular.display_name, ''), v_titular.first_name || ' ' || v_titular.last_name),
    coalesce(nullif(v_offer.public_name, ''), nullif(v_specialist.business_name, ''), v_specialist.display_name),
    v_offer.fixed_fee_cents, 'VISTO'::public.scp_order_status, 'UNPAID'::public.scp_financial_status
  ) returning * into v_order;
  update public.service_requests set status = 'MATCHED'::public.scp_listing_status where id = v_req.id;
  insert into public.service_order_events (order_id, actor_id, event_type, to_status, note)
    values (v_order.id, (select auth.uid()), 'STATUS_CHANGED', 'VISTO'::public.scp_order_status, 'Conexión creada. Pago pendiente; no hay fondos en custodia.');
  return v_order;
exception when unique_violation then
  raise exception 'Esta demanda ya tiene un expediente de conexión.';
end;
$$;

create or replace function public.update_service_order_status(
  p_order_id uuid,
  p_new_status public.scp_order_status,
  p_note text default ''
)
returns public.service_orders language plpgsql security definer set search_path = '' as $$
declare v_order public.service_orders; v_role public.scp_user_role; v_uid uuid := (select auth.uid()); v_old public.scp_order_status; v_allowed boolean := false;
begin
  if v_uid is null then raise exception 'Inicia sesión para actualizar el expediente.'; end if;
  select * into v_order from public.service_orders where id = p_order_id for update;
  if not found then raise exception 'No se encuentra el expediente.'; end if;
  v_old := v_order.status;
  select role into v_role from public.profiles where id = v_uid;
  if v_uid not in (v_order.titular_id, v_order.specialist_id) then raise exception 'No tienes acceso a este expediente.'; end if;
  if p_new_status = 'INCIDENCIA'::public.scp_order_status then
    v_allowed := v_order.status not in ('CONFORMIDAD_OK'::public.scp_order_status, 'INCIDENCIA'::public.scp_order_status)
      and length(trim(coalesce(p_note, ''))) >= 5;
  elsif v_role = 'ESPECIALISTA'::public.scp_user_role and p_new_status = 'ACEPTADO'::public.scp_order_status then
    v_allowed := v_order.specialist_id = v_uid and v_order.status = 'VISTO'::public.scp_order_status;
  elsif v_role = 'ESPECIALISTA'::public.scp_user_role and p_new_status = 'EN_CURSO'::public.scp_order_status then
    v_allowed := v_order.specialist_id = v_uid and v_order.status = 'ACEPTADO'::public.scp_order_status
      and v_order.financial_status = 'HELD_IN_ESCROW'::public.scp_financial_status;
  elsif v_role = 'ESPECIALISTA'::public.scp_user_role and p_new_status = 'ENTREGADO'::public.scp_order_status then
    v_allowed := v_order.specialist_id = v_uid and v_order.status = 'EN_CURSO'::public.scp_order_status;
  elsif v_role = 'TITULAR'::public.scp_user_role and p_new_status = 'CONFORMIDAD_OK'::public.scp_order_status then
    v_allowed := v_order.titular_id = v_uid and v_order.status = 'ENTREGADO'::public.scp_order_status;
  end if;
  if not v_allowed then raise exception 'Este cambio no está permitido en el estado actual. Para iniciar, el pago debe constar como retenido por un proveedor conectado.'; end if;
  update public.service_orders set status = p_new_status where id = p_order_id returning * into v_order;
  insert into public.service_order_events (order_id, actor_id, event_type, from_status, to_status, note)
    values (p_order_id, v_uid, 'STATUS_CHANGED', v_old, p_new_status, left(coalesce(p_note,''), 2000));
  return v_order;
end;
$$;

create or replace function public.admin_set_order_status(
  p_order_id uuid,
  p_new_status public.scp_order_status,
  p_note text default ''
)
returns public.service_orders language plpgsql security definer set search_path = '' as $$
declare v_order public.service_orders; v_old public.scp_order_status;
begin
  if not public.is_scp_admin() then raise exception 'Solo Administración SCP puede modificar este expediente.'; end if;
  select * into v_order from public.service_orders where id = p_order_id for update;
  if not found then raise exception 'No se encuentra el expediente.'; end if;
  if p_new_status = 'EN_CURSO'::public.scp_order_status and v_order.financial_status <> 'HELD_IN_ESCROW'::public.scp_financial_status then
    raise exception 'No se puede iniciar el servicio sin una confirmación real de fondos retenidos.';
  end if;
  v_old := v_order.status;
  update public.service_orders set status = p_new_status where id = p_order_id returning * into v_order;
  insert into public.service_order_events (order_id, actor_id, event_type, from_status, to_status, note)
    values (p_order_id, (select auth.uid()), 'STATUS_CHANGED', v_old, p_new_status, left(coalesce(p_note,''), 2000));
  return v_order;
end;
$$;

-- Solo un proceso de servidor/webhook de pagos con service_role puede cambiar dinero.
-- Supabase Auth y estas tablas por sí solas no cobran, retienen, liberan ni reembolsan fondos.
create or replace function public.apply_order_financial_event(
  p_order_id uuid,
  p_new_financial_status public.scp_financial_status,
  p_provider text,
  p_payment_reference text,
  p_confirmed_amount_cents bigint,
  p_scp_fee_cents bigint default null,
  p_note text default ''
)
returns public.service_orders language plpgsql security definer set search_path = '' as $$
declare v_order public.service_orders; v_old public.scp_financial_status;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'Este cambio requiere el backend/webhook privado del proveedor de pagos.'; end if;
  select * into v_order from public.service_orders where id = p_order_id for update;
  if not found then raise exception 'No se encuentra el expediente.'; end if;
  v_old := v_order.financial_status;
  if v_old = 'UNPAID'::public.scp_financial_status and p_new_financial_status <> 'HELD_IN_ESCROW'::public.scp_financial_status then raise exception 'El primer evento financiero debe confirmar el pago retenido.'; end if;
  if v_old = 'HELD_IN_ESCROW'::public.scp_financial_status and p_new_financial_status not in ('RELEASED'::public.scp_financial_status, 'REFUNDED_100'::public.scp_financial_status, 'REFUNDED_90'::public.scp_financial_status) then raise exception 'Resolución financiera inválida.'; end if;
  if v_old <> 'UNPAID'::public.scp_financial_status and v_old <> 'HELD_IN_ESCROW'::public.scp_financial_status then raise exception 'El expediente ya tiene una resolución financiera terminal.'; end if;
  if p_new_financial_status = 'RELEASED'::public.scp_financial_status and v_order.status <> 'CONFORMIDAD_OK'::public.scp_order_status then raise exception 'El pago solo se libera tras la conformidad del Titular.'; end if;
  if p_new_financial_status in ('REFUNDED_100'::public.scp_financial_status, 'REFUNDED_90'::public.scp_financial_status) and v_order.status <> 'INCIDENCIA'::public.scp_order_status then raise exception 'El reembolso exige una incidencia registrada.'; end if;
  if p_confirmed_amount_cents is null or p_confirmed_amount_cents < 0 then raise exception 'El backend debe enviar el importe confirmado por el proveedor.'; end if;
  if p_new_financial_status = 'HELD_IN_ESCROW'::public.scp_financial_status and p_confirmed_amount_cents <> v_order.total_cents then raise exception 'El importe confirmado no coincide con el precio cerrado del expediente.'; end if;
  if p_new_financial_status = 'RELEASED'::public.scp_financial_status and p_confirmed_amount_cents <> v_order.total_cents then raise exception 'El importe liberado no coincide con el total del expediente.'; end if;
  if p_new_financial_status = 'REFUNDED_100'::public.scp_financial_status and p_confirmed_amount_cents <> v_order.total_cents then raise exception 'El reembolso no coincide con el 100%% del importe.'; end if;
  if p_new_financial_status = 'REFUNDED_90'::public.scp_financial_status and p_confirmed_amount_cents <> floor((v_order.total_cents * 90 + 50) / 100) then raise exception 'El reembolso no coincide con el 90%% establecido.'; end if;
  if p_new_financial_status = 'REFUNDED_100'::public.scp_financial_status and not exists (
    select 1 from public.profiles p where p.id = v_order.titular_id and p.is_subscribed
  ) then raise exception 'El reembolso del 100%% requiere una membresía activa confirmada.'; end if;
  if p_new_financial_status = 'REFUNDED_90'::public.scp_financial_status and exists (
    select 1 from public.profiles p where p.id = v_order.titular_id and p.is_subscribed
  ) then raise exception 'La cuenta tiene membresía activa; comprueba el porcentaje aplicable.'; end if;
  if p_new_financial_status = 'RELEASED'::public.scp_financial_status and (p_scp_fee_cents is null or p_scp_fee_cents < 0 or p_scp_fee_cents > v_order.total_cents) then raise exception 'Configura la comisión SCP antes de liquidar.'; end if;
  update public.service_orders set financial_status = p_new_financial_status,
    financial_amount_cents = p_confirmed_amount_cents,
    refund_amount_cents = case when p_new_financial_status in ('REFUNDED_100'::public.scp_financial_status, 'REFUNDED_90'::public.scp_financial_status) then p_confirmed_amount_cents else refund_amount_cents end,
    payment_provider = left(coalesce(p_provider,''), 60), payment_reference = left(coalesce(p_payment_reference,''), 200),
    scp_fee_cents = case when p_new_financial_status = 'RELEASED'::public.scp_financial_status then p_scp_fee_cents else scp_fee_cents end,
    specialist_net_cents = case when p_new_financial_status = 'RELEASED'::public.scp_financial_status then total_cents - p_scp_fee_cents else specialist_net_cents end,
    paid_at = case when p_new_financial_status = 'HELD_IN_ESCROW'::public.scp_financial_status then now() else paid_at end,
    financial_updated_at = now()
  where id = p_order_id returning * into v_order;
  insert into public.service_order_events (order_id, actor_id, event_type, from_financial_status, to_financial_status, note)
    values (p_order_id, null, 'FINANCIAL_CHANGED', v_old, p_new_financial_status, left(coalesce(p_note,''), 2000));
  return v_order;
end;
$$;

create or replace function public.create_private_specialist_review(
  p_order_id uuid, p_rating smallint, p_private_note text default ''
)
returns public.specialist_reviews language plpgsql security definer set search_path = '' as $$
declare v_order public.service_orders; v_review public.specialist_reviews;
begin
  select * into v_order from public.service_orders where id = p_order_id;
  if not found or v_order.titular_id <> (select auth.uid()) then raise exception 'Solo el Usuario Titular del expediente puede dejar esta valoración.'; end if;
  if v_order.status <> 'CONFORMIDAD_OK'::public.scp_order_status then raise exception 'La valoración se habilita después de cerrar el servicio con conformidad.'; end if;
  insert into public.specialist_reviews (order_id, titular_id, specialist_id, rating, private_note)
    values (p_order_id, v_order.titular_id, v_order.specialist_id, p_rating, left(coalesce(p_private_note,''), 1500)) returning * into v_review;
  return v_review;
end;
$$;

revoke all on function public.admin_review_profile(uuid, public.scp_profile_status, boolean, text) from public, anon;
revoke all on function public.admin_review_offer(uuid, public.scp_listing_status, text) from public, anon;
revoke all on function public.create_service_order(uuid, uuid) from public, anon;
revoke all on function public.update_service_order_status(uuid, public.scp_order_status, text) from public, anon;
revoke all on function public.admin_set_order_status(uuid, public.scp_order_status, text) from public, anon;
revoke all on function public.apply_order_financial_event(uuid, public.scp_financial_status, text, text, bigint, bigint, text) from public, anon, authenticated;
revoke all on function public.create_private_specialist_review(uuid, smallint, text) from public, anon;
grant execute on function public.admin_review_profile(uuid, public.scp_profile_status, boolean, text) to authenticated, service_role;
grant execute on function public.admin_review_offer(uuid, public.scp_listing_status, text) to authenticated, service_role;
grant execute on function public.create_service_order(uuid, uuid) to authenticated, service_role;
grant execute on function public.update_service_order_status(uuid, public.scp_order_status, text) to authenticated, service_role;
grant execute on function public.admin_set_order_status(uuid, public.scp_order_status, text) to authenticated, service_role;
grant execute on function public.apply_order_financial_event(uuid, public.scp_financial_status, text, text, bigint, bigint, text) to service_role;
grant execute on function public.create_private_specialist_review(uuid, smallint, text) to authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.service_requests enable row level security;
alter table public.specialist_offers enable row level security;
alter table public.service_orders enable row level security;
alter table public.service_order_events enable row level security;
alter table public.specialist_documents enable row level security;
alter table public.specialist_reviews enable row level security;

drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_scp_admin()));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid()) and role in ('TITULAR'::public.scp_user_role, 'ESPECIALISTA'::public.scp_user_role))
  with check (id = (select auth.uid()) and role in ('TITULAR'::public.scp_user_role, 'ESPECIALISTA'::public.scp_user_role));

drop policy if exists requests_read_own_shared_or_admin on public.service_requests;
create policy requests_read_own_shared_or_admin on public.service_requests for select to authenticated
  using (
    titular_id = (select auth.uid())
    or (select public.is_scp_admin())
    or (status = 'PUBLISHED'::public.scp_listing_status and share_with_verified
        and (select public.is_scp_active_user((select auth.uid()), 'ESPECIALISTA'::public.scp_user_role)))
  );
drop policy if exists requests_insert_titular on public.service_requests;
create policy requests_insert_titular on public.service_requests for insert to authenticated
  with check (
    titular_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'TITULAR'::public.scp_user_role)
    and (status = 'DRAFT'::public.scp_listing_status
         or (status = 'PUBLISHED'::public.scp_listing_status and (select public.is_scp_active_user((select auth.uid()), 'TITULAR'::public.scp_user_role))))
  );

drop policy if exists offers_read_public_verified_owner_or_admin on public.specialist_offers;
create policy offers_read_public_verified_owner_or_admin on public.specialist_offers for select to authenticated
  using (
    specialist_id = (select auth.uid())
    or (select public.is_scp_admin())
    or (status = 'PUBLISHED'::public.scp_listing_status
        and (select public.is_scp_active_user(specialist_id, 'ESPECIALISTA'::public.scp_user_role))
        and (select public.is_scp_active_user((select auth.uid()), 'TITULAR'::public.scp_user_role)))
  );
drop policy if exists offers_insert_specialist on public.specialist_offers;
create policy offers_insert_specialist on public.specialist_offers for insert to authenticated
  with check (
    specialist_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'ESPECIALISTA'::public.scp_user_role)
    and status in ('DRAFT'::public.scp_listing_status, 'PENDING_REVIEW'::public.scp_listing_status)
  );

drop policy if exists orders_read_participants_or_admin on public.service_orders;
create policy orders_read_participants_or_admin on public.service_orders for select to authenticated
  using (titular_id = (select auth.uid()) or specialist_id = (select auth.uid()) or (select public.is_scp_admin()));
drop policy if exists events_read_participants_or_admin on public.service_order_events;
create policy events_read_participants_or_admin on public.service_order_events for select to authenticated
  using (exists (select 1 from public.service_orders o where o.id = order_id and
    (o.titular_id = (select auth.uid()) or o.specialist_id = (select auth.uid()) or (select public.is_scp_admin()))));
drop policy if exists documents_read_owner_or_admin on public.specialist_documents;
create policy documents_read_owner_or_admin on public.specialist_documents for select to authenticated
  using (specialist_id = (select auth.uid()) or (select public.is_scp_admin()));
drop policy if exists documents_insert_verified_identity on public.specialist_documents;
create policy documents_insert_verified_identity on public.specialist_documents for insert to authenticated
  with check (specialist_id = (select auth.uid()) and exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'ESPECIALISTA'::public.scp_user_role
  ));
drop policy if exists reviews_read_private_parties_or_admin on public.specialist_reviews;
create policy reviews_read_private_parties_or_admin on public.specialist_reviews for select to authenticated
  using (titular_id = (select auth.uid()) or specialist_id = (select auth.uid()) or (select public.is_scp_admin()));
drop policy if exists reviews_insert_titular_after_close on public.specialist_reviews;
create policy reviews_insert_titular_after_close on public.specialist_reviews for insert to authenticated
  with check (titular_id = (select auth.uid()) and exists (
    select 1 from public.service_orders o where o.id = order_id and o.titular_id = (select auth.uid())
      and o.specialist_id = specialist_id and o.status = 'CONFORMIDAD_OK'::public.scp_order_status
  ));

revoke all on public.profiles, public.service_requests, public.specialist_offers,
  public.service_orders, public.service_order_events, public.specialist_documents,
  public.specialist_reviews from anon, authenticated;
grant select on public.profiles, public.service_requests, public.specialist_offers,
  public.service_orders, public.service_order_events, public.specialist_documents,
  public.specialist_reviews to authenticated;
-- El perfil propio puede editar sus datos, pero no cambiar role, aprobación, membresía ni verificación.
grant update (display_name, first_name, last_name, phone, contact_preference, identity_type,
  identity_number, address, profession, college, college_number, registration_required,
  business_name, legal_name, tax_id, business_address, business_activity, sector,
  license_number, requires_license, profile_data) on public.profiles to authenticated;
grant insert on public.service_requests, public.specialist_offers, public.specialist_documents,
  public.specialist_reviews to authenticated;

-- Bucket privado: expedientes profesionales en PDF, nunca públicos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scp-specialist-documents', 'scp-specialist-documents', false, 8388608, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 8388608, allowed_mime_types = array['application/pdf'];

drop policy if exists scp_docs_insert_own on storage.objects;
create policy scp_docs_insert_own on storage.objects for insert to authenticated
  with check (
    bucket_id = 'scp-specialist-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'ESPECIALISTA'::public.scp_user_role)
  );
drop policy if exists scp_docs_read_owner_or_admin on storage.objects;
create policy scp_docs_read_owner_or_admin on storage.objects for select to authenticated
  using (
    bucket_id = 'scp-specialist-documents'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_scp_admin()))
  );

-- Para habilitar la cuenta propietaria, crea primero su usuario en /registro.html y luego,
-- en SQL Editor, sustituye el correo por el correo de administración real y ejecuta:
-- update public.profiles set role='ADMIN', approval_status='APPROVED', is_subscribed=false, is_verified=false
-- where lower(email)=lower('TU_CORREO_ADMIN');

-- El estado UNPAID es el valor inicial honesto. HELD_IN_ESCROW/RELEASED/REFUNDED_*
-- solo deben actualizarse desde un backend/webhook privado después de confirmar al proveedor.
