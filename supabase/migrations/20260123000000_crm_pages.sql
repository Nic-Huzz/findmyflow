-- CRM Pages Table
-- Stores landing pages and sales pages for tracking
-- Users generate copy via PromptGenerator, then track page performance here

CREATE TABLE IF NOT EXISTS crm_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,

  -- Page details
  name TEXT NOT NULL,
  page_type TEXT NOT NULL CHECK (page_type IN ('landing', 'sales', 'thank_you', 'checkout', 'other')),
  url TEXT,
  description TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'paused', 'archived')),

  -- Metrics (manually entered or from UTM tracking)
  visitors INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN visitors > 0 THEN (conversions::DECIMAL / visitors * 100) ELSE 0 END
  ) STORED,

  -- Generated content storage (optional - user can save generated copy)
  generated_copy JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_pages_user_id ON crm_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_pages_status ON crm_pages(status);
CREATE INDEX IF NOT EXISTS idx_crm_pages_type ON crm_pages(page_type);

-- RLS
ALTER TABLE crm_pages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view own pages"
  ON crm_pages FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can insert own pages"
  ON crm_pages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can update own pages"
  ON crm_pages FOR UPDATE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can delete own pages"
  ON crm_pages FOR DELETE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_crm_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crm_pages_updated_at ON crm_pages;
CREATE TRIGGER crm_pages_updated_at
  BEFORE UPDATE ON crm_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_pages_updated_at();

COMMENT ON TABLE crm_pages IS 'Stores landing pages and sales pages for CRM tracking';
COMMENT ON COLUMN crm_pages.page_type IS 'Type of page: landing, sales, thank_you, checkout, other';
COMMENT ON COLUMN crm_pages.generated_copy IS 'Optional storage for AI-generated copy (headline, body, CTA)';
