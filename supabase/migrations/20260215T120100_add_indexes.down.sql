-- Migration: add indexes (down)

drop index if exists idx_master_voters_name;
drop index if exists idx_master_voters_voterid;
drop index if exists idx_voter_profiles_voterid;
drop index if exists idx_family_members_voterid;

