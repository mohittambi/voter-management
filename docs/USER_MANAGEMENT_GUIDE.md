# User Management & RBAC Setup Guide

## Overview

The Voter Management Portal now includes a complete Role-Based Access Control (RBAC) system with two user roles:

### 👑 Admin Role
- Full system access
- Upload voter lists
- View import history
- Manage service types (add/edit/delete)
- Create new users
- View all reports
- Configure system settings

### 👤 Office User Role
- Search voters
- View voter profiles
- Link family members
- Create service requests
- Update work status
- **Cannot** upload voters
- **Cannot** manage services
- **Cannot** create users

## Setup Instructions

### 1. Apply Database Migrations

Run the RBAC migration to create the necessary tables:

```bash
cd /path/to/voter-management
supabase migration up
```

This will create:
- `user_roles` table
- `service_types` table
- RLS policies for both tables

### 2. Create Your First Admin User

You have three options:

#### Option A: Using the Signup API (Recommended)

First, make sure your local Supabase is running and you have the service role key in `.env.local`.

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourSecurePassword123",
    "role": "admin"
  }'
```

#### Option B: Using Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" and create a user with your email/password
3. Note the User ID from the created user
4. Go to SQL Editor and run:

```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('YOUR_USER_ID_HERE', 'admin');
```

#### Option C: Using psql

```bash
# Connect to your local Supabase
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Create the auth user (use Supabase auth API instead)
# Then insert the role
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID_FROM_AUTH_USERS', 'admin');
```

### 3. Test the System

1. Start your Next.js dev server:
   ```bash
   cd web
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. Login with your admin credentials

4. You should see the full navigation menu including:
   - Dashboard
   - Upload Voters
   - Import History
   - Search Voters
   - Manage Services
   - Create User

5. Your role badge should show "👑 Admin" in the header

### 4. Create Office Users

As an admin:

1. Navigate to "Create User" from the sidebar
2. Fill in the email and password
3. Select "Office User" role
4. Click "Create User"
5. The new user can now login with their credentials

## Authentication Flow

```
User → Login Page → Supabase Auth
                      ↓
              Auth Context (fetch role)
                      ↓
              Protected Routes Check Role
                      ↓
              Render Appropriate UI
```

## Permission Matrix

| Feature | Admin | Office User |
|---------|-------|-------------|
| Dashboard | ✅ | ✅ |
| Upload Voters | ✅ | ❌ |
| Import History | ✅ | ❌ |
| Search Voters | ✅ | ✅ |
| Manage Services | ✅ | ❌ |
| Create Users | ✅ | ❌ |
| Link Families | ✅ | ✅ |
| Edit Profiles | ✅ | ✅ |

## Files Structure

```
web/
├── contexts/
│   └── AuthContext.tsx          # Auth state management
├── lib/
│   └── rbac.ts                  # Permission definitions
├── components/
│   ├── DashboardLayout.tsx      # Role-based navigation
│   └── ProtectedRoute.tsx       # Route protection HOC
├── pages/
│   ├── login.tsx                # Login page
│   ├── signup.tsx               # User creation (admin-only)
│   ├── services.tsx             # Service management (admin-only)
│   └── api/
│       ├── auth/
│       │   ├── role.ts          # Fetch user role
│       │   └── signup.ts        # Create new user
│       └── services.ts          # Service CRUD

supabase/
├── migrations/
│   └── 20260215120300_user_roles_and_services.sql
└── seed_admin.sql               # Admin creation guide
```

## Customizing Permissions

Edit `web/lib/rbac.ts` to customize permissions:

```typescript
export const PERMISSIONS = {
  UPLOAD_VOTERS: ['admin'],
  MANAGE_SERVICES: ['admin'],
  SEARCH_VOTERS: ['admin', 'office_user'],
  // Add more permissions...
};
```

Then use `hasPermission(userRole, 'PERMISSION_NAME')` in your components.

## Security Notes

1. **Service Role Key**: Keep `SUPABASE_SERVICE_ROLE_KEY` secret - never expose it client-side
2. **RLS Policies**: All tables have Row Level Security enabled
3. **API Protection**: Server-side API routes verify roles before operations
4. **Client-side Checks**: UI elements hidden based on role, but server enforces access

## Troubleshooting

### "Access Denied" on protected pages
- Verify the user has the correct role in `user_roles` table
- Check RLS policies are enabled
- Ensure AuthContext is properly wrapped in `_app.tsx`

### Role not loading
- Check `/api/auth/role` endpoint is working
- Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Look for console errors in browser dev tools

### Cannot create users
- Ensure you're logged in as admin
- Check service role key is configured
- Verify migrations have been applied

## Next Steps

- Add password reset functionality
- Implement session timeout
- Add audit logging for admin actions
- Create a user management page to edit/delete users
- Add email verification for new users
