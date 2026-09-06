# Quest Hierarchy Restructure — Spec

## Context

The current quest model is too flat. Users pursue multiple life paths that eventually converge, but the DB has no way to represent this hierarchy. "Vibe Rise" has 70 tasks dumped into one quest when they belong to separate life paths (Dance, App Building, Breathwork). The hierarchy needs to reflect the user's actual journey: separate paths → convergence → category creation.

## Key Decision: Category, Not Brand

**Category** (in the Category Pirates sense) is a new way of framing a problem. You've Framed, Named, and Claimed it. It has a DAM statement, a movement, superconsumers. It's earned through convergence, not assigned at creation.

- "Vibe Rise" IS a category — it rejects the premise of traditional healing and proposes a new one
- "Financial Security" is NOT a category yet — it's a personal goal bucket with no DAM statement
- Categories are earned via the Direction Bridge (Stage 8+), not created upfront

**Paths can exist standalone.** A path without a category is normal Phase 2 state, not a gap to fill.

## The Three Phases of Path Convergence

This maps to the hero's journey stages 7-8:

**Phase 1 (Stages 1-6): Separate threads.** User pursues individual paths. Each has its own dome, growth edges, courage challenges. No suggestion they're connected. Paths are standalone — `category_quest_id` is NULL.

**Phase 2 (Stage 7-8): Connection moment.** User has enough self-knowledge to see the thread. The Phase 2→3 Direction Bridge surfaces problem convergence: "These paths all solve the same problem." User DISCOVERS the connection — app doesn't force it.

**Phase 3 (Stage 8+): Category creation.** User names the unified thing. Paths consciously feed one category. Each path still has its own dome, but a category-level aggregate dome shows the full picture. Category creation is optional but highly recommended — naming the category is what makes everything compound.

## Hierarchy

```
Category (quest_type: 'category', earned via Direction Bridge)
├── Life Path (quest_type: 'path', category_quest_id → parent)
│   ├── Project (quest_experiences, experience_type: 'project')
│   │   └── Tasks / Courage Challenges
│   └── Project
├── Life Path
└── Life Path

Life Path (standalone, category_quest_id = NULL)
├── Project
│   └── Tasks
└── Project
```

### Projects Are The Moveable Unit

When a path serves multiple directions, the path stays but individual projects move. Example: AI Coding is a path with projects (Creel Client, Toby Client, Vibe Rise App). At category creation, "Vibe Rise App" project moves from AI Coding to the new "App Building" path under the Vibe Rise category. Creel Client and Toby Client stay in AI Coding.

Moving a project means:
1. UPDATE `quest_experiences.quest_id` to new path
2. UPDATE `quest_tasks.quest_id` for all tasks under that experience
3. Both in a single transaction to prevent orphans

**Cross-pollination insight:** Moving a project from Path A to Path B IS cross-pollination evidence. The act of migration proves the paths served the same direction. Future: auto-create `quest_cross_pollination` record when a project migrates.

### Huzz's Actual Hierarchy (Post-Migration)

```
Category: "Vibe Rise" (quest_type: 'category')
├── Path: Dance Events
│   └── Project: Monument Disco Tour (8 tasks)
├── Path: App Building
│   └── Project: Find My Flow app (1 task)
├── Path: Breathwork
└── Path: Content

Path: AI Coding (standalone, no category)
  Projects: Creel Client, Toby Client, etc.

Path: Buy Headsets Ecommerce Site (standalone)

Path: Travel Experience Host (standalone)
  Projects: Tuk Tuk Tournament Host, Travel Tournament Host

Path: Fear Challenges → "Personal Growth" (deferred, needs separate conversation)
```

### Single-Path Categories

A single path can create its own category. Buy Headsets could become a category ("affordable equipment for experience creators") when the user goes through the Direction Bridge and recognises it. No requirement for multiple paths to converge.

## Schema Changes

Additive only — no destructive changes.

```sql
ALTER TABLE quests
  ADD COLUMN IF NOT EXISTS quest_type text DEFAULT 'path'
    CHECK (quest_type IN ('category', 'path')),
  ADD COLUMN IF NOT EXISTS category_quest_id uuid
    REFERENCES quests(id) ON DELETE SET NULL;

ALTER TABLE quest_experiences
  ADD COLUMN IF NOT EXISTS experience_type text DEFAULT 'project'
    CHECK (experience_type IN ('project', 'ongoing'));

CREATE INDEX IF NOT EXISTS idx_quests_category_quest_id
  ON quests(category_quest_id) WHERE category_quest_id IS NOT NULL;
```

### What each level maps to in DB

| Concept | DB Table | Key Fields |
|---------|----------|------------|
| Category | `quests` (quest_type: 'category') | label, status, user_id |
| Life Path | `quests` (quest_type: 'path') | label, category_quest_id (nullable), dome data |
| Project | `quest_experiences` (experience_type: 'project') | label, quest_id, status |
| Task / Challenge | `quest_tasks` → `groan_challenges` | quest_id, experience_id |

