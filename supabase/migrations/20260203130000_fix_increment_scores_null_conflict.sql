-- Fix for increment_scores RPC NULL project_id handling
-- The ON CONFLICT clause doesn't work with partial unique indexes
-- This replaces the INSERT ... ON CONFLICT with explicit existence checks
-- Also adds optional p_week_start parameter to handle timezone differences
--
-- Created: February 3, 2025

-- First, drop the old function signature to avoid overloading conflicts
DROP FUNCTION IF EXISTS increment_scores(UUID, UUID, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION increment_scores(
  p_user_id UUID,
  p_project_id UUID,
  p_category TEXT,  -- 'business', 'healing', or 'courage'
  p_points INTEGER,
  p_week_start DATE DEFAULT NULL  -- Optional: client-provided week start for timezone consistency
)
RETURNS JSON AS $$
DECLARE
  v_week_start DATE;
  v_weekly_record challenge_weekly_scores%ROWTYPE;
  v_lifetime_record user_lifetime_scores%ROWTYPE;
  v_weekly_exists BOOLEAN;
  v_lifetime_exists BOOLEAN;
BEGIN
  -- Use client-provided week start if available, otherwise calculate server-side
  IF p_week_start IS NOT NULL THEN
    v_week_start := p_week_start;
  ELSE
    -- Calculate Monday of current week (ISO week starts on Monday)
    v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  END IF;

  -- ========================================
  -- Update Weekly Scores
  -- ========================================

  -- Check if weekly record exists (handles NULL project_id correctly)
  SELECT EXISTS (
    SELECT 1 FROM challenge_weekly_scores
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
      AND week_start_date = v_week_start
  ) INTO v_weekly_exists;

  -- Insert if not exists
  IF NOT v_weekly_exists THEN
    INSERT INTO challenge_weekly_scores (user_id, project_id, week_start_date, business_score, healing_score, courage_score)
    VALUES (p_user_id, p_project_id, v_week_start, 0, 0, 0);
  END IF;

  -- Update the appropriate category
  IF p_category = 'business' THEN
    UPDATE challenge_weekly_scores
    SET business_score = business_score + p_points, updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
      AND week_start_date = v_week_start
    RETURNING * INTO v_weekly_record;
  ELSIF p_category = 'healing' THEN
    UPDATE challenge_weekly_scores
    SET healing_score = healing_score + p_points, updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
      AND week_start_date = v_week_start
    RETURNING * INTO v_weekly_record;
  ELSIF p_category = 'courage' THEN
    UPDATE challenge_weekly_scores
    SET courage_score = courage_score + p_points, updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
      AND week_start_date = v_week_start
    RETURNING * INTO v_weekly_record;
  ELSE
    RAISE EXCEPTION 'Invalid category: %. Must be business, healing, or courage', p_category;
  END IF;

  -- ========================================
  -- Update Lifetime Scores
  -- ========================================

  -- Check if lifetime record exists (handles NULL project_id correctly)
  SELECT EXISTS (
    SELECT 1 FROM user_lifetime_scores
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
  ) INTO v_lifetime_exists;

  -- Insert if not exists
  IF NOT v_lifetime_exists THEN
    INSERT INTO user_lifetime_scores (user_id, project_id)
    VALUES (p_user_id, p_project_id);
  END IF;

  -- Update lifetime totals
  IF p_category = 'business' THEN
    UPDATE user_lifetime_scores
    SET lifetime_business_score = lifetime_business_score + p_points,
        lifetime_total_score = lifetime_total_score + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
    RETURNING * INTO v_lifetime_record;
  ELSIF p_category = 'healing' THEN
    UPDATE user_lifetime_scores
    SET lifetime_healing_score = lifetime_healing_score + p_points,
        lifetime_total_score = lifetime_total_score + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
    RETURNING * INTO v_lifetime_record;
  ELSIF p_category = 'courage' THEN
    UPDATE user_lifetime_scores
    SET lifetime_courage_score = lifetime_courage_score + p_points,
        lifetime_total_score = lifetime_total_score + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND (project_id = p_project_id OR (project_id IS NULL AND p_project_id IS NULL))
    RETURNING * INTO v_lifetime_record;
  END IF;

  -- Return the updated scores
  RETURN json_build_object(
    'weekly', json_build_object(
      'business_score', COALESCE(v_weekly_record.business_score, 0),
      'healing_score', COALESCE(v_weekly_record.healing_score, 0),
      'courage_score', COALESCE(v_weekly_record.courage_score, 0),
      'total', COALESCE(v_weekly_record.business_score, 0) + COALESCE(v_weekly_record.healing_score, 0) + COALESCE(v_weekly_record.courage_score, 0)
    ),
    'lifetime', json_build_object(
      'business_score', COALESCE(v_lifetime_record.lifetime_business_score, 0),
      'healing_score', COALESCE(v_lifetime_record.lifetime_healing_score, 0),
      'courage_score', COALESCE(v_lifetime_record.lifetime_courage_score, 0),
      'total', COALESCE(v_lifetime_record.lifetime_total_score, 0)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION increment_scores IS 'Atomically increments both weekly and lifetime scores for a category. Fixed to handle NULL project_id correctly. Returns updated scores as JSON.';
