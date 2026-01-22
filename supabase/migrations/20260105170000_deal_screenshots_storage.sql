-- Deal Screenshots Storage Setup
-- Creates storage bucket and policies for deal conversation screenshots

-- Create the storage bucket for deal screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deal-screenshots',
  'deal-screenshots',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for deal-screenshots bucket

-- Users can upload their own screenshots (folder structure: user_id/filename)
DROP POLICY IF EXISTS "Users can upload own deal screenshots" ON storage.objects;
DO $$ BEGIN
CREATE POLICY "Users can upload own deal screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'deal-screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own screenshots
DROP POLICY IF EXISTS "Users can view own deal screenshots" ON storage.objects;
DO $$ BEGIN
CREATE POLICY "Users can view own deal screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'deal-screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own screenshots
DROP POLICY IF EXISTS "Users can delete own deal screenshots" ON storage.objects;
DO $$ BEGIN
CREATE POLICY "Users can delete own deal screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'deal-screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own screenshots
DROP POLICY IF EXISTS "Users can update own deal screenshots" ON storage.objects;
DO $$ BEGIN
CREATE POLICY "Users can update own deal screenshots"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'deal-screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
