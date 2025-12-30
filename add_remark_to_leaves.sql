-- Add remark column to leaves table
ALTER TABLE public.leaves 
ADD COLUMN IF NOT EXISTS remark TEXT;

-- Optional: Add comment to document the column
COMMENT ON COLUMN public.leaves.remark IS 'Additional remarks or notes for the leave request';

