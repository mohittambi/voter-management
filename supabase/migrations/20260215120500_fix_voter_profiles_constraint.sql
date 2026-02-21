-- Migration: Add unique constraint on voter_profiles.voter_id for proper upserts

-- Add unique constraint on voter_id (one profile per voter) - idempotent
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
