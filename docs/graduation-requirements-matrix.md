# Graduation Requirements Matrix

**Last Updated:** December 4, 2025
**For:** Developers & Product Team

---

## 📋 Overview

This matrix shows exactly what users need to complete to graduate from each stage. Requirements are enforced both client-side (`personaStages.js`) and server-side (`graduation-check/index.ts`).

**Graduation Logic:**
- Users must complete **ALL** requirements to graduate
- Flows, milestones, and challenge streaks are checked
- Graduation can be triggered manually or automatically
- Upon graduation, user progresses to the next stage

---

## 🎯 Full Requirements Matrix

### Vibe Seeker

| Stage | Flows Required | Milestones Required | Challenge Streak | Graduates To |
|-------|----------------|---------------------|------------------|--------------|
| **Clarity** | • nikigai_skills<br>• nikigai_problems<br>• nikigai_persona<br>• nikigai_integration | None | None | **Vibe Riser** (validation stage) |

**Notes:**
- Vibe Seekers have only 1 stage (Clarity)
- Must complete all 4 Nikigai flows
- 7-Day Challenge is **locked** until graduation
- After graduation, user becomes Vibe Riser and unlocks 7-Day Challenge

---

### Vibe Riser

| Stage | Flows Required | Milestones Required | Challenge Streak | Graduates To |
|-------|----------------|---------------------|------------------|--------------|
| **Validation** | None | • validation_form_sent<br>• validation_responses_3 | None | **Creation** |
| **Creation** | • 100m_offer<br>• lead_magnet_offer | • product_created<br>• lead_magnet_created | None | **Testing** |
| **Testing** | None | • testing_complete<br>• feedback_responses_3<br>• improvements_identified | None | **Launch** |
| **Launch** | • 100m_leads | • strategy_identified<br>• funnel_stages_defined | **7 days** | **Final Stage** (no further progression) |

**Notes:**
- Vibe Risers have 4 stages
- Launch stage requires maintaining 7-day challenge streak
- 7-Day Challenge unlocked immediately (already graduated from Vibe Seeker)

---

### Movement Maker

| Stage | Flows Required | Milestones Required | Challenge Streak | Graduates To |
|-------|----------------|---------------------|------------------|--------------|
| **Ideation** | • acquisition_flow<br>• upsell_flow<br>• downsell_flow<br>• continuity_flow | • read_putting_it_together<br>• decide_acquisition<br>• decide_upsell<br>• decide_downsell<br>• decide_continuity | None | **Creation** |
| **Creation** | None | • create_acquisition_offer<br>• create_upsell_offer<br>• create_downsell_offer<br>• create_continuity_offer | None | **Launch** |
| **Launch** | • 100m_leads | • strategy_identified<br>• funnel_stages_defined | **7 days** | **Final Stage** (no further progression) |

**Notes:**
- Movement Makers have 3 stages
- Ideation stage requires most work: 4 flows + 5 milestones
- Launch stage requires maintaining 7-day challenge streak
- 7-Day Challenge unlocked immediately

---

## 📊 Requirements by Type

### Flow Requirements

**Flow completion is tracked in `flow_sessions` table:**
- `flow_type` must match exactly
- `status` must be 'completed'
- User must have at least 1 completed session

| Flow Type | Used By Persona | Stage | Challenge ID |
|-----------|-----------------|-------|--------------|
| nikigai_skills | Vibe Seeker | Clarity | N/A (home page flows) |
| nikigai_problems | Vibe Seeker | Clarity | N/A (home page flows) |
| nikigai_persona | Vibe Seeker | Clarity | N/A (home page flows) |
| nikigai_integration | Vibe Seeker | Clarity | N/A (home page flows) |
| 100m_offer | Vibe Riser | Creation | flow_100m_offer |
| lead_magnet_offer | Vibe Riser | Creation | flow_lead_magnet |
| acquisition_flow | Movement Maker | Ideation | flow_attraction_offer |
| upsell_flow | Movement Maker | Ideation | flow_upsell_offer |
| downsell_flow | Movement Maker | Ideation | flow_downsell_offer |
| continuity_flow | Movement Maker | Ideation | flow_continuity_offer |
| 100m_leads | Vibe Riser, Movement Maker | Launch | flow_leads_strategy_vr / flow_leads_strategy_mm |

