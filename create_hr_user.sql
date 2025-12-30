-- Create HR user in Supabase Auth
-- Note: This requires using Supabase Auth functions or Dashboard
-- The following is a guide, actual implementation depends on your setup

-- Method 1: Use Supabase Dashboard (Recommended)
-- Go to Authentication > Users > Add user
-- Email: hr@yourcompany.com
-- Password: [set a secure password]
-- Auto Confirm User: ✓ (checked)

-- Method 2: If you have admin access, you can use auth.admin_create_user()
-- This requires service_role key (NOT anon key)
-- Example (run in Supabase SQL Editor with service_role):
/*
SELECT auth.admin_create_user(
  '{
    "email": "hr@example.com",
    "password": "SecurePassword123!",
    "email_confirm": true,
    "user_metadata": {
      "role": "hr",
      "is_admin": false
    }
  }'::jsonb
);
*/

-- Method 3: After creating user via Dashboard, update user metadata
-- First, get the user ID from Authentication > Users
-- Then run (replace 'USER_ID_HERE' with actual user ID):
/*
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'hr',
  'is_admin', false
)
WHERE id = 'USER_ID_HERE';
*/

-- Important Notes:
-- 1. HR users should NOT have a record in the 'crews' table
-- 2. HR users can access all HR pages (salary, run, payslips, crews, admin)
-- 3. The login logic checks: if user is in crews table = employee, else = HR
-- 4. Admin users are identified by email containing 'admin' or user_metadata.role = 'admin'


