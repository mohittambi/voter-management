# RBAC Testing Checklist

Complete testing checklist for the User Management & Role-Based Access Control system.

## Setup Prerequisites

Before testing, ensure:
- [ ] Local Supabase is running (`supabase start`)
- [ ] All migrations are applied (`supabase migration up`)
- [ ] Storage bucket is created (run `supabase/setup_storage.sql`)
- [ ] RLS policies are applied (run `supabase/setup_rls.sql`)
- [ ] Frontend dependencies are installed (`cd web && npm install`)
- [ ] `.env.local` is configured with correct Supabase keys
- [ ] Dev server is running (`npm run dev`)

## Test Case 1: First Admin User Creation

### Steps:
1. [ ] Create admin user via API:
   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@test.com",
       "password": "Admin123!",
       "role": "admin"
     }'
   ```
2. [ ] Verify user created in `auth.users` table
3. [ ] Verify role assigned in `user_roles` table

### Expected Results:
- ✅ API returns `{ "user": { ... } }`
- ✅ User appears in Supabase Auth dashboard
- ✅ `user_roles` table has entry with `role = 'admin'`

## Test Case 2: Admin Login & Navigation

### Steps:
1. [ ] Navigate to `http://localhost:3000/login`
2. [ ] Enter admin credentials (admin@test.com / Admin123!)
3. [ ] Click "Sign In"

### Expected Results:
- ✅ Redirected to dashboard (`/`)
- ✅ Header shows "👑 Admin" role badge
- ✅ User email displayed in header
- ✅ Logout button visible
- ✅ Sidebar shows all navigation items:
  - Dashboard
  - Upload Voters
  - Import History
  - Search Voters
  - Manage Services
  - Create User

## Test Case 3: Admin Can Upload Voters

### Steps:
1. [ ] Login as admin
2. [ ] Click "Upload Voters" in sidebar
3. [ ] Select a test Excel file (use `web/sample_voters.csv`)
4. [ ] Verify upload completes

### Expected Results:
- ✅ Upload page loads successfully
- ✅ File upload UI displayed
- ✅ Upload shows progress and success message
- ✅ `imports` table has new entry
- ✅ `master_voters` table populated with data

## Test Case 4: Admin Can Manage Services

### Steps:
1. [ ] Login as admin
2. [ ] Click "Manage Services" in sidebar
3. [ ] Click "Add Service Type"
4. [ ] Fill form:
   - Name: "Ration Card Application"
   - Description: "Apply for new ration card"
   - Active: checked
5. [ ] Click "Create"
6. [ ] Verify service appears in list
7. [ ] Click "Edit" on the service
8. [ ] Change description
9. [ ] Click "Update"
10. [ ] Click "Delete" and confirm

### Expected Results:
- ✅ Services page loads successfully
- ✅ Modal opens for adding service
- ✅ Service created and appears in list
- ✅ Edit updates the service
- ✅ Delete removes the service
- ✅ `service_types` table reflects all changes

## Test Case 5: Admin Can Create Office User

### Steps:
1. [ ] Login as admin
2. [ ] Click "Create User" in sidebar
3. [ ] Fill form:
   - Email: "office@test.com"
   - Password: "Office123!"
   - Confirm Password: "Office123!"
   - Role: "Office User"
4. [ ] Click "Create User"

### Expected Results:
- ✅ Success message displayed
- ✅ User created in `auth.users`
- ✅ Role assigned as "office_user" in `user_roles`

## Test Case 6: Office User Login & Limited Navigation

### Steps:
1. [ ] Logout admin user
2. [ ] Navigate to login page
3. [ ] Login as office user (office@test.com / Office123!)

### Expected Results:
- ✅ Login successful
- ✅ Header shows "👤 Office User" role badge
- ✅ Sidebar shows ONLY:
  - Dashboard
  - Search Voters
- ✅ Sidebar does NOT show:
  - Upload Voters ❌
  - Import History ❌
  - Manage Services ❌
  - Create User ❌

## Test Case 7: Office User Cannot Access Protected Routes

### Steps:
1. [ ] Login as office user
2. [ ] Manually navigate to `http://localhost:3000/upload`
3. [ ] Try accessing `http://localhost:3000/services`
4. [ ] Try accessing `http://localhost:3000/signup`

### Expected Results:
- ✅ Each page shows "Access Denied" message
- ✅ "Go to Dashboard" button displayed
- ✅ No error in console (just access denied UI)

## Test Case 8: Office User Can Search Voters

### Steps:
1. [ ] Login as office user
2. [ ] Click "Search Voters" in sidebar
3. [ ] Enter search query (name or mobile)
4. [ ] Click "Search"

### Expected Results:
- ✅ Search page loads successfully
- ✅ Search results displayed
- ✅ Can click on voter to view profile
- ✅ Can edit voter profile fields

