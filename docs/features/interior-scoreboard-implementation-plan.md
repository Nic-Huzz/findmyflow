# Interior Scoreboard — Implementation Plan

*Created: July 2026. Status: Ready to build.*

## What We're Building and Why

### The big picture (explain it like I'm 12)

Right now the app helps you discover who you are and do brave things. But it doesn't SHOW you that you're growing. You complete a challenge and get a checkmark. That's it.

We're adding ways for you to SEE your progress:
- **How clear you are** about who you're becoming (Clarity score)
- **What skills you're developing** through your challenges (Skill tree)
- **Your favorite "I am" statements** that you collect over time
- **How unique your combination is** compared to 299 famous builders (Monopoly score, Scale app only)

---

## Sprint Overview

### Sprint 0: Fix the plumbing (1-2 days)
**What:** Make sure courage challenges and quests are properly connected in the database.
**Why:** Right now, 4 courage challenges are orphaned (not connected to any quest) and 8 quest tasks have no matching courage challenge. If we build metrics on broken data, the numbers will be wrong and users won't trust them.
**Confidence: 85%**

### Sprint 1: Organize tasks + remember your "I am" statements (2-3 days)
**What:** Let people tag tasks as "this week / this month / this quarter." Show a dropdown of previous identity statements when completing a courage challenge so you can reuse your favorites.
**Why:** Tasks are currently a flat list with no sense of time. And every "I am someone who..." statement disappears after you write it. Both should accumulate and be visible.
**Confidence: 95%**

### Sprint 2: Rate your mirror + see your Clarity score (3-4 days)
**What:** After completing Life Map, the app shows you what it thinks your skills, wounds, and audience are. You rate each one 1-5: "This IS me" to "That's not me." Your average rating = your Clarity score (shown on /me page).
**Why:** The app already generates a mirror of who you are. But it never asks "did we get it right?" This closes the loop. Clarity score gives you one number that shows you're getting clearer over time.
**Confidence: 85%**

### Sprint 3: Tag quests with skills + start the skill tree (2-3 days)
**What:** When you create a life path quest, the AI figures out which skills it uses (performing, coaching, building, etc). In the background, start counting XP per skill from your courage challenges. Let users set their starting level per skill.
**Why:** So the app knows "Dance Facilitator = performing skill." Then every challenge on that quest gives you performing XP. Eventually this becomes a visible skill tree showing what you're developing.
**Confidence: 85%**

### Sprint 4: Smarter curiosity analysis + mirror re-generation (3-4 days)
**What:** When you enter books/podcasts, the AI now also identifies which skills and wounds they relate to (not just which branch). After every 5 courage challenges on a skill, the AI re-generates your mirror cluster and asks if the updated version feels more right.
**Why:** Your curiosities (books you read) and your actions (challenges you do) should both sharpen the same picture of who you are. The mirror gets more accurate the more you use the app.
**Confidence: 90%**

### Sprint 5: Show progress on every completion (2-3 days)
**What:** After completing any task, see: progress bar, courage trend (🔥🔥😌🔥), identity statements collected, and quest alignment. After completing a to-do, one quick tap: "Lit me up / Was okay / Bored."
**Why:** Every action should feel like it moved you forward. No checkmark should disappear into the void.
**Confidence: 85%**

---

## Sprint 0: Data Integrity (1-2 days)

### Fix 1: Add FK constraint
Add proper foreign key on `quest_tasks.groan_challenge_id` → `groan_challenges.id` with ON DELETE SET NULL. First clean any stale references.

### Fix 2: Fix broken code paths
| File | Issue | Fix |
|---|---|---|
| UnstickFlow.jsx | Creates courage quest_task without groan_challenge | Also create groan_challenge and link |
| HealingIntentionsList.jsx | Same | Same |
| WahooCreator.jsx "from list" | Accepts groan_challenge without creating quest_task | Also create quest_task and link |

### Fix 3: Add quest_id to groan_challenges
Migration: `ALTER TABLE groan_challenges ADD COLUMN quest_id uuid REFERENCES quests(id) ON DELETE SET NULL`

