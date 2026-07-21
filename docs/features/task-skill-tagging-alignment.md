# Task-Level Skill Tagging + Alignment Detection

*Created: July 18 2026. Status: Spec.*

## The Problem

Quests are tagged with skills (e.g., Dance Events → `performing, connecting`). But a quest contains many tasks that use DIFFERENT skills. "Host silent disco" uses `performing`. "Sales calls for Sprouter" uses `connecting`. "Build landing page" uses `building`.

Currently XP is awarded per quest skill on every courage challenge completion. A dance quest tagged `performing, connecting` awards both skills even when the task was "cold call 10 venues." Task-level tagging means XP goes to the right skill.

## What This Enables

### 1. Accurate skill tracking + badges
"You've completed 25 tasks using your performing skill. Performer L3 unlocked."

### 2. Alignment detection
User's nikigai says top skills = `performing, coaching`. But their last 30 completed tasks are 60% `building`, 20% `creating`, 10% `performing`. The app surfaces: "You're spending most of your time building. Your nikigai says performing lights you up. Are you avoiding the stage?"

### 3. Skill-level XP accuracy
XP goes to the skill the task actually used, not all quest skills equally.

## What Already Exists

| Piece | Status | Location |
|-------|--------|----------|
| 10 skill definitions | Built | `classify-quest-skills/index.ts` lines 10-20 |
| AI quest skill tagger (Haiku) | Built | `questSkillTagger.js` → edge function |
| `quests.skill_tags` column | Built | Migration 20260718000002 |
| `user_skill_progress` table | Built | Migration 20260718000005 |
| `increment_skill_xp()` RPC | Built | Same migration |
| `awardSkillXP()` function | Built | `skillProgress.js` lines 30-44 |
| L0-L4 level calc from XP | Built | RPC: 0→L0, 3→L1, 8→L2, 15→L3, 25→L4 |
| Nikigai skill clusters | Built | `nikigai_clusters` with `skill_tags` column |
| Branch scoring | Built | `useBranchScoring.js` |
| Skill level picker modal | Partial | State in LevelTab, UI never rendered |
| Skill level display | Missing | No component |
| Task-level skill tags | Missing | Only quests are tagged |
| Alignment check | Missing | No comparison logic |

## Design

### Input Guidance for Courage Challenges

WahooCreator currently shows "What's the scary thing you want to do?" as a placeholder. Add a subtitle hint beneath the input:

```
e.g. "Host a breathwork session at a retreat" or "Cold call 10 venue owners"
```

This guides users toward **action + context** format, which gives the classifier (keyword or AI) a clear verb to tag. The action verb maps directly to a skill: host → performing, call → connecting, build → building, post → speaking_up.

No changes to the main prompt. Just the subtitle hint.

### Task-Level Skill Tagging

**New column:**
```sql
ALTER TABLE quest_tasks ADD COLUMN skill_tags text[];
```

**When to tag:** On task creation (courage challenges + regular to-dos).

**How to tag — hybrid 3-tier:**

1. **Expanded keyword classifier (instant, free).** Try matching task text against skill keywords. Covers ~60% of well-written tasks.

