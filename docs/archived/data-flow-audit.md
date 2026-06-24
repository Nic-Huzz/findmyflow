# FindMyFlow Data Flow & Supabase Audit

**Date**: 2026-02-06
**Scope**: Onboarding, quest completions, flow sessions, CRM operations, stage progression, Groan Matrix

---

## Summary

| Severity | Count |
|----------|-------|
| P0 - Critical (blocks core features) | 7 |
| P1 - High (data loss / security) | 10 |
| P2 - Medium (silent failures / UX) | 10 |
| P3 - Low (tech debt / edge cases) | 5 |

---

## P0 - Critical

These bugs block core user journeys or cause data loss.

### 1. Graduation NEVER triggers — flow_sessions missing `project_id`

**Files**: `src/flows/MoneyModelFlowBase.jsx:419-425`, all flow files writing to `flow_sessions`

`MoneyModelFlowBase` saves flow completions without `project_id`:
```javascript
await supabase.from('flow_sessions').insert({
  user_id: user.id,
  flow_type: config.flowType,
  status: 'completed',
  // NO project_id
})
```

But `graduationChecker.js:476-503` queries with `.eq('project_id', projectId)`. Result: **graduation always fails**.

Additionally, flow components don't receive project context at all — there's no way to pass `project_id` to them currently.

**Fix**: Pass selected project via context/URL params to all flow components. Include `project_id` in flow_sessions inserts.

---

### 2. Graduation NEVER triggers — milestone_completions missing `project_id`

**File**: `src/flows/MoneyModelFlowBase.jsx:459-466`

Same issue as above. Milestones use the old persona-based system:
```javascript
await supabase.from('milestone_completions').insert({
  user_id: user.id,
  milestone_id: config.milestoneId,
  persona: stageProgress?.persona || 'vibe_seeker', // OLD SYSTEM
  // NO project_id
})
```

But `checkProjectMilestones()` queries with `.eq('project_id', projectId)`.

---

### 3. Graduation NEVER triggers — no code calls the graduation checker

**File**: `src/hooks/useChallengeData.js`, `src/flows/MoneyModelFlowBase.jsx`

Even if bugs #1 and #2 were fixed, nothing calls `checkAndGraduateProject()` after completing flows or milestones. The graduation checker exists but is never invoked at the right time.

---

### 4. flow_type mismatch — 5 of 6 Money Model flows save wrong ID

**Files**: `src/flows/moneyModelConfigs.js`, `src/lib/graduationChecker.js`

| Flow | Saved to flow_sessions | Graduation checker expects |
|------|----------------------|--------------------------|
| Upsell | `upsell_flow` | `upsell_offer` |
| Downsell | `downsell_flow` | `downsell_offer` |
| Continuity | `continuity_flow` | `continuity_offer` |
| LeadsStrategy | `100m_leads` | `leads_strategy` |
| LeadMagnet | `lead_magnet_offer` | `lead_magnet` |

The `flowType` (saved to DB) differs from `challengeFlowId` (used for quests). Graduation checker queries `flow_type` in `flow_sessions`, so it won't find completions.

**Fix**: Align `flowType` in `moneyModelConfigs.js` with what `stageConfig.js:requiredFlows` and `graduationChecker.js` expect.

---

### 5. ExistingProjectFlow doesn't set `onboarding_v2_completed` — users see onboarding again

**File**: `src/components/ExistingProjectFlow.jsx:222-231`

```javascript
await supabase.from('user_stage_progress')
  .update({ onboarding_completed: true }) // Missing onboarding_v2_completed!
  .eq('user_id', user.id)
```

But `Profile.jsx:456` checks `stageProgress.onboarding_v2_completed !== true`, so users who complete `ExistingProjectFlow` get sent back to `HomeFirstTime` on every visit.

**Fix**: Add `onboarding_v2_completed: true` to the update.

---

### 6. Movement Maker persona NEVER assigned

**File**: `src/lib/onboardingV2.js:122`

```javascript
const isFullTime = employmentStatus === 'self_employed' // NEVER matches
```

Q1 saves granular values like `'self_employed_established'` or `'self_employed_early'`, but the check is for exact string `'self_employed'`.

**Fix**: `const isFullTime = employmentStatus?.startsWith('self_employed')`

---

### 7. OfferChecklist quest completion missing required fields

**File**: `src/pages/OfferChecklist.jsx:462-474`

Insert to `quest_completions` is missing `challenge_day` (NOT NULL constraint) and `quest_category` (needed for points). This insert will fail or produce broken data.

**Fix**: Add `challenge_day: activeChallenge?.current_day || 0` and `quest_category: 'Business'`.

---

## P1 - High

