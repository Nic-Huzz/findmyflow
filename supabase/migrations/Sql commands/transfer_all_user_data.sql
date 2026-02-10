-- =============================================
-- TRANSFER ALL USER DATA
-- From: nichurrell@icloud.com
-- To: huzz@nichuzz.com
-- =============================================
-- IMPORTANT: This transfers ALL data, not just validation flows
-- Review the audit results first before running this!
-- =============================================

-- Step 1: Preview what will be transferred
DO $$
DECLARE
  old_user_id UUID;
  new_user_id UUID;
  old_email TEXT := 'nichurrell@icloud.com';
  new_email TEXT := 'huzz@nichuzz.com';
BEGIN
  SELECT id INTO old_user_id FROM auth.users WHERE email = old_email;
  SELECT id INTO new_user_id FROM auth.users WHERE email = new_email;

  IF old_user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found', old_email;
  END IF;

  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found', new_email;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'TRANSFER PREVIEW';
  RAISE NOTICE 'FROM: % (%)', old_email, old_user_id;
  RAISE NOTICE 'TO:   % (%)', new_email, new_user_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'To execute the transfer:';
  RAISE NOTICE '1. Review the counts above';
  RAISE NOTICE '2. Uncomment the TRANSFER section below';
  RAISE NOTICE '3. Re-run this script';
  RAISE NOTICE '';
END $$;

-- Step 2: TRANSFER ALL DATA
-- ⚠️ UNCOMMENT THE ENTIRE DO BLOCK BELOW TO EXECUTE ⚠️

/*
DO $$
DECLARE
  old_user_id UUID;
  new_user_id UUID;
  old_email TEXT := 'nichurrell@icloud.com';
  new_email TEXT := 'huzz@nichuzz.com';
  updated_count INTEGER;
BEGIN
  -- Get user IDs
  SELECT id INTO old_user_id FROM auth.users WHERE email = old_email;
  SELECT id INTO new_user_id FROM auth.users WHERE email = new_email;

  RAISE NOTICE 'Starting transfer from % to %', old_email, new_email;
  RAISE NOTICE '';

  -- =============================================
  -- CORE TABLES
  -- =============================================
  RAISE NOTICE '--- Transferring Core Tables ---';

  UPDATE user_stage_progress SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'user_stage_progress: % rows', updated_count;

  UPDATE user_projects SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'user_projects: % rows', updated_count;

  UPDATE flow_sessions SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'flow_sessions: % rows', updated_count;

  UPDATE flow_entries SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'flow_entries: % rows', updated_count;

  UPDATE milestone_completions SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'milestone_completions: % rows', updated_count;

  UPDATE quest_completions SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'quest_completions: % rows', updated_count;

  UPDATE challenge_instances SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'challenge_instances: % rows', updated_count;

  UPDATE groan_reflections SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'groan_reflections: % rows', updated_count;

  -- =============================================
  -- FLOW DATA
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE '--- Transferring Flow Data ---';

  UPDATE nikigai_clusters SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'nikigai_clusters: % rows', updated_count;

  UPDATE nikigai_responses SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'nikigai_responses: % rows', updated_count;

  UPDATE nikigai_key_outcomes SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'nikigai_key_outcomes: % rows', updated_count;

  UPDATE persona_profiles SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'persona_profiles: % rows', updated_count;

  UPDATE nervous_system_responses SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'nervous_system_responses: % rows', updated_count;

  UPDATE healing_compass_responses SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'healing_compass_responses: % rows', updated_count;

  UPDATE lead_flow_profiles SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'lead_flow_profiles: % rows', updated_count;

  -- =============================================
  -- ASSESSMENTS
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE '--- Transferring Assessments ---';

  UPDATE attraction_offer_assessments SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'attraction_offer_assessments: % rows', updated_count;

  UPDATE upsell_assessments SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'upsell_assessments: % rows', updated_count;

  UPDATE downsell_assessments SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'downsell_assessments: % rows', updated_count;

  UPDATE continuity_assessments SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'continuity_assessments: % rows', updated_count;

  UPDATE leads_assessments SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'leads_assessments: % rows', updated_count;

  UPDATE lead_magnet_assessments SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'lead_magnet_assessments: % rows', updated_count;

  UPDATE offer_builder_assessments SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'offer_builder_assessments: % rows', updated_count;

  UPDATE funnel_metrics SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'funnel_metrics: % rows', updated_count;

  UPDATE zarlo_conversations SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'zarlo_conversations: % rows', updated_count;

  -- =============================================
  -- CRM TABLES
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE '--- Transferring CRM Data ---';

  UPDATE crm_pages SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'crm_pages: % rows', updated_count;

  UPDATE crm_contacts SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'crm_contacts: % rows', updated_count;

  UPDATE crm_email_sequences SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'crm_email_sequences: % rows', updated_count;

  -- crm_warm_leads merged into crm_contacts (outreach fields now on crm_contacts)
  -- No separate transfer needed

  -- =============================================
  -- GROAN MATRIX
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE '--- Transferring Groan Matrix ---';

  UPDATE groan_challenges SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'groan_challenges: % rows', updated_count;

  UPDATE groan_proof SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'groan_proof: % rows', updated_count;

  UPDATE groan_contract_evidence SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'groan_contract_evidence: % rows', updated_count;

  UPDATE groan_outcomes SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'groan_outcomes: % rows', updated_count;

  UPDATE groan_streaks SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'groan_streaks: % rows', updated_count;

  UPDATE groan_user_preferences SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'groan_user_preferences: % rows', updated_count;

  -- =============================================
  -- VALIDATION SYSTEM
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE '--- Transferring Validation System ---';

  UPDATE validation_flows SET creator_user_id = new_user_id, updated_at = NOW() WHERE creator_user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'validation_flows: % rows', updated_count;

  UPDATE validation_analysis SET user_id = new_user_id WHERE user_id = old_user_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'validation_analysis: % rows', updated_count;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TRANSFER COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Run the verification queries below to confirm.';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Transfer failed: %', SQLERRM;
    ROLLBACK;
END $$;
*/

-- Step 3: Verification Queries
-- Run these after the transfer completes

/*
-- Verify old user has no data left
SELECT
  'Old user remaining data check' as check_type,
  COUNT(*) as total_rows
FROM (
  SELECT user_id FROM user_stage_progress WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'nichurrell@icloud.com')
  UNION ALL
  SELECT user_id FROM user_projects WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'nichurrell@icloud.com')
  UNION ALL
  SELECT creator_user_id FROM validation_flows WHERE creator_user_id IN (SELECT id FROM auth.users WHERE email = 'nichurrell@icloud.com')
) as remaining;
-- Should return 0

-- Verify new user has the data
SELECT
  'New user data check' as check_type,
  COUNT(*) as total_rows
FROM (
  SELECT user_id FROM user_stage_progress WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'huzz@nichuzz.com')
  UNION ALL
  SELECT user_id FROM user_projects WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'huzz@nichuzz.com')
  UNION ALL
  SELECT creator_user_id FROM validation_flows WHERE creator_user_id IN (SELECT id FROM auth.users WHERE email = 'huzz@nichuzz.com')
) as transferred;
-- Should show the transferred data count
*/
