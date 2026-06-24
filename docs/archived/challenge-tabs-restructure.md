# Challenge Tabs Restructure Plan

## Overview

This document outlines the restructuring of the 7-day challenge tabs from the current Daily/Weekly structure to a new category-based structure with improved filtering.

**Date:** December 2024

---

## Current vs New Tab Structure

### Current Tabs
- Daily
- Weekly
- Tracker
- Flow Finder
- Bonus

### New Tabs
| Tab | Description | Quest Count |
|-----|-------------|-------------|
| **Groans** | Growth, awareness, and daily practice quests | ~20 |
| **Healing** | Nervous system work, release practices | 5 |
| **Flow Finder** | Persona/stage-specific flows & milestones | 30+ |
| **Tracker** | Flow Compass tracking | 2 |
| **Bonus** | Feedback, sharing, extras | 5 |

---

## Groans Tab - Filtering Design

The Groans tab contains ~20 quests and requires filtering to remain usable.

### Recommended Approach: Chip Filters + Daily/Weekly Toggle

```
┌─────────────────────────────────────┐
│ [Daily ○] [Weekly ○]                │  ← Frequency toggle
│                                     │
│ [All] [Recognise] [Rewire] [...]    │  ← R-type chip filters
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Quest cards...                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Features:**
- Horizontal chip filters for R-types (Recognise, Release, Rewire, Reconnect)
- Tap to filter, tap again to deselect
- Daily/Weekly toggle as secondary filter
- "All" chip to reset filters

---

## Complete Quest Allocation

### Groans Tab (20 quests)

#### Recognise (5 quests)
| ID | Name | Frequency |
|----|------|-----------|
| `recognise_essence_observe` | Essence Voice | Daily |
| `recognise_protective_observe` | Protective Voice | Daily |
| `recognise_positive_frequency` | Positive Frequency | Daily |
| `recognise_negative_frequency` | Negative Frequency | Daily |
| `recognise_nonfiction_content` | Identify Your Curiosities | Weekly |

#### Rewire (7 quests)
| ID | Name | Frequency |
|----|------|-----------|
| `rewire_behavior_change` | Embody Your Essence | Daily |
| `rewire_dopamine_diet` | Dopamine Diet Change | **Weekly** |
| `rewire_future_successful_you` | Future Successful You | Daily |
| `rewire_protective_to_essence` | Protective to Essence Shift | Daily |
| `rewire_hell_yea` | Make It A Hell Yea | Daily |
| `rewire_3_percent_better` | 3% Better | Weekly |
| `reconnect_groan_wheel` | Essence Voice Groan | Weekly |

#### Reconnect (7 quests)
| ID | Name | Frequency |
|----|------|-----------|
| `reconnect_morning_meditation` | Meditation | Daily |
| `reconnect_morning_dance` | Rise & Vibe Dance | Daily |
| `reconnect_morning_breathwork` | Breathwork | Daily |
| `reconnect_self_identified` | Self-Identified Activity | Daily |
| `reconnect_daily_prayer` | Daily Prayer | Daily |
| `reconnect_weekly_task` | Weekly Self-Identified Task | Weekly |
| `reconnect_remove_negative` | Environment Hygiene | Weekly |

#### Challenge (1 quest)
| ID | Name | Frequency |
|----|------|-----------|
| `groan_challenge` | Groan Challenge | Anytime |

---

### Healing Tab (5 quests)

| ID | Name | Type | Frequency |
|----|------|------|-----------|
| `recognise_nervous_system` | Map Nervous System Boundaries | Recognise | Weekly |
| `recognise_healing_compass` | Healing Compass | Recognise | Weekly |
| `release_negative_charge` | Processing Your Emotions | Release | Daily |
| `release_daily_challenge` | Daily Release Challenge | Release | Daily |
| `release_weekly_big` | Big Release | Release | Weekly |

---

### Tracker Tab (2 quests)

| ID | Name | Frequency |
|----|------|-----------|
| `recognise_flow_update` | Daily Flow Update | Daily |
| `recognise_weekly_flow_update` | Weekly Flow Update | Weekly |

---

### Flow Finder Tab (30+ quests)

Persona and stage-specific quests remain unchanged:
- Vibe Seeker: Skills, Problems, Persona, Integration flows
- Vibe Riser: Validation, Creation, Testing, Launch milestones
- Movement Maker: Money Model flows and milestones

---

### Bonus Tab (5 quests)

| ID | Name |
|----|------|
| `bonus_feedback` | Feedback Form |
| `bonus_ig_groan` | Post Your Groan on Instagram |
| `bonus_tell_friend` | Tell a Friend |
| `bonus_essence_ring` | Buy Essence Ring |
| `bonus_challenge_recommendation` | Challenge Recommendation |
| `bonus_elephant_report` | Weekly Reflection |

---

## JSON Structure Changes

### Field Definitions

| Field | Purpose | Values |
|-------|---------|--------|
| `category` | Which TAB the quest appears in | `Groans`, `Healing`, `Tracker`, `Flow Finder`, `Bonus` |
| `type` | R-type for filtering (or persona) | `Recognise`, `Release`, `Rewire`, `Reconnect`, `Vibe Riser`, `Movement Maker`, `challenge`, `anytime` |
| `frequency` | NEW field - when quest can be done | `daily`, `weekly`, `anytime` |

### Example Quest Structure

```json
{
  "id": "recognise_essence_observe",
  "category": "Groans",
  "type": "Recognise",
  "frequency": "daily",
  "name": "Essence Voice",
  "description": "Where did your essence voice show up in your work today",
  "points": 5,
  "inputType": "text",
  "placeholder": "What was the situation? What were you doing?",
  "learnMore": "..."
}
```

---

## Implementation Steps

### Step 1: Update `challengeQuestsUpdate.json` ✅
- [x] Change `category` values to new tab names
- [x] Add `frequency` field to all quests (daily/weekly/anytime)
- [x] Change `rewire_dopamine_diet` to weekly
- [x] Verify all quests are correctly allocated

### Step 2: Database Migration ✅
- [x] Created migration: `20251220120000_add_groans_healing_categories.sql`
- [x] Update `quest_completions` table CHECK constraint:
```sql
ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS check_quest_category;

