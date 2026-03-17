-- Feature batch: minor applicants, validation, auto status delays, ticket numbers, voter documents

-- master_voters: flag for below-18 / non-electoral roll applicants
alter table master_voters add column if not exists is_non_voter boolean default false;

-- voter_profiles: link to parent/family member (reference voter); data validation for birthday notifications
alter table voter_profiles add column if not exists reference_voter_id uuid references master_voters(id) on delete set null;
alter table voter_profiles add column if not exists data_validated boolean default false;
create index if not exists idx_voter_profiles_reference_voter on voter_profiles(reference_voter_id);
create index if not exists idx_voter_profiles_data_validated on voter_profiles(data_validated);

-- service_types: configurable hours for auto status advancement
alter table service_types add column if not exists hours_to_share int default 10;
alter table service_types add column if not exists hours_to_wip int default 48;

-- service_requests: human-readable ticket number (SERIAL for auto-increment)
alter table service_requests add column if not exists ticket_number serial;

-- voter_documents: store document metadata and storage path per voter
create table if not exists voter_documents (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid references master_voters(id) on delete cascade not null,
  document_type text not null,
  storage_path text not null,
  file_name text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_voter_documents_voter on voter_documents(voter_id);

alter table voter_documents enable row level security;

create policy "Authenticated users can read voter_documents"
  on voter_documents for select
  to authenticated
  using (true);

create policy "Authenticated users can insert voter_documents"
  on voter_documents for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete voter_documents"
  on voter_documents for delete
  to authenticated
  using (true);

create policy "Service role full access to voter_documents"
  on voter_documents for all
  to service_role
  using (true);
