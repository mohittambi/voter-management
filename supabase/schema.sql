-- Supabase schema for Voter-Linked Public Service Management (MVP)
-- Run in Supabase SQL editor or via migration tools

-- Imports metadata
create table if not exists imports (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  uploaded_by uuid, -- auth.uid
  uploaded_at timestamptz default now(),
  record_count int default 0
);

-- Master voter list (non-editable in UI)
create table if not exists master_voters (
  id uuid default gen_random_uuid() primary key,
  first_name text,
  middle_name text,
  surname text,
  voter_id text unique not null,
  raw_import_id uuid references imports(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_master_voters_name on master_voters (first_name, middle_name, surname);
create index if not exists idx_master_voters_voterid on master_voters (voter_id);

-- Editable profile fields stored separately (to keep master read-only)
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
create index if not exists idx_voter_profiles_voterid on voter_profiles (voter_id);

-- Families & members
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
create index if not exists idx_family_members_voterid on family_members (voter_id);

-- Simple form builder storage
create table if not exists form_definitions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  schema jsonb not null, -- JSON schema or custom format
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

-- Audit table for important actions (basic)
create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  action text,
  details jsonb,
  created_at timestamptz default now()
);