### 8. Security: contentPlanningService deletes without `user_id`

**File**: `src/lib/crm/contentPlanningService.js:139`

```javascript
await supabase.from('crm_content_plans').delete().eq('id', plan.id)
// No .eq('user_id', userId)
```

Same issue at line 151-154 for `crm_content_items` deletion. If RLS isn't configured, this could delete other users' data.

---

### 9. Security: contentPlanningService content items delete without `user_id`

**File**: `src/lib/crm/contentPlanningService.js:151-154`

```javascript
await supabase.from('crm_content_items').delete().eq('plan_id', planId)
// No .eq('user_id', userId)
```

---

### 10. HealingCompass & FunnelCalculator don't create flow_sessions

**Files**: `src/flows/HealingCompass.jsx`, `src/flows/FunnelCalculator.jsx`

These flows save to their own tables (`healing_compass_responses`, `funnel_metrics`) but never write to `flow_sessions`. The graduation checker can't detect these completions.

---

### 11. Silent profile save failure in lead magnet flow

**File**: `src/App.jsx:303-306`

```javascript
} catch (err) {
  console.error('Failed to save profile:', err)
  // Continue with flow even if save fails — NO USER FEEDBACK
}
```

User gets magic link but archetype data is lost. Later, `HomeFirstTime.jsx` tries to load archetypes and finds nothing.

---

### 12. Silent lead profile error in PersonaAssessment

**File**: `src/PersonaAssessment.jsx:168-171`

```javascript
if (leadError) {
  console.error('Error saving lead profile:', leadError)
  // Don't block - user can still authenticate
}
```

User authenticates but has no archetype data.

---

### 13. Warm lead → contact promotion fails silently

**File**: `src/pages/crm/WarmOutreach.jsx:425-439`

When the "Also add to Contacts" checkbox is used, errors are caught but never shown to the user. User thinks contact was created but it wasn't.

---

### 14. CSV import has no rollback on partial batch failure

**File**: `src/lib/crm/csvImportService.js:556-600`

If batch insert fails, code falls back to individual inserts but doesn't rollback already-inserted records. Re-importing creates duplicates.

---

### 15. Challenge.jsx `challenge_day` can be undefined

**File**: `src/Challenge.jsx:512`

```javascript
challenge_day: progress.current_day, // Could be undefined → NOT NULL violation
```

**Fix**: `challenge_day: progress.current_day ?? 0`

---

### 16. Duplicate quest check misses user-level quests

**File**: `src/Challenge.jsx:551-572`

User-level quests (Flow Finder) have `challenge_instance_id: null`, but the duplicate check only filters by the active challenge's instance ID. Users could double-earn points.

---

### 17. Project creation errors silently ignored during onboarding

**File**: `src/components/onboarding/QuickCapture/QuickCapture.jsx:318-324`

```javascript
if (projectError) {
  console.error(`Error creating project:`, projectError)
  // Don't fail the whole onboarding
}
```

User completes onboarding with zero projects. Profile page shows empty state.

---

## P2 - Medium

### 18. Groan 48hr outcome tracking query is inverted

**File**: `src/lib/crm/groanChallengeService.js:486-512`

`.lte('completed_at', fortyEightHoursAgo)` returns OLD challenges, not ones in the 48hr follow-up window. Should be `.gte()`. Also, `.is('groan_outcomes', null)` doesn't work on aggregated counts.

---

### 19. Race condition: category points use stale state

**File**: `src/hooks/useChallengeData.js:1277-1318`, `src/Challenge.jsx:657-714`

After fetching new completions, `getTabCompletionStatus` may use the old React state `completions` instead of the freshly fetched data.

---

### 20. Email sequence `steps_count` race condition

**File**: `src/pages/crm/EmailSequences.jsx:395-400, 644-646`

Manually updated count can become inaccurate under rapid create/delete. Should use a DB trigger or count query.

---

### 21. MindSpace saves in loop without transaction

**File**: `src/flows/MindSpace.jsx:298-378`

Skills, problems, and personas are saved in separate inserts. If one fails mid-loop, you get partial data. No rollback.

---

### 22. QuickCapture double-submit ref never reset on success

**File**: `src/components/onboarding/QuickCapture/QuickCapture.jsx:220-226`

`saveTriggeredRef.current` is set to `true` but never reset on success (only on error). If `onComplete` navigation fails, user can't retry.

---

### 23. ContentCreate missing explicit `user_id` in Edge Function call

**File**: `src/pages/crm/ContentCreate.jsx:307-316`

Relies on auth context in the Edge Function rather than explicit user association.

---

### 24. Multiple silent `console.warn` error handlers in MoneyModelFlowBase

