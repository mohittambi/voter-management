-- Migration: Expand voter schema for Manoli.xlsx support with Marathi fields

-- Add columns to master_voters
alter table master_voters add column if not exists booth_number int;
alter table master_voters add column if not exists serial_number int;
alter table master_voters add column if not exists name_marathi text;
alter table master_voters add column if not exists name_english text;
alter table master_voters add column if not exists surname_marathi text;
alter table master_voters add column if not exists caste text;
alter table master_voters add column if not exists age int;
alter table master_voters add column if not exists gender text;
alter table master_voters add column if not exists assembly_constituency text;

-- Create workers table (कार्यकर्ते)
create table if not exists workers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  mobile text,
  epic_number text,
  created_at timestamptz default now(),
  unique(name, mobile)
);

-- Create employees table (कर्मचारी)
create table if not exists employees (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  employee_id text unique not null,
  created_at timestamptz default now()
);

-- Create villages table (गावे)
create table if not exists villages (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  new_gan text,
  new_gat text,
  created_at timestamptz default now()
);

-- Add columns to voter_profiles
alter table voter_profiles add column if not exists mobile_secondary text;
alter table voter_profiles add column if not exists address_marathi text;
alter table voter_profiles add column if not exists address_english text;
alter table voter_profiles add column if not exists village text;
alter table voter_profiles add column if not exists status text default 'Active';
alter table voter_profiles add column if not exists worker_id uuid references workers(id);
alter table voter_profiles add column if not exists employee_id uuid references employees(id);
alter table voter_profiles add column if not exists village_id uuid references villages(id);

-- Add relationship_marathi to family_members
alter table family_members add column if not exists relationship_marathi text;

-- Add indexes for performance
create index if not exists idx_master_voters_booth on master_voters(booth_number);
create index if not exists idx_master_voters_name_marathi on master_voters(name_marathi);
create index if not exists idx_master_voters_name_english on master_voters(name_english);
create index if not exists idx_voter_profiles_status on voter_profiles(status);
create index if not exists idx_workers_mobile on workers(mobile);
create index if not exists idx_workers_name on workers(name);
create index if not exists idx_employees_emp_id on employees(employee_id);
create index if not exists idx_villages_name on villages(name);

-- RLS policies for new tables
alter table workers enable row level security;
alter table employees enable row level security;
alter table villages enable row level security;

create policy "Public can read workers"
  on workers for select
  to authenticated
  using (true);

create policy "Service role full access workers"
  on workers for all
  to service_role
  using (true);

create policy "Public can read employees"
  on employees for select
  to authenticated
  using (true);

create policy "Service role full access employees"
  on employees for all
  to service_role
  using (true);

create policy "Public can read villages"
  on villages for select
  to authenticated
  using (true);

create policy "Service role full access villages"
  on villages for all
  to service_role
  using (true);
