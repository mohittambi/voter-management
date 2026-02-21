-- Migration: Add active column to user_roles for soft-deactivation

alter table user_roles add column if not exists active boolean default true;
create index if not exists idx_user_roles_active on user_roles(active);
