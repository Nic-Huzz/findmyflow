-- CEO Dogfood Setup: Huzz as User #1 of FindMyFlow CRM
-- Projects already exist in Supabase - this only sets up:
--   1. Monthly revenue goal (moonshot pace)
--   2. Gamification stats initialization
--   3. Time-sensitive deals in pipeline
--
-- Usage: Replace REPLACE_WITH_USER_ID with actual auth.users UUID, then push

DO $$
DECLARE
  v_user_id uuid := '4259174e-b7b5-4c35-a354-7287dd19ca43';
BEGIN

-- ============================================
-- STEP 1: Set monthly revenue goal + init gamification
-- ============================================

INSERT INTO user_crm_stats (user_id, total_points, current_streak, longest_streak, monthly_revenue_goal)
VALUES (v_user_id, 0, 0, 0, 83333)
ON CONFLICT (user_id) DO UPDATE SET
  monthly_revenue_goal = 83333,
  updated_at = now();

-- Monthly goal = 83,333 (1M/year moonshot / 12 months)

-- ============================================
-- STEP 2: Seed time-sensitive deals
-- ============================================

-- Ramon prototype (deadline deal)
INSERT INTO sales_deals (user_id, contact_name, source, product_type, value, status, probability, expected_close_date, notes)
SELECT v_user_id, 'Ramon', 'referral', 'Book-to-App Prototype', 0, 'delivering', 100,
  (CURRENT_DATE + INTERVAL '20 days')::date,
  'Book-to-app prototype. Significant work remaining. ~20 day deadline.'
WHERE NOT EXISTS (
  SELECT 1 FROM sales_deals WHERE user_id = v_user_id AND contact_name = 'Ramon' AND status != 'completed'
);

-- Creel engagement (upcoming client)
INSERT INTO sales_deals (user_id, contact_name, source, product_type, value, status, probability, notes)
SELECT v_user_id, 'Creel', 'referral', 'BuildwithAI + Farm Product Dev', 0, 'booked', 40,
  '1 day/week paid engagement. Deliver BuildwithAI programs + support farm product development.'
WHERE NOT EXISTS (
  SELECT 1 FROM sales_deals WHERE user_id = v_user_id AND contact_name = 'Creel' AND status != 'completed'
);

END $$;
