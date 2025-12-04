# Troubleshooting Guide: 7-Day Challenge System

**Last Updated:** December 4, 2025
**For:** Developers & Support Team

---

## 📋 Overview

This guide helps you diagnose and fix common issues with the 7-day challenge system, including:
- Challenge visibility problems
- Quest completion failures
- Graduation checker issues
- Flow integration bugs
- Database state inconsistencies

---

## 🔍 Quick Diagnostic Steps

When a user reports a challenge issue, start here:

1. **Verify User State**
   - What persona are they?
   - What stage are they in?
   - Do they have an active challenge?

2. **Check Database State**
   - Are there completion records?
   - Is stage_progress correct?
   - Are flow_sessions being created?

3. **Check Console Logs**
   - Any JavaScript errors?
   - Quest completion warnings?
   - Network failures?

4. **Verify Challenge Configuration**
   - Is the challenge in challengeQuestsUpdate.json?
   - Are persona_specific and stage_required correct?
   - Does flow_id match flow integration code?

---

## 🐛 Common Issues & Solutions

### Issue 1: Challenge Not Appearing

**Symptoms:**
- User says "I can't see challenge X"
- Challenge exists in JSON but doesn't display

**Diagnostic SQL:**
```sql
-- Check user's persona and stage
SELECT
  p.persona,
  sp.current_stage,
  sp.graduation_eligible
FROM profiles p
LEFT JOIN stage_progress sp ON p.user_id = sp.user_id
WHERE p.user_id = '[USER_ID]';
```

**Common Causes:**

#### Cause 1A: Wrong Persona
```json
// Challenge configured for:
"persona_specific": ["vibe_riser"]

// But user is:
persona: "movement_maker"
```

**Fix:** Verify `persona_specific` array includes user's persona.

#### Cause 1B: Wrong Stage
```json
// Challenge configured for:
"stage_required": "creation"

// But user is in:
current_stage: "validation"
```

**Fix:** Verify `stage_required` matches user's current stage.

#### Cause 1C: Challenge Not Active
```json
// Challenge has:
"status": "coming_soon"
```

**Fix:** Remove status field or change to active.

#### Cause 1D: Missing from JSON
- Challenge may have been deleted or not synced
- Verify challenge exists in `/public/challengeQuestsUpdate.json`

**Fix:** Add challenge back to JSON or rebuild/redeploy.

---

### Issue 2: Flow Challenge Not Auto-Completing

**Symptoms:**
- User completes a flow
- Quest remains in "pending" state
- Points not awarded

**Diagnostic SQL:**
```sql
-- Check if flow completion was recorded
SELECT *
FROM flow_sessions
WHERE user_id = '[USER_ID]'
  AND flow_type = '[FLOW_TYPE]'
ORDER BY created_at DESC
LIMIT 5;

-- Check if quest completion exists
SELECT *
FROM quest_completions
WHERE user_id = '[USER_ID]'
  AND quest_id = '[QUEST_ID]'
ORDER BY completed_at DESC
LIMIT 5;
```

**Common Causes:**

#### Cause 2A: Mismatched flow_id
```javascript
// In challengeQuestsUpdate.json:
"flow_id": "flow_100m_offer"

// But in flow component:
await completeFlowQuest({
  flowId: 'flow_acquisition_offer'  // ❌ DOESN'T MATCH
})
```

**Fix:** Ensure flow_id in JSON exactly matches flowId parameter in completeFlowQuest call.

**How to Find:**
1. Open challenge JSON, find the challenge
2. Note the `flow_id` value
3. Open the flow component (e.g., AttractionOfferFlow.jsx)
4. Search for `completeFlowQuest`
5. Verify flowId parameter matches

#### Cause 2B: Missing completeFlowQuest Integration
```javascript
// Flow saves results but never calls:
await completeFlowQuest({ ... })
```

**Fix:** Add quest completion integration to flow component.

**Code to Add:**
```javascript
// After saving assessment
import { completeFlowQuest } from './lib/questCompletion'

try {
  await completeFlowQuest({
    userId: user.id,
    flowId: 'flow_[your_flow_id]',
    pointsEarned: 35
  })
} catch (questError) {
  console.warn('Quest completion failed:', questError)
}
```

#### Cause 2C: No Active Challenge
- User may have completed/deleted their 7-day challenge
- Quest completion only works when user has an active challenge

