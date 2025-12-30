-- Create leave_requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'unpaid', 'other')),
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_crew_id ON public.leave_requests(crew_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);

-- Enable Row Level Security
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Create policy: Employees can view their own leave requests
CREATE POLICY "Employees can view own leave requests"
  ON public.leave_requests
  FOR SELECT
  USING (
    crew_id IN (
      SELECT id FROM public.crews 
      WHERE user_id = auth.uid()
    )
  );

-- Create policy: Employees can insert their own leave requests
CREATE POLICY "Employees can insert own leave requests"
  ON public.leave_requests
  FOR INSERT
  WITH CHECK (
    crew_id IN (
      SELECT id FROM public.crews 
      WHERE user_id = auth.uid()
    )
  );

-- Create policy: HR/Admin can view all leave requests
CREATE POLICY "HR can view all leave requests"
  ON public.leave_requests
  FOR SELECT
  USING (true);

-- Create policy: HR/Admin can update leave requests
CREATE POLICY "HR can update leave requests"
  ON public.leave_requests
  FOR UPDATE
  USING (true);

-- Create storage bucket for leave evidence (run this in Supabase Storage)
-- Note: You need to create the bucket manually in Supabase Dashboard > Storage
-- Bucket name: leave-evidence
-- Public: Yes (or set up proper RLS policies)