Backfill: `UPDATE groan_challenges gc SET quest_id = qt.quest_id FROM quest_tasks qt WHERE qt.groan_challenge_id = gc.id`

Update all creation code paths (WahooCreator, QuestPathMap, WahooDiscoveryFlow, life paths matrix) to set quest_id on insert.

---

## Sprint 1: Timeframe Tags + Identity Statement Library (2-3 days)

### Timeframe tags
- Add `timeframe` text field to `quest_tasks` (week / month / quarter, default: week)
- 3-option picker on task creation UI
- Group tasks by timeframe on quest card

### Identity Statement Library
- Query previous identity_statements from `quest_completions.reflection_text`
- Show dropdown (sorted by frequency) + free text input on GroanCompletionModal
- Each reuse = a vote. Top statements = strong identity signal.

---

## Sprint 2: Cluster Resonance Rating + Clarity Score (3-4 days)

### After Life Map completion
- New screen: "Here's what we found. Does this feel right?"
- Each cluster: name, items, 1-5 dot rating, remove button
- "Add a cluster that's missing" at bottom
- Save `resonance_rating` + `resonance_updated_at` on nikigai_clusters

### Clarity score
- Average resonance of KEPT clusters (removed ones excluded)
- Display on /me page: `Clarity 80% ↑`
- One number, tappable for detail

### DB changes
- nikigai_clusters: add `resonance_rating` integer, `resonance_updated_at` timestamp, `behavioral_evidence` integer, `is_removed` boolean

---

## Sprint 3: Quest Skill Tagging + Background Skill Tree (2-3 days)

### Quest auto-tagging (skills only)
- On quest creation: AI maps label → `skill_tags[]`
- Problems + personas stay at user level (Life Map clusters), not quest level
- Backdate ~80 existing quests

### Background skill tree collection
- New table: `user_skill_progress` (user_id, skill_id, xp, level, updated_at)
- On courage challenge completion: quest's skill_tags determine which skills get +1 XP
- XP thresholds: L0→L1 at 3, L1→L2 at 8, L2→L3 at 15, L3→L4 at 25 (tunable)
- "Set starting level" option per skill (user self-reports baseline, challenge data adds on top)
- No UI yet — collect in background, display later

### DB changes
- quests: add `skill_tags` text[]
- New table: `user_skill_progress` (user_id, skill_id text, xp integer, level text, updated_at timestamp)

---

## Sprint 4: Extend classify-curiosities + Re-generation (3-4 days)

### classify-curiosities extension
- Add skill and problem taxonomy definitions to AI prompt
- Output: each cluster gets `skills[]` + `problems[]` alongside existing `branch`
- Update CuriosityMapFlow.jsx to save new fields

### Cluster re-generation trigger
- After 5 courage challenges on quests sharing skill_tags with a cluster:
  - Edge function takes original cluster + challenge outcomes + identity statements
  - Returns updated cluster name/description
  - In-app prompt: "Based on your recent challenges, [old] has evolved to [new]. Does this feel more right?"
  - User re-rates ONE cluster
  - Clarity % updates

### Also tag nikigai_clusters with taxonomy
- Post-processing after nikigai-conversation runs at Life Map completion
- AI maps freeform cluster labels → skill_tags[], problem_tags[], persona_tags[]

### DB changes
- nikigai_clusters: add `skill_tags` text[], `problem_tags` text[], `persona_tags` text[]
- curiosity_clusters: add `skills` text[], `problems` text[]

---

## Sprint 5: Per-Completion Progress + To-do Signal (2-3 days)

### Quest card progress
- Progress bar: X/Y tasks done
- Courage trend: last N wahoo classifications as emoji row (🔥🔥😌🔥)
- Top identity statement with frequency
- Quest alignment % (from sprint 3 tag data)

### To-do "lit me up" signal
- After tapping ✓ on any to-do, inline on quest card: 🔥 Lit me up / 😐 Was okay / 😴 Bored
- One tap, then disappears

