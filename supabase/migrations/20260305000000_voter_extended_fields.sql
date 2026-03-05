-- Migration: Add extended voter profile fields (education, occupation, caste_category, ration_card_type, anniversary_date)

alter table voter_profiles add column if not exists education text;
alter table voter_profiles add column if not exists occupation text;
alter table voter_profiles add column if not exists caste_category text
  check (caste_category is null or caste_category in ('SC', 'ST', 'OBC', 'Open'));
alter table voter_profiles add column if not exists ration_card_type text
  check (ration_card_type is null or ration_card_type in ('White', 'Yellow', 'Orange', 'NA'));
alter table voter_profiles add column if not exists anniversary_date date;