## Test Case 9: Office User Can Link Family Members

### Steps:
1. [ ] Login as office user
2. [ ] Search and open a voter profile
3. [ ] Click "Link Family Member"
4. [ ] Search for another voter
5. [ ] Select relationship
6. [ ] Click "Link"

### Expected Results:
- ✅ Family link modal opens
- ✅ Can search for voters
- ✅ Can link successfully
- ✅ Family tree appears in sidebar
- ✅ `families` and `family_members` tables updated

## Test Case 10: Logout & Session Management

### Steps:
1. [ ] Login as admin
2. [ ] Click "Logout" button in header
3. [ ] Verify redirected to login page
4. [ ] Try accessing `http://localhost:3000/` without login
5. [ ] Login again and verify session persists

### Expected Results:
- ✅ Logout redirects to `/login`
- ✅ Accessing protected routes without login redirects to login
- ✅ Login restores session correctly
- ✅ Role badge and navigation correct after re-login

## Test Case 11: API-Level Authorization

### Steps:
1. [ ] Login as office user
2. [ ] Open browser DevTools → Network tab
3. [ ] Try to manually call admin-only API:
   ```javascript
   fetch('/api/services', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name: 'Test Service', active: true })
   }).then(r => r.json()).then(console.log)
   ```
4. [ ] Check response

### Expected Results:
- ✅ API returns `403 Forbidden` or appropriate error
- ✅ Service is NOT created in database
- ✅ Console shows authorization error

## Test Case 12: Password Validation

### Steps:
1. [ ] Login as admin
2. [ ] Go to Create User page
3. [ ] Try creating user with password "123" (too short)
4. [ ] Try with mismatched passwords
5. [ ] Try with valid password

### Expected Results:
- ✅ Short password shows error: "Password must be at least 6 characters"
- ✅ Mismatched passwords show error: "Passwords do not match"
- ✅ Valid password creates user successfully

## Test Case 13: RLS Policy Enforcement

### Steps:
1. [ ] Login as office user
2. [ ] Open Supabase SQL Editor
3. [ ] Try to query:
   ```sql
   SELECT * FROM user_roles;
   ```
4. [ ] Try to insert:
   ```sql
   INSERT INTO user_roles (user_id, role) VALUES ('test-id', 'admin');
   ```

### Expected Results:
- ✅ Office user can only see their own role (RLS enforced)
- ✅ Insert fails (only service role can insert)

## Test Case 14: Multiple Sessions

### Steps:
1. [ ] Open browser window 1 → Login as admin
2. [ ] Open browser window 2 (incognito) → Login as office user
3. [ ] Verify both sessions work independently
4. [ ] Logout from window 1
5. [ ] Verify window 2 still logged in

### Expected Results:
- ✅ Both sessions independent
- ✅ Correct role badge in each window
- ✅ Logout doesn't affect other session

## Test Case 15: Edge Cases

### Steps:
1. [ ] Try logging in with invalid email
2. [ ] Try logging in with wrong password
3. [ ] Try accessing pages while logged out
4. [ ] Refresh page while logged in
5. [ ] Close and reopen browser (session persistence)

### Expected Results:
- ✅ Invalid credentials show error message
- ✅ Logged-out state redirects to login
- ✅ Page refresh maintains session
- ✅ Session persists across browser restarts (until logout)

## Acceptance Criteria Summary

| Criteria | Status | Notes |
|----------|--------|-------|
| AC-01: Admin can login and see all menu options | [ ] | Upload, Services, Reports visible |
| AC-02: Office User can login and only see limited menu | [ ] | Search, Profile, Family only |
| AC-03: Office User cannot access admin routes | [ ] | /upload, /services return 403 |
| AC-04: Admin can create/edit/delete service types | [ ] | Full CRUD working |
| AC-05: API routes reject unauthorized role access | [ ] | 403 response for unauthorized |

## Performance & Security Checks

- [ ] No console errors on any page
- [ ] No service role key exposed in client-side code
- [ ] All API routes verify role server-side
- [ ] RLS policies enabled on all tables
- [ ] Auth state loads quickly (<500ms)
- [ ] Navigation transitions smooth
- [ ] No memory leaks on repeated login/logout

## Documentation Checks

- [ ] README includes RBAC setup instructions
- [ ] USER_MANAGEMENT_GUIDE.md is complete
- [ ] Permission matrix is accurate
- [ ] Troubleshooting section covers common issues
- [ ] Environment variables documented

---

## Test Results Summary

**Date:** _______________  
**Tester:** _______________  
**Environment:** Local / Staging / Production  

**Overall Status:** PASS / FAIL  

**Issues Found:**
1. 
2. 
3. 

**Notes:**


---

**Sign-off:**
- [ ] All critical tests passed
- [ ] All blockers resolved
- [ ] Ready for production deployment