**Diagnostic SQL:**
```sql
-- Check for active challenge
SELECT *
FROM challenge_progress
WHERE user_id = '[USER_ID]'
  AND status = 'active'
ORDER BY created_at DESC
LIMIT 1;
```

**Fix:** User needs to start a new 7-day challenge.

#### Cause 2D: JavaScript Error in Flow
- Check browser console for errors
- Quest completion may be failing silently

**Fix:** Look for error messages and fix the underlying issue.

---

### Issue 3: Graduation Checker Not Recognizing Completion

**Symptoms:**
- User completed all requirements
- Graduation checker says they haven't
- "Can't progress to next stage"

**Diagnostic SQL:**
```sql
-- Check flow completions
SELECT DISTINCT flow_type
FROM flow_sessions
WHERE user_id = '[USER_ID]'
  AND status = 'completed';

-- Check milestone completions
SELECT DISTINCT milestone_type
FROM milestone_completions
WHERE user_id = '[USER_ID]';

-- Check current stage requirements
SELECT *
FROM stage_progress
WHERE user_id = '[USER_ID]';
```

**Common Causes:**

#### Cause 3A: Mismatched flow_type Names

**Example:**
```javascript
// personaStages.js requires:
flows_required: ['100m_offer']

// But flow_sessions records:
flow_type: 'acquisition_flow'  // ❌ DOESN'T MATCH
```

**Fix:** Update flow component to save correct flow_type to flow_sessions table.

**How to Verify:**
1. Open `/src/lib/personaStages.js`
2. Find the persona and stage
3. Note values in `flows_required` array
4. For each value, search codebase for where it's saved to flow_sessions
5. Ensure `flow_type` matches exactly

#### Cause 3B: Client-Server Mismatch

**Example:**
```javascript
// Client-side (personaStages.js):
creation: {
  flows_required: ['100m_offer', 'lead_magnet_offer'],
  milestones: ['product_created']
}

// Server-side (graduation-check/index.ts):
creation: {
  flows_required: ['100m_offer'],  // ❌ MISSING lead_magnet_offer
  milestones: ['product_created']
}
```

**Fix:** Ensure `/supabase/functions/graduation-check/index.ts` EXACTLY matches client-side requirements.

#### Cause 3C: Case Sensitivity

**Example:**
```javascript
// Saved as:
flow_type: 'Lead_Magnet_Offer'

// But checking for:
flows_required: ['lead_magnet_offer']  // ❌ Case doesn't match
```

**Fix:** Always use lowercase snake_case for flow_type and milestone_type values.

---

### Issue 4: User Can't See Any Challenges (7-Day Challenge Locked)

**Symptoms:**
- User navigates to /7-day-challenge
- Sees "Complete all 4 Nikigai flows to unlock" message
- Button is locked/disabled

**Diagnostic SQL:**
```sql
-- Check if user is Vibe Seeker
SELECT persona
FROM profiles
WHERE user_id = '[USER_ID]';

-- Check Nikigai flow completions
SELECT flow_type, status, completed_at
FROM flow_sessions
WHERE user_id = '[USER_ID]'
  AND flow_type IN (
    'nikigai_skills',
    'nikigai_problems',
    'nikigai_persona',
    'nikigai_integration'
  )
ORDER BY completed_at;
```

**Expected Behavior:**
- Vibe Seekers must complete all 4 Nikigai flows before accessing 7-day challenge
- Once complete, they graduate to Vibe Riser and unlock access

**Fix Options:**

1. **If user hasn't completed Nikigai flows:**
   - This is correct behavior
   - Guide them to complete Nikigai flows from home page

2. **If user completed flows but still locked:**
   - Check if graduation ran successfully
   - Manually update persona if needed:
   ```sql
   UPDATE profiles
   SET persona = 'vibe_riser'
   WHERE user_id = '[USER_ID]';
   ```

---

### Issue 5: Daily Implementation Not Resetting

**Symptoms:**
- User completed daily implementation yesterday
- Today they can't complete it again
- Streak bubbles not updating

**Diagnostic SQL:**
```sql
-- Check recent completions
SELECT
  quest_id,
  completed_at,
  DATE(completed_at) as completion_date
FROM quest_completions
WHERE user_id = '[USER_ID]'
  AND quest_id = 'daily_implementation'
ORDER BY completed_at DESC
LIMIT 10;
```

**Common Causes:**

