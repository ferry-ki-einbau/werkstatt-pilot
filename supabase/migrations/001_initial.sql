-- Tenants (jede Werkstatt = 1 Tenant)
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  phone text,
  address text,
  google_review_url text,
  logo_url text,
  sms_enabled boolean default false,
  created_at timestamptz default now()
);

-- Profiles (erweitert Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  full_name text,
  role text default 'technician' check (role in ('owner', 'admin', 'technician')),
  created_at timestamptz default now()
);

-- Customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  full_name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now()
);

-- Vehicles
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  kennzeichen text not null,
  marke text,
  modell text,
  baujahr integer,
  vin text,
  tuev_datum date,
  letzte_inspektion date,
  letzter_km_stand integer,
  created_at timestamptz default now()
);

-- Jobs (Aufträge = Kanban Karten)
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  vehicle_id uuid references public.vehicles(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'annahme' check (status in (
    'annahme', 'diagnose', 'teile_bestellt', 'teile_da', 'reparatur', 'abholbereit', 'abgeholt'
  )),
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  estimated_cost numeric(10,2),
  actual_cost numeric(10,2),
  estimated_ready date,
  technician_id uuid references public.profiles(id),
  internal_notes text,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notification Log
create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade,
  customer_id uuid references public.customers(id),
  type text not null check (type in ('sms', 'email', 'whatsapp')),
  status text not null check (status in ('sent', 'failed', 'pending')),
  message text,
  recipient text,
  created_at timestamptz default now()
);

-- RLS aktivieren
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.jobs enable row level security;
alter table public.notification_log enable row level security;

-- Helper function: get current user's tenant_id
create or replace function public.get_tenant_id()
returns uuid language sql stable as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

-- RLS Policies: Profiles
create policy "Users can view own profile" on public.profiles
  for select using (id = auth.uid());
create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());

-- RLS Policies: Tenants
create policy "Users can view own tenant" on public.tenants
  for select using (id = public.get_tenant_id());
create policy "Owner can update tenant" on public.tenants
  for update using (id = public.get_tenant_id());

-- RLS Policies: Customers
create policy "Tenant users can view customers" on public.customers
  for all using (tenant_id = public.get_tenant_id());

-- RLS Policies: Vehicles
create policy "Tenant users can view vehicles" on public.vehicles
  for all using (tenant_id = public.get_tenant_id());

-- RLS Policies: Jobs
create policy "Tenant users can view jobs" on public.jobs
  for all using (tenant_id = public.get_tenant_id());

-- RLS Policies: Notification Log
create policy "Tenant users can view notifications" on public.notification_log
  for all using (tenant_id = public.get_tenant_id());

-- Trigger: update jobs.updated_at automatisch
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.update_updated_at();

-- Trigger: create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
