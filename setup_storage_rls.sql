-- Storage RLS Policies for HRMSMVP bucket
-- Allow authenticated users to upload files to leave-evidence folder
CREATE POLICY "Allow authenticated users to upload leave evidence"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'HRMSMVP' 
  AND (storage.foldername(name))[1] = 'leave-evidence'
);

-- Allow authenticated users to read their own files
CREATE POLICY "Allow authenticated users to read leave evidence"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'HRMSMVP' 
  AND (storage.foldername(name))[1] = 'leave-evidence'
);

-- Allow authenticated users to update their own files (optional)
CREATE POLICY "Allow authenticated users to update leave evidence"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'HRMSMVP' 
  AND (storage.foldername(name))[1] = 'leave-evidence'
);

-- Allow authenticated users to delete their own files (optional)
CREATE POLICY "Allow authenticated users to delete leave evidence"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'HRMSMVP' 
  AND (storage.foldername(name))[1] = 'leave-evidence'
);