### Why this works

- Quests already have dome infrastructure (dimension_values on linked challenges, NS checkins, skill_tags, branch, predicted_state)
- `useSafetyDome` is user-global — doesn't filter by quest_id, so category/path split has ZERO impact
- Category dome = aggregate of all child path domes (new query: WHERE category_quest_id = X)
- Experiences already group tasks — just labelled as "projects" conceptually
- No new tables needed
- `ON DELETE SET NULL` — deleting a category makes child paths standalone, never cascade-deletes them

### FK constraints verified

| Table | quest_id type | Impact of task redistribution |
|-------|--------------|------------------------------|
| `quest_tasks` | UUID FK (cascade delete) | UPDATE quest_id — primary operation |
| `quest_experiences` | UUID FK (cascade delete) | UPDATE quest_id when moving projects |
| `quest_cross_pollination` | UUID (source + target) | Leave as-is, 4 historical records |
| `quest_completions` | TEXT (soft link) | No impact — not a real FK |
| `nervous_system_checkins` | TEXT (soft link) | No impact — not a real FK |
| `groan_challenges` | No direct quest_id | Links through quest_tasks — follows automatically |
| `healing_intentions` | No direct quest_id | Links through quest_task_id — follows automatically |

## Category Creation Flow (Direction Bridge Card 3.5)

Category creation lives in the Direction Bridge as a new card between Multiplication Reveal (Card 3) and Money Model (Card 4). Triggers at Stage 8.

```
Direction Bridge (Stage 8, Discover tab):
  Card 1: Life Map Review           ← existing
  Card 2: Problem Motivation        ← existing
  Card 3: Multiplication Reveal     ← existing
  Card 4: Category Creation         ← NEW (optional but encouraged)
  Card 5: Money Model               ← existing (now informed by category)
  Card 6: First Income              ← existing (triggers Stage 9)
```

### Card 4 flow (bite-size, own component):

**Beat 1: Show paths**
"You've been walking these paths:" → list all active paths with courage challenge counts

**Beat 2: Convergence signal**
"Look at what they share — they all [problem from Card 2]. They all use [skill from Card 3]."

**Beat 3: Retrospective assignment**
"Which of these paths serve this direction?"
Checkboxes for each path. Unselected paths stay standalone.

**Beat 4: Name it**
"This thing you've been building — what do you call it?"
AI suggestion based on DAM formula: `[differentiating word] + [old category]`

**Beat 5: Created**
→ INSERT quest with quest_type: 'category'
→ UPDATE selected paths: SET category_quest_id
→ Unselected paths remain standalone

**Skip option:** Always available. Nudge: "Naming your direction is what makes everything compound." Can return to it later.

### Path creation after category exists

When creating a new path (via ChooseQuestsFlow or manually), one extra question:
"Does this path belong to an existing category?" → dropdown of user's categories + "No, standalone"

## Data Migration (Huzz Only)

### Step 1: Schema migration
Apply the 3 columns + index + constraints.

### Step 2: Upgrade Vibe Rise to category
```sql
UPDATE quests SET quest_type = 'category'
WHERE id = '8b07e527-3881-40df-b618-a4e6edd65849';
```

### Step 3: Create life path quests under Vibe Rise
Create 4 new path quests:
- "Dance Events" (category_quest_id → Vibe Rise)
- "App Building" (category_quest_id → Vibe Rise)
- "Breathwork" (category_quest_id → Vibe Rise)
- "Content" (category_quest_id → Vibe Rise)

Existing standalone quests stay standalone:
- "Buy Headsets Ecommerce Site" — no category yet
- "Travel Experience Host" — no category yet
- "AI Coding" — stays standalone (client work)

Old completed quests left as historical artifacts:
- "Dance Event Hosts for 1000s of people" (completed) — kept for history
- "Breathwork" (completed) — kept for history
- "AI Coding" (completed) — stays as-is

### Step 4: Move existing projects to correct paths
**Transaction required** — update both quest_experiences and quest_tasks atomically.

- "Monument Disco Tour" project (8 tasks) → Dance Events path
- "Find My Flow app" project (1 task) → App Building path

### Step 5: Redistribute ungrouped tasks (with user confirmation per group)
61 tasks currently under Vibe Rise with no experience_id. Move to correct path quests.

Pre-sorted groups for confirmation:

**→ Dance Events (19 tasks)**
Barcelona Monument Rave, Amsterdam Monument Rave, Eiffel Tower Monument Rave, Monument Rave Copenhagen, Times Square Flash Mob | Silent Disco at Bondi, Silent Disco Opera House, Silent Disco Koh Phangan, Silent Disco KL Airport, First Paid Silent Disco | Seminyak Pop-up, Opera House, First Pump-Up Before Disco, First Celebrate the Day | Host vibe rise fest, Retreat Disco + Breathwork | Dance with Local, Pop-up with Local Indonesians, Film Dance Videos with Randoms

