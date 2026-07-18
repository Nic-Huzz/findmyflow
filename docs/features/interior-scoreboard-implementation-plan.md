# Interior Scoreboard — Implementation Plan

*Created: July 2026. Updated: July 17. Status: Sprint 0 complete, ready for Sprint 1.*

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

### Sprint 0: Fix the plumbing ✅ DONE (July 17)
**What:** Connected courage challenges to quests in the database so the app knows which challenge belongs to which life path.
**Why:** Without this, the app couldn't count progress per skill. 22 challenges were floating in space, not connected to anything.
**Shipped:** `9fca732` (code) + migration `add_quest_id_to_groan_challenges_and_fk` (DB). FK constraint added, quest_id column added + backfilled 116/138 records, createGroanChallenge accepts questId, WahooCreator + UnstickFlow updated.

### Sprint 1: Organize tasks + remember your "I am" statements (2-3 days)
**What:** When you add a task, pick "this week / this month / this quarter." When you finish a courage challenge, see all your previous "I am someone who..." statements and pick one or write a new one.
**Why:** Tasks are a flat list right now with no sense of what's urgent vs later. And every time you write "I am someone who takes risks," it disappears. It should build into a collection you can look back on and feel proud of.
**Confidence: 95%**

### Sprint 2: Rate your mirror + see your Clarity score (3-4 days)
**What:** After the app tells you who you are (Life Map), it asks "did we get this right?" for each thing it found. You rate 1-5. Your average = your Clarity score, shown as one number on your profile.
**Why:** The app already guesses your skills and wounds. But it never checks if it got it right. This closes the loop. And seeing "Clarity: 80%" going up over time shows you you're getting clearer about who you are.
**Confidence: 85%**

### Sprint 3: Tag life paths with skills (2 days)
**What:** When you create a life path, the AI figures out which skills it uses (performing, building, coaching). Backdate existing quests. Validate accuracy before building anything on top.
**Why:** This is the foundation for everything else: skill tree, cluster re-generation, quest alignment. If the AI tagging is inaccurate, everything built on it is wrong. Ship this alone, test it, fix any bad tags, THEN build on top.
**Confidence: 85%**

### Sprint 4: Mirror re-generation + Clarity that moves (2-3 days)
**What:** After every 5 courage challenges on quests tagged with the same skill, the AI re-generates your mirror cluster and asks if the updated version feels more right. You re-rate one cluster. Your Clarity score updates.
**Why:** Without this, Clarity from Sprint 2 is a static number that never changes. This makes it a LIVING score that sharpens the more you use the app. The mirror evolves with you. This is what makes users come back to check their Clarity.
**Confidence: 85%**

### Sprint 4b: Courage challenge counter + identity collection (1 day)
**What:** Above the active courage challenges list, show a counter: "23 courage challenges completed." Tap it to expand a dropdown showing all "I am someone who..." statements with reinforcement counts (e.g., "takes risks to follow passions (×5)"). 
**Why:** Users complete challenges and the count disappears. This makes the ACCUMULATION visible. Seeing "I've done 23 brave things and my top identity is 'takes risks' reinforced 5 times" is motivating. The identity library already exists in the DB from Sprint 1, this just surfaces it permanently.
**Confidence: 90%** — data exists, simple query + display component.

### Sprint 5: Show progress + guidance on every completion (3-4 days)
**What:** After completing any task: progress bar moves, courage trend shows (🔥🔥😌🔥), identity statements collect. After a to-do: "Lit me up / Was okay / Bored." PLUS: Zarlo/Figurine reference your scores. Low Clarity → "Try exploring a new curiosity." Quest with consistent "Pressure" outcomes → "You're skilled here but it doesn't light you up. That might be your Zone of Excellence."
**Why:** A score without guidance is just a number. Guidance without a score is just opinion. Together they create motivation. Every completion should feel meaningful AND tell you what to do next.
**Confidence: 75%** — progress display is clear, guidance layer needs design work with Zarlo/Figurine specs.

### Sprint 6: Skill tree background + curiosity extension (3-4 days)
**What:** Start counting XP per skill from courage challenges (background, no UI yet). "Set your starting level" per skill. Extend curiosity analysis to also identify skills and wounds from books/podcasts.
**Why:** The skill tree is the long-term payoff: seeing your skills level up like a game. But it depends on accurate quest tagging (Sprint 3) and enough challenge data. Collecting in background now, displaying later when there's enough data to be meaningful.
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

## Sprint 3: Quest Skill Tagging Only (2 days)

### Quest auto-tagging (skills only)
- On quest creation: AI maps label → `skill_tags[]`
- Problems + personas stay at user level (Life Map clusters), not quest level
- Backdate ~80 existing quests
- **VALIDATE before proceeding**: review all backdated tags for accuracy. Fix any bad tags manually. Only proceed to Sprint 4 when tagging quality is confirmed.

### DB changes
- quests: add `skill_tags` text[]

---

## Sprint 4: Mirror Re-generation + Clarity That Moves (2-3 days)

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

---

## Sprint 5: Per-Completion Progress + Guidance Layer (3-4 days)

### Quest card progress
- Progress bar: X/Y tasks done
- Courage trend: last N wahoo classifications as emoji row (🔥🔥😌🔥)
- Top identity statement with frequency
- Quest alignment % (from Sprint 3 tag data)

