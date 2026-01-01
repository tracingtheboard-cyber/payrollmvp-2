-- 允许匿名用户（public）读取 HRMSMVP bucket 中 policies 文件夹下的文件
-- 如果策略已存在，先删除
DROP POLICY IF EXISTS "Allow public read access to policy files" ON storage.objects;

CREATE POLICY "Allow public read access to policy files"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'HRMSMVP' 
  AND (storage.foldername(name))[1] = 'policies'
);

-- 如果需要允许匿名用户读取整个 HRMSMVP bucket 的所有文件，可以使用下面的语句
-- DROP POLICY IF EXISTS "Allow public read access to HRMSMVP bucket" ON storage.objects;
-- CREATE POLICY "Allow public read access to HRMSMVP bucket"
-- ON storage.objects
-- FOR SELECT
-- TO anon
-- USING (bucket_id = 'HRMSMVP');

