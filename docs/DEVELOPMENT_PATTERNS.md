# Development Patterns & Best Practices

**Created:** February 2026
**Purpose:** Prevent common bugs by following consistent patterns across the codebase.

---

## Table of Contents

1. [Supabase Operations](#supabase-operations)
2. [Challenge & Points Integration](#challenge--points-integration)
3. [Flow Completion Patterns](#flow-completion-patterns)
4. [Configuration Management](#configuration-management)

---

## Supabase Operations

### Always Destructure and Check Errors

Every Supabase operation (insert, update, upsert, delete, RPC) must:
1. Destructure the `error` from the response
2. Check and handle the error appropriately

```javascript
// ❌ BAD - Error ignored
await supabase.from('table').insert({ ... })

// ❌ BAD - No error destructuring
const result = await supabase.from('table').insert({ ... })

// ✅ GOOD - Error destructured and checked
const { data, error } = await supabase.from('table').insert({ ... })
if (error) {
  console.error('Error saving to table:', error)
  // Handle error appropriately (throw, return, show user message)
}

// ✅ GOOD - For non-critical operations
const { error } = await supabase.from('table').insert({ ... })
if (error) {
  console.error('Error saving to table:', error)
  // Non-fatal - continue execution but log for debugging
}
```

### Required Fields Checklist

Before inserting to these tables, ensure required fields are present:

| Table | Required Fields |
|-------|-----------------|
| `flow_sessions` | `user_id`, `flow_type`, `status` |
| `nikigai_clusters` | `user_id`, `session_id`, `cluster_type`, `cluster_stage` |
| `nikigai_responses` | `user_id`, `session_id`, `flow_type`, `response_type` |
| `quest_completions` | `user_id`, `challenge_instance_id`, `quest_id`, `points_earned` |
| `flow_entries` | `user_id`, `project_id`, `direction` |

### Create Session First Pattern

When saving to tables that require `session_id`, create the session first:

```javascript
// 1. Create session and get ID
const sessionId = crypto.randomUUID()
const { error: sessionError } = await supabase.from('flow_sessions').insert({
  id: sessionId,
  user_id: user.id,
  flow_type: 'my_flow',
  status: 'completed',
  completed_at: new Date().toISOString()
})

if (sessionError) {
  console.error('Error creating session:', sessionError)
  return // Don't continue without session
}

// 2. Use sessionId in related tables
const { error } = await supabase.from('nikigai_clusters').insert({
  session_id: sessionId,
  user_id: user.id,
  // ... other fields
})
```

---

## Challenge & Points Integration

### When to Sync with Challenge System

Any flow that awards points MUST call `syncFlowFinderWithChallenge` after completion:

```javascript
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'

// In your save/complete handler:
try {
  await saveDataToDatabase()

  // Sync with challenge system
  await syncFlowFinderWithChallenge(user.id, 'flow_type_here')
  console.log('✅ Flow synced with challenge')
} catch (syncError) {
  console.warn('Challenge sync failed:', syncError)
  // Non-fatal - don't block completion
}
```

### Flow Types Registry

All flow types that sync with challenges must be registered in `questCompletionHelpers.js`:

```javascript
// src/lib/questCompletionHelpers.js

// 1. Add to flowToQuestMap (quest_id must match challengeQuestsUpdate.json)
const flowToQuestMap = {
  'skills': 'flow_finder_skills',
  'problems': 'flow_finder_problems',
  'persona': 'flow_finder_persona',
  'integration': 'flow_finder_integration',
  'play_list_finder': 'play_list_finder',
  'persona_identifier': 'persona_identifier',
  'flow_finder_explainer': 'flow_finder_explainer',
  'mind_space': 'mind_space_extraction',  // <-- Add new flows here
}

// 2. Add to questPoints (must match challengeQuestsUpdate.json)
const questPoints = {
  'flow_finder_skills': 5,
  'flow_finder_problems': 5,
  // ...
  'mind_space_extraction': 10,  // <-- Add points here
}
```

### Scoring Categories

Points are categorized into three buckets for the leaderboard:

| Quest Category | Scoring Category |
|----------------|------------------|
| `Business`, `Flow Finder`, `Bonus` | `business` |
| `Healing`, `Tracker`, `Daily`, `Weekly` | `healing` |
| `Groans` | `courage` |

See `src/lib/scoringCategories.js` for the mapping.

---

## Flow Completion Patterns

### Standard Flow Completion Handler

Every flow's completion handler should follow this pattern:

```javascript
const handleComplete = async () => {
  if (isProcessing) return // Prevent double-clicks
  setIsProcessing(true)
  setError(null)

  try {
    // 1. Save to database
    await saveDataToDatabase()

    // 2. Sync with challenge (if applicable)
    try {
      await syncFlowFinderWithChallenge(user.id, 'my_flow_type')
      console.log('✅ Flow synced with challenge')
    } catch (syncError) {
      console.warn('Challenge sync failed:', syncError)
      // Non-fatal
    }

    // 3. Check graduation eligibility (if applicable)
    try {
      const eligibility = await checkGraduationEligibility(user.id)
      if (eligibility.eligible) {
        triggerConfetti()
        setGraduationMessage({ ... })
      }
    } catch (gradError) {
      console.warn('Graduation check failed:', gradError)
      // Non-fatal
    }

    // 4. Navigate or update UI
    setStep('complete')

  } catch (err) {
    console.error('Save error:', err)
    setError('Failed to save. Please try again.')
  } finally {
    setIsProcessing(false)
  }
}
```

### Flow Session Creation

Every flow should create a `flow_sessions` record on completion:

```javascript
const { error } = await supabase.from('flow_sessions').insert({
  id: crypto.randomUUID(), // Generate ID for use in related tables
  user_id: user.id,
  flow_type: 'my_flow_type',
  flow_version: '1.0',
  status: 'completed',
  last_step_id: 'final_step',
  completed_at: new Date().toISOString()
})

if (error) {
  console.error('Error creating flow session:', error)
}
```

---

## Configuration Management

### Single Source of Truth

Quest definitions live in `public/challengeQuestsUpdate.json`. Any hardcoded references must match:

| Location | Must Match |
|----------|------------|
| `questCompletionHelpers.js` → `flowToQuestMap` | Quest `id` field in JSON |
| `questCompletionHelpers.js` → `questPoints` | Quest `points` field in JSON |
| Quest `category` in code | Quest `category` field in JSON |

### Adding a New Quest

1. **Add to JSON** (`public/challengeQuestsUpdate.json`):
```json
{
  "id": "my_new_quest",
  "category": "Business",
  "type": "Flow Finder",
  "frequency": "anytime",
  "stage_required": 0,
  "name": "My New Quest",
  "description": "Description here",
  "points": 10
}
```

2. **Add to Helper** (`src/lib/questCompletionHelpers.js`):
```javascript
const flowToQuestMap = {
  // ...existing
  'my_flow_type': 'my_new_quest'
}

const questPoints = {
  // ...existing
  'my_new_quest': 10  // Must match JSON
}
```

3. **Add sync call in flow** (your flow component):
```javascript
await syncFlowFinderWithChallenge(user.id, 'my_flow_type')
```

### Verification Checklist

Before merging any flow-related changes, verify:

- [ ] All Supabase operations have error handling
- [ ] Required fields are provided for all inserts
- [ ] `session_id` is created before related inserts
- [ ] `syncFlowFinderWithChallenge` is called if flow awards points
- [ ] Quest ID in helper matches `public/challengeQuestsUpdate.json`
- [ ] Points in helper match `public/challengeQuestsUpdate.json`
- [ ] Flow type is registered in `flowToQuestMap`

---

## Quick Reference

### Import Patterns

```javascript
// Supabase client
import { supabase } from '../lib/supabaseClient'

// Challenge sync
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'

// Graduation check
import { checkGraduationEligibility } from '../lib/graduationChecker'

// Celebrations
import { useCelebrations } from '../hooks/useCelebrations'
const { triggerConfetti, celebrateLevelUp } = useCelebrations()

// Scoring categories
import { getScoringCategory, syncScoreToLeaderboard } from '../lib/scoringCategories'
```

### Common Bugs to Avoid

| Bug | Prevention |
|-----|------------|
| Silent save failures | Always destructure `{ error }` and check it |
| Missing session_id | Create flow_session first, use its ID |
| Points not updating | Call `syncFlowFinderWithChallenge` after save |
| Quest not found | Ensure quest ID matches JSON exactly |
| Wrong points awarded | Keep `questPoints` in sync with JSON |
| Double submissions | Use `isProcessing` state guard |

---

## Related Documentation

- `docs/scoring-system-refactor.md` - Detailed scoring system architecture
- `docs/7-day-challenge-system.md` - Challenge system overview
- `CLAUDE.md` - Main project guide and architecture