#### Cause 5A: Timezone Issue
- User in different timezone than server
- Completion timestamp may cross date boundary

**Fix:** Verify date comparison logic accounts for user timezone.

#### Cause 5B: maxPerDay Logic Not Working
```json
// Challenge should have:
"maxPerDay": 1
```

**Fix:** Verify `maxPerDay` field exists in challenge JSON.

#### Cause 5C: Multiple Completions Same Day
- User completed multiple times same day
- Hit maxPerDay limit

**Diagnostic:** Check completion_date in SQL results above. If multiple entries for today, limit is working correctly.

---

### Issue 6: Points Not Awarded

**Symptoms:**
- Quest shows as completed
- User didn't receive points
- Total score unchanged

**Diagnostic SQL:**
```sql
-- Check user's current points
SELECT total_score
FROM challenge_progress
WHERE user_id = '[USER_ID]'
  AND status = 'active';

-- Check quest completion record
SELECT points_earned
FROM quest_completions
WHERE user_id = '[USER_ID]'
  AND quest_id = '[QUEST_ID]'
ORDER BY completed_at DESC
LIMIT 1;

-- Check challenge instance
SELECT quests_data
FROM challenge_instances
WHERE id = (
  SELECT challenge_instance_id
  FROM challenge_progress
  WHERE user_id = '[USER_ID]'
    AND status = 'active'
);
```

**Common Causes:**

#### Cause 6A: Mismatched Points
```javascript
// Challenge JSON says:
"points": 35

// But completeFlowQuest called with:
pointsEarned: 40  // ❌ DOESN'T MATCH
```

**Fix:** Ensure pointsEarned parameter matches points value in JSON.

#### Cause 6B: Challenge Completed Before Quest System
- Quest exists in old challenge instance that didn't include this quest
- User needs to start new challenge to see new quests

**Fix:** User should complete current challenge and start a new one.

---

### Issue 7: "Learn More" Section Not Displaying

**Symptoms:**
- User clicks "Learn More"
- Nothing happens or section is blank

**Common Causes:**

#### Cause 7A: Missing learnMore Field
```json
// Challenge doesn't have:
"learnMore": "..."
```

**Fix:** Add learnMore field to challenge JSON.

#### Cause 7B: Empty learnMore Field
```json
"learnMore": ""  // ❌ EMPTY
```

**Fix:** Add content or remove field entirely.

---

## 🔧 Debugging Tools

### Browser Console Debugging

**Enable Detailed Logging:**
```javascript
// In Challenge.jsx or flow component
console.log('User Persona:', userData?.persona)
console.log('Current Stage:', stageProgress?.current_stage)
console.log('Filtered Quests:', filteredQuests)
console.log('Quest Completion Data:', { userId, flowId, pointsEarned })
```

**Network Tab:**
- Check for failed API calls to Supabase
- Look for 401/403 (auth issues) or 500 (server errors)
- Verify quest completion POST requests

### SQL Debugging Queries

**Get Complete User State:**
```sql
SELECT
  p.user_id,
  p.persona,
  p.email,
  sp.current_stage,
  sp.graduation_eligible,
  cp.status as challenge_status,
  cp.total_score,
  cp.quests_completed_count
FROM profiles p
LEFT JOIN stage_progress sp ON p.user_id = sp.user_id
LEFT JOIN challenge_progress cp ON p.user_id = cp.user_id AND cp.status = 'active'
WHERE p.user_id = '[USER_ID]';
```

**List All Completed Quests:**
```sql
SELECT
  qc.quest_id,
  qc.completed_at,
  qc.points_earned,
  qc.completion_data
FROM quest_completions qc
WHERE qc.user_id = '[USER_ID]'
ORDER BY qc.completed_at DESC;
```

**Check Graduation Requirements vs Actual:**
```sql
-- Flow completions
SELECT DISTINCT flow_type, COUNT(*) as completion_count
FROM flow_sessions
WHERE user_id = '[USER_ID]'
  AND status = 'completed'
GROUP BY flow_type;

-- Milestone completions
SELECT DISTINCT milestone_type, COUNT(*) as completion_count
FROM milestone_completions
WHERE user_id = '[USER_ID]'
GROUP BY milestone_type;
```

**Find Duplicate Completions:**
```sql
SELECT quest_id, COUNT(*) as completion_count
FROM quest_completions
WHERE user_id = '[USER_ID]'
GROUP BY quest_id
HAVING COUNT(*) > 1;
```