### Courage challenge depth prompts
- Standard flow (all): 4-state + identity statement dropdown + 3% check
- L0 extra: "Lit me up / Was okay / Bored"
- L3 extra: "What did you earn?" (Scale app)
- L4 extra: "How many people?" (Scale app)

### DB changes
- quest_tasks: add `task_signal` text (lit_me_up / was_okay / bored)

---

## Dependencies

```
Sprint 0 → no dependencies (do first)
Sprint 1 → no dependencies (can start immediately)
Sprint 2 → no dependencies (can run parallel with Sprint 1)
Sprint 3 → Sprint 0 (needs clean data for quest_id on groan_challenges)
Sprint 4 → Sprint 3 (needs skill_tags on quests before re-generation)
Sprint 5 → Sprints 3+4 (needs tags + challenge data to show progress)
```

Sprints 0+1+2 can run in parallel. Sprints 3→4→5 are sequential.

**Total: ~12-16 days across 6 sprints.**

---

## All Database Changes (consolidated)

### Migrations needed

**Sprint 0:**
- FK constraint: `ALTER TABLE quest_tasks ADD CONSTRAINT fk_groan_challenge FOREIGN KEY (groan_challenge_id) REFERENCES groan_challenges(id) ON DELETE SET NULL`
- New column: `ALTER TABLE groan_challenges ADD COLUMN quest_id uuid REFERENCES quests(id) ON DELETE SET NULL`
- Backfill: `UPDATE groan_challenges gc SET quest_id = qt.quest_id FROM quest_tasks qt WHERE qt.groan_challenge_id = gc.id`

**Sprint 1:**
- `ALTER TABLE quest_tasks ADD COLUMN timeframe text DEFAULT 'week'`

**Sprint 2:**
- `ALTER TABLE nikigai_clusters ADD COLUMN resonance_rating integer`
- `ALTER TABLE nikigai_clusters ADD COLUMN resonance_updated_at timestamptz`
- `ALTER TABLE nikigai_clusters ADD COLUMN behavioral_evidence integer DEFAULT 0`
- `ALTER TABLE nikigai_clusters ADD COLUMN is_removed boolean DEFAULT false`

**Sprint 3:**
- `ALTER TABLE quests ADD COLUMN skill_tags text[]`
- New table: `CREATE TABLE user_skill_progress (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id), skill_id text NOT NULL, xp integer DEFAULT 0, level text DEFAULT 'education', updated_at timestamptz DEFAULT now(), UNIQUE(user_id, skill_id))`

**Sprint 4:**
- `ALTER TABLE nikigai_clusters ADD COLUMN skill_tags text[]`
- `ALTER TABLE nikigai_clusters ADD COLUMN problem_tags text[]`
- `ALTER TABLE nikigai_clusters ADD COLUMN persona_tags text[]`
- `ALTER TABLE curiosity_clusters ADD COLUMN skills text[]`
- `ALTER TABLE curiosity_clusters ADD COLUMN problems text[]`

**Sprint 5:**
- `ALTER TABLE quest_tasks ADD COLUMN task_signal text`

---

## Consumer App Metrics (what users see)

| Metric | What it is | Where it shows | When it's ready |
|---|---|---|---|
| **Capacity** | How safe your nervous system feels (0-100) | Quest tab header | Already exists |
| **Clarity** | How well you know who you are (0-100%) | /me page | Sprint 2 |
| **Skill tree** | Your skills leveling up (L0-L4 per skill) | TBD — future sprint | Sprint 3 (background) |

## Scale App Metrics

| Metric | What it is | Where it shows | When it's ready |
|---|---|---|---|
| **Monopoly Score** | How unique your combination is vs 299 builders | Scale dashboard | Future sprint |
| **Alignment** | % income from aligned path | Scale dashboard | Needs L3 prompts |

---

## Related Docs

- `docs/features/interior-scoreboard-spec.md` — full spec with metric definitions, per-completion UX, design evolution
- `docs/features/monopoly-engine-spec.md` — Monopoly Score calculation with Huzz worked example
- Obsidian: `Frameworks/Collect Connect Your Flow.md` — spine framework
