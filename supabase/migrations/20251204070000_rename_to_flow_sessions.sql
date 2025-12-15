-- ============================================================================
-- Migration: Rename nikigai_sessions to flow_sessions
-- Purpose: Accurate naming for general flow tracking (not just Nikigai)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Rename the table
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.nikigai_sessions
RENAME TO flow_sessions;

-- ----------------------------------------------------------------------------
-- Step 2: Rename indexes to match new table name
-- ----------------------------------------------------------------------------
-- Primary indexes
ALTER INDEX IF EXISTS nikigai_sessions_pkey
RENAME TO flow_sessions_pkey;

ALTER INDEX IF EXISTS idx_nikigai_sessions_user_id
RENAME TO idx_flow_sessions_user_id;

-- Flow type indexes (from migration 20251130000000)
ALTER INDEX IF EXISTS idx_nikigai_sessions_flow_type
RENAME TO idx_flow_sessions_flow_type;

ALTER INDEX IF EXISTS idx_nikigai_sessions_user_flow_type
RENAME TO idx_flow_sessions_user_flow_type;

-- ----------------------------------------------------------------------------
-- Step 3: Update table comment for documentation
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.flow_sessions IS
'Tracks all assessment flow sessions (Nikigai, 100m Offer, Money Model, Lead Magnet, etc.).
Used by graduation checker to verify flow completions.';

-- ----------------------------------------------------------------------------
-- Step 4: Update flow_type column comment with all valid values
-- ----------------------------------------------------------------------------
COMMENT ON COLUMN public.flow_sessions.flow_type IS
'Flow type identifier for graduation tracking. Valid values:
- Nikigai pillars: nikigai_skills, nikigai_problems, nikigai_persona, nikigai_integration
- Vibe Riser: 100m_offer, lead_magnet_offer, validation_flow
- Movement Maker: acquisition_flow, upsell_flow, downsell_flow, continuity_flow, 100m_leads, 100m_money_model
- Legacy: nikigai (all-in-one v2.2 flow)';

-- ----------------------------------------------------------------------------
-- Step 5: Update foreign key references in other tables
-- ----------------------------------------------------------------------------
-- user_projects references flow_sessions via source_session_id
-- Foreign key constraints automatically follow table renames in PostgreSQL

-- ----------------------------------------------------------------------------
-- Verification query
-- ----------------------------------------------------------------------------
SELECT
  'flow_sessions' as table_name,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT flow_type) as unique_flow_types
FROM public.flow_sessions;
