-- Essence Avatar: figurine storage + memory table
-- Migration: 20260619_essence_avatar

-- 1. Figurine image column on lead_flow_profiles
ALTER TABLE lead_flow_profiles
  ADD COLUMN IF NOT EXISTS custom_essence_figurine TEXT;

-- 2. Compounding memory table
CREATE TABLE IF NOT EXISTS essence_avatar_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'pattern', 'correction', 'insight', 'milestone', 'fear', 'breakthrough'
  )),
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'conversation' CHECK (source IN (
    'conversation', 'mystery_box', 'observation', 'system'
  )),
  confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  superseded_by UUID REFERENCES essence_avatar_memory(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avatar_memory_user ON essence_avatar_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_memory_active ON essence_avatar_memory(user_id, memory_type)
  WHERE deleted_at IS NULL AND superseded_by IS NULL;

-- 3. RLS
ALTER TABLE essence_avatar_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own memories" ON essence_avatar_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own memories" ON essence_avatar_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own memories" ON essence_avatar_memory
  FOR UPDATE USING (auth.uid() = user_id);
