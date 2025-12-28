-- Delete test user: contact@headsetrentalbali.com
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'contact@headsetrentalbali.com';

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User not found in auth.users';
  ELSE
    RAISE NOTICE 'Deleting user: %', target_user_id;

    -- Delete from all user-related tables
    DELETE FROM groan_reflections WHERE user_id = target_user_id;
    DELETE FROM quest_completions WHERE user_id = target_user_id;
    DELETE FROM milestone_completions WHERE user_id = target_user_id;
    DELETE FROM challenge_progress WHERE user_id = target_user_id;
    DELETE FROM challenge_participants WHERE user_id = target_user_id;
    DELETE FROM flow_sessions WHERE user_id = target_user_id;
    DELETE FROM nikigai_clusters WHERE user_id = target_user_id;
    DELETE FROM nikigai_responses WHERE user_id = target_user_id;
    DELETE FROM nikigai_key_outcomes WHERE user_id = target_user_id;
    DELETE FROM persona_profiles WHERE user_id = target_user_id;
    DELETE FROM nervous_system_responses WHERE user_id = target_user_id;
    DELETE FROM healing_compass_responses WHERE user_id = target_user_id;
    DELETE FROM validation_flows WHERE creator_user_id = target_user_id;
    DELETE FROM attraction_offer_assessments WHERE user_id = target_user_id;
    DELETE FROM upsell_assessments WHERE user_id = target_user_id;
    DELETE FROM downsell_assessments WHERE user_id = target_user_id;
    DELETE FROM continuity_assessments WHERE user_id = target_user_id;
    DELETE FROM leads_assessments WHERE user_id = target_user_id;
    DELETE FROM lead_magnet_assessments WHERE user_id = target_user_id;
    DELETE FROM user_projects WHERE user_id = target_user_id;
    DELETE FROM flow_entries WHERE user_id = target_user_id;
    DELETE FROM conversation_logs WHERE user_id = target_user_id;
    DELETE FROM push_subscriptions WHERE user_id = target_user_id;
    DELETE FROM user_stage_progress WHERE user_id = target_user_id;
    DELETE FROM profiles WHERE id = target_user_id;

    -- Delete the auth user
    DELETE FROM auth.users WHERE id = target_user_id;

    RAISE NOTICE 'Auth user deleted';
  END IF;
END $$;

-- Delete from lead_flow_profiles (uses email, not user_id)
DELETE FROM lead_flow_profiles WHERE email = 'contact@headsetrentalbali.com';

SELECT 'User contact@headsetrentalbali.com fully deleted' as status;
