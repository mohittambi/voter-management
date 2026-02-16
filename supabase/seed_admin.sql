-- Seed first admin user
-- Replace the email/password with your desired admin credentials
-- Run this after migrations are applied

-- This is a manual script to be run via psql or Supabase Studio SQL editor
-- You'll need to create the user in Supabase Auth first, then use this script
-- to assign the admin role

-- STEP 1: Create user via Supabase Dashboard or API
-- Email: admin@example.com
-- Password: (set your secure password)

-- STEP 2: After user is created, get the user ID from auth.users table:
-- SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- STEP 3: Run this command to assign admin role (replace USER_ID):
-- INSERT INTO user_roles (user_id, role) VALUES ('USER_ID_HERE', 'admin');

-- Example (you need to replace with actual user ID):
-- INSERT INTO user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000000', 'admin');

-- Alternatively, use the signup API endpoint with service role key:
-- POST /api/auth/signup
-- Body: { "email": "admin@example.com", "password": "YourSecurePassword", "role": "admin" }
