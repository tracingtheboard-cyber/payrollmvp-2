-- Enable Row Level Security on salary_items table (if not already enabled)
ALTER TABLE salary_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to select salary_items" ON salary_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert salary_items" ON salary_items;
DROP POLICY IF EXISTS "Allow authenticated users to update salary_items" ON salary_items;
DROP POLICY IF EXISTS "Allow HR users to select salary_items" ON salary_items;
DROP POLICY IF EXISTS "Allow HR users to insert salary_items" ON salary_items;
DROP POLICY IF EXISTS "Allow HR users to update salary_items" ON salary_items;

-- Option 1: Allow all authenticated users (RECOMMENDED FOR STARTING - simpler)
-- This allows any logged-in user to read, insert, and update salary_items
CREATE POLICY "Allow authenticated users to select salary_items"
ON salary_items
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert salary_items"
ON salary_items
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update salary_items"
ON salary_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Option 2: Only allow HR users (More secure - uncomment if you want stricter control)
-- Uncomment the following and comment out Option 1 if you want HR-only access:

-- CREATE POLICY "Allow HR users to select salary_items"
-- ON salary_items
-- FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM auth.users
--     WHERE auth.users.id = auth.uid()
--     AND (
--       (auth.users.raw_user_meta_data->>'is_hr')::boolean = true
--       OR auth.users.raw_user_meta_data->>'role' = 'hr'
--       OR auth.users.email LIKE '%admin%'
--     )
--   )
-- );

-- CREATE POLICY "Allow HR users to insert salary_items"
-- ON salary_items
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM auth.users
--     WHERE auth.users.id = auth.uid()
--     AND (
--       (auth.users.raw_user_meta_data->>'is_hr')::boolean = true
--       OR auth.users.raw_user_meta_data->>'role' = 'hr'
--       OR auth.users.email LIKE '%admin%'
--     )
--   )
-- );

-- CREATE POLICY "Allow HR users to update salary_items"
-- ON salary_items
-- FOR UPDATE
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM auth.users
--     WHERE auth.users.id = auth.uid()
--     AND (
--       (auth.users.raw_user_meta_data->>'is_hr')::boolean = true
--       OR auth.users.raw_user_meta_data->>'role' = 'hr'
--       OR auth.users.email LIKE '%admin%'
--     )
--   )
-- )
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM auth.users
--     WHERE auth.users.id = auth.uid()
--     AND (
--       (auth.users.raw_user_meta_data->>'is_hr')::boolean = true
--       OR auth.users.raw_user_meta_data->>'role' = 'hr'
--       OR auth.users.email LIKE '%admin%'
--     )
--   )
-- );

