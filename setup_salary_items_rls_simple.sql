-- Simple RLS setup for salary_items table
-- Enable Row Level Security
ALTER TABLE salary_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to select salary_items" ON salary_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert salary_items" ON salary_items;
DROP POLICY IF EXISTS "Allow authenticated users to update salary_items" ON salary_items;

-- Allow all authenticated users to SELECT
CREATE POLICY "Allow authenticated users to select salary_items"
ON salary_items
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to INSERT
CREATE POLICY "Allow authenticated users to insert salary_items"
ON salary_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to UPDATE
CREATE POLICY "Allow authenticated users to update salary_items"
ON salary_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