### Milestone Requirements

**Milestone completion is tracked in `milestone_completions` table:**
- `milestone_type` must match exactly
- User must have at least 1 completed milestone

| Milestone Type | Used By Persona | Stage | Challenge ID | Input Type |
|----------------|-----------------|-------|--------------|------------|
| validation_form_sent | Vibe Riser | Validation | milestone_send_validation | text |
| validation_responses_3 | Vibe Riser | Validation | milestone_get_validation_3 | text |
| product_created | Vibe Riser | Creation | milestone_create_product | text |
| lead_magnet_created | Vibe Riser | Creation | milestone_create_lead_magnet | text |
| testing_complete | Vibe Riser | Testing | milestone_testing_complete | text |
| feedback_responses_3 | Vibe Riser | Testing | milestone_feedback_3 | text |
| improvements_identified | Vibe Riser | Testing | milestone_improvements | text |
| strategy_identified | Vibe Riser, Movement Maker | Launch | milestone_strategy | text |
| funnel_stages_defined | Vibe Riser, Movement Maker | Launch | milestone_funnel_stages | text |
| read_putting_it_together | Movement Maker | Ideation | milestone_read_putting_it_together | checkbox |
| decide_acquisition | Movement Maker | Ideation | milestone_decide_acquisition | text |
| decide_upsell | Movement Maker | Ideation | milestone_decide_upsell | text |
| decide_downsell | Movement Maker | Ideation | milestone_decide_downsell | text |
| decide_continuity | Movement Maker | Ideation | milestone_decide_continuity | text |
| create_acquisition_offer | Movement Maker | Creation | milestone_create_acquisition | text |
| create_upsell_offer | Movement Maker | Creation | milestone_create_upsell | text |
| create_downsell_offer | Movement Maker | Creation | milestone_create_downsell | text |
| create_continuity_offer | Movement Maker | Creation | milestone_create_continuity | text |

### Challenge Streak Requirements

**Streak is tracked in `challenge_progress` table:**
- Only required for Launch stage (both Vibe Riser and Movement Maker)
- Must maintain 7 consecutive days of completing at least 1 quest
- Tracked via `longest_streak` column
- Reset if user misses a day

---

## 🔄 Graduation Flow

### Automatic Graduation Check

**Triggers:**
1. User completes a flow
2. User completes a milestone
3. User completes a quest
4. User manually clicks "Check Graduation Status"

**Process:**
```javascript
// graduationChecker.js
1. Fetch user's current stage and persona
2. Get requirements for current stage
3. Check flows_required:
   - Query flow_sessions for completed flows
   - Verify each required flow has at least 1 completion
4. Check milestones:
   - Query milestone_completions for completed milestones
   - Verify each required milestone has at least 1 completion
5. Check challenge_streak (if required):
   - Query challenge_progress for longest_streak
   - Verify streak >= 7 days
6. If ALL requirements met:
   - Set graduation_eligible = true
   - Return graduation status
7. If ANY requirement missing:
   - Return missing requirements
```

### Manual Graduation

**When:** User clicks "Graduate to Next Stage" button

**Process:**
1. Verify `graduation_eligible = true` in `stage_progress`
2. Get next stage from PERSONA_STAGES
3. Update `stage_progress.current_stage` to next stage
4. Set `graduation_eligible = false`
5. Show celebration modal with stage-specific message
6. Redirect to appropriate page

**Special Case - Vibe Seeker:**
1. Upon clarity graduation, update `profiles.persona = 'vibe_riser'`
2. Create new `stage_progress` record with stage = 'validation'
3. Unlock 7-Day Challenge access

---

## 🧪 Testing Graduation Requirements

### Test Checklist

For each persona/stage combination, verify:

