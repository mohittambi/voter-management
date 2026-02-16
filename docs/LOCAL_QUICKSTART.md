# Local Development Quick Start

This guide walks you through running the voter management system on your local machine using Supabase local and Next.js.

## Prerequisites (one-time setup)

1. Node.js 18+ and npm
2. Docker Desktop (required by Supabase local)
3. Supabase CLI
   - Install: `npm install -g supabase`
   - Or macOS: `brew install supabase/tap/supabase`

## Steps to Run Locally

### 1. Start Supabase (local)

From the repo root:

```bash
supabase start
```

This launches local Postgres, Auth, Storage, and Studio. Keep the terminal open while developing.

You should see output with:
- Studio URL: http://127.0.0.1:54323
- Project URL: http://127.0.0.1:54321
- Publishable key (anon key)
- Secret key (service role key)

**Note:** `web/.env.local` is already configured with these values.

### 2. Apply Database Migrations

From the repo root:

```bash
supabase migrations apply
```

This creates all required tables (master_voters, voter_profiles, families, form_definitions, etc.).

### 2.1 Create Storage Bucket

Open Supabase Studio at http://127.0.0.1:54323, navigate to Storage, and create a bucket named `imports`:

1. Go to Storage section in left sidebar
2. Click "Create a new bucket"
3. Name: `imports`
4. Public: unchecked (private bucket)
5. Click "Create bucket"

Alternatively, use the CLI:

```bash
# Create bucket via SQL
supabase db execute "
INSERT INTO storage.buckets (id, name, public)
VALUES ('imports', 'imports', false)
ON CONFLICT (id) DO NOTHING;
"
```

### 3. Install Frontend Dependencies

```bash
cd web
npm install
```

### 4. Start the Next.js App

```bash
npm run dev
```

Open http://localhost:3000

## Verification & Testing

### Check Tables in Studio

Open http://127.0.0.1:54323 and verify tables exist:
- imports
- master_voters
- voter_profiles
- families
- family_members
- form_definitions
- form_submissions
- audit_logs

### Upload Test Data

1. Go to http://localhost:3000/upload
2. Upload `web/sample_voters.csv` (accepts .csv, .xls, .xlsx)
3. File will be stored in Storage bucket `imports` and records imported
4. Check Studio → master_voters table for imported records
5. Check Studio → Storage → imports bucket to see stored file

### View Import History

1. Go to http://localhost:3000/imports
2. See list of all uploads with filenames, dates, record counts
3. Click "Download" to retrieve original uploaded file from Storage

### Search Voters

1. Go to http://localhost:3000/search
2. Search by name (e.g., "Ramesh" or "Kumar")
3. Results should show matching voters

### Edit Profile

1. Get a voter ID from Studio → master_voters table (copy the UUID)
2. Open http://localhost:3000/voter/<voter-id>
3. Click "Edit" and update DOB, mobile, email
4. Save and verify voter_profiles table updated in Studio

### Link Family Members

1. From a voter profile page, click "Link Family Member / Mark Head"
2. Search for another voter
3. Select relationship and click "Link"
4. Verify families and family_members tables in Studio

## Stop Supabase

When done developing:

```bash
supabase stop
```

## Troubleshooting

### Port conflicts
- If supabase start fails with port errors, stop any conflicting services or change ports in `supabase/config.toml`

### Docker not running
- Ensure Docker Desktop is running before `supabase start`

### Migrations already applied
- If you see "migration already applied" errors, that's OK — it means tables exist

### Environment variables not loaded
- Restart the Next.js dev server after changing `web/.env.local`

## Next Steps

- View upload history: http://localhost:3000/imports
- Add authentication: configure Supabase Auth (email/password already enabled in local)
- Deploy to production: follow `web/README.md` for Vercel + Supabase cloud setup
- Add service requests and status workflows (deferred features from RFP)

## Storage Notes

- Raw uploaded Excel files are stored in Supabase Storage bucket `imports`
- Each import record in the `imports` table has a `storage_path` column linking to the stored file
- Files can be downloaded from the import history page or via Supabase Studio
- For production, configure Storage bucket policies and size limits in Supabase dashboard
