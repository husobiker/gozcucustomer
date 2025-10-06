-- Supabase Storage bucket oluştur (leave-documents için)

-- Storage bucket oluştur
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'leave-documents',
  'leave-documents', 
  true,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
);

-- Bucket policy oluştur (authenticated users can upload)
CREATE POLICY "Allow authenticated users to upload leave documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'leave-documents');

-- Bucket policy oluştur (authenticated users can view)
CREATE POLICY "Allow authenticated users to view leave documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'leave-documents');

-- Bucket policy oluştur (authenticated users can update)
CREATE POLICY "Allow authenticated users to update leave documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'leave-documents');

-- Bucket policy oluştur (authenticated users can delete)
CREATE POLICY "Allow authenticated users to delete leave documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'leave-documents');
