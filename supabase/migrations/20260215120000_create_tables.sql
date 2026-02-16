-- Migration: create tables (up)
-- Generated for Supabase CLI migrations

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

