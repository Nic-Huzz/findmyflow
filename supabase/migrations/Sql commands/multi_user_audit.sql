-- =============================================
-- MULTI-USER DATA AUDIT
-- Shows all data for specified email addresses
-- =============================================

DO $$
DECLARE
  target_emails TEXT[] := ARRAY['contact@headsetrentalbali.com', 'nichurrell@icloud.com', 'nichurrell@me.com'];
  email TEXT;
  user_id UUID;
  row_count INTEGER;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'MULTI-USER DATA AUDIT';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';

  FOREACH email IN ARRAY target_emails
  LOOP
    -- Get user ID for this email
    SELECT id INTO user_id FROM auth.users WHERE auth.users.email = email;

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'EMAIL: %', email;

    IF user_id IS NULL THEN
      RAISE NOTICE 'STATUS: User NOT FOUND in auth.users';
      RAISE NOTICE '==========================================';
      RAISE NOTICE '';
      CONTINUE;
    END IF;

    RAISE NOTICE 'USER ID: %', user_id;
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- CORE TABLES
    RAISE NOTICE '--- CORE TABLES ---';

    SELECT COUNT(*) INTO row_count FROM user_stage_progress WHERE user_stage_progress.user_id = user_id;
    RAISE NOTICE 'user_stage_progress: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM user_projects WHERE user_projects.user_id = user_id;
    RAISE NOTICE 'user_projects: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM flow_sessions WHERE flow_sessions.user_id = user_id;
    RAISE NOTICE 'flow_sessions: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM flow_entries WHERE flow_entries.user_id = user_id;
    RAISE NOTICE 'flow_entries: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM milestone_completions WHERE milestone_completions.user_id = user_id;
    RAISE NOTICE 'milestone_completions: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM quest_completions WHERE quest_completions.user_id = user_id;
    RAISE NOTICE 'quest_completions: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM challenge_instances WHERE challenge_instances.user_id = user_id;
    RAISE NOTICE 'challenge_instances: % rows', row_count;

    BEGIN
      SELECT COUNT(*) INTO row_count FROM groan_reflections WHERE groan_reflections.user_id = user_id;
      RAISE NOTICE 'groan_reflections: % rows', row_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'groan_reflections: table does not exist';
    END;

    RAISE NOTICE '';

    -- FLOW DATA
    RAISE NOTICE '--- FLOW DATA ---';

    SELECT COUNT(*) INTO row_count FROM nikigai_clusters WHERE nikigai_clusters.user_id = user_id;
    RAISE NOTICE 'nikigai_clusters: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM nikigai_responses WHERE nikigai_responses.user_id = user_id;
    RAISE NOTICE 'nikigai_responses: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM nikigai_key_outcomes WHERE nikigai_key_outcomes.user_id = user_id;
    RAISE NOTICE 'nikigai_key_outcomes: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM persona_profiles WHERE persona_profiles.user_id = user_id;
    RAISE NOTICE 'persona_profiles: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM nervous_system_responses WHERE nervous_system_responses.user_id = user_id;
    RAISE NOTICE 'nervous_system_responses: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM healing_compass_responses WHERE healing_compass_responses.user_id = user_id;
    RAISE NOTICE 'healing_compass_responses: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM lead_flow_profiles WHERE lead_flow_profiles.user_id = user_id;
    RAISE NOTICE 'lead_flow_profiles: % rows', row_count;

    RAISE NOTICE '';

    -- ASSESSMENTS
    RAISE NOTICE '--- ASSESSMENTS ---';

    SELECT COUNT(*) INTO row_count FROM attraction_offer_assessments WHERE attraction_offer_assessments.user_id = user_id;
    RAISE NOTICE 'attraction_offer_assessments: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM upsell_assessments WHERE upsell_assessments.user_id = user_id;
    RAISE NOTICE 'upsell_assessments: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM downsell_assessments WHERE downsell_assessments.user_id = user_id;
    RAISE NOTICE 'downsell_assessments: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM continuity_assessments WHERE continuity_assessments.user_id = user_id;
    RAISE NOTICE 'continuity_assessments: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM leads_assessments WHERE leads_assessments.user_id = user_id;
    RAISE NOTICE 'leads_assessments: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM lead_magnet_assessments WHERE lead_magnet_assessments.user_id = user_id;
    RAISE NOTICE 'lead_magnet_assessments: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM offer_builder_assessments WHERE offer_builder_assessments.user_id = user_id;
    RAISE NOTICE 'offer_builder_assessments: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM funnel_metrics WHERE funnel_metrics.user_id = user_id;
    RAISE NOTICE 'funnel_metrics: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM zarlo_conversations WHERE zarlo_conversations.user_id = user_id;
    RAISE NOTICE 'zarlo_conversations: % rows', row_count;

    RAISE NOTICE '';

    -- CRM TABLES
    RAISE NOTICE '--- CRM TABLES ---';

    SELECT COUNT(*) INTO row_count FROM crm_pages WHERE crm_pages.user_id = user_id;
    RAISE NOTICE 'crm_pages: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM crm_contacts WHERE crm_contacts.user_id = user_id;
    RAISE NOTICE 'crm_contacts: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM crm_email_sequences WHERE crm_email_sequences.user_id = user_id;
    RAISE NOTICE 'crm_email_sequences: % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM crm_warm_leads WHERE crm_warm_leads.user_id = user_id;
    RAISE NOTICE 'crm_warm_leads: % rows', row_count;

    RAISE NOTICE '';

    -- GROAN MATRIX
    RAISE NOTICE '--- GROAN MATRIX ---';

    SELECT COUNT(*) INTO row_count FROM groan_challenges WHERE groan_challenges.user_id = user_id;
    RAISE NOTICE 'groan_challenges: % rows', row_count;

    BEGIN
      SELECT COUNT(*) INTO row_count FROM groan_proof WHERE groan_proof.user_id = user_id;
      RAISE NOTICE 'groan_proof: % rows', row_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'groan_proof: table does not exist';
    END;

    BEGIN
      SELECT COUNT(*) INTO row_count FROM groan_contract_evidence WHERE groan_contract_evidence.user_id = user_id;
      RAISE NOTICE 'groan_contract_evidence: % rows', row_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'groan_contract_evidence: table does not exist';
    END;

    BEGIN
      SELECT COUNT(*) INTO row_count FROM groan_outcomes WHERE groan_outcomes.user_id = user_id;
      RAISE NOTICE 'groan_outcomes: % rows', row_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'groan_outcomes: table does not exist';
    END;

    BEGIN
      SELECT COUNT(*) INTO row_count FROM groan_streaks WHERE groan_streaks.user_id = user_id;
      RAISE NOTICE 'groan_streaks: % rows', row_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'groan_streaks: table does not exist';
    END;

    BEGIN
      SELECT COUNT(*) INTO row_count FROM groan_user_preferences WHERE groan_user_preferences.user_id = user_id;
      RAISE NOTICE 'groan_user_preferences: % rows', row_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'groan_user_preferences: table does not exist';
    END;

    RAISE NOTICE '';

    -- VALIDATION SYSTEM
    RAISE NOTICE '--- VALIDATION SYSTEM ---';

    SELECT COUNT(*) INTO row_count FROM validation_flows WHERE creator_user_id = user_id;
    RAISE NOTICE 'validation_flows (as creator): % rows', row_count;

    SELECT COUNT(*) INTO row_count FROM validation_analysis WHERE validation_analysis.user_id = user_id;
    RAISE NOTICE 'validation_analysis: % rows', row_count;

    SELECT COUNT(*) INTO row_count
    FROM validation_sessions vs
    WHERE vs.flow_id IN (SELECT id FROM validation_flows WHERE creator_user_id = user_id);
    RAISE NOTICE 'validation_sessions (from their flows): % rows', row_count;

    SELECT COUNT(*) INTO row_count
    FROM validation_responses vr
    WHERE vr.flow_id IN (SELECT id FROM validation_flows WHERE creator_user_id = user_id);
    RAISE NOTICE 'validation_responses (from their flows): % rows', row_count;

    RAISE NOTICE '';
    RAISE NOTICE '';

  END LOOP;

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'AUDIT COMPLETE';
  RAISE NOTICE '==========================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during audit: %', SQLERRM;
    RAISE NOTICE 'Some tables may not exist or may have different column names';
END $$;


-- =============================================
-- QUICK SUMMARY VIEW
-- =============================================
SELECT
  u.email,
  u.id as user_id,
  u.created_at,
  u.last_sign_in_at,
  (SELECT COUNT(*) FROM user_projects WHERE user_id = u.id) as projects,
  (SELECT COUNT(*) FROM flow_sessions WHERE user_id = u.id) as flow_sessions,
  (SELECT COUNT(*) FROM nikigai_clusters WHERE user_id = u.id) as nikigai_clusters,
  (SELECT COUNT(*) FROM validation_flows WHERE creator_user_id = u.id) as validation_flows
FROM auth.users u
WHERE u.email IN ('contact@headsetrentalbali.com', 'nichurrell@icloud.com', 'nichurrell@me.com')
ORDER BY u.created_at;
