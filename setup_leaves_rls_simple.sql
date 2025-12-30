-- Simple RLS Policies for leaves table
-- This allows all authenticated users to view and update leaves
-- For production, you should add proper role checks

-- Enable Row Level Security
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (optional, for clean setup)
DROP POLICY IF EXISTS "HR can view all leave requests" ON public.leaves;
DROP POLICY IF EXISTS "HR can update leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Employees can view own leave requests" ON public.leaves;
DROP POLICY IF EXISTS "Employees can insert own leave requests" ON public.leaves;

-- Policy: Allow all authenticated users to view all leave requests
-- (For testing - in production, add role checks)
CREATE POLICY "Allow authenticated users to view all leaves"
  ON public.leaves
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow all authenticated users to update leave requests
CREATE POLICY "Allow authenticated users to update leaves"
  ON public.leaves
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Allow employees to insert their own leave requests
CREATE POLICY "Allow employees to insert own leaves"
  ON public.leaves
  FOR INSERT
  TO authenticated
  WITH CHECK (
    crew_id IS NULL OR
    crew_id IN (
      SELECT id FROM public.crews 
      WHERE user_id = auth.uid()
    )
  );


