-- ============================================================================
-- Add flow_type column to nikigai_sessions
-- This enables graduation checker to track which flows users have completed
-- ============================================================================

-- Add flow_type column to nikigai_sessions
ALTER TABLE public.nikigai_sessions
ADD COLUMN IF NOT EXISTS flow_type TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_nikigai_sessions_flow_type
ON public.nikigai_sessions(flow_type);

-- Create composite index for common queries (user + flow_type)
CREATE INDEX IF NOT EXISTS idx_nikigai_sessions_user_flow_type
ON public.nikigai_sessions(user_id, flow_type);

-- Backfill existing sessions based on flow_version pattern
-- Map flow_version to flow_type for existing data
UPDATE public.nikigai_sessions
SET flow_type = CASE
  WHEN flow_version LIKE 'skills%' THEN 'nikigai'
  WHEN flow_version LIKE 'problems%' THEN 'nikigai'
  WHEN flow_version LIKE 'persona%' THEN 'nikigai'
  WHEN flow_version LIKE 'integration%' THEN 'nikigai'
  WHEN flow_version LIKE 'monetization%' THEN '100m_offer'
  WHEN flow_version LIKE 'money_model%' THEN '100m_money_model'
  ELSE flow_version
END
WHERE flow_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.nikigai_sessions.flow_type IS
'High-level flow type for graduation tracking. Values: nikigai, 100m_offer, 100m_money_model';

-- Verify the update
SELECT
  flow_version,
  flow_type,
  COUNT(*) as session_count
FROM public.nikigai_sessions
GROUP BY flow_version, flow_type
ORDER BY flow_version;
