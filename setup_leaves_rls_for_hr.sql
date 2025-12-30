-- RLS Policies for leaves table
-- Allow HR users to view all leave requests

-- Enable Row Level Security (if not already enabled)
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- Policy: HR can view all leave requests
-- Note: This assumes HR users have user_metadata.role = 'hr' or is_hr = true
CREATE POLICY "HR can view all leave requests"
  ON public.leaves
  FOR SELECT
  USING (
    -- Allow if user is HR (check user_metadata)
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        (auth.users.raw_user_meta_data->>'role')::text = 'hr'
        OR (auth.users.raw_user_meta_data->>'is_hr')::boolean = true
      )
    )
    -- OR allow if user is admin
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.email LIKE '%admin%'
        OR (auth.users.raw_user_meta_data->>'role')::text = 'admin'
        OR (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
      )
    )
  );

-- Policy: HR can update leave requests (approve/reject)
CREATE POLICY "HR can update leave requests"
  ON public.leaves
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        (auth.users.raw_user_meta_data->>'role')::text = 'hr'
        OR (auth.users.raw_user_meta_data->>'is_hr')::boolean = true
        OR auth.users.email LIKE '%admin%'
        OR (auth.users.raw_user_meta_data->>'role')::text = 'admin'
      )
    )
  );

-- Policy: Employees can view their own leave requests (already should exist)
-- This is for employees to see their own requests
CREATE POLICY "Employees can view own leave requests"
  ON public.leaves
  FOR SELECT
  USING (
    crew_id IN (
      SELECT id FROM public.crews 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Employees can insert their own leave requests (already should exist)
CREATE POLICY "Employees can insert own leave requests"
  ON public.leaves
  FOR INSERT
  WITH CHECK (
    crew_id IN (
      SELECT id FROM public.crews 
      WHERE user_id = auth.uid()
    )
  );