- [ ] All required flows are tracked in database
- [ ] Flow completion triggers graduation check
- [ ] All required milestones are tracked in database
- [ ] Milestone completion triggers graduation check
- [ ] Challenge streak is tracked correctly (if required)
- [ ] Graduation button appears when eligible
- [ ] Graduation updates stage correctly
- [ ] Celebration message displays
- [ ] Next stage challenges appear

### SQL Test Queries

**Check User's Completed Flows:**
```sql
SELECT DISTINCT flow_type, COUNT(*) as completions
FROM flow_sessions
WHERE user_id = '[USER_ID]'
  AND status = 'completed'
GROUP BY flow_type;
```

**Check User's Completed Milestones:**
```sql
SELECT DISTINCT milestone_type, COUNT(*) as completions
FROM milestone_completions
WHERE user_id = '[USER_ID]'
GROUP BY milestone_type;
```

**Check User's Challenge Streak:**
```sql
SELECT longest_streak, current_streak
FROM challenge_progress
WHERE user_id = '[USER_ID]'
  AND status = 'active';
```

**Check Graduation Eligibility:**
```sql
SELECT
  p.persona,
  sp.current_stage,
  sp.graduation_eligible,
  sp.last_checked_at
FROM profiles p
JOIN stage_progress sp ON p.user_id = sp.user_id
WHERE p.user_id = '[USER_ID]';
```

**Get All Requirements for User's Current Stage:**
```sql
-- Use personaStages.js to look up requirements manually
-- OR implement server-side endpoint that returns requirements
```

---

## 🔍 Verifying Flow/Milestone Consistency

### Flow Type Verification

**Goal:** Ensure flow_type in `flow_sessions` matches `flows_required` in `personaStages.js`

| personaStages.js | flow_sessions.flow_type | Flow Component | ✓ Status |
|------------------|-------------------------|----------------|----------|
| nikigai_skills | nikigai_skills | NikigaiTest.jsx | ✓ Match |
| nikigai_problems | nikigai_problems | NikigaiTest.jsx | ✓ Match |
| nikigai_persona | nikigai_persona | NikigaiTest.jsx | ✓ Match |
| nikigai_integration | nikigai_integration | NikigaiTest.jsx | ✓ Match |
| 100m_offer | 100m_offer | NikigaiTest.jsx | ✓ Match |
| lead_magnet_offer | lead_magnet_offer | LeadMagnetFlow.jsx | ✓ Match |
| acquisition_flow | acquisition_flow | AttractionOfferFlow.jsx | ✓ Match |
| upsell_flow | upsell_flow | UpsellFlow.jsx | ✓ Match |
| downsell_flow | downsell_flow | DownsellFlow.jsx | ✓ Match |
| continuity_flow | continuity_flow | ContinuityFlow.jsx | ✓ Match |
| 100m_leads | 100m_leads | LeadsStrategyFlow.jsx | ✓ Match |

**All flow types verified ✓**

### Milestone Type Verification

**Goal:** Ensure milestone_type in challenges matches `milestones` in `personaStages.js`

| personaStages.js | challengeQuestsUpdate.json | Challenge ID | ✓ Status |
|------------------|----------------------------|--------------|----------|
| validation_form_sent | validation_form_sent | milestone_send_validation | ✓ Match |
| validation_responses_3 | validation_responses_3 | milestone_get_validation_3 | ✓ Match |
| product_created | product_created | milestone_create_product | ✓ Match |
| lead_magnet_created | lead_magnet_created | milestone_create_lead_magnet | ✓ Match |
| testing_complete | testing_complete | milestone_testing_complete | ✓ Match |
| feedback_responses_3 | feedback_responses_3 | milestone_feedback_3 | ✓ Match |
| improvements_identified | improvements_identified | milestone_improvements | ✓ Match |
| strategy_identified | strategy_identified | milestone_strategy | ✓ Match |
| funnel_stages_defined | funnel_stages_defined | milestone_funnel_stages | ✓ Match |
| read_putting_it_together | read_putting_it_together | milestone_read_putting_it_together | ✓ Match |
| decide_acquisition | decide_acquisition | milestone_decide_acquisition | ✓ Match |
| decide_upsell | decide_upsell | milestone_decide_upsell | ✓ Match |
| decide_downsell | decide_downsell | milestone_decide_downsell | ✓ Match |
| decide_continuity | decide_continuity | milestone_decide_continuity | ✓ Match |
| create_acquisition_offer | create_acquisition_offer | milestone_create_acquisition | ✓ Match |
| create_upsell_offer | create_upsell_offer | milestone_create_upsell | ✓ Match |
| create_downsell_offer | create_downsell_offer | milestone_create_downsell | ✓ Match |
| create_continuity_offer | create_continuity_offer | milestone_create_continuity | ✓ Match |

