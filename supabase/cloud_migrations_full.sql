-- ============================================================
-- Full migration script for Supabase Cloud
-- Run this in Supabase Dashboard → SQL Editor
-- Project: voter-management (sbxgwkfxflbawajqltuz)
-- ============================================================

-- 1. Create tables
create extension if not exists pgcrypto;

create table if not exists imports (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  uploaded_by uuid,
  uploaded_at timestamptz default now(),
  record_count int default 0
);

create table if not exists master_voters (
  id uuid default gen_random_uuid() primary key,
  first_name text,
  middle_name text,
  surname text,
  voter_id text unique not null,
  raw_import_id uuid references imports(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists voter_profiles (
  id uuid default gen_random_uuid() primary key,
  voter_id uuid references master_voters(id) on delete cascade,
  dob date,
  mobile text,
  aadhaar_masked text,
  email text,
  social_ids jsonb,
  updated_at timestamptz default now()
);

create table if not exists families (
  id uuid default gen_random_uuid() primary key,
  head_voter_id uuid references master_voters(id) on delete restrict,
  created_at timestamptz default now()
);

create table if not exists family_members (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references families(id) on delete cascade,
  voter_id uuid references master_voters(id) on delete restrict,
  relationship text,
  unique (family_id, voter_id)
);

create table if not exists form_definitions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  schema jsonb not null,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists form_submissions (
  id uuid default gen_random_uuid() primary key,
  form_id uuid references form_definitions(id) on delete cascade,
  voter_id uuid references master_voters(id) on delete set null,
  data jsonb,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  action text,
  details jsonb,
  created_at timestamptz default now()
);

-- 2. Add indexes
create index if not exists idx_master_voters_name on master_voters (first_name, middle_name, surname);
create index if not exists idx_master_voters_voterid on master_voters (voter_id);
create index if not exists idx_voter_profiles_voterid on voter_profiles (voter_id);
create index if not exists idx_family_members_voterid on family_members (voter_id);

-- 3. Add storage_path to imports
alter table imports add column if not exists storage_path text;
create index if not exists idx_imports_storage_path on imports (storage_path);

-- 4. User roles and service types
do $$ begin
  create type user_role as enum ('admin', 'office_user');
exception when duplicate_object then null;
end $$;

create table if not exists user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  role user_role not null default 'office_user',
  created_at timestamptz default now(),
  unique(user_id)
);

create index if not exists idx_user_roles_user_id on user_roles (user_id);

create table if not exists service_types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  active boolean default true,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_roles enable row level security;
drop policy if exists "Users can read their own role" on user_roles;
create policy "Users can read their own role" on user_roles for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Service role full access to user_roles" on user_roles;
create policy "Service role full access to user_roles" on user_roles for all to service_role using (true);

alter table service_types enable row level security;
drop policy if exists "Anyone can read active service types" on service_types;
create policy "Anyone can read active service types" on service_types for select to authenticated, anon using (active = true);
drop policy if exists "Service role full access to service_types" on service_types;
create policy "Service role full access to service_types" on service_types for all to service_role using (true);

-- 5. Expand voter schema
alter table master_voters add column if not exists booth_number int;
alter table master_voters add column if not exists serial_number int;
alter table master_voters add column if not exists name_marathi text;
alter table master_voters add column if not exists name_english text;
alter table master_voters add column if not exists surname_marathi text;
alter table master_voters add column if not exists caste text;
alter table master_voters add column if not exists age int;
alter table master_voters add column if not exists gender text;
alter table master_voters add column if not exists assembly_constituency text;

create table if not exists workers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  mobile text,
  epic_number text,
  created_at timestamptz default now(),
  unique(name, mobile)
);

create table if not exists employees (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  employee_id text unique not null,
  created_at timestamptz default now()
);

create table if not exists villages (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  new_gan text,
  new_gat text,
  created_at timestamptz default now()
);

