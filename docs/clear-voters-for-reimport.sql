-- =============================================================================
-- Clear all voters for a fresh sheet re-import (run in Supabase SQL Editor)
-- =============================================================================
-- WARNING: Irreversible. Deletes service requests, families, family_members,
-- master_voters (and CASCADE: voter_profiles, voter_documents). form_submissions
-- rows are kept with voter_id set to NULL. Optional: clears imports table.
--
-- Order respects ON DELETE RESTRICT on families / family_members / service_requests.
-- After this, upload voters via the app at /upload (families are added manually).
-- =============================================================================

BEGIN;

-- 1. Status logs (also CASCADE from service_requests; explicit for clarity)
DELETE FROM service_request_status_logs;

-- 2. Service requests (RESTRICT on master_voters)
DELETE FROM service_requests;

-- 3. Family members (RESTRICT on master_voters)
DELETE FROM family_members;

-- 4. Family heads (RESTRICT on master_voters)
DELETE FROM families;

-- 5. Master voters — CASCADE: voter_profiles, voter_documents; SET NULL: form_submissions.voter_id
DELETE FROM master_voters;

-- 6. Optional: clear old import metadata (raw_import_id on old rows already gone)
DELETE FROM imports;

COMMIT;
