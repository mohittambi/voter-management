# Voter Management — Local Setup & Supabase Provisioning Plan

**Estimated time:** 15–25 minutes

---

## Part 1: Local Prerequisites

### 1.1 Node.js
- **Requirement:** Node.js 18+ (Next.js 14 compatible)
- **Check:** `node -v`
- **Install (if needed):** [nodejs.org](https://nodejs.org) or `nvm install 18`

### 1.2 Supabase CLI
- **Install:**
  ```bash
  npm install -g supabase
  ```
- **Verify:** `supabase --version`

### 1.3 Environment Variables
- **File to create:** `web/.env.local`
- **Contents:**
  ```
  NEXT_PUBLIC_SUPABASE_URL=<from Part 2.2>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Part 2.2>
  SUPABASE_SERVICE_ROLE_KEY=<from Part 2.6>
  SUPABASE_STORAGE_BUCKET=imports
  ```
- **Note:** Fill values after Supabase project is created (Part 2).

### 1.4 Sample Excel File
- **File to create:** `web/sample_voters.xlsx`
- **Required columns:** `First Name`, `Middle Name`, `Surname`, `Voter ID`
- **Suggested rows:** 5–10 records for smoke testing
- **Example rows:**

  | First Name | Middle Name | Surname | Voter ID |
  |------------|-------------|---------|----------|
  | Raj        | Kumar       | Sharma  | VOT001   |
  | Priya      |             | Singh   | VOT002   |
  | Amit       | R           | Patel   | VOT003   |

- **Create via:** Excel, Google Sheets (export as .xlsx), or a small script using `xlsx` package.

### 1.5 Install Web Dependencies
```bash
cd web && npm install
```

---

## Part 2: Supabase Project Provisioning & Configuration

### 2.1 Create Supabase Project
- **Where:** [supabase.com/dashboard](https://supabase.com/dashboard) → New Project
- **Steps:** Choose org → name (e.g. `voter-management`) → set DB password → region → Create
- **Output:** Project URL and project ref (e.g. `abcdefghijklmnop`)

### 2.2 Link Project with Supabase CLI
```bash
cd /Users/mohittambi/work/raghav/voter-management
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
```
- **Files used:** `supabase/config.toml` (created/updated by `supabase link`)

### 2.3 Apply Migrations
```bash
supabase db push
```
- **Migrations applied (in order):**
  - `supabase/migrations/20260215T120000_create_tables.up.sql`
  - `supabase/migrations/20260215T120100_add_indexes.up.sql`

### 2.4 Create Storage Bucket
- **Where:** Supabase Dashboard → Storage → New bucket
- **Name:** `imports`
- **Public:** No (private)
- **RLS:** Enable (default). Add policy if needed for service role uploads.

**Or via SQL (Dashboard SQL Editor):**
```sql
insert into storage.buckets (id, name, public) values ('imports', 'imports', false);
```

### 2.5 Enable Auth Email
- **Where:** Supabase Dashboard → Authentication → Providers
- **Enable:** Email provider (enabled by default)
- **Optional:** Configure email templates, confirmations, etc.

### 2.6 Get Service Role Secret
- **Where:** Supabase Dashboard → Project Settings → API
- **Copy:** `service_role` key (under "Project API keys")
- **Store in:** `web/.env.local` as `SUPABASE_SERVICE_ROLE_KEY`
- **Security:** Never commit; server-side only.

### 2.7 RLS Notes
- **Current state:** Migrations do not define RLS policies; tables rely on service role for server-side access.
- **Action:** Document that RLS should be added for production (per `docs/deployment_checklist.md`).
- **Suggested policies (for later):**
  - `master_voters`, `voter_profiles`: read for authenticated; write via service role only.
  - `imports`: insert for authenticated; read for admins.
  - `storage.objects`: allow service role full access to `imports` bucket.

---

## Part 3: Finalize Local Config

### 3.1 Populate `.env.local`
After completing Part 2, copy from Dashboard → Project Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon` public key
- `SUPABASE_SERVICE_ROLE_KEY` = `service_role` key

### 3.2 Start Dev Server
```bash
cd web && npm run dev
```

---

## Acceptance Checks

| # | Check | Command/Action |
|---|-------|----------------|
| 1 | Node 18+ | `node -v` |
| 2 | Supabase CLI | `supabase --version` |
| 3 | Project linked | `supabase projects list` shows project |
| 4 | Migrations applied | Dashboard → Table Editor: `imports`, `master_voters`, `voter_profiles`, etc. exist |
| 5 | Storage bucket | Dashboard → Storage: `imports` bucket exists |
| 6 | Auth email enabled | Dashboard → Auth → Providers: Email enabled |
| 7 | Env vars set | `web/.env.local` has all 4 vars |
| 8 | Upload works | Upload `sample_voters.xlsx` at `http://localhost:3000/upload` → `imports` and `master_voters` populated |
| 9 | Search works | Visit `http://localhost:3000/search` and search for a voter |

---

## Files Used/Changed

| Path | Action |
|------|--------|
| `web/.env.local` | **Create** — env vars |
| `web/sample_voters.xlsx` | **Create** — sample Excel |
| `supabase/config.toml` | **Create/Update** — via `supabase link` |
| `supabase/migrations/*.up.sql` | **Read** — applied by `supabase db push` |

---

## Summary Commands (Copy-Paste)

```bash
# 1. Prerequisites
node -v                    # expect 18+
npm install -g supabase
cd /Users/mohittambi/work/raghav/voter-management/web && npm install

# 2. After creating project in Dashboard:
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push

# 3. Create .env.local in web/ with URL, anon key, service_role key, bucket name
# 4. Create sample_voters.xlsx with columns: First Name, Middle Name, Surname, Voter ID
# 5. Run app
cd web && npm run dev
```

---

**Confirm to proceed with execution?** (Reply yes to have the assistant create `web/.env.example`, `web/sample_voters.xlsx` template, and any missing config files.)
