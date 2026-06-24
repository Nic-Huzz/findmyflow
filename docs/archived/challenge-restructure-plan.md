# Challenge Tab Restructure Plan

## Overview

Restructuring the Challenge system to introduce stage-specific inner work under a new "Voices" sub-tab within the Business tab, while consolidating healing/wellness practices under the Healing tab.

---

## New Tab Structure

### Main Tabs (4 total - unchanged)

| Tab | Sub-tabs |
|-----|----------|
| Business | Tasks \| Voices |
| Healing | Daily \| Weekly |
| Tracker | (none) |
| Bonus | (none) |

---

## Business Tab

### Sub-tab: TASKS
Existing stage-specific business quests — no change.

### Sub-tab: VOICES
Stage-specific inner work with **personalized archetype names** from user's onboarding.

**Three quest types per stage:**
1. **Essence Voice** (Daily) — Celebrating when essence showed up
2. **Protective Voice** (Daily) — Noticing when protective patterns blocked progress
3. **Stage Groan** (Anytime) — Stage-specific comfort zone challenge

#### Stage-Specific Voice Prompts

| Stage | Essence Voice Question | Protective Voice Question | Stage Groan Challenge |
|-------|------------------------|---------------------------|----------------------|
| 1. Validation | How did your {essence} share your idea boldly today? | How did your {protective} stop you from asking for feedback? | Ask 1 person for honest feedback |
| 2. Product | How did your {essence} create without waiting for permission? | How did your {protective} keep you from shipping? | Ship something before it feels ready |
| 3. Testing | How did your {essence} receive feedback with confidence? | How did your {protective} make you defensive about criticism? | Ask for brutal honesty without defending |
| 4. Money | How did your {essence} own your value today? | How did your {protective} make you discount or over-explain? | State your price without apologizing |
| 5. Campaign | How did your {essence} show up publicly today? | How did your {protective} hold you back from being seen? | Put yourself out there publicly |
| 6. Launch | How did your {essence} commit boldly despite uncertainty? | How did your {protective} delay your commitment? | Announce a launch date publicly |
| 7. Tracking | How did your {essence} face your results with curiosity? | How did your {protective} avoid looking at the data? | Review your numbers without judgment |

#### Personalization

Questions dynamically insert the user's chosen archetypes:

**Essence Archetypes (12):**
- Radiant Rebel
- Compassionate Leader
- Playful Creator
- Mystic Messenger
- Grounded Guardian
- Wild Alchemist
- Sacred Jester
- Cosmic Connector
- Heart Holder
- Rhythm Architect
- Wise Sage
- Truth-Teller

**Protective Archetypes (5):**
- People Pleaser
- Performer
- Controller
- Perfectionist
- Ghost

**Example (User: Radiant Rebel + Perfectionist, Stage 1):**
- Essence: "How did your **Radiant Rebel** share your idea boldly today?"
- Protective: "How did your **Perfectionist** stop you from asking for feedback?"

---

## Healing Tab

### Sub-tab: DAILY

| Quest | Status |
|-------|--------|
| Positive Frequency | Existing |
| Negative Frequency | Existing |
| Daily Release Challenge | Existing |
| Processing Your Emotions | Existing |
| Future Successful You | ← Moved from Groans |
| Meditation | ← Moved from Groans |
| Breathwork | ← Moved from Groans |
| Rise & Vibe Dance | ← Moved from Groans |
| Daily Prayer | ← Moved from Groans |
| Self-Identified Activity | ← Moved from Groans |

### Sub-tab: WEEKLY

| Quest | Status |
|-------|--------|
| Trigger Pattern | Existing |
| Nervous System Flow | Existing |
| Healing Compass Flow | Existing |
| Big Release | Existing |
| Make It A Hell Yea | ← Moved from Groans |
| Dopamine Diet Change | ← Moved from Groans |
| Environment Hygiene | ← Moved from Groans |
| Weekly Self-Identified Task | ← Moved from Groans |

---

