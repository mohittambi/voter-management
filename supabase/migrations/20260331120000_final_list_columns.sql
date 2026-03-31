-- Dedicated columns for final voter list ingest (EN/MR first name split + sheet relation code)

alter table master_voters add column if not exists first_name_marathi text;

alter table voter_profiles add column if not exists household_relation_code text;
