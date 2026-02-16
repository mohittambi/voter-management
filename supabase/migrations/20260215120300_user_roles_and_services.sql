-- Migration: Add user roles and service types (up)

-- User roles table
create type user_role as enum ('admin', 'office_user');

create table if not exists user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  role user_role not null default 'office_user',
  created_at timestamptz default now(),
  unique(user_id)
);

create index if not exists idx_user_roles_user_id on user_roles (user_id);

-- Service types table (for service request management)
create table if not exists service_types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  description text,
  active boolean default true,
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies for user_roles
alter table user_roles enable row level security;

create policy "Users can read their own role"
  on user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Service role full access to user_roles"
  on user_roles for all
  to service_role
  using (true);

-- RLS policies for service_types
alter table service_types enable row level security;

create policy "Anyone can read active service types"
  on service_types for select
  to authenticated, anon
  using (active = true);

create policy "Service role full access to service_types"
  on service_types for all
  to service_role
  using (true);