```javascript
export function classifyTaskSkills(taskText) {
  const t = taskText.toLowerCase()
  const matches = []

  const SKILL_KEYWORDS = {
    performing:   /\b(host(ed|ing)?|perform(ed|ing)?|facilitat\w*|dj\w*|danc\w*|present(ed|ing)?|disco|comedy|sing(ing)?|magic|improv|flash.mob|open.mic|gig|concert)/i,
    storytelling: /\b(story|narrat\w*|content|writ(e|ten|ing)|blog|newsletter|reel|film(ed|ing)?)/i,
    teaching:     /\b(teach|taught|mentor\w*|explain|workshop|masterclass|course|lesson|curriculum)/i,
    coaching:     /\b(coach\w*|guid(e|ed|ing)|1.on.1|check.in|debrief)/i,
    creating:     /\b(creat\w*|made|develop\w*|record\w*|compos\w*|prototyp\w*|invent)/i,
    building:     /\b(build|built|code[ds]?|coding|app|platform|system|automat\w*|ship(ped)?|launch(ed)?|deploy)/i,
    designing:    /\b(design\w*|layout|visual|brand\w*|ux|ui|mockup|wireframe)/i,
    leading:      /\b(lead|led|organis\w*|manag\w*|coordinat\w*|hire[ds]?|recruit\w*|team|direct(ed)?)/i,
    connecting:   /\b(connect\w*|network\w*|call(ed|ing)?|reach\w*|pitch\w*|sell|sold|dm|email\w*|outreach|cold|messag\w*|contact\w*)/i,
    speaking_up:  /\b(speak|spoke|shar(e[ds]?|ing)|post(ed|ing)?|publish\w*|vulnerab\w*|admit|confess|public(ly)?|announc)/i,
  }

  for (const [skill, rx] of Object.entries(SKILL_KEYWORDS)) {
    if (rx.test(t)) matches.push(skill)
  }
  return matches.length > 0 ? matches.slice(0, 2) : null // max 2 skills
}
```

2. **If no keyword match → inherit quest's `skill_tags`.** The quest is already AI-tagged. A task on a `performing, connecting` quest inherits both. Imprecise but not wrong.

3. **Future v2: AI refinement.** Extend `classify-quest-skills` to accept task text + quest context and pick the 1-2 most relevant skills. Only needed if keyword + fallback proves too imprecise.

### Skill XP on Task Completion

Change `awardSkillXP` to use task-level tags when available:

```javascript
// Courage challenges: task tags → quest fallback
// Regular to-dos: task tags ONLY (no quest fallback — prevents inflation)
const skillsToAward = task.skill_tags?.length > 0
  ? task.skill_tags
  : task.is_courage_challenge ? quest.skill_tags : null

if (skillsToAward) awardSkillXP(userId, skillsToAward)
```

**XP rules:**
- Courage challenge: +1 XP per matched skill. Falls back to quest skill_tags if no task tags.
- Regular to-do: +1 XP per matched skill. **No fallback** — only awards XP if the keyword classifier found a skill match. Prevents "update spreadsheet" inflating performing XP just because it's on a performing quest.

### Alignment Detection

**Data sources:**
1. **What the user says matters:** `nikigai_clusters` where `cluster_type = 'skills'` and `is_favourite = true`. Extract unique `skill_tags` across all favourited clusters.
2. **What the user actually does:** `quest_tasks` completed in last 30 days, grouped by `skill_tags`.

**Huzz's nikigai skills (verified from DB):**
- `performing` (2x), `coaching` (2x), `designing`, `building`, `leading`, `teaching` (1x each)

**Alignment score:**
```javascript
function calculateAlignment(nikigaiSkills, taskSkillCounts) {
  const totalTasks = Object.values(taskSkillCounts).reduce((a, b) => a + b, 0)
  if (totalTasks < 5) return null // not enough data
  const alignedTasks = nikigaiSkills.reduce((sum, skill) =>
    sum + (taskSkillCounts[skill] || 0), 0)
  return Math.round((alignedTasks / totalTasks) * 100)
}
```

**Surfacing misalignment:**
- Score < 40%: "Most of your recent work uses skills outside your nikigai. You might be in someone else's zone of genius."
- Score 40-70%: "Mixed. Some aligned work, some drift."
- Score > 70%: "Strongly aligned. Your actions match your self-knowledge."

**Where to show:** Zone Matrix (LevelTab), Zarlo Brief (proactive nudge), or a new Alignment card on Journey tab.

### Skill Level Display on /mirror

The `user_skill_progress` table already tracks XP and level. The `/mirror` page is described as "Clarity home: cluster re-rating, identity statements, skill tree, re-gen flow" — skill display belongs here.

