-- Fix groan_challenge_status enum to include all statuses used by the app
-- The app uses: generated, accepted, completed, skipped
-- The enum has: active, completed, skipped

-- Add missing enum values
ALTER TYPE groan_challenge_status ADD VALUE IF NOT EXISTS 'generated';
ALTER TYPE groan_challenge_status ADD VALUE IF NOT EXISTS 'accepted';
