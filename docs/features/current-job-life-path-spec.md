# Current Job as Life Path — Feature Spec

> Your current job isn't something to escape. It's a training ground with hidden experiences that feed the life you're building.

## The Insight

Most people attracted to this app have pieces of what they love embedded in their current work. An account manager who loves presenting but hates admin. A teacher who loves mentoring but is trapped by curriculum. The dot-connecting happens when they see which dome experiences already exist in their work and which are Vibe Rise vs Stressed.

## The Flow (~90 seconds)

### Step 1: Name it
"What do you currently do for work?"
- Text input (free text, e.g. "Account Manager at a marketing agency")
- Becomes the quest label

### Step 2: Pick experiences
"Which of these experiences are part of your current work?"
- Show dome nodes the user has already rated, grouped by primal
- Each shows their existing NS state from the dome (no re-rating needed)
- User ticks the ones that are part of their job
- Minimum 3 selections

### Step 3: Current dimensions
"Where are you right now with this work?"
- 7 expansion dimensions, each with a simple current-state picker:
  - Duration: how long are your sessions/work blocks?
  - Frequency: how often do you do this?
  - Medium: what format? (in-person / online / hybrid)
  - People: how many people do you work with at once?
  - Money: are you earning from this? (not yet / some / main income)
  - Location: where do you do this? (one place / flexible / anywhere)
  - Independence: who decides what you do? (boss decides / shared / I decide)
- These become the baseline. Courage challenges push beyond them.

### Step 4: Life Fuel (whole job)
"Thinking about your current work overall, which are true?"
- 4 checkboxes (same as post-courage):
  - I did this because I wanted to (Choice)
  - I connected with someone and it made the experience better (Connection)
  - I used or grew a skill I love (Mastery)
  - This served something I care about (Meaning)
- One set for the whole job, not per experience

### Step 5: Summary + quest creation
Show the results, then auto-create:

**What's already alive:**
- Dome experiences rated Vibe Rise / Fun within the job. "These parts of your work are already feeding your flow."

**What's costing you:**
- Dome experiences rated Stressed / Bored within the job. "These parts are draining you."

**Cross-pollination:**
- Where current job experiences overlap with aspirational quest experiences. "You already do presenting at work. Your quest 'Host breathwork sessions' uses the same skill. Your job is already training you."

**Auto-generated courage challenges:**
- For stressed/bored experiences: context-shift challenges using the expansion dimensions as the push
  - "Your presentations are always to the same team (People: 5). This week, present to a new audience."
  - "You only do this online (Medium: online). Try doing it in-person once."
  - "You have zero say in how you do this (Independence: boss decides). This week, propose one change."

**Save:** Creates quest with `is_current_job: true`, tasks from selected experiences, dimension baseline stored on the quest.

## Data Model

### Quest record
Uses existing `quests` table:
```
  label: "Account Manager at XYZ"
  is_current_job: true (new boolean column, default false)
  skill_tags: [] (derived from selected dome node skill inference)
  predicted_state: dominant NS state from selected experiences
  current_dimensions: jsonb (new column) {
    duration: "2-3 hours",
    frequency: "daily",
    medium: "hybrid",
    people: "5-10",
    money: "main_income",
    location: "one_place",
    independence: "shared"
  }
  life_fuel_baseline: jsonb { choice: bool, connection: bool, mastery: bool, meaning: bool }
```

### Quest tasks
Uses existing `quest_tasks` table:
- One task per selected dome experience
- `title`: experience label
- `node_id`: dome node ID (for cross-referencing with dome data)
- `is_courage_challenge`: true for stressed/bored experiences (these become the push)

### Courage challenges
Uses existing `groan_challenges` table:
- Auto-generated from stressed/bored experiences
- `expansion_dimensions`: set to the dimension being pushed (e.g. ["people"] for "present to a new audience")
- Post-completion: normal flow (NS state, identity statement, 3%, Life Fuel checkboxes)

### Migration needed
```sql
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_current_job boolean DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS current_dimensions jsonb;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS life_fuel_baseline jsonb;
ALTER TABLE quest_tasks ADD COLUMN IF NOT EXISTS node_id text;
```

## UI Location

**Quests tab** — "Add your current work" button
- Shows when user has no quest with `is_current_job: true`
- Sits above the quest list, subtle CTA (not blocking)
- After completion: quest card with "Current" badge, distinct from aspirational quests

## Quest Card Differences

Current job quest cards:
- "Current" badge next to the title
- Shows dimension baseline (small pills: "5-10 people", "hybrid", "daily")
- Courage challenges framed as context shifts, not new experiences:
  - Aspirational: "Host a breathwork session"
  - Current job: "Present to a new audience this week"
- Life Fuel baseline visible: shows which channels are present/absent at work

## What This Connects To

- **Dome:** Experiences carry their dome NS ratings. No re-rating.
- **Expansion dimensions:** Current dimensions = baseline. Courage challenges push beyond. Progress tab shows dimension growth.
- **Life Fuel diamond:** Current job courage challenges feed the same diamond as aspirational challenges.
- **Cross-pollination:** Built into GroanCompletionModal. "Did this also feed another path?" connects current job to aspirational quests.
- **Zone Matrix:** Current job challenges count as action.

## What This Does NOT Do

- No new tables (uses quests + quest_tasks + groan_challenges)
- No new tabs or major UI surfaces
- No re-rating of dome experiences
- Not required (optional CTA, not a gate)

## Open Questions

1. Allow multiple current job quests? (day job + freelance) — **Yes** per user request
2. When user changes jobs, do they archive the old quest and create a new one?
3. Should auto-generated courage challenges use AI (edge function) or be template-based from dimension gaps?
