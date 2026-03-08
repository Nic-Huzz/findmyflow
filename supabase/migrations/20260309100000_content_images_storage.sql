-- Content Images Storage - for inline images in content drafts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for content-images bucket

-- Authenticated users can upload images (folder: user_id/filename)
CREATE POLICY "Users can upload content images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read access (images are embedded in markdown viewed by reviewers)
CREATE POLICY "Anyone can view content images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'content-images');

-- Users can delete their own images
CREATE POLICY "Users can delete own content images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
