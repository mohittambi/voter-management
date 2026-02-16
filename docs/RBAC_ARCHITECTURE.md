# RBAC System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser/Client                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React Components                        │   │
│  │  • Login Page     • Dashboard    • Services Page    │   │
│  │  • Signup Page    • Profile      • Search Page      │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │             AuthContext Provider                     │   │
│  │  • Manages authentication state                      │   │
│  │  • Fetches and stores user role                      │   │
│  │  • Provides signIn/signOut methods                   │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │           ProtectedRoute HOC                         │   │
│  │  • Checks authentication                             │   │
│  │  • Verifies role permissions                         │   │
│  │  • Redirects unauthorized users                      │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │          Page Components with RBAC                   │   │
│  │  • Conditional rendering based on role               │   │
│  │  • Role-filtered navigation                          │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          │ HTTPS
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                   Next.js API Routes                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/auth/signup     • Creates users (admin only)   │   │
│  │  /api/auth/role       • Fetches user role            │   │
│  │  /api/services        • CRUD for service types       │   │
│  │  /api/upload          • Upload voters (admin only)   │   │
│  │  /api/search          • Search voters                │   │
│  │  /api/profile/update  • Update voter profile         │   │
│  │  /api/family/link     • Link family members          │   │
│  │  /api/family/info     • Get family tree              │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │          Role Verification Layer                      │   │
│  │  • Checks service role key                           │   │
│  │  • Queries user_roles table                          │   │
│  │  • Returns 403 if unauthorized                       │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          │ PostgreSQL Protocol
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                     Supabase Backend                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                      │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  auth.users                                     │  │   │
│  │  │  • User credentials (managed by Supabase Auth) │  │   │
│  │  └──────────────────┬─────────────────────────────┘  │   │
│  │                     │ FK                              │   │
│  │  ┌──────────────────▼─────────────────────────────┐  │   │
│  │  │  user_roles                                     │  │   │
│  │  │  • user_id | role (admin/office_user)          │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │  service_types                                   │  │   │
│  │  │  • Service definitions (admin-managed)          │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │  Other Tables (voters, families, etc.)          │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Row Level Security (RLS) Policies            │   │
│  │  • user_roles: Users can read own role               │   │
│  │  • service_types: All can read active, admin can CUD │   │
│  │  • All tables: Service role bypasses RLS             │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow Diagram

```
┌──────┐
│ User │
└───┬──┘
    │
    │ 1. Navigate to /login
    ▼
┌──────────────┐
│ Login Page   │
└───┬──────────┘
    │
    │ 2. Enter email/password
    │ 3. Click "Sign In"
    ▼
┌────────────────────────┐
│ supabase.auth          │
│ .signInWithPassword()  │
└───┬────────────────────┘
    │
    │ 4. Verify credentials
    ▼
┌────────────────────────┐
│ Supabase Auth Service  │
│ (auth.users table)     │
└───┬────────────────────┘
    │
    │ 5. Return user session
    ▼
┌────────────────────────┐
│ AuthContext            │
│ onAuthStateChange()    │
└───┬────────────────────┘
    │
    │ 6. Fetch user role
    │    GET /api/auth/role?user_id=xxx
    ▼
┌────────────────────────┐
│ API Route              │
│ Query user_roles table │
└───┬────────────────────┘
    │
    │ 7. Return role
    ▼
┌────────────────────────┐
│ AuthContext            │
│ setRole(role)          │
└───┬────────────────────┘
    │
    │ 8. Redirect to /
    ▼
┌────────────────────────┐
│ ProtectedRoute         │
│ Check role & auth      │
└───┬────────────────────┘
    │
    │ 9. Render dashboard
    ▼
┌────────────────────────┐
│ Dashboard with         │
│ role-based navigation  │
└────────────────────────┘
```

---

## Authorization Flow (Protected API Endpoint)

