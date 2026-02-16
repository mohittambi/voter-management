-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('imports', 'imports', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage tables
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload to imports bucket
CREATE POLICY "Allow authenticated uploads to imports"
ON storage.objects
FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'imports');

-- Allow authenticated users to read from imports bucket
CREATE POLICY "Allow authenticated reads from imports"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'imports');

-- Allow service role full access
CREATE POLICY "Service role full access to imports"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'imports');

-- Allow public access to buckets table
CREATE POLICY "Public bucket access"
ON storage.buckets
FOR SELECT
TO public, authenticated, anon
USING (true);