**→ Content (10 tasks)**
Yap, Create different video types, Experiment with trial reel viral content | These words HBF promo video, Film & share your hostel mission | Share Paid Workshop on Socials, Share story about fantasy | Time Warp Playlist / First Podcast, Guerilla Marketing | 100 Reach Outs

**→ App Building (14 tasks)**
Published an app, Scale Portal, Building Nikigai University, First fantasy test | Built MCP session sync, Built OAuth consent page, Deployed edge function | Designed MCP architecture, Hero stage triggers rewrite, Rebranded app | Progress tab brand polish, Quest card redesign, Quest Map timeline | QA sweep, WahooCreator subtitles, WeeklyFocus polish, Updated tagline

**→ Breathwork (3 tasks)**
Healing compass for Krislin retreat, New Coaching Framework, Deliver Teacher Training

**→ Business/Sales (5 tasks — path TBD)**
Sales Calls for Sprouter, Shared Sprouter, Two New Programs | Acquisition partner for events, Create a guide for experience creators

**→ Unclear (3 tasks — ask user)**
Book flights, Close hostel partner, Sourced backup headsets

**→ Bounce Series (3 tasks — Dance Events sub-project?)**
Bounce around berlin, Bounce around + connect with wellness communities, Bounce around handing out flyers

### Step 6: Update cross-pollination records
4 historical records. Custom-update since single user:
- AI Coding → Vibe Rise: leave (historical)
- Dance Event Hosts → Vibe Rise: update target to Dance Events path if desired
- Breathwork → Vibe Rise: update target to Breathwork path if desired
- Vibe Rise → Travel Experience Host: leave (still valid)

## Dome at Each Level

| Level | Dome computation | What it shows |
|-------|-----------------|---------------|
| Category | Aggregate of all child path domes | Full capacity across everything in this direction |
| Life Path | Challenges filtered by quest_id + after_state | Capacity on this specific pursuit |
| Project | Challenges filtered by experience_id | How much this project stretched you (snapshot) |

Note: `useSafetyDome` is currently user-global (no quest filtering). Per-path and per-category domes are a future enhancement — the data structure supports it, the hook just needs a filter param.

## Connection to Prediction Error + Voice Patterns

Voice patterns are per-path, not per-category. Ghost might live on Dance Events (vulnerability) but not on App Building (where Perfectionist lives). Pattern detection should scope to path-level.

The category-level dome reveals which paths contribute which spokes: "Dance gives you Vulnerability. Coding gives you Business Commitment. Together they make a complete dome."

## Tech Debt: Single Dome Label Source of Truth

Experience dome node labels are defined in 3 places that can drift out of sync:
1. `EXPERIENCE_LABELS` in `experienceDomeConfig.js` (primary, used by `getExperienceLabel()`)
2. `experienceIndustryMap.json` (has its own `label` field per node)
3. `domeSkillInference.json` (has its own `label` field per node)

Note: `ruleBreakTreeData.js` also has labels for the same node IDs, but those serve the Rule Break Tree visualization (with `\n` line breaks for layout). They're a separate system, not a dome label source.

**Fix:** The JSON files should either: (a) drop their `label` fields and resolve via `getExperienceLabel()` at runtime, or (b) be generated from `EXPERIENCE_LABELS` at build time. Until fixed, any dome label change must be updated in all 3 locations.

## UX Needed (Post-Restructure)

### Project creation + challenge reallocation UI
Users need to be able to:
1. **Create new projects** within a path (group related tasks/challenges)
2. **Move courage challenges** between projects and between paths
3. **Move projects** between paths (the moveable unit)

These are drag/tap interactions on the Paths tab or QuestBoardCard. Design TBD — the schema supports all of these (UPDATE quest_id / experience_id on quest_tasks and quest_experiences).

Project creation is organic: user does several related courage challenges, notices a pattern, creates a project and assigns existing challenges to it. The app could also prompt this via Zarlo or weekly review after N similar challenges on one path.

## Resolved Questions

1. **Fear Challenges disposition** → "Personal Growth" path. Longer conversation needed, deferred.
2. **Content path** → Under Vibe Rise for now. Each category could have its own content tasks in future.
3. **Category creation UX** → Card 3.5 in Direction Bridge, optional but encouraged.
4. **Can a path move between categories?** → Yes, UPDATE category_quest_id.
5. **Can a single path create a category?** → Yes.
6. **Brand vs Category** → Category (CP sense). Earned, not assigned.
7. **AI Coding split** → Path stays standalone for client work. Individual projects (like Vibe Rise App) move to category paths.
8. **Projects as moveable unit** → quest_experiences move between paths via quest_id UPDATE + task quest_id UPDATE in single transaction.
9. **Cross-pollination from project moves** → Future: auto-create cross_pollination record when project migrates between paths.