**Skill counter grid on /mirror:** Show each of the 10 skills the user has XP in:

```
Performing          L3  ████████░░  15/25 XP
  23 tasks completed

Coaching            L2  ██████░░░░  10/15 XP
  12 tasks completed

Building            L2  █████░░░░░   8/15 XP
  8 tasks completed

Connecting          L1  ████░░░░░░   4/8 XP
  6 tasks completed
```

Only show skills with 1+ XP. Sorted by level then XP. Each row shows: skill name, current level, XP progress bar to next level, total tasks completed with that skill.

**Skill pills on quest cards (QuestBoardCard):** Small coloured pills showing the quest's skill tags with user's current level.
```
[Performing L3] [Connecting L1]
```

**Milestone celebrations:** When XP crosses a level threshold, trigger `celebrateLevelUp()` (already exists). "Performing L3 unlocked."

## Build Sequence

### Sprint 1: Skill display on /mirror (45 min)
*Show what already exists before collecting more data.*
1. Skill counter grid on `/mirror` — query `user_skill_progress`, render XP bars + task counts
2. Skill pills on QuestBoardCard (quest's skill_tags with user's current level)
3. Wire the skill level picker modal that exists in LevelTab but never renders
4. Milestone celebration on level-up (wire `celebrateLevelUp`)

### Sprint 2: Tag tasks + input guidance (45 min)
*Improve data quality going forward.*
1. Add subtitle hint in WahooCreator beneath the main prompt
2. Migration: `ALTER TABLE quest_tasks ADD COLUMN skill_tags text[];`
3. `classifyTaskSkills()` function in questSkillTagger.js (expanded keyword classifier)
4. Call on task creation in QuestBoardCard + WahooCreator
5. Backfill: run classifier on existing quest_tasks (keyword match only, no quest fallback for backfill)

### Sprint 3: Fix XP awarding (30 min)
*Route XP to the right skill.*
1. Change `awardSkillXP` calls to use `task.skill_tags` when available
2. Courage challenges: fall back to quest skill_tags if no task tags
3. Regular to-dos: XP only if keyword classifier matched (no quest fallback)
4. Backfill: award retroactive XP for completed tasks that got keyword-matched skill_tags

### Sprint 4: Alignment detection (45 min)
*The payoff.*
1. `useAlignment` hook: compares nikigai skills vs 30-day task skills
2. Alignment score calculation (min 5 tasks threshold)
3. Alignment card on /mirror below skill counter grid
4. Feed into Zarlo Brief for proactive nudge when score < 40%

## Files to Touch

| File | Sprint | Change |
|------|--------|--------|
| `/mirror` page component | 1, 4 | Skill counter grid, alignment card |
| `src/components/QuestBoardCard.jsx` | 1, 2, 3 | Skill pills, tag on creation, XP with task tags |
| `src/components/level/LevelTab.jsx` | 1 | Wire skill level picker modal |
| `src/lib/useCelebrations.js` | 1 | Wire milestone celebration on level-up |
| `src/components/WahooCreator.jsx` | 2 | Subtitle hint + tag courage challenges |
| `supabase/migrations/new` | 2 | Add `skill_tags text[]` to quest_tasks |
| `src/lib/questSkillTagger.js` | 2 | Add `classifyTaskSkills()` with expanded keywords |
| `src/components/GroanCompletionModal.jsx` | 3 | Use task skill_tags for XP |
| `src/lib/skillProgress.js` | 3 | Task-level tags, conditional fallback logic |
| `src/hooks/useAlignment.js` | 4 | New hook: nikigai vs activity comparison |

## Not In Scope

- Dynamic state lines on QuestPathMap (separate feature, prototype done)
- Experience type categories (performing/marketing/outreach) — skills cover this
- AI classifier for tasks (v2 upgrade if keyword + quest fallback proves insufficient)
- Fear Challenges legacy data (historical, not representative of new user flow)
