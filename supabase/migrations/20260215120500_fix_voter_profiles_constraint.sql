-- Migration: Add unique constraint on voter_profiles.voter_id for proper upserts

-- Add unique constraint on voter_id (one profile per voter)
alter table voter_profiles add constraint voter_profiles_voter_id_unique unique (voter_id);
