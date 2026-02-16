# Deployment & QA Checklist (MVP)

1. Provision Supabase project and run `supabase/schema.sql` in SQL editor.
2. Create a storage bucket for imports and set `SUPABASE_STORAGE_BUCKET`.
3. Configure Auth (email/password) and enable email auth on Supabase.
4. Set environment variables in Vercel:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (secret)
   - SUPABASE_STORAGE_BUCKET
5. Run local smoke tests:
   - Upload a small Excel with 10 records via `/upload` and confirm `imports` and `master_voters` populated.
   - Search for a voter via `/search`.
   - Create a simple form via `/api/forms` and render it using form renderer (manual test).
6. Confirm RLS and minimal masking for Aadhaar in reports.
7. Backup DB before bulk imports.

