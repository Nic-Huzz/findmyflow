-- =============================================
-- DELETE ALL USER DATA FOR TEST ACCOUNTS
-- Keeps auth.users entries so accounts can still log in
-- =============================================

-- Target emails to wipe (keeping contact@headsetrentalbali.com for legacy testing)
-- nichurrell@icloud.com
-- nichurrell@me.com

DO $$
DECLARE
  target_user_ids UUID[];
  uid UUID;
  total_deleted INTEGER := 0;
  row_count INTEGER;
BEGIN
  -- Get user IDs
  SELECT ARRAY_AGG(id) INTO target_user_ids
  FROM auth.users
  WHERE email IN ('nichurrell@icloud.com', 'nichurrell@me.com');

  IF target_user_ids IS NULL OR array_length(target_user_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No users found with the specified emails';
  END IF;

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'DELETING DATA FOR % USERS', array_length(target_user_ids, 1);
  RAISE NOTICE 'User IDs: %', target_user_ids;
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';

  -- =============================================
  -- VALIDATION SYSTEM (delete in order due to FK constraints)
  -- =============================================
  RAISE NOTICE '--- VALIDATION SYSTEM ---';

  BEGIN
    DELETE FROM validation_responses WHERE flow_id IN (
      SELECT id FROM validation_flows WHERE creator_user_id = ANY(target_user_ids)
    );
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'validation_responses: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'validation_responses: table does not exist';
  END;

  BEGIN
    DELETE FROM validation_sessions WHERE flow_id IN (
      SELECT id FROM validation_flows WHERE creator_user_id = ANY(target_user_ids)
    );
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'validation_sessions: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'validation_sessions: table does not exist';
  END;

  BEGIN
    DELETE FROM validation_analysis WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'validation_analysis: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'validation_analysis: table does not exist';
  END;

  BEGIN
    DELETE FROM validation_flows WHERE creator_user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'validation_flows: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'validation_flows: table does not exist';
  END;

  RAISE NOTICE '';

  -- =============================================
  -- GROAN MATRIX
  -- =============================================
  RAISE NOTICE '--- GROAN MATRIX ---';

  BEGIN
    DELETE FROM groan_outcomes WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'groan_outcomes: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'groan_outcomes: table does not exist';
  END;

  BEGIN
    DELETE FROM groan_proof WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'groan_proof: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'groan_proof: table does not exist';
  END;

  BEGIN
    DELETE FROM groan_contract_evidence WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'groan_contract_evidence: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'groan_contract_evidence: table does not exist';
  END;

  BEGIN
    DELETE FROM groan_streaks WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'groan_streaks: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'groan_streaks: table does not exist';
  END;

  BEGIN
    DELETE FROM groan_user_preferences WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'groan_user_preferences: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'groan_user_preferences: table does not exist';
  END;

  BEGIN
    DELETE FROM groan_challenges WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'groan_challenges: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'groan_challenges: table does not exist';
  END;

  BEGIN
    DELETE FROM groan_reflections WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'groan_reflections: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'groan_reflections: table does not exist';
  END;

  RAISE NOTICE '';

  -- =============================================
  -- CRM TABLES
  -- =============================================
  RAISE NOTICE '--- CRM TABLES ---';

  BEGIN
    DELETE FROM crm_email_steps WHERE sequence_id IN (
      SELECT id FROM crm_email_sequences WHERE user_id = ANY(target_user_ids)
    );
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'crm_email_steps: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'crm_email_steps: table does not exist';
  END;

  BEGIN
    DELETE FROM crm_email_sequences WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'crm_email_sequences: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'crm_email_sequences: table does not exist';
  END;

  BEGIN
    DELETE FROM crm_pages WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'crm_pages: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'crm_pages: table does not exist';
  END;

  BEGIN
    DELETE FROM crm_contacts WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'crm_contacts: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'crm_contacts: table does not exist';
  END;

  BEGIN
    DELETE FROM crm_warm_leads_deprecated WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'crm_warm_leads_deprecated: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'crm_warm_leads_deprecated: table does not exist (already merged into crm_contacts)';
  END;

  RAISE NOTICE '';

  -- =============================================
  -- ASSESSMENTS
  -- =============================================
  RAISE NOTICE '--- ASSESSMENTS ---';

  BEGIN
    DELETE FROM attraction_offer_assessments WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'attraction_offer_assessments: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'attraction_offer_assessments: table does not exist';
  END;

  BEGIN
    DELETE FROM upsell_assessments WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'upsell_assessments: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'upsell_assessments: table does not exist';
  END;

  BEGIN
    DELETE FROM downsell_assessments WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'downsell_assessments: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'downsell_assessments: table does not exist';
  END;

  BEGIN
    DELETE FROM continuity_assessments WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'continuity_assessments: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'continuity_assessments: table does not exist';
  END;

  BEGIN
    DELETE FROM leads_assessments WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'leads_assessments: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'leads_assessments: table does not exist';
  END;

  BEGIN
    DELETE FROM lead_magnet_assessments WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'lead_magnet_assessments: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'lead_magnet_assessments: table does not exist';
  END;

  BEGIN
    DELETE FROM offer_builder_assessments WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'offer_builder_assessments: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'offer_builder_assessments: table does not exist';
  END;

  BEGIN
    DELETE FROM funnel_metrics WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'funnel_metrics: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'funnel_metrics: table does not exist';
  END;

  BEGIN
    DELETE FROM zarlo_conversations WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'zarlo_conversations: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'zarlo_conversations: table does not exist';
  END;

  RAISE NOTICE '';

  -- =============================================
  -- FLOW DATA
  -- =============================================
  RAISE NOTICE '--- FLOW DATA ---';

  BEGIN
    DELETE FROM nikigai_key_outcomes WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'nikigai_key_outcomes: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'nikigai_key_outcomes: table does not exist';
  END;

  BEGIN
    DELETE FROM nikigai_responses WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'nikigai_responses: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'nikigai_responses: table does not exist';
  END;

  BEGIN
    DELETE FROM nikigai_clusters WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'nikigai_clusters: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'nikigai_clusters: table does not exist';
  END;

  BEGIN
    DELETE FROM persona_profiles WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'persona_profiles: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'persona_profiles: table does not exist';
  END;

  BEGIN
    DELETE FROM nervous_system_responses WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'nervous_system_responses: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'nervous_system_responses: table does not exist';
  END;

  BEGIN
    DELETE FROM healing_compass_responses WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'healing_compass_responses: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'healing_compass_responses: table does not exist';
  END;

  BEGIN
    DELETE FROM lead_flow_profiles WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'lead_flow_profiles: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'lead_flow_profiles: table does not exist';
  END;

  RAISE NOTICE '';

  -- =============================================
  -- CORE TABLES
  -- =============================================
  RAISE NOTICE '--- CORE TABLES ---';

  -- Delete challenge_progress first (references user_projects via project_id)
  BEGIN
    DELETE FROM challenge_progress WHERE project_id IN (
      SELECT id FROM user_projects WHERE user_id = ANY(target_user_ids)
    );
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'challenge_progress (by project): % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'challenge_progress: table does not exist';
  END;

  -- Also try by user_id in case it has that column
  BEGIN
    DELETE FROM challenge_progress WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'challenge_progress (by user): % deleted', row_count;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    NULL; -- Already handled above or column doesn't exist
  END;

  BEGIN
    DELETE FROM quest_completions WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'quest_completions: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'quest_completions: table does not exist';
  END;

  BEGIN
    DELETE FROM milestone_completions WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'milestone_completions: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'milestone_completions: table does not exist';
  END;

  BEGIN
    DELETE FROM challenge_instances WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'challenge_instances: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'challenge_instances: table does not exist';
  END;

  BEGIN
    DELETE FROM flow_entries WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'flow_entries: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'flow_entries: table does not exist';
  END;

  BEGIN
    DELETE FROM flow_sessions WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'flow_sessions: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'flow_sessions: table does not exist';
  END;

  BEGIN
    DELETE FROM user_projects WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'user_projects: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'user_projects: table does not exist';
  END;

  BEGIN
    DELETE FROM user_stage_progress WHERE user_id = ANY(target_user_ids);
    GET DIAGNOSTICS row_count = ROW_COUNT;
    total_deleted := total_deleted + row_count;
    RAISE NOTICE 'user_stage_progress: % deleted', row_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'user_stage_progress: table does not exist';
  END;

  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'DELETION COMPLETE';
  RAISE NOTICE 'Total rows deleted: %', total_deleted;
  RAISE NOTICE '';
  RAISE NOTICE 'Auth accounts preserved - users can still log in';
  RAISE NOTICE '==========================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during deletion: %', SQLERRM;
    RAISE;
END $$;


-- =============================================
-- VERIFY DELETION
-- =============================================
SELECT
  u.email,
  u.id as user_id,
  u.created_at,
  'Auth account preserved - ready for testing' as status
FROM auth.users u
WHERE u.email IN ('nichurrell@icloud.com', 'nichurrell@me.com')
ORDER BY u.email;
