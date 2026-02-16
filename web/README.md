# Voter Management (Web) — Setup & Deploy

This Next.js app connects to Supabase for DB, Auth, and Storage. It targets deployment to Vercel (free tier).

## 🔐 User Management & RBAC

This system includes role-based access control with **Admin** and **Office User** roles.

**See [../docs/USER_MANAGEMENT_GUIDE.md](../docs/USER_MANAGEMENT_GUIDE.md) for complete RBAC setup instructions.**

Quick summary:
- **Admin**: Full access (upload voters, manage services, create users, view reports)
- **Office User**: Limited access (search voters, create service requests, no uploads)

## Environment Variables

Set in Vercel or `.env.local` for local dev:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only; set in Vercel as secret)
- `SUPABASE_STORAGE_BUCKET` — (optional) storage bucket name for imports (default: `imports`)
- `SUPABASE_STORAGE_ACCESS_KEY` — (optional) S3-compatible access key for storage
- `SUPABASE_STORAGE_SECRET_KEY` — (optional) S3-compatible secret key for storage

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Supabase locally (see main project README):
   ```bash
   cd ..
   supabase start
   ```

3. Apply migrations:
   ```bash
   supabase migration up
   ```

4. Create `.env.local` with the keys from `supabase start` output (see `.env.example`)

5. Create your first admin user (see USER_MANAGEMENT_GUIDE.md)

6. Run the dev server:
   ```bash
   npm run dev
   ```

7. Navigate to `http://localhost:3000/login` and login with admin credentials

## Deployment (Vercel)

1. Link Vercel to this repo
2. Set root directory to `web/` in Vercel project settings
3. Add all environment variables in Vercel (mark `SUPABASE_SERVICE_ROLE_KEY` as secret)
4. Deploy — Vercel builds and serves the Next.js app
5. After first deploy, create admin user via API or Supabase Dashboard

## Supabase CLI / Migrations

This project includes Supabase CLI-style migrations under `supabase/migrations/`.

Local usage (install supabase CLI first):

1. Login and link project:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

2. Apply migrations:
   ```bash
   supabase migration up
   ```

3. To check migration status:
   ```bash
   supabase migration list
   ```

## Smoke Tests

After setup, verify the following:

### Authentication & RBAC
- ✅ Login as admin at `/login`
- ✅ See full navigation menu (Upload, Services, Create User)
- ✅ Role badge shows "👑 Admin" in header
- ✅ Create an office user via `/signup`
- ✅ Logout and login as office user
- ✅ Verify office user cannot see Upload/Services/Create User menus
- ✅ Try accessing `/upload` as office user (should see "Access Denied")

### Voter Management
- ✅ Upload a small Excel with ~10 records via `/upload` (admin only)
- ✅ Verify `imports` and `master_voters` are populated (check Supabase table or SQL editor)
- ✅ Search for a voter via `/search`
- ✅ Open voter profile `http://localhost:3000/voter/<voter_id>`
- ✅ Click Edit to change DOB/mobile/email; confirm `voter_profiles` updated

### Family Management
- ✅ On voter profile, click "Link Family Member"
- ✅ Search and add a family member
- ✅ Confirm `families` and `family_members` tables updated
- ✅ Verify family tree appears in voter profile sidebar

### Service Management (Admin Only)
- ✅ Navigate to `/services`
- ✅ Add a new service type (e.g., "Ration Card Application")
- ✅ Edit and deactivate a service
- ✅ Delete a service

## Notes

- The API route `/api/upload` expects `SUPABASE_SERVICE_ROLE_KEY` to insert master data securely
- All sensitive operations use service role key server-side only
- Row Level Security (RLS) is enabled on all tables
- Authentication state is managed via `AuthContext` (see `contexts/AuthContext.tsx`)
- Protected routes use `ProtectedRoute` HOC (see `components/ProtectedRoute.tsx`)

## Troubleshooting

See [USER_MANAGEMENT_GUIDE.md](../docs/USER_MANAGEMENT_GUIDE.md#troubleshooting) for RBAC troubleshooting.

Common issues:
- **"Module not found"**: Check import paths, ensure `npm install` completed
- **"Bucket not found"**: Run storage setup SQL (see `supabase/setup_storage.sql`)
- **"Access Denied"**: Verify user role in `user_roles` table and RLS policies

## Architecture

```
User → Login → AuthContext → ProtectedRoute → Page/Component
                    ↓
              Fetch User Role
                    ↓
          Filter Navigation & API Access
```

