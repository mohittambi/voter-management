-- Enable RLS on all application tables
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to all tables (for API routes)
CREATE POLICY "Service role full access" ON imports FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON master_voters FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON voter_profiles FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON families FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON family_members FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON form_definitions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON form_submissions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON audit_logs FOR ALL TO service_role USING (true);

-- Allow anon/authenticated read access to master_voters and profiles (for search)
CREATE POLICY "Allow read access to master_voters" ON master_voters FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Allow read access to voter_profiles" ON voter_profiles FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Allow read access to families" ON families FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Allow read access to family_members" ON family_members FOR SELECT TO authenticated, anon USING (true);
