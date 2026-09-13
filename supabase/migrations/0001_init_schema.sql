-- Vehicle Maintenance Log — initial schema
-- Run this once in the Supabase SQL Editor (or via `supabase db push` once
-- the project is linked with the Supabase CLI).

create extension if not exists "pgcrypto";

-- =========================================================================
-- Helper: keep updated_at fresh on every UPDATE
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- vehicles
-- =========================================================================
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  brand text not null,
  model text not null,
  year smallint,
  license_plate text,
  current_mileage integer not null default 0 check (current_mileage >= 0),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vehicles_user_id_idx on public.vehicles (user_id);

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

alter table public.vehicles enable row level security;

create policy "vehicles are managed by their owner"
  on public.vehicles
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =========================================================================
-- maintenance_types — global lookup, not user-scoped
-- =========================================================================
create table public.maintenance_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_interval_km integer check (default_interval_km > 0),
  default_interval_months integer check (default_interval_months > 0),
  icon text,
  created_at timestamptz not null default now()
);

alter table public.maintenance_types enable row level security;

create policy "maintenance types are readable by any signed-in user"
  on public.maintenance_types
  for select
  using (auth.role() = 'authenticated');

-- =========================================================================
-- maintenance_logs
-- =========================================================================
create table public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  maintenance_type_id uuid not null references public.maintenance_types (id),
  service_date date not null,
  mileage_at_service integer not null check (mileage_at_service >= 0),
  cost numeric(10, 2) check (cost >= 0),
  shop_name text,
  receipt_image_url text,
  notes text,
  -- computed by the set_maintenance_next_due trigger below — do not set manually
  next_due_mileage integer,
  next_due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index maintenance_logs_vehicle_id_idx on public.maintenance_logs (vehicle_id);
create index maintenance_logs_next_due_date_idx on public.maintenance_logs (next_due_date);

create trigger maintenance_logs_set_updated_at
  before update on public.maintenance_logs
  for each row execute function public.set_updated_at();

-- Auto-calculate the next due point from whichever interval(s) the
-- maintenance type defines — distance, time, or both ("whichever comes
-- first" is decided later by the app when it reads these two columns).
create or replace function public.set_maintenance_next_due()
returns trigger
language plpgsql
as $$
declare
  v_interval_km integer;
  v_interval_months integer;
begin
  select default_interval_km, default_interval_months
    into v_interval_km, v_interval_months
    from public.maintenance_types
    where id = new.maintenance_type_id;

  new.next_due_mileage := case
    when v_interval_km is not null then new.mileage_at_service + v_interval_km
    else null
  end;

  new.next_due_date := case
    when v_interval_months is not null
      then (new.service_date + (v_interval_months || ' months')::interval)::date
    else null
  end;

  return new;
end;
$$;

create trigger maintenance_logs_set_next_due
  before insert or update of service_date, mileage_at_service, maintenance_type_id
  on public.maintenance_logs
  for each row execute function public.set_maintenance_next_due();

alter table public.maintenance_logs enable row level security;

create policy "maintenance logs are managed by the owning vehicle's user"
  on public.maintenance_logs
  for all
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = maintenance_logs.vehicle_id and v.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = maintenance_logs.vehicle_id and v.user_id = auth.uid()
    )
  );

-- =========================================================================
-- documents — พ.ร.บ. / ประกัน / ภาษี / ใบขับขี่
-- =========================================================================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  document_type text not null check (
    document_type in ('compulsory_insurance', 'voluntary_insurance', 'tax', 'driving_license')
  ),
  issue_date date,
  expiry_date date not null,
  policy_number text,
  cost numeric(10, 2) check (cost >= 0),
  file_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_vehicle_id_idx on public.documents (vehicle_id);
create index documents_expiry_date_idx on public.documents (expiry_date);

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

create policy "documents are managed by the owning vehicle's user"
  on public.documents
  for all
  using (
    exists (
      select 1 from public.vehicles v
      where v.id = documents.vehicle_id and v.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vehicles v
      where v.id = documents.vehicle_id and v.user_id = auth.uid()
    )
  );

-- =========================================================================
-- notification_settings — one row per user
-- =========================================================================
create table public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  days_before_alert integer[] not null default '{30, 14, 7}',
  notify_via text not null default 'email' check (notify_via in ('email')),
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_settings_set_updated_at
  before update on public.notification_settings
  for each row execute function public.set_updated_at();

alter table public.notification_settings enable row level security;

create policy "notification settings are managed by their owner"
  on public.notification_settings
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
