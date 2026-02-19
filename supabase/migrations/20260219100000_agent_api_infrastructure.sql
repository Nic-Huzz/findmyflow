-- ============================================
-- Agent API Infrastructure
-- Enables AI agents to submit assessment results
-- on behalf of authenticated FindMyFlow users.
-- ============================================

-- 1. API Keys table
CREATE TABLE IF NOT EXISTS agent_api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,        -- e.g. "fmf_k1_a3b2" for display
  label text NOT NULL DEFAULT 'My Agent',
  permissions jsonb DEFAULT '{"flows": ["attraction_offer", "upsell_offer", "downsell_offer", "continuity_offer", "leads_strategy", "lead_magnet_offer"]}'::jsonb,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  is_active boolean DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_api_keys_hash ON agent_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_agent_api_keys_user ON agent_api_keys(user_id);

ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys"
  ON agent_api_keys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Agent tracking columns on all 6 assessment tables
ALTER TABLE attraction_offer_assessments
  ADD COLUMN IF NOT EXISTS agent_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS submitted_via text DEFAULT 'web_ui';

ALTER TABLE upsell_assessments
  ADD COLUMN IF NOT EXISTS agent_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS submitted_via text DEFAULT 'web_ui';

ALTER TABLE downsell_assessments
  ADD COLUMN IF NOT EXISTS agent_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS submitted_via text DEFAULT 'web_ui';

ALTER TABLE continuity_assessments
  ADD COLUMN IF NOT EXISTS agent_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS submitted_via text DEFAULT 'web_ui';

ALTER TABLE leads_assessments
  ADD COLUMN IF NOT EXISTS agent_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS submitted_via text DEFAULT 'web_ui';

ALTER TABLE lead_magnet_assessments
  ADD COLUMN IF NOT EXISTS agent_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS submitted_via text DEFAULT 'web_ui';

-- 3. Backfill existing rows so submitted_via is never NULL
UPDATE attraction_offer_assessments SET submitted_via = 'web_ui' WHERE submitted_via IS NULL;
UPDATE upsell_assessments SET submitted_via = 'web_ui' WHERE submitted_via IS NULL;
UPDATE downsell_assessments SET submitted_via = 'web_ui' WHERE submitted_via IS NULL;
UPDATE continuity_assessments SET submitted_via = 'web_ui' WHERE submitted_via IS NULL;
UPDATE leads_assessments SET submitted_via = 'web_ui' WHERE submitted_via IS NULL;
UPDATE lead_magnet_assessments SET submitted_via = 'web_ui' WHERE submitted_via IS NULL;
