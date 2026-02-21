-- Migration: Service Requests module
-- Creates service_requests and service_request_status_logs tables

-- Valid status values (per RFP)
-- 1. Document Submitted (default)
-- 2. Document Shared to Office
-- 3. Work in Progress
-- 4. Work Completed
-- 5. Closed / Delivered

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

-- Status change audit log — every status change saves timestamp + user
create table if not exists service_request_status_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references service_requests(id) on delete cascade not null,
  status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz default now()
);

create index if not exists idx_sr_logs_request on service_request_status_logs(request_id);
create index if not exists idx_sr_logs_changed_at on service_request_status_logs(changed_at desc);

-- Auto-update updated_at on service_requests
create or replace function update_service_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger service_requests_updated_at
  before update on service_requests
  for each row
  execute function update_service_requests_updated_at();

-- RLS
alter table service_requests enable row level security;
alter table service_request_status_logs enable row level security;

create policy "Authenticated users can read service_requests"
  on service_requests for select
  to authenticated
  using (true);

create policy "Authenticated users can insert service_requests"
  on service_requests for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated users can update service_requests"
  on service_requests for update
  to authenticated
  using (true);

create policy "Service role full access to service_requests"
  on service_requests for all
  to service_role
  using (true);

create policy "Authenticated users can read status logs"
  on service_request_status_logs for select
  to authenticated
  using (true);

create policy "Authenticated users can insert status logs"
  on service_request_status_logs for insert
  to authenticated
  with check (auth.uid() = changed_by);

create policy "Service role full access to status logs"
  on service_request_status_logs for all
  to service_role
  using (true);
