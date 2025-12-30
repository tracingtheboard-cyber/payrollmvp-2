-- Add evidence_url column to leaves table
ALTER TABLE public.leaves 
ADD COLUMN IF NOT EXISTS evidence_url TEXT;

-- Optional: Add comment to document the column
COMMENT ON COLUMN public.leaves.evidence_url IS 'URL to the evidence file stored in Supabase Storage';

