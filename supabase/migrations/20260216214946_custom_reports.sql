-- Migration: Create custom reports table for report builder feature
-- This allows users to save and reuse custom report configurations

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

-- Create index on user_id for faster lookups
create index if not exists idx_custom_reports_user_id on custom_reports(user_id);
create index if not exists idx_custom_reports_created_at on custom_reports(created_at desc);

-- Enable RLS
alter table custom_reports enable row level security;

-- Policy: Users can read their own reports
create policy "Users can read their own reports"
  on custom_reports
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Users can create their own reports
create policy "Users can create their own reports"
  on custom_reports
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Users can update their own reports
create policy "Users can update their own reports"
  on custom_reports
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own reports
create policy "Users can delete their own reports"
  on custom_reports
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Service role has full access
create policy "Service role full access to custom_reports"
  on custom_reports
  for all
  to service_role
  using (true);

-- Function to update updated_at timestamp
create or replace function update_custom_reports_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger custom_reports_updated_at
  before update on custom_reports
  for each row
  execute function update_custom_reports_updated_at();

-- Comments for documentation
comment on table custom_reports is 'Stores user-defined custom report configurations';
comment on column custom_reports.config is 'JSONB configuration: {fields: [], filters: [], groupBy: [], sortBy: {}, limit: number}';
comment on column custom_reports.usage_count is 'Number of times this report has been executed';
comment on column custom_reports.last_run_at is 'Timestamp of last report execution';
