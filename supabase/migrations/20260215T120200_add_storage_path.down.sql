-- Migration: add storage_path to imports (down)

drop index if exists idx_imports_storage_path;
alter table imports drop column if exists storage_path;
