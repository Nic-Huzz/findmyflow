-- =============================================
-- USER DATA AUDIT
-- Shows all data associated with nichurrell@icloud.com
-- =============================================

DO $$
DECLARE
  target_user_id UUID;
  target_email TEXT := 'nichurrell@icloud.com';
  row_count INTEGER;
BEGIN
  -- Get user ID
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found', target_email;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATA AUDIT FOR: %', target_email;
  RAISE NOTICE 'User ID: %', target_user_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- =============================================
  -- CORE TABLES
  -- =============================================
  RAISE NOTICE '--- CORE TABLES ---';

  SELECT COUNT(*) INTO row_count FROM user_stage_progress WHERE user_id = target_user_id;
  RAISE NOTICE 'user_stage_progress: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM user_projects WHERE user_id = target_user_id;
  RAISE NOTICE 'user_projects: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM flow_sessions WHERE user_id = target_user_id;
  RAISE NOTICE 'flow_sessions: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM flow_entries WHERE user_id = target_user_id;
  RAISE NOTICE 'flow_entries: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM milestone_completions WHERE user_id = target_user_id;
  RAISE NOTICE 'milestone_completions: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM quest_completions WHERE user_id = target_user_id;
  RAISE NOTICE 'quest_completions: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM challenge_instances WHERE user_id = target_user_id;
  RAISE NOTICE 'challenge_instances: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM groan_reflections WHERE user_id = target_user_id;
  RAISE NOTICE 'groan_reflections: % rows', row_count;

  RAISE NOTICE '';

  -- =============================================
  -- FLOW DATA
  -- =============================================
  RAISE NOTICE '--- FLOW DATA ---';

  SELECT COUNT(*) INTO row_count FROM nikigai_clusters WHERE user_id = target_user_id;
  RAISE NOTICE 'nikigai_clusters: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM nikigai_responses WHERE user_id = target_user_id;
  RAISE NOTICE 'nikigai_responses: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM nikigai_key_outcomes WHERE user_id = target_user_id;
  RAISE NOTICE 'nikigai_key_outcomes: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM persona_profiles WHERE user_id = target_user_id;
  RAISE NOTICE 'persona_profiles: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM nervous_system_responses WHERE user_id = target_user_id;
  RAISE NOTICE 'nervous_system_responses: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM healing_compass_responses WHERE user_id = target_user_id;
  RAISE NOTICE 'healing_compass_responses: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM lead_flow_profiles WHERE user_id = target_user_id;
  RAISE NOTICE 'lead_flow_profiles: % rows', row_count;

  RAISE NOTICE '';

  -- =============================================
  -- ASSESSMENTS
  -- =============================================
  RAISE NOTICE '--- ASSESSMENTS ---';

  SELECT COUNT(*) INTO row_count FROM attraction_offer_assessments WHERE user_id = target_user_id;
  RAISE NOTICE 'attraction_offer_assessments: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM upsell_assessments WHERE user_id = target_user_id;
  RAISE NOTICE 'upsell_assessments: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM downsell_assessments WHERE user_id = target_user_id;
  RAISE NOTICE 'downsell_assessments: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM continuity_assessments WHERE user_id = target_user_id;
  RAISE NOTICE 'continuity_assessments: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM leads_assessments WHERE user_id = target_user_id;
  RAISE NOTICE 'leads_assessments: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM lead_magnet_assessments WHERE user_id = target_user_id;
  RAISE NOTICE 'lead_magnet_assessments: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM offer_builder_assessments WHERE user_id = target_user_id;
  RAISE NOTICE 'offer_builder_assessments: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM funnel_metrics WHERE user_id = target_user_id;
  RAISE NOTICE 'funnel_metrics: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM zarlo_conversations WHERE user_id = target_user_id;
  RAISE NOTICE 'zarlo_conversations: % rows', row_count;

  RAISE NOTICE '';

  -- =============================================
  -- CRM TABLES
  -- =============================================
  RAISE NOTICE '--- CRM TABLES ---';

  SELECT COUNT(*) INTO row_count FROM crm_pages WHERE user_id = target_user_id;
  RAISE NOTICE 'crm_pages: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM crm_contacts WHERE user_id = target_user_id;
  RAISE NOTICE 'crm_contacts: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM crm_email_sequences WHERE user_id = target_user_id;
  RAISE NOTICE 'crm_email_sequences: % rows', row_count;

  -- crm_warm_leads merged into crm_contacts (outreach_status IS NOT NULL = warm lead)
  SELECT COUNT(*) INTO row_count FROM crm_contacts WHERE user_id = target_user_id AND outreach_status IS NOT NULL;
  RAISE NOTICE 'crm_contacts (outreach): % rows', row_count;

  RAISE NOTICE '';

  -- =============================================
  -- GROAN MATRIX
  -- =============================================
  RAISE NOTICE '--- GROAN MATRIX ---';

  SELECT COUNT(*) INTO row_count FROM groan_challenges WHERE user_id = target_user_id;
  RAISE NOTICE 'groan_challenges: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM groan_proof WHERE user_id = target_user_id;
  RAISE NOTICE 'groan_proof: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM groan_contract_evidence WHERE user_id = target_user_id;
  RAISE NOTICE 'groan_contract_evidence: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM groan_outcomes WHERE user_id = target_user_id;
  RAISE NOTICE 'groan_outcomes: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM groan_streaks WHERE user_id = target_user_id;
  RAISE NOTICE 'groan_streaks: % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM groan_user_preferences WHERE user_id = target_user_id;
  RAISE NOTICE 'groan_user_preferences: % rows', row_count;

  RAISE NOTICE '';

  -- =============================================
  -- VALIDATION SYSTEM
  -- =============================================
  RAISE NOTICE '--- VALIDATION SYSTEM ---';

  SELECT COUNT(*) INTO row_count FROM validation_flows WHERE creator_user_id = target_user_id;
  RAISE NOTICE 'validation_flows (as creator): % rows', row_count;

  SELECT COUNT(*) INTO row_count FROM validation_analysis WHERE user_id = target_user_id;
  RAISE NOTICE 'validation_analysis: % rows', row_count;

  -- Count sessions and responses for this user's flows
  SELECT COUNT(*) INTO row_count
  FROM validation_sessions vs
  WHERE vs.flow_id IN (SELECT id FROM validation_flows WHERE creator_user_id = target_user_id);
  RAISE NOTICE 'validation_sessions (from their flows): % rows', row_count;

  SELECT COUNT(*) INTO row_count
  FROM validation_responses vr
  WHERE vr.flow_id IN (SELECT id FROM validation_flows WHERE creator_user_id = target_user_id);
  RAISE NOTICE 'validation_responses (from their flows): % rows', row_count;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AUDIT COMPLETE';
  RAISE NOTICE '========================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during audit: %', SQLERRM;
    RAISE NOTICE 'Some tables may not exist or may have different column names';
END $$;