---

## 🧪 Testing Scenarios

### Test 1: New Challenge Visibility
1. Add challenge to JSON with specific persona and stage
2. Create test user with that persona
3. Set test user to that stage
4. Navigate to /7-day-challenge
5. Verify challenge appears in correct category

### Test 2: Flow Auto-Completion
1. Start 7-day challenge
2. Navigate to flow with challenge
3. Complete entire flow
4. Return to /7-day-challenge
5. Verify quest marked complete and points awarded

### Test 3: Stage Progression
1. Complete all requirements for current stage
2. Check stage_progress.graduation_eligible = true
3. Click "Graduate to Next Stage"
4. Verify current_stage updated
5. Verify new stage challenges now visible

### Test 4: Daily Implementation Reset
1. Complete daily implementation challenge
2. Note timestamp
3. Wait 24 hours (or manually update timestamp in DB)
4. Attempt to complete again
5. Verify can complete and new streak bubble filled

### Test 5: Vibe Seeker Lock
1. Create test user with persona = 'vibe_seeker'
2. Navigate to /me
3. Verify 7-day challenge button shows "🔒 Complete Nikigai Flows to Unlock"
4. Click button
5. Verify nothing happens (disabled)

---

## 🚨 Critical Errors

### Error: "Cannot read property 'flow_id' of undefined"

**Cause:** Challenge JSON structure is broken or quest not found.

**Fix:**
1. Validate JSON syntax: `npm run build`
2. Check challenge exists in challengeQuestsUpdate.json
3. Verify quest_id spelling

### Error: "Duplicate key value violates unique constraint"

**Cause:** Trying to insert duplicate quest completion.

**Common Scenario:**
- Flow completes twice in quick succession
- User clicks "Complete Quest" multiple times

**Fix:** Code already wraps in try-catch, but check for race conditions in flow completion logic.

### Error: "RLS policy violation"

**Cause:** Row Level Security preventing access to table.

**Fix:**
1. Verify user is authenticated
2. Check RLS policies on affected table
3. Ensure user_id matches authenticated user

---

## 📊 Database Schema Reference

### Key Tables

**challenge_progress**
- Tracks user's active challenge
- Fields: user_id, status, total_score, quests_completed_count

**quest_completions**
- Records each quest completion
- Fields: user_id, quest_id, points_earned, completed_at

**flow_sessions**
- Tracks flow completions for graduation
- Fields: user_id, flow_type, status, completed_at

**milestone_completions**
- Tracks milestone completions for graduation
- Fields: user_id, milestone_type, description, completed_at

**stage_progress**
- Tracks user's current stage and graduation eligibility
- Fields: user_id, current_stage, graduation_eligible

---

## 🆘 Escalation Guide

### When to Escalate

1. **Data Corruption**
   - Multiple users affected
   - Database state inconsistent
   - Cannot be fixed with SQL updates

2. **System-Wide Failures**
   - Quest completion failing for all users
   - Graduation checker consistently wrong
   - Critical flows not saving

3. **Security Issues**
   - Users can see other users' data
   - RLS policies not working
   - Quest completion bypasses

### Escalation Process

1. **Gather Information:**
   - User ID(s) affected
   - Error messages (console + network)
   - SQL query results
   - Steps to reproduce

2. **Document Issue:**
   - Create GitHub issue with all details
   - Include SQL queries run
   - Add console logs and screenshots

3. **Temporary Workaround:**
   - Can user progress another way?
   - Manual database update needed?
   - Feature flag to disable?

---

## 📚 Related Documentation

- **Adding New Challenges:** `/md files/ADDING-NEW-CHALLENGES.md`
- **Phase 3 Updates:** `/md files/7-DAY-CHALLENGE-UPDATES.md`
- **Graduation Requirements Matrix:** `/md files/GRADUATION-REQUIREMENTS-MATRIX.md`

---

## 🔄 Maintenance Tasks

### Weekly
- [ ] Review quest completion error logs
- [ ] Check for orphaned challenge_progress records
- [ ] Verify graduation checker accuracy

### Monthly
- [ ] Audit challenge JSON for inconsistencies
- [ ] Review flow_type naming consistency
- [ ] Update this guide with new issues

---

**Last Updated:** December 4, 2025
**Version:** 1.0
**Maintained By:** Development Team
