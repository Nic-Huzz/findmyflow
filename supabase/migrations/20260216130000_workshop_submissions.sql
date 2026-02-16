-- Workshop submissions for Healing Compass landing page
CREATE TABLE workshop_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  emotional_need TEXT NOT NULL,
  action_commitment TEXT,
  protective_pattern TEXT NOT NULL,
  essence_archetype TEXT NOT NULL,
  letter_photo_url TEXT,
  new_belief TEXT,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public insert (no auth required), no client-side reads
ALTER TABLE workshop_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert workshop submissions"
  ON workshop_submissions FOR INSERT WITH CHECK (true);

-- Indexes for admin lookups
CREATE INDEX idx_workshop_submissions_email ON workshop_submissions(email);
CREATE INDEX idx_workshop_submissions_created ON workshop_submissions(created_at DESC);

-- Storage bucket for workshop letter photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('workshop-photos', 'workshop-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to workshop-photos bucket (no auth required)
CREATE POLICY "Anyone can upload workshop photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'workshop-photos');

-- Allow public reads
CREATE POLICY "Workshop photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'workshop-photos');