### To-do "lit me up" signal
- After tapping ✓ on any to-do, inline on quest card: 🔥 Lit me up / 😐 Was okay / 😴 Bored
- One tap, then disappears

### Courage challenge depth prompts
- Standard flow (all): 4-state + identity statement dropdown + 3% check
- L0 extra: "Lit me up / Was okay / Bored"
- L3 extra: "What did you earn?" (Scale app)
- L4 extra: "How many people?" (Scale app)

### Guidance layer (Zarlo/Figurine integration)
- When Clarity is low (<60%): Zarlo suggests "Try exploring a new curiosity" or "Complete your Life Map"
- When a quest has 3+ "Pressure" outcomes in a row: warn "You're skilled here but it doesn't light you up. This might be your Zone of Excellence."
- When Clarity increases: Figurine celebrates "Your mirror just got sharper. You rated [cluster] higher than before."
- When identity statements repeat 5+ times: highlight "You keep saying you're someone who [X]. That's becoming part of who you are."

### DB changes
- quest_tasks: add `task_signal` text (lit_me_up / was_okay / bored)

---

## Sprint 6: Skill Tree Background + Curiosity Extension (3-4 days)

### Background skill tree collection
- New table: `user_skill_progress` (user_id, skill_id, xp, level, updated_at)
- On courage challenge completion: quest's skill_tags determine which skills get +1 XP
- XP thresholds: L0→L1 at 3, L1→L2 at 8, L2→L3 at 15, L3→L4 at 25 (tunable)
- "Set starting level" option per skill (user self-reports baseline, challenge data adds on top)
- No UI yet — collect in background, display later

### classify-curiosities extension
- Add skill and problem taxonomy definitions to AI prompt
- Output: each cluster gets `skills[]` + `problems[]` alongside existing `branch`
- Update CuriosityMapFlow.jsx to save new fields

### DB changes
- New table: `user_skill_progress` (id uuid, user_id uuid, skill_id text, xp integer, level text, updated_at timestamp, UNIQUE(user_id, skill_id))
- curiosity_clusters: add `skills` text[], `problems` text[]

---

## Dependencies

```
Sprint 0 ✅ DONE
Sprint 1 → no dependencies (start anytime)
Sprint 2 → no dependencies (can run parallel with Sprint 1)
Sprint 3 → Sprint 0 ✅ (needs quest_id on groan_challenges — done)
Sprint 4 → Sprint 3 (needs skill_tags on quests) + Sprint 2 (needs resonance rating to exist)
Sprint 5 → Sprint 4 (needs re-generation + tags to show alignment/guidance)
Sprint 6 → Sprint 3 (needs skill_tags for XP counting)
```

Sprints 1+2 can run in parallel. Sprint 3 can start anytime.
Sprint 4 needs both 2+3 done. Sprint 5 needs 4. Sprint 6 can run parallel with 5.

```
Week 1:  Sprint 1 + Sprint 2 (parallel)
Week 2:  Sprint 3 (2 days) + Sprint 4 start
Week 3:  Sprint 4 finish + Sprint 5
Week 4:  Sprint 6

Or compressed:
Week 1:  Sprint 1 + 2 + 3 (parallel where possible)
Week 2:  Sprint 4 + 5
Week 3:  Sprint 6
```

**Total: ~15-19 days across 7 sprints (including Sprint 0 done).**

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

**Sprint 4:**
- `ALTER TABLE nikigai_clusters ADD COLUMN skill_tags text[]`
- `ALTER TABLE nikigai_clusters ADD COLUMN problem_tags text[]`
- `ALTER TABLE nikigai_clusters ADD COLUMN persona_tags text[]`

**Sprint 5:**
- `ALTER TABLE quest_tasks ADD COLUMN task_signal text`

**Sprint 6:**
- New table: `CREATE TABLE user_skill_progress (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id), skill_id text NOT NULL, xp integer DEFAULT 0, level text DEFAULT 'education', updated_at timestamptz DEFAULT now(), UNIQUE(user_id, skill_id))`
- `ALTER TABLE curiosity_clusters ADD COLUMN skills text[]`
- `ALTER TABLE curiosity_clusters ADD COLUMN problems text[]`

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

## Open Questions (to resolve before or during sprints)

### L0 learning resources that aren't courage challenges
Currently, to-dos on quests don't capture WHAT the user was learning. A to-do like "Read The Body Keeps the Score" looks the same as "Email 3 venues" — both are just text with a checkmark. We don't know:
- What type of resource it was (book, podcast, course, video)
- The title/name of the resource
- Whether it "lit them up"

This matters because learning resources feed the Curiosity Map and Clarity convergence signal. Without capturing L0 data on to-dos, we miss a major input.

**Options to explore:**
- Add an optional "learning resource" tag on to-do creation (type + title)
- Auto-detect from text ("Read..." or "Watch..." → prompt for resource details)
- Connect to the existing Curiosity Map: "Add this to your curiosity map?" after completing a learning to-do
- Or accept that learning resources are captured separately via the Curiosity Map flow, and to-dos don't need this

**Decision needed:** Sprint 2 or 5 timeframe.

---

## Related Docs

- `docs/features/interior-scoreboard-spec.md` — full spec with metric definitions, per-completion UX, design evolution
- `docs/features/monopoly-engine-spec.md` — Monopoly Score calculation with Huzz worked example
- Obsidian: `Frameworks/Collect Connect Your Flow.md` — spine framework