**File**: `src/flows/MoneyModelFlowBase.jsx:426-468`

Three separate try-catch blocks for flow tracking, quest completion, and milestone creation — all silently swallowed. User sees success screen but data may not be saved.

---

### 25. Flow Compass blocks entries when user has no project

**File**: `src/pages/FlowCompassPage.jsx:261-293`

Validation requires `selectedProjectId`, but challenge quests can trigger compass entries without a project. Users without projects can't use the page directly.

---

### 26. No optimistic UI rollback in CRM Contacts

**File**: `src/pages/crm/Contacts.jsx:277-285`

UI updates immediately but doesn't rollback if save fails.

---

### 27. Funnel sync can run concurrently without debouncing

**File**: `src/pages/crm/Sales.jsx` (multiple calls to `syncCRMToFunnel`)

Multiple deal operations trigger syncs without debouncing.

---

## P3 - Low

### 28. Groan challenge status uses same enum value for two states

**File**: `src/lib/stageConfig.js:471-476`

`GENERATED: 'active'` and `ACCEPTED: 'active'` — differentiated only by `accepted_at` timestamp. Works but fragile.

---

### 29. Groan source types singular vs cluster_type plural mismatch

`GROAN_SOURCE_TYPES.SKILL = 'skill'` (singular) but `nikigai_clusters.cluster_type = 'skills'` (plural). Requires manual mapping.

---

### 30. No enforcement of single primary project per user

**File**: `src/Profile.jsx:83`

```javascript
const primary = projects?.find(p => p.is_primary) || projects?.[0]
```

No DB constraint prevents multiple `is_primary = true` projects.

---

### 31. Tower stats queries swallow all errors

**File**: `src/lib/crm/towerStats.js`

All stat functions return `null` on error. Dashboard shows `0` with no way to know if it's a real zero or an error.

---

### 32. Content status changes have no workflow validation

**File**: `src/pages/crm/ContentHistory.jsx:135-143`

Users can change content from any status to any other (e.g., "posted" back to "draft"), breaking metrics.

---

## Data Migration Needed

### Pre-universalization Flow Finder records

Old completions from before Feb 4, 2026 have non-null `challenge_instance_id` and `project_id`. SQL migration:

```sql
UPDATE quest_completions
SET
  challenge_instance_id = NULL,
  project_id = NULL,
  quest_category = 'Business',
  challenge_day = 0
WHERE quest_id IN (
  'flow_finder_skills', 'flow_finder_problems', 'flow_finder_persona',
  'flow_finder_integration', 'flow_finder_explainer', 'mind_space_extraction',
  'play_list_finder', 'persona_identifier'
)
AND created_at < '2026-02-04T00:00:00Z'
AND (challenge_instance_id IS NOT NULL OR quest_category != 'Business');
```

---

## Architecture Issues

### A. No project context passed to flow components

Flow components (MoneyModelFlowBase, MindSpace, etc.) don't receive the selected project. Even after fixing the insert bugs, there's no value to write. Need to pass project via React context or URL params.

### B. Graduation system is fully disconnected

Three things must all be fixed together for graduation to work:
1. Flow sessions need `project_id` (Bug #1)
2. Milestones need `project_id` (Bug #2)
3. Something must call the graduation checker (Bug #3)
4. `flowType` values must match `requiredFlows` (Bug #4)

### C. No Flow Finder → Project creation path

Users can complete Flow Finder (Stage 0) but there's no step that creates a project from those results. Users get stuck.

---

## Fix Priority Roadmap

**Week 1 — Unblock graduation**:
- Fix `moneyModelConfigs.js` flowType values (#4)
- Add `onboarding_v2_completed` to ExistingProjectFlow (#5)
- Fix Movement Maker persona derivation (#6)
- Fix OfferChecklist missing fields (#7)
- Fix `challenge_day` undefined (#15)

**Week 2 — Project context pipeline**:
- Create project context provider
- Pass project_id to all flow components
- Add project_id to flow_sessions inserts (#1)
- Add project_id to milestone_completions inserts (#2)
- Wire up graduation checker calls (#3)

**Week 3 — Security & data integrity**:
- Add user_id to contentPlanningService deletes (#8, #9)
- Add flow_sessions to HealingCompass & FunnelCalculator (#10)
- Fix duplicate quest check for user-level quests (#16)
- Fix Groan 48hr query (#18)
- Run pre-universalization data migration

**Week 4 — Error handling & UX**:
- Surface silent failures to users (#11, #12, #13, #17, #24)
- Add CSV import rollback/messaging (#14)
- Fix race conditions (#19, #20)
- Add MindSpace transaction wrapper (#21)