alter table voter_profiles add column if not exists mobile_secondary text;
alter table voter_profiles add column if not exists address_marathi text;
alter table voter_profiles add column if not exists address_english text;
alter table voter_profiles add column if not exists village text;
alter table voter_profiles add column if not exists status text default 'Active';
alter table voter_profiles add column if not exists worker_id uuid references workers(id);
alter table voter_profiles add column if not exists employee_id uuid references employees(id);
alter table voter_profiles add column if not exists village_id uuid references villages(id);
alter table voter_profiles add column if not exists education text;
alter table voter_profiles add column if not exists occupation text;
alter table voter_profiles add column if not exists caste_category text check (caste_category is null or caste_category in ('SC', 'ST', 'OBC', 'Open'));
alter table voter_profiles add column if not exists ration_card_type text check (ration_card_type is null or ration_card_type in ('White', 'Yellow', 'Orange', 'NA'));
alter table voter_profiles add column if not exists anniversary_date date;

alter table family_members add column if not exists relationship_marathi text;

create index if not exists idx_master_voters_booth on master_voters(booth_number);
create index if not exists idx_master_voters_name_marathi on master_voters(name_marathi);
create index if not exists idx_master_voters_name_english on master_voters(name_english);
create index if not exists idx_voter_profiles_status on voter_profiles(status);
create index if not exists idx_workers_mobile on workers(mobile);
create index if not exists idx_workers_name on workers(name);
create index if not exists idx_employees_emp_id on employees(employee_id);
create index if not exists idx_villages_name on villages(name);

alter table workers enable row level security;
alter table employees enable row level security;
alter table villages enable row level security;

drop policy if exists "Public can read workers" on workers;
create policy "Public can read workers" on workers for select to authenticated using (true);
drop policy if exists "Service role full access workers" on workers;
create policy "Service role full access workers" on workers for all to service_role using (true);

drop policy if exists "Public can read employees" on employees;
create policy "Public can read employees" on employees for select to authenticated using (true);
drop policy if exists "Service role full access employees" on employees;
create policy "Service role full access employees" on employees for all to service_role using (true);

drop policy if exists "Public can read villages" on villages;
create policy "Public can read villages" on villages for select to authenticated using (true);
drop policy if exists "Service role full access villages" on villages;
create policy "Service role full access villages" on villages for all to service_role using (true);

-- 6. Fix voter_profiles constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'voter_profiles_voter_id_unique'
    and conrelid = 'public.voter_profiles'::regclass
  ) then
    alter table voter_profiles add constraint voter_profiles_voter_id_unique unique (voter_id);
  end if;
end $$;

-- 7. Custom reports
create table if not exists custom_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  config jsonb not null,
  usage_count int default 0,
  last_run_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_custom_reports_user_id on custom_reports(user_id);
create index if not exists idx_custom_reports_created_at on custom_reports(created_at desc);

alter table custom_reports enable row level security;

drop policy if exists "Users can read their own reports" on custom_reports;
create policy "Users can read their own reports" on custom_reports for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can create their own reports" on custom_reports;
create policy "Users can create their own reports" on custom_reports for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own reports" on custom_reports;
create policy "Users can update their own reports" on custom_reports for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own reports" on custom_reports;
create policy "Users can delete their own reports" on custom_reports for delete to authenticated using (auth.uid() = user_id);
drop policy if exists "Service role full access to custom_reports" on custom_reports;
create policy "Service role full access to custom_reports" on custom_reports for all to service_role using (true);

create or replace function update_custom_reports_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists custom_reports_updated_at on custom_reports;
create trigger custom_reports_updated_at before update on custom_reports for each row execute function update_custom_reports_updated_at();

-- 8. Service requests
create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid references master_voters(id) on delete restrict not null,
  service_type_id uuid references service_types(id) on delete restrict not null,
  status text not null default 'Document Submitted' check (status in (
    'Document Submitted',
    'Document Shared to Office',
    'Work in Progress',
    'Work Completed',
    'Closed / Delivered'
  )),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sr_voter on service_requests(voter_id);