**All milestone types verified ✓**

---

## 🚨 Common Graduation Issues

### Issue: User Completed Requirements But Can't Graduate

**Diagnostic Steps:**

1. **Check stage_progress.graduation_eligible:**
```sql
SELECT graduation_eligible, last_checked_at
FROM stage_progress
WHERE user_id = '[USER_ID]';
```

2. **Manually trigger graduation check:**
   - User clicks "Check Graduation Status" button in UI
   - OR run graduation checker function manually

3. **Compare actual vs required:**
```sql
-- Get what user has completed
SELECT 'flows' as type, ARRAY_AGG(DISTINCT flow_type) as completed
FROM flow_sessions
WHERE user_id = '[USER_ID]' AND status = 'completed'
UNION ALL
SELECT 'milestones', ARRAY_AGG(DISTINCT milestone_type)
FROM milestone_completions
WHERE user_id = '[USER_ID]';

-- Then compare to personaStages.js requirements manually
```

4. **Common causes:**
   - flow_type mismatch (e.g., saved as 'acquisitionFlow' but checking for 'acquisition_flow')
   - milestone_type mismatch (e.g., 'product-created' vs 'product_created')
   - Client-server requirement mismatch
   - Streak not updating correctly

### Issue: Graduation Check Never Runs

**Symptoms:**
- graduation_eligible always false
- last_checked_at is null or very old

**Causes:**
1. Graduation checker function not being called
2. JavaScript error preventing check
3. Database permissions issue

**Fix:**
- Check console for errors
- Manually call `checkGraduation()` function
- Verify RLS policies on stage_progress table

### Issue: User Graduated But Stage Didn't Update

**Symptoms:**
- graduation_eligible = true
- User clicked "Graduate" button
- current_stage didn't change

**Causes:**
1. Graduation mutation failed
2. RLS policy blocking update
3. JavaScript error during graduation

**Fix:**
- Check network tab for failed requests
- Check console for errors
- Manually update stage:
```sql
UPDATE stage_progress
SET
  current_stage = '[NEXT_STAGE]',
  graduation_eligible = false,
  updated_at = NOW()
WHERE user_id = '[USER_ID]';
```

---

## 📚 Related Documentation

- **Adding New Challenges:** `/md files/ADDING-NEW-CHALLENGES.md`
- **Phase 3 Updates:** `/md files/7-DAY-CHALLENGE-UPDATES.md`
- **Troubleshooting:** `/md files/TROUBLESHOOTING-CHALLENGES.md`

---

## 🔄 Maintenance

### When Adding New Requirements

1. **Update `personaStages.js`:**
   - Add flow to `flows_required` array
   - OR add milestone to `milestones` array

2. **Update server-side graduation checker:**
   - `/supabase/functions/graduation-check/index.ts`
   - MUST match client-side exactly

3. **Add corresponding challenge:**
   - Add to `challengeQuestsUpdate.json`
   - Set correct `flow_id` or `milestone_type`
   - Set correct `stage_required` and `persona_specific`

4. **Verify flow integration:**
   - Ensure flow component saves correct `flow_type` to `flow_sessions`
   - Ensure flow calls `completeFlowQuest()` with correct `flowId`

5. **Test graduation:**
   - Create test user in that persona/stage
   - Complete all requirements
   - Verify graduation eligible
   - Verify graduation succeeds
   - Verify next stage challenges appear

---

**Last Updated:** December 4, 2025
**Version:** 1.0
**Maintained By:** Development Team
