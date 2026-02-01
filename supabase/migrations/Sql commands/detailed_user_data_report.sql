-- =============================================
-- DETAILED USER DATA REPORT
-- Shows specific records for nichurrell@icloud.com
-- =============================================

-- Set the target email
\set target_email '''nichurrell@icloud.com'''

-- Get user ID
WITH target_user AS (
  SELECT id, email, created_at
  FROM auth.users
  WHERE email = 'nichurrell@icloud.com'
)
SELECT
  '=== USER ACCOUNT ===' as section,
  id as user_id,
  email,
  created_at
FROM target_user;

-- =============================================
-- USER PROJECTS
-- =============================================
SELECT
  '=== USER PROJECTS ===' as section,
  up.id,
  up.project_name,
  up.project_stage,
  up.points,
  up.created_at,
  up.updated_at
FROM user_projects up
JOIN auth.users u ON u.id = up.user_id
WHERE u.email = 'nichurrell@icloud.com'
ORDER BY up.created_at DESC;

-- =============================================
-- USER STAGE PROGRESS
-- =============================================
SELECT
  '=== STAGE PROGRESS ===' as section,
  usp.persona,
  usp.current_stage,
  usp.onboarding_complete,
  usp.created_at,
  usp.updated_at
FROM user_stage_progress usp
JOIN auth.users u ON u.id = usp.user_id
WHERE u.email = 'nichurrell@icloud.com';

-- =============================================
-- VALIDATION FLOWS
-- =============================================
SELECT
  '=== VALIDATION FLOWS ===' as section,
  vf.id,
  vf.flow_name,
  vf.flow_description,
  vf.share_token,
  vf.persona,
  vf.stage,
  vf.is_active,
  vf.response_count,
  vf.created_at
FROM validation_flows vf
JOIN auth.users u ON u.id = vf.creator_user_id
WHERE u.email = 'nichurrell@icloud.com'
ORDER BY vf.created_at DESC;

-- =============================================
-- VALIDATION SESSIONS (from their flows)
-- =============================================
SELECT
  '=== VALIDATION SESSIONS ===' as section,
  vs.id as session_id,
  vf.flow_name,
  vs.respondent_email,
  vs.respondent_name,
  vs.is_completed,
  vs.started_at,
  vs.completed_at
FROM validation_sessions vs
JOIN validation_flows vf ON vf.id = vs.flow_id
JOIN auth.users u ON u.id = vf.creator_user_id
WHERE u.email = 'nichurrell@icloud.com'
ORDER BY vs.started_at DESC;

-- =============================================
-- VALIDATION ANALYSIS
-- =============================================
SELECT
  '=== VALIDATION ANALYSIS ===' as section,
  va.id,
  va.total_responses,
  va.flows_analyzed,
  va.analysis_number,
  va.context_problem,
  va.context_solution,
  va.context_audience,
  va.created_at
FROM validation_analysis va
JOIN auth.users u ON u.id = va.user_id
WHERE u.email = 'nichurrell@icloud.com'
ORDER BY va.created_at DESC;

-- =============================================
-- NIKIGAI DATA
-- =============================================
SELECT
  '=== NIKIGAI CLUSTERS ===' as section,
  nc.id,
  nc.cluster_type,
  nc.main_text,
  nc.proficiency_level,
  nc.created_at
FROM nikigai_clusters nc
JOIN auth.users u ON u.id = nc.user_id
WHERE u.email = 'nichurrell@icloud.com'
ORDER BY nc.cluster_type, nc.created_at;

-- =============================================
-- PERSONA PROFILES
-- =============================================
SELECT
  '=== PERSONA PROFILES ===' as section,
  pp.id,
  pp.persona_type,
  pp.primary_motivation,
  pp.created_at
FROM persona_profiles pp
JOIN auth.users u ON u.id = pp.user_id
WHERE u.email = 'nichurrell@icloud.com'
ORDER BY pp.created_at DESC;

-- =============================================
-- FLOW SESSIONS
-- =============================================
SELECT
  '=== FLOW SESSIONS ===' as section,
  fs.id,
  fs.flow_type,
  fs.status,
  fs.created_at,
  fs.completed_at
FROM flow_sessions fs
JOIN auth.users u ON u.id = fs.user_id
WHERE u.email = 'nichurrell@icloud.com'
ORDER BY fs.created_at DESC
LIMIT 20;

-- =============================================
-- QUEST COMPLETIONS
-- =============================================
SELECT
  '=== QUEST COMPLETIONS ===' as section,
  qc.quest_type,
  COUNT(*) as count,
  MAX(qc.completed_at) as last_completed
FROM quest_completions qc
JOIN auth.users u ON u.id = qc.user_id
WHERE u.email = 'nichurrell@icloud.com'
GROUP BY qc.quest_type
ORDER BY count DESC;

-- =============================================
-- CRM DATA
-- =============================================
SELECT
  '=== CRM PAGES ===' as section,
  cp.id,
  cp.page_title,
  cp.page_type,
  cp.created_at
FROM crm_pages cp
JOIN auth.users u ON u.id = cp.user_id
WHERE u.email = 'nichurrell@icloud.com'
ORDER BY cp.created_at DESC;

SELECT
  '=== CRM CONTACTS ===' as section,
  cc.id,
  cc.name,
  cc.email,
  cc.lead_score,
  cc.created_at
FROM crm_contacts cc
JOIN auth.users u ON u.id = cc.user_id
WHERE u.email = 'nichurrell@icloud.com'
ORDER BY cc.created_at DESC;

-- =============================================
-- ZARLO CONVERSATIONS
-- =============================================
SELECT
  '=== ZARLO CONVERSATIONS ===' as section,
  zc.id,
  zc.page_route,
  LEFT(zc.user_message, 100) as message_preview,
  zc.created_at
FROM zarlo_conversations zc
JOIN auth.users u ON u.id = zc.user_id
WHERE u.email = 'nichurrell@icloud.com'
ORDER BY zc.created_at DESC
LIMIT 10;

-- =============================================
-- GROAN CHALLENGES
-- =============================================
SELECT
  '=== GROAN CHALLENGES ===' as section,
  gc.id,
  gc.source_type,
  gc.visibility_layer,
  gc.challenge_status,
  gc.scary_score,
  gc.wahoo_score,
  gc.created_at
FROM groan_challenges gc
JOIN auth.users u ON u.id = gc.user_id
WHERE u.email = 'nichurrell@icloud.com'
ORDER BY gc.created_at DESC
LIMIT 10;