create index if not exists idx_sr_status on service_requests(status);
create index if not exists idx_sr_created_by on service_requests(created_by);
create index if not exists idx_sr_created_at on service_requests(created_at desc);
create index if not exists idx_sr_service_type on service_requests(service_type_id);

create table if not exists service_request_status_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references service_requests(id) on delete cascade not null,
  status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz default now()
);

create index if not exists idx_sr_logs_request on service_request_status_logs(request_id);
create index if not exists idx_sr_logs_changed_at on service_request_status_logs(changed_at desc);

create or replace function update_service_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists service_requests_updated_at on service_requests;
create trigger service_requests_updated_at before update on service_requests for each row execute function update_service_requests_updated_at();

alter table service_requests enable row level security;
alter table service_request_status_logs enable row level security;

drop policy if exists "Authenticated users can read service_requests" on service_requests;
create policy "Authenticated users can read service_requests" on service_requests for select to authenticated using (true);
drop policy if exists "Authenticated users can insert service_requests" on service_requests;
create policy "Authenticated users can insert service_requests" on service_requests for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "Authenticated users can update service_requests" on service_requests;
create policy "Authenticated users can update service_requests" on service_requests for update to authenticated using (true);
drop policy if exists "Service role full access to service_requests" on service_requests;
create policy "Service role full access to service_requests" on service_requests for all to service_role using (true);

drop policy if exists "Authenticated users can read status logs" on service_request_status_logs;
create policy "Authenticated users can read status logs" on service_request_status_logs for select to authenticated using (true);
drop policy if exists "Authenticated users can insert status logs" on service_request_status_logs;
create policy "Authenticated users can insert status logs" on service_request_status_logs for insert to authenticated with check (auth.uid() = changed_by);
drop policy if exists "Service role full access to status logs" on service_request_status_logs;
create policy "Service role full access to status logs" on service_request_status_logs for all to service_role using (true);

-- 9. User roles active column
alter table user_roles add column if not exists active boolean default true;
create index if not exists idx_user_roles_active on user_roles(active);

-- 10. RLS on application tables
alter table imports enable row level security;
alter table master_voters enable row level security;
alter table voter_profiles enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table form_definitions enable row level security;
alter table form_submissions enable row level security;
alter table audit_logs enable row level security;

drop policy if exists "Service role full access" on imports;
create policy "Service role full access" on imports for all to service_role using (true);
drop policy if exists "Service role full access" on master_voters;
create policy "Service role full access" on master_voters for all to service_role using (true);
drop policy if exists "Service role full access" on voter_profiles;
create policy "Service role full access" on voter_profiles for all to service_role using (true);
drop policy if exists "Service role full access" on families;
create policy "Service role full access" on families for all to service_role using (true);
drop policy if exists "Service role full access" on family_members;
create policy "Service role full access" on family_members for all to service_role using (true);
drop policy if exists "Service role full access" on form_definitions;
create policy "Service role full access" on form_definitions for all to service_role using (true);
drop policy if exists "Service role full access" on form_submissions;
create policy "Service role full access" on form_submissions for all to service_role using (true);
drop policy if exists "Service role full access" on audit_logs;
create policy "Service role full access" on audit_logs for all to service_role using (true);

drop policy if exists "Allow read access to master_voters" on master_voters;
create policy "Allow read access to master_voters" on master_voters for select to authenticated, anon using (true);
drop policy if exists "Allow read access to voter_profiles" on voter_profiles;
create policy "Allow read access to voter_profiles" on voter_profiles for select to authenticated, anon using (true);
drop policy if exists "Allow read access to families" on families;
create policy "Allow read access to families" on families for select to authenticated, anon using (true);
drop policy if exists "Allow read access to family_members" on family_members;
create policy "Allow read access to family_members" on family_members for select to authenticated, anon using (true);
