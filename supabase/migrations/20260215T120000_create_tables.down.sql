-- Migration: create tables (down)

drop table if exists audit_logs;
drop table if exists form_submissions;
drop table if exists form_definitions;
drop table if exists family_members;
drop table if exists families;
drop table if exists voter_profiles;
drop table if exists master_voters;
drop table if exists imports;

drop extension if exists pgcrypto;

