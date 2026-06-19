-- Auto-complete experiences whose date is 7+ days in the past.
-- Runs as a pg_cron job daily at 06:00 UTC.
-- Also adds content_purpose column to instagram_posts for brand building tagging.

-- 1. Create the function that auto-completes stale upcoming experiences
CREATE OR REPLACE FUNCTION public.auto_complete_past_experiences()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE experiences
  SET status = 'completed',
      updated_at = now()
  WHERE status = 'upcoming'
    AND experience_date IS NOT NULL
    AND experience_date < (current_date - interval '7 days');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- 2. Schedule daily at 06:00 UTC
SELECT cron.schedule(
  'auto-complete-past-experiences-daily',
  '0 6 * * *',
  $$ SELECT public.auto_complete_past_experiences(); $$
);

-- 3. Add content_purpose column to instagram_posts for Brand Pulse tagging
ALTER TABLE instagram_posts
ADD COLUMN IF NOT EXISTS content_purpose TEXT DEFAULT NULL
CHECK (content_purpose IN ('experience', 'brand'));