## Archive (Remove)

| Quest | Reason |
|-------|--------|
| Protective to Essence Shift | Absorbed into daily Essence/Protective Voice quests |
| Generic Groan Challenge | Replaced by stage-specific groans |
| Essence Voice Groan (weekly) | Replaced by stage-specific main groans |

---

## Multi-Step Flow Adaptation

### Current Flow Structure (RecogniseQuestInput.jsx)

**Protective Voice Quest (4 steps):**
1. Voice & Area — Shows user's archetype, "Other" expands options, plus business area selector
2. Fears & Layer — Vulnerability trifecta + Vulnerability layer
3. Situation — Text description + intensity slider (1-5)
4. Review — Summary of all selections

**Essence Voice Quest (3 steps):**
1. Business Area — Displays user's essence archetype name + superpower, selects business area
2. Situation — Text description + alignment slider (1-5)
3. Review — Summary

**Groan Reflection (5 steps) - GroanReflectionInput.jsx:**
1. What did you do? — Text describing the groan task
2. Protective voice — Which archetype showed up
3. Fears — Trifecta multi-select
4. Flow direction — N/E/S/W how it felt
5. Reflection — Summary + optional notes

### Adapted Flow Structure

#### Key Changes:
1. **Remove business area picker** — Stage already provides context
2. **Add stage context card** — Shows stage name and the personalized "how" question
3. **Dynamic question text** — Pulls user's archetype name into the question
4. **Keep everything else** — Trifecta, vulnerability layers, intensity sliders, review steps all stay

#### Vulnerability Trifecta (unchanged)
- Fear of Judgment
- Not Being Good Enough
- Fear of Failure

#### Vulnerability Layers (unchanged)
- Screen (online visibility)
- Live (in-person)
- Tribe (community/peers)
- Money (pricing/sales)
- Heart (emotional vulnerability)

### Adapted Step-by-Step

**Essence Voice Quest (Stage-Specific):**

| Step | Content |
|------|---------|
| 1 | Stage context card + archetype display + "How did your {essence} {stage_action}?" |
| 2 | Describe the moment (textarea) + alignment slider (1-5) |
| 3 | Review summary |

**Protective Voice Quest (Stage-Specific):**

| Step | Content |
|------|---------|
| 1 | Stage context card + archetype display + "How did your {protective} {stage_block}?" |
| 2 | Vulnerability trifecta (multi-select) + Vulnerability layer picker |
| 3 | Describe the situation (textarea) + intensity slider (1-5) |
| 4 | Review summary |

**Stage Groan Quest:**

| Step | Content |
|------|---------|
| 1 | Stage context card + Stage-specific groan prompt (e.g., "Describe how you asked for feedback") |
| 2 | Which protective voice showed up? |
| 3 | Vulnerability trifecta (multi-select) |
| 4 | Flow direction (N/E/S/W) |
| 5 | Reflection summary + optional notes |

---

## UI Layout

### Business Tab Layout
```
┌─────────────────────────────────────────────┐
│  MAIN TABS                                  │
│  Business | Groans | Healing | Tracker | +  │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  STAGE TABS (unchanged position)            │
│  1 | 2 | 3 | 4 | 5 | 6 | 7                  │
├─────────────────────────────────────────────┤
│  SUB-TABS (new - BELOW stage tabs)          │
│  Tasks | Voices                             │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  QUEST CARDS                                │
└─────────────────────────────────────────────┘
```

### Healing Tab Layout
```
┌─────────────────────────────────────────────┐
│  MAIN TABS                                  │
│  Business | Groans | Healing | Tracker | +  │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  SUB-TABS (new)                             │
│  Daily | Weekly                             │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  QUEST CARDS                                │
└─────────────────────────────────────────────┘
```

