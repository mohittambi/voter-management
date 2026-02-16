-- Migration: add storage_path to imports (up)

alter table imports add column if not exists storage_path text;
create index if not exists idx_imports_storage_path on imports (storage_path);
