-- =============================================
-- TRANSFER VALIDATION FLOW OWNERSHIP
-- From: nichurrell@icloud.com
-- To: huzz@nichuzz.com
-- =============================================

-- Step 1: Get the user IDs (for verification)
DO $$
DECLARE
  old_user_id UUID;
  new_user_id UUID;
  flows_count INTEGER;
  analysis_count INTEGER;
  flow_record RECORD;
BEGIN
  -- Get user IDs
  SELECT id INTO old_user_id FROM auth.users WHERE email = 'nichurrell@icloud.com';
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'huzz@nichuzz.com';

  -- Verify both users exist
  IF old_user_id IS NULL THEN
    RAISE EXCEPTION 'User nichurrell@icloud.com not found';
  END IF;

  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'User huzz@nichuzz.com not found';
  END IF;

  RAISE NOTICE 'Old User ID (nichurrell@icloud.com): %', old_user_id;
  RAISE NOTICE 'New User ID (huzz@nichuzz.com): %', new_user_id;

  -- Count flows to be transferred
  SELECT COUNT(*) INTO flows_count
  FROM validation_flows
  WHERE creator_user_id = old_user_id;

  RAISE NOTICE 'Validation flows to transfer: %', flows_count;

  -- Count analyses to be transferred
  SELECT COUNT(*) INTO analysis_count
  FROM validation_analysis
  WHERE user_id = old_user_id;

  RAISE NOTICE 'Validation analyses to transfer: %', analysis_count;

  -- Display flows that will be transferred
  RAISE NOTICE '--- Flows to be transferred ---';
  FOR flow_record IN
    SELECT id, flow_name, created_at
    FROM validation_flows
    WHERE creator_user_id = old_user_id
  LOOP
    RAISE NOTICE 'Flow: % - % (created: %)', flow_record.id, flow_record.flow_name, flow_record.created_at;
  END LOOP;

END $$;

-- Step 2: Perform the transfer
-- UNCOMMENT THE SECTION BELOW TO EXECUTE THE TRANSFER

/*
DO $$
DECLARE
  old_user_id UUID;
  new_user_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO old_user_id FROM auth.users WHERE email = 'nichurrell@icloud.com';
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'huzz@nichuzz.com';

  -- Update validation_flows table
  UPDATE validation_flows
  SET creator_user_id = new_user_id,
      updated_at = NOW()
  WHERE creator_user_id = old_user_id;

  RAISE NOTICE 'Updated % validation flows', (SELECT COUNT(*) FROM validation_flows WHERE creator_user_id = new_user_id);

  -- Update validation_analysis table
  UPDATE validation_analysis
  SET user_id = new_user_id
  WHERE user_id = old_user_id;

  RAISE NOTICE 'Updated % validation analyses', (SELECT COUNT(*) FROM validation_analysis WHERE user_id = new_user_id);

  RAISE NOTICE 'Transfer complete!';
END $$;
*/

-- Step 3: Verification queries
-- Run these after uncommenting and executing Step 2

/*
-- Verify flows were transferred
SELECT
  vf.id,
  vf.flow_name,
  vf.created_at,
  vf.response_count,
  u.email as creator_email
FROM validation_flows vf
JOIN auth.users u ON u.id = vf.creator_user_id
WHERE u.email = 'huzz@nichuzz.com'
ORDER BY vf.created_at DESC;

-- Verify analyses were transferred
SELECT
  va.id,
  va.created_at,
  va.total_responses,
  u.email as user_email
FROM validation_analysis va
JOIN auth.users u ON u.id = va.user_id
WHERE u.email = 'huzz@nichuzz.com'
ORDER BY va.created_at DESC;

-- Check that old user has no flows remaining
SELECT
  COUNT(*) as remaining_flows
FROM validation_flows vf
JOIN auth.users u ON u.id = vf.creator_user_id
WHERE u.email = 'nichurrell@icloud.com';

-- Should return 0
*/