ALTER TABLE quest_completions
ADD CONSTRAINT check_quest_category
CHECK (quest_category IN ('Recognise', 'Release', 'Rewire', 'Reconnect', 'Bonus', 'Daily', 'Weekly', 'Tracker', 'Flow Finder', 'Groans', 'Healing'));
```

### Step 3: Update `Challenge.jsx` ✅
- [x] Update tab definitions to new structure (Groans, Healing, Flow Finder, Tracker, Bonus)
- [x] Create R-type chip filter component
- [x] Add Daily/Weekly toggle component
- [x] Update quest filtering logic using `displayQuests`
- [x] Ensure tab switching works correctly

### Step 4: Update Helper Files ✅
- [x] `src/lib/questCompletion.js` - updated to use R-type from `type` field and frequency from `frequency` field
- [x] `src/Challenge.css` - added styles for filter chips

### Step 5: Testing
- [ ] Run database migration: `supabase db push` or apply SQL manually
- [ ] Verify all tabs display correct quests
- [ ] Verify R-type chip filters work
- [ ] Verify Daily/Weekly toggle works
- [ ] Verify quest completion saves with new categories
- [ ] Verify points and streaks calculate correctly
- [ ] Test on mobile for touch/swipe behavior

---

## Migration Notes

### Existing Quest Completions
Existing `quest_completions` records have old category values. Options:
1. **Update existing records** - Run migration to update old categories to new
2. **Allow both** - Temporarily allow old + new values in CHECK constraint
3. **Ignore** - Old records keep old values, only new completions use new values

**Recommended:** Option 3 for simplicity. The category is denormalized anyway (quest ID is the source of truth).

---

## Related Files

- `/public/challengeQuestsUpdate.json` - Quest definitions
- `/src/Challenge.jsx` - Main challenge component
- `/src/lib/questCompletionHelpers.js` - Quest completion helpers
- `/src/lib/questCompletion.js` - Quest completion logic
- `/docs/7-day-challenge-system.md` - Existing challenge documentation
