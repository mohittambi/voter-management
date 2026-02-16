-- Migration: add indexes (up)

create index if not exists idx_master_voters_name on master_voters (first_name, middle_name, surname);
create index if not exists idx_master_voters_voterid on master_voters (voter_id);
create index if not exists idx_voter_profiles_voterid on voter_profiles (voter_id);
create index if not exists idx_family_members_voterid on family_members (voter_id);