```
┌──────────────────┐
│ Client Component │
└────────┬─────────┘
         │
         │ 1. Fetch API (authenticated)
         │    POST /api/services
         ▼
┌──────────────────────────┐
│ API Route Handler        │
│ /api/services.ts         │
└────────┬─────────────────┘
         │
         │ 2. Get user from session
         ▼
┌──────────────────────────┐
│ Supabase Client          │
│ (Service Role)           │
└────────┬─────────────────┘
         │
         │ 3. Query user_roles
         │    SELECT role FROM user_roles
         │    WHERE user_id = ?
         ▼
┌──────────────────────────┐
│ PostgreSQL               │
│ (with RLS enabled)       │
└────────┬─────────────────┘
         │
         │ 4. Return role
         ▼
┌──────────────────────────┐
│ API Route                │
│ Check if role = 'admin'  │
└────────┬─────────────────┘
         │
         ├─ NO ──▶ Return 403 Forbidden
         │
         │ YES
         ▼
┌──────────────────────────┐
│ Perform admin operation  │
│ (insert/update/delete)   │
└────────┬─────────────────┘
         │
         │ 5. Return success
         ▼
┌──────────────────────────┐
│ Client receives response │
└──────────────────────────┘
```

---

## Navigation Rendering Flow

```
┌────────────────────────┐
│ DashboardLayout.tsx    │
└──────────┬─────────────┘
           │
           │ 1. useAuth() → get role
           ▼
┌──────────────────────────┐
│ Define allNavItems with  │
│ permission requirements  │
└──────────┬───────────────┘
           │
           │ 2. Filter items
           │    navItems = allNavItems.filter(
           │      item => hasPermission(role, item.permission)
           │    )
           ▼
┌──────────────────────────┐
│ Render filtered navItems │
└──────────────────────────┘

Example:
- Admin role:
  ✅ Dashboard
  ✅ Upload Voters
  ✅ Import History
  ✅ Search Voters
  ✅ Manage Services
  ✅ Create User

- Office User role:
  ✅ Dashboard
  ❌ Upload Voters (filtered out)
  ❌ Import History (filtered out)
  ✅ Search Voters
  ❌ Manage Services (filtered out)
  ❌ Create User (filtered out)
```

---

## Permission Matrix

```
┌───────────────────────┬─────────┬──────────────┐
│      Permission       │  Admin  │ Office User  │
├───────────────────────┼─────────┼──────────────┤
│ UPLOAD_VOTERS         │    ✅   │      ❌      │
│ MANAGE_SERVICES       │    ✅   │      ❌      │
│ VIEW_ALL_REPORTS      │    ✅   │      ❌      │
│ CONFIGURE_TEMPLATES   │    ✅   │      ❌      │
│ MANAGE_USERS          │    ✅   │      ❌      │
│ SEARCH_VOTERS         │    ✅   │      ✅      │
│ CREATE_SERVICE_REQ    │    ✅   │      ✅      │
│ UPDATE_WORK_STATUS    │    ✅   │      ✅      │
│ VIEW_OWN_REQUESTS     │    ✅   │      ✅      │
│ CREATE_FORMS          │    ✅   │      ❌      │
│ FILL_FORMS            │    ✅   │      ✅      │
│ LINK_FAMILY           │    ✅   │      ✅      │
└───────────────────────┴─────────┴──────────────┘
```

---

## Data Flow for Creating a User (Admin Only)

```
Admin User                  Client                API Route            Database
    │                         │                      │                    │
    │ 1. Navigate to         │                      │                    │
    │    /signup             │                      │                    │
    ├──────────────────────▶ │                      │                    │
    │                         │                      │                    │
    │                    2. Check role              │                    │
    │                    isAdmin = true             │                    │
    │                    Render form                │                    │
    │                         │                      │                    │
    │ 3. Fill form &         │                      │                    │
    │    submit              │                      │                    │
    ├──────────────────────▶ │                      │                    │
    │                         │                      │                    │
    │                         │ 4. POST /api/auth/signup                  │
    │                         ├────────────────────▶│                    │
    │                         │    { email, pwd,   │                    │
    │                         │      role }        │                    │
    │                         │                      │                    │
    │                         │              5. createUser()              │
    │                         │              (Supabase Auth)              │
    │                         │                      ├──────────────────▶│
    │                         │                      │                  auth.users
    │                         │                      │                    │
    │                         │              6. Insert user_roles         │
    │                         │                      ├──────────────────▶│
    │                         │                      │                  user_roles
    │                         │                      │                    │
    │                         │ 7. Return success    │                    │
    │                         │◀────────────────────│                    │
    │                         │                      │                    │
    │ 8. Show success msg    │                      │                    │
    │◀──────────────────────│                      │                    │
    │                         │                      │                    │
```

---

## Security Layers

