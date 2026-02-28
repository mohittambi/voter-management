-- ============================================================
-- Storage setup for voter_bucket
-- Run this AFTER cloud_migrations_full.sql
-- In Supabase Dashboard → SQL Editor
-- ============================================================

-- Create voter_bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('voter_bucket', 'voter_bucket', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage tables (if not already)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated/anon to upload to voter_bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to voter_bucket" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to voter_bucket"
ON storage.objects
FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'voter_bucket');

-- Allow authenticated/anon to read from voter_bucket
DROP POLICY IF EXISTS "Allow authenticated reads from voter_bucket" ON storage.objects;
CREATE POLICY "Allow authenticated reads from voter_bucket"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'voter_bucket');

-- Service role full access
DROP POLICY IF EXISTS "Service role full access to voter_bucket" ON storage.objects;
CREATE POLICY "Service role full access to voter_bucket"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'voter_bucket');

-- Public bucket list access
DROP POLICY IF EXISTS "Public bucket access" ON storage.buckets;
CREATE POLICY "Public bucket access"
ON storage.buckets
FOR SELECT
TO public, authenticated, anon
USING (true);
