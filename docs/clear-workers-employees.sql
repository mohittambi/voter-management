-- =============================================================================
-- Remove all workers (कार्यकर्ते) and employees (कर्मचारी)
-- Run in Supabase SQL Editor (irreversible for those rows)
-- =============================================================================
-- voter_profiles.worker_id / employee_id reference these tables — clear first.
-- =============================================================================

BEGIN;

UPDATE voter_profiles
SET
  worker_id = NULL,
  employee_id = NULL
WHERE worker_id IS NOT NULL OR employee_id IS NOT NULL;

DELETE FROM workers;
DELETE FROM employees;

COMMIT;