### Styling Notes
- Sub-tabs use same styling as existing stage tabs
- Reuse `.stage-tabs-wrapper` background/border pattern
- Same purple accent colors (#5e17eb, #8b5cf6)
- Same card shadows and border-radius
- Header, main tabs, stage tabs, quest cards all unchanged

---

### Example UI: Stage 1 Validation - Essence Voice

```
┌─────────────────────────────────────┐
│ 🔍 Stage 1: Validation              │
└─────────────────────────────────────┘

✨ Radiant Rebel
"You ignite courage in the quiet..."

How did your Radiant Rebel share
your idea boldly today?

         [Next →]
```

```
Step 2:
📝 Describe the moment

[textarea]

How aligned did you feel?
😐 [1] [2] [3] [4] [5] ✨

         [Next →]
```

```
Step 3:
✅ Review your reflection
• Essence: Radiant Rebel
• Stage: Validation
• Situation: [their text]
• Alignment: 4/5

         [Complete ✓]
```

---

## Summary

| Destination | Quest Count |
|-------------|-------------|
| Business → Voices | 21 new quests (7 stages × 3 types) |
| Healing → Daily | +6 quests (Future Successful You + 5 Reconnect practices) |
| Healing → Weekly | +4 quests (Make It A Hell Yea + 3 lifestyle quests) |
| Archive | 3 quests removed |

---

## Implementation Steps

### Phase 1: Data Layer

1. **Update `stageConfig.js`**
   - Add `essenceAction` and `protectiveBlock` text for each stage
   - Add `groanChallenge` text for each stage

2. **Create `voiceQuestConfig.js`** (new file)
   - Stage-specific prompt templates
   - Helper function to generate personalized questions

### Phase 2: Component Updates

3. **Modify `RecogniseQuestInput.jsx`**
   - Accept `stageNumber` prop
   - Remove business area picker when stage is provided
   - Add stage context card component
   - Dynamic question text using stage config + user archetypes

4. **Modify `GroanReflectionInput.jsx`**
   - Accept `stageNumber` prop
   - Use stage-specific groan challenge text
   - Add stage context card

### Phase 3: Challenge Integration

5. **Update `useChallengeData.js`**
   - Add Voices sub-tab logic
   - Generate stage-specific quest cards
   - Track completions per stage per quest type

6. **Update `Challenge.jsx`**
   - Add sub-tab UI for Business (Tasks | Voices)
   - Render Voices quests filtered by current stage
   - Update Healing tab with Daily | Weekly sub-tabs

### Phase 4: Quest Movement

7. **Move quests to Healing → Daily**
   - Future Successful You
   - Meditation, Breathwork, Rise & Vibe Dance, Daily Prayer, Self-Identified Activity

8. **Move quests to Healing → Weekly**
   - Make It A Hell Yea
   - Dopamine Diet Change, Environment Hygiene, Weekly Self-Identified Task

9. **Archive deprecated quests**
   - Protective to Essence Shift, Generic Groan Challenge, Essence Voice Groan (weekly)
   - Remove from quest definitions
   - Keep completion history intact

### Phase 5: Testing & Polish

10. **Test all flows**
    - Verify personalization with different archetype combinations
    - Test stage transitions
    - Verify completion tracking

11. **Update points system if needed**
    - Ensure Voices quests award appropriate points

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/stageConfig.js` | Add voice prompt configs per stage |
| `src/lib/voiceQuestConfig.js` | New file - quest generation helpers |
| `src/components/RecogniseQuestInput.jsx` | Stage-aware mode, context card |
| `src/components/GroanReflectionInput.jsx` | Stage-aware mode |
| `src/hooks/useChallengeData.js` | Voices sub-tab logic, quest generation |
| `src/Challenge.jsx` | Sub-tab UI, tab restructure |
| `src/components/QuestCard.jsx` | May need updates for Voices display |
| `public/challengeQuestsUpdate.json` | Update quest definitions |

---

## Database Considerations

- Existing `quest_completions` table should work — just new `quest_id` values
- `groan_reflections` table already has `stage` column — verify it's used
- May need to add `quest_type` enum: `essence_voice`, `protective_voice`, `stage_groan`

---

*Last updated: January 2026*
