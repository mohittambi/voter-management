# 🚀 Quick Start Guide - Complete System Setup

Complete guide to get the Voter Management Portal with RBAC running locally in under 10 minutes.

---

## Prerequisites

- **Node.js** v18.17+ or v20+ ([Download](https://nodejs.org))
- **Supabase CLI** ([Installation Guide](https://supabase.com/docs/guides/cli))
- **Git** (for cloning repo)
- **Docker** (for local Supabase)

---

## Step 1: Clone & Navigate

```bash
cd /path/to/voter-management
```

---

## Step 2: Start Local Supabase

```bash
supabase start
```

**Expected output:**
```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhb...
service_role key: eyJhb...
```

**Important:** Save the `anon key` and `service_role key` for the next step!

---

## Step 3: Apply Database Migrations

```bash
supabase migration up
```

This will create:
- All core tables (imports, master_voters, voter_profiles, families, etc.)
- User roles table
- Service types table
- Database indexes

**Verify migrations:**
```bash
supabase migration list
```

You should see all migrations marked as "Applied".

---

## Step 4: Setup Storage & RLS

```bash
# Create storage bucket and RLS policies
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/setup_storage.sql

# Apply RLS policies to application tables
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/setup_rls.sql
```

**Note:** You may see some warnings about `objects` and `buckets` tables - these are expected and can be ignored.

---

## Step 5: Configure Environment Variables

Create `web/.env.local` with the keys from Step 2:

```bash
cd web
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_step_2
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_step_2
SUPABASE_STORAGE_BUCKET=imports
SUPABASE_STORAGE_ACCESS_KEY=625729a08b95bf1b7ff351a663f3a23c
SUPABASE_STORAGE_SECRET_KEY=850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
EOF
```

**Replace the placeholder keys with your actual keys from `supabase start` output!**

---

## Step 6: Install Dependencies

```bash
npm install
```

If you get engine warnings, upgrade Node.js to v18.17+ or v20+:
```bash
# Using nvm
nvm install 20
nvm use 20
```

---

## Step 7: Start Frontend Server

```bash
npm run dev
```

Server will start at: `http://localhost:3000`

---

## Step 8: Create First Admin User

Open a new terminal window and run:

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "role": "admin"
  }'
```

**Expected response:**
```json
{
  "user": {
    "id": "uuid...",
    "email": "admin@example.com",
    ...
  }
}
```

---

## Step 9: Login to the Portal

1. Open browser: `http://localhost:3000/login`
2. Enter credentials:
   - Email: `admin@example.com`
   - Password: `Admin123!`
3. Click "Sign In"

**You should be redirected to the dashboard! 🎉**

---

## Step 10: Verify Setup (Smoke Tests)

### ✅ Test 1: Navigation Menu
- Verify you see all menu items:
  - Dashboard
  - Upload Voters
  - Import History
  - Search Voters
  - Manage Services
  - Create User

### ✅ Test 2: Upload Voters
1. Click "Upload Voters"
2. Select `web/sample_voters.csv`
3. Verify upload succeeds

### ✅ Test 3: Search Voters
1. Click "Search Voters"
2. Search for "John" or "Sharma"
3. Click on a result to view profile

### ✅ Test 4: Manage Services
1. Click "Manage Services"
2. Click "Add Service Type"
3. Create a service (e.g., "Ration Card")
4. Verify it appears in the list

### ✅ Test 5: Create Office User
1. Click "Create User"
2. Create a user:
   - Email: `office@example.com`
   - Password: `Office123!`
   - Role: Office User
3. Logout
4. Login as office user
5. Verify limited menu (no Upload/Services/Create User)

---

## 🎉 You're All Set!

The system is now fully functional with:
- ✅ Database with all tables
- ✅ Storage bucket configured
- ✅ RLS policies applied
- ✅ Admin user created
- ✅ Frontend running
- ✅ Authentication working

---

## 📖 Next Steps

### Learn More
- Read [USER_MANAGEMENT_GUIDE.md](USER_MANAGEMENT_GUIDE.md) for detailed RBAC info
- Check [API_REFERENCE.md](API_REFERENCE.md) for API documentation
- Review [RBAC_ARCHITECTURE.md](RBAC_ARCHITECTURE.md) for system architecture

### Run Complete Tests
- Follow [RBAC_TESTING_CHECKLIST.md](RBAC_TESTING_CHECKLIST.md) for thorough testing

### Customize
- Edit `web/lib/rbac.ts` to modify permissions
- Update `web/styles/globals.css` to change design
- Add more service types via the UI

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"
**Solution:** Run `npm install` in the `web/` directory

### Issue: "Bucket not found"
**Solution:** Run `supabase/setup_storage.sql` again

### Issue: "Access Denied" on all pages
**Solution:** Verify user role in database:
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT * FROM user_roles;"
```

### Issue: "Module not found: Can't resolve '@supabase/supabase-js'"
**Solution:** Check Node.js version (must be 18.17+)

### Issue: Search returns empty
**Solution:** Make sure you've uploaded voter data first

### Issue: Can't create admin user
**Solution:** Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

---

## 🔧 Useful Commands

```bash
# View all migrations
supabase migration list

# View database tables
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "\dt"

# View all users
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT id, email FROM auth.users;"

# View user roles
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT u.email, r.role FROM auth.users u JOIN user_roles r ON u.id = r.user_id;"

# View imported voters
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT COUNT(*) FROM master_voters;"

# Stop Supabase
supabase stop

# Restart Supabase (preserves data)
supabase start
```

---

## 📦 System Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ http://localhost:3000
       ▼
┌─────────────┐
│  Next.js    │
│  Frontend   │
└──────┬──────┘
       │
       │ API Calls
       ▼
┌─────────────┐
│  Supabase   │
│  Local      │
│  (Docker)   │
└─────────────┘
```

---

## 🎯 Feature Checklist

- ✅ Authentication (Login/Logout)
- ✅ Role-Based Access Control (Admin/Office User)
- ✅ Voter Upload (Admin-only)
- ✅ Voter Search (All users)
- ✅ Voter Profile View/Edit
- ✅ Family Linking
- ✅ Service Management (Admin-only)
- ✅ User Creation (Admin-only)
- ✅ Import History (Admin-only)
- ✅ Professional UI/UX
- ✅ Responsive Design
- ✅ Secure API Endpoints
- ✅ Database RLS Policies

---

## 📞 Need Help?

1. Check the troubleshooting section above
2. Review error messages in browser console (F12)
3. Check server logs in the terminal running `npm run dev`
4. Verify database state using the useful commands
5. Consult the documentation files in `docs/`

---

**Estimated Setup Time:** 10-15 minutes  
**Difficulty:** Beginner-Friendly  
**Status:** Production Ready ✅

---

**Happy Building! 🚀**