```
Layer 1: Client-Side UI
─────────────────────────
• Hide/show elements based on role
• Prevent accidental unauthorized clicks
• NOT security-critical (can be bypassed)

        ↓

Layer 2: Route Protection
─────────────────────────
• ProtectedRoute HOC checks auth & role
• Redirects to login or access denied
• Prevents rendering protected pages

        ↓

Layer 3: API Authorization
─────────────────────────
• Every API route verifies user role
• Returns 403 for unauthorized
• Server-side enforcement (critical)

        ↓

Layer 4: Database RLS
─────────────────────────
• Row Level Security policies on tables
• Additional database-level protection
• Prevents direct DB access bypass

        ↓

Layer 5: Service Role Key
─────────────────────────
• Admin operations use service role
• Bypasses RLS for trusted operations
• Never exposed client-side
```

---

## Technology Stack

```
┌─────────────────────────────────────┐
│         Frontend (Client)            │
│  • Next.js 14                        │
│  • React 18                          │
│  • TypeScript                        │
│  • AuthContext (React Context API)  │
└─────────────────┬───────────────────┘
                  │
                  │ API Calls (fetch)
                  │
┌─────────────────▼───────────────────┐
│         Backend (Server)             │
│  • Next.js API Routes                │
│  • Node.js                           │
│  • Supabase JS Client                │
└─────────────────┬───────────────────┘
                  │
                  │ PostgreSQL Protocol
                  │
┌─────────────────▼───────────────────┐
│         Database (Supabase)          │
│  • PostgreSQL 15                     │
│  • Row Level Security (RLS)          │
│  • Supabase Auth (GoTrue)            │
│  • Supabase Storage (S3-compatible)  │
└──────────────────────────────────────┘
```

---

## File Structure

```
voter-management/
├── supabase/
│   ├── migrations/
│   │   └── 20260215120300_user_roles_and_services.sql
│   ├── setup_rls.sql
│   └── seed_admin.sql
├── web/
│   ├── contexts/
│   │   └── AuthContext.tsx           ← Auth state management
│   ├── lib/
│   │   ├── rbac.ts                   ← Permission definitions
│   │   └── supabaseClient.ts         ← DB client helpers
│   ├── components/
│   │   ├── DashboardLayout.tsx       ← Role-based nav
│   │   └── ProtectedRoute.tsx        ← Route guard HOC
│   ├── pages/
│   │   ├── login.tsx                 ← Login page
│   │   ├── signup.tsx                ← User creation (admin)
│   │   ├── services.tsx              ← Service mgmt (admin)
│   │   ├── upload.tsx                ← Upload (admin)
│   │   ├── search.tsx                ← Search (all)
│   │   ├── index.tsx                 ← Dashboard
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── signup.ts         ← Create user
│   │       │   └── role.ts           ← Fetch role
│   │       └── services.ts           ← Service CRUD
│   └── styles/
│       └── globals.css               ← Global styles
└── docs/
    ├── USER_MANAGEMENT_GUIDE.md
    ├── API_REFERENCE.md
    ├── RBAC_TESTING_CHECKLIST.md
    └── RBAC_ARCHITECTURE.md          ← This file
```

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│              Production Setup                     │
└──────────────────────────────────────────────────┘

        User Browser
             │
             │ HTTPS
             ▼
    ┌─────────────────┐
    │  Vercel Edge     │
    │  (CDN + Edge    │
    │   Functions)    │
    └────────┬────────┘
             │
             │ Serverless Functions
             ▼
    ┌─────────────────┐
    │  Next.js API    │
    │  (API Routes)   │
    └────────┬────────┘
             │
             │ Secure Connection
             ▼
    ┌─────────────────┐
    │  Supabase Cloud │
    │  (PostgreSQL +  │
    │   Auth + Storage)│
    └─────────────────┘

Environment Variables (Vercel):
• NEXT_PUBLIC_SUPABASE_URL
• NEXT_PUBLIC_SUPABASE_ANON_KEY
• SUPABASE_SERVICE_ROLE_KEY (secret)
```

---

## Future Enhancements

1. **Multi-Factor Authentication (MFA)**
   - SMS/Email OTP
   - TOTP (Google Authenticator)

2. **Granular Permissions**
   - Per-module permissions
   - Custom role definitions

3. **Audit Trail**
   - Log all admin actions
   - Track permission changes

4. **Session Management**
   - Configurable session timeout
   - Force logout on password change

5. **User Management UI**
   - Edit user roles
   - Deactivate/reactivate users
   - Password reset by admin
