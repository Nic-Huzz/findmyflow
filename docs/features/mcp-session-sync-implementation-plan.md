# MCP Session Sync — Implementation Plan (v2)

**Date**: 2026-07-29
**Status**: Design approved, ready to build
**Branch**: `feature/mcp-session-sync`

## Purpose

Turn every Claude session (Code or Desktop) into a passive data collection point for the user's self-knowledge graph. The app becomes a brain that compounds with every AI interaction, without the user opening the app UI.

**Core thesis**: Whoever owns the structured self-knowledge data owns the brain. The MCP server makes it portable across any AI client. See Obsidian: `Frameworks/Whoever Owns The Brain Is King.md`.

**Design principle**: Save evidence, not interpretations. Evidence is permanent. Interpretations change as more data arrives. The edge function collects raw signals (states, voice counts, skill tags, task signals). Claude interprets them conversationally.

## Architecture

Two new MCP tools added to the existing `supabase/functions/mcp-server/index.ts`. One new DB table for context mapping.

```
┌──────────────────────────────────────────────────────────┐
│  Claude (Code or Desktop)                                │
│                                                          │
│  KNOWS CONTEXT:                                          │
│    Code: working directory → quest mapping                │
│    Desktop: project folder → quest mapping                │
│                                                          │
│  Session start:                                          │
│    get_interior_scoreboard                               │
│    → Claude has: scores, skills, quests, life paths,     │
│       evidence counts, context mappings                   │
│    → Claude knows which quest this session maps to        │
│                                                          │
│  During session:                                         │
│    Claude notices patterns from evidence data             │
│    Claude notices alignment signals from task work        │
│                                                          │
│  Session end:                                            │
│    Claude identifies accomplishments from conversation    │
│    Claude matches to quest (from context mapping)         │
│    Claude tags skills (from scoreboard taxonomy)          │
│    Claude asks user: "How did each feel?"                │
│    → commit_progress (single tool call, all writes)      │
│    → Returns: RP, XP, clusters, notable evidence         │
│    Claude reports results like Zarlo                      │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌────────────────────┐
│  MCP Server     │────▶│  Existing RPCs     │
│  (edge function)│     │  increment_skill_xp│
│                 │     │  increment_scores  │
│  2 new tools:   │     │  incr_behav_evid   │
│  scoreboard     │     └────────────────────┘
│  commit         │
└─────────────────┘
```

**Key architectural decision**: Claude (Opus/Sonnet, the user's subscription) does the matching and skill tagging. Not a Haiku API call in the edge function. This is:
- **Cheaper** (no Haiku cost per sync)
- **More accurate** (Claude has full conversation context, not just accomplishment text)
- **Simpler** (one tool call for writes, not a propose → confirm two-phase)
- **Faster** (one round-trip, not two)

---

## New DB Table: `quest_context_mappings`

Maps Claude contexts (directories, project folders) to quests. One-time setup per context.

```sql
CREATE TABLE quest_context_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quest_id uuid REFERENCES quests(id) ON DELETE CASCADE NOT NULL,
  context_type text NOT NULL,  -- 'claude_code_directory' | 'claude_desktop_project'
  context_identifier text NOT NULL,  -- '/Users/nichuzz/creations/headset-rentals' or 'Headset Rentals'
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, context_type, context_identifier)
);

ALTER TABLE quest_context_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mappings" ON quest_context_mappings
  FOR ALL USING (auth.uid() = user_id);
```

---

## Tool 1: `get_interior_scoreboard`

**When called**: Session start. Gives Claude full context about the user.

**Input schema:**
```typescript
interface ScoreboardInput {
  mode?: 'light' | 'full'  // default 'light'
}
```

### Light mode (default, fast)

8 parallel queries:

1. **Clarity + Action Score**: Port `scoreUtilities.js` logic
   - Clarity: `nikigai_clusters` where cluster_stage='final', is_removed=false → count resonance_state in ('vibe_rise','fun') / total
   - Action: 3 sub-queries over rolling 7 days (quest_completions/Groans wahoo_classification, quest_tasks task_signal, nervous_system_checkins/daily state) → aligned / total * 100, null if total < 5
   - Zone: 60% threshold on both axes → quadrant name

2. **RP + Level**: `user_lifetime_scores` where project_id IS NULL → total + level name

3. **Streak**: `challenge_instances` most recent → streak_count (or compute from nervous_system_checkins)

4. **Skills**: `user_skill_progress` → all 10 skills with xp + level

5. **Active quests**: `quests` where status='active' + aggregate from `quest_tasks` (total, done, courage_total, courage_done) + include skill_tags, branch, predicted_state, days_since_activity

6. **Unstarted life paths**: `life_path_sessions` via client_email → compare careers[].id against quests.career_id → return careers with no quest

7. **Context mappings**: `quest_context_mappings` for this user → returns directory/project → quest_id mapping

8. **Identity statements**: `quest_completions` where category='Groans', last 100 → parse reflection_text JSON → extract + dedupe identity_statement with counts

### Full mode (on demand, richer)

Everything in light mode PLUS 5 additional parallel queries:

9. **Protective voice evidence**: COUNT GROUP BY protective_voice from `nervous_system_checkins` + `healing_intentions` → raw counts per voice. For each voice, check which quest skill_tags it appeared alongside.

10. **State evidence**: Last 14 `nervous_system_checkins` where type='daily' → array of {date, state}. Detect consecutive same-state streaks.

11. **Courage evidence**: `groan_challenges` grouped by related quest skill_tags → {created, completed} per skill. `quest_tasks` grouped by task_signal where done=true → {lit_me_up, was_okay, bored} totals.

12. **Drain evidence**: `nervous_system_checkins` where type='drain' grouped by source_quest_id → frequency per category. Incomplete healing: `healing_intentions` where healing_stage='in_progress' with quest labels.

13. **Chain health**: Count quests with null skill_tags. Count life paths without quests. Count stale quests (active, no task completion in 14+ days).

### Response schema:

```typescript
interface InteriorScoreboard {
  scores: {
    clarity: number | null
    action: number | null
    zone: string | null          // 'self_actualisation' | 'head_full_of_dreams' | 'misguided' | 'unfulfilment'
    rp_total: number
    rp_level: string
    streak: number
  }
  skills: Array<{
    id: string                   // 10 taxonomy IDs
    display_name: string
    xp: number
    level: number                // 0-4
    level_name: string           // 'education' | 'testing' | 'practising' | 'charging' | 'teaching'
  }>
  active_quests: Array<{
    id: string
    label: string
    career_id: string | null
    skill_tags: string[]
    branch: string | null
    predicted_state: string | null
    tasks_total: number
    tasks_done: number
    courage_total: number
    courage_done: number
    days_since_activity: number
    uncompleted_tasks: Array<{ id: string, text: string }>  // for task matching
  }>
  unstarted_life_paths: Array<{
    career_id: string
    label: string
    predicted_state: string
  }>
  context_mappings: Array<{
    context_type: string
    context_identifier: string
    quest_id: string
    quest_label: string
  }>
  identity_statements: Array<{
    text: string
    count: number
  }>
  // Only present in 'full' mode:
  evidence?: {
    protective_voices: Record<string, number>
    voice_skill_contexts: Record<string, string[]>
    daily_state_last_14: Array<{ date: string, state: string }>
    state_streak: { state: string, days: number } | null
    courage_by_skill: Record<string, { created: number, completed: number }>
    task_signals: { lit_me_up: number, was_okay: number, bored: number }
    drain_frequency: Record<string, number>
    stale_quests: Array<{ label: string, days_inactive: number }>
    healing_incomplete: Array<{ pattern: string, quest_label: string }>
  }
  chain_health?: {
    quests_missing_skill_tags: number
    life_paths_without_quests: number
  }
}
```

### Estimated lines: ~200 (light) + ~100 (full mode additions) = ~300 total

---

## Tool 2: `commit_progress`

**When called**: Session end. Claude has already matched accomplishments to quests and collected states from the user. This tool validates and writes.

**Input schema:**
```typescript
interface CommitInput {
  entries: Array<{
    // Quest targeting (Claude matched these using scoreboard data)
    quest_id: string | null                     // existing quest
    create_quest?: {                            // create new quest
      label: string
      career_id: string | null                  // link to life path if applicable
      predicted_state: string                   // vibe_rise | fun | stress | boring
    }

    // Task (Claude identified from session context)
    task_text: string                            // concise task name
    complete_existing_task_id?: string           // if matching an uncompleted task from scoreboard

    // Skill classification (Claude tagged from scoreboard taxonomy)
    skill_tags: string[]                        // 1-3 from the 10 taxonomy IDs

    // User's state response (Claude asked "how did this feel while doing it?")
    state: 'vibe_rise' | 'fun' | 'stress' | 'boring'

    // State-dependent depth (Claude collected based on state)
    identity_statement?: string                 // vibe_rise: "I am someone who..."
    protective_voice?: string                   // stress: ghost | controller | perfectionist | auto-pilot | people-pleaser
    cross_quest_ids?: string[]                  // vibe_rise: other quests this work also fed
  }>

  // Context mapping (optional, for first-time setup)
  set_context_mapping?: {
    context_type: 'claude_code_directory' | 'claude_desktop_project'
    context_identifier: string                  // directory path or project name
    quest_id: string
  }
}
```

### Edge function logic per entry:

**Step 1: Resolve quest**
- If `quest_id` provided: validate it exists, belongs to user, AND `status = 'active'`. If quest is closed/completed, return error suggesting user reopen or pick another quest.
- If `create_quest` provided: INSERT into `quests` with career_id link, call `classify-quest-skills` edge function async for skill_tags + branch, run cluster linking
- If neither: reject entry

**Step 2: Resolve task**
- If `complete_existing_task_id` provided: validate task belongs to quest and is not already done
- Otherwise: query `MAX(sort_order) FROM quest_tasks WHERE quest_id = X` → INSERT new `quest_tasks` row (text, quest_id, user_id, sort_order = max + 1)
- Award 2 RP via `increment_scores(user_id, null, 'courage', 2, week_start)` for task creation

**Step 3: Complete task**
- UPDATE `quest_tasks` SET done=true, completed_at=now()
- SET `task_signal` based on state:
  - vibe_rise → `'lit_me_up'`
  - fun → `'lit_me_up'`
  - stress → `'was_okay'`
  - boring → `'bored'`
- Award 3 RP via `increment_scores(user_id, null, 'courage', 3, week_start)`
- Total per task: 2 (create) + 3 (complete) = **5 RP** (matches app: QuestBoardCard awards 2 for add, 3 for complete)

**IMPORTANT: State name mapping** — user-facing names differ from internal DB values:

| User says | `task_signal` | `wahoo_classification` (in reflection_text JSON) |
|-----------|-------------|--------------------------------------------------|
| Vibe Rise | `lit_me_up` | `vibe` |
| Fun | `lit_me_up` | `peace` |
| Stress | `was_okay` | `anxious` |
| Boring | `bored` | `shutdown` |

The reflection_text JSON MUST use the internal names (`vibe`, `peace`, `anxious`, `shutdown`) not the user-facing names. PlayListTab identity parser and Action Score calculation both depend on these exact strings.

**Step 4: State-dependent writes** (only for vibe_rise and stress)

| State | Extra writes | Why |
|-------|-------------|-----|
| vibe_rise | INSERT `quest_completions` with reflection_text JSON containing identity_statement, wahoo_classification='vibe', task context. INSERT `quest_cross_pollination` rows if cross_quest_ids provided. | Courage-level moment. Rich data capture. |
| stress | INSERT `nervous_system_checkins` with type='stall', protective_voice, source_quest_id=quest_id. | Protective pattern evidence. |
| fun | No extra writes beyond task_signal. | Regular aligned work. |
| boring | No extra writes beyond task_signal. | Honest signal, captured in task_signal. |

**Step 5: Skill XP + behavioral evidence** (only for vibe_rise and stress)

These are the courage-level states. Regular work (fun, boring) doesn't award XP or evidence, matching the app where only courage challenge completions trigger these.

- For each `skill_tag` in the entry: call `increment_skill_xp(user_id, skill_id)` RPC
- Find `nikigai_clusters` whose `skill_tags` overlap with entry's `skill_tags` (cluster_stage='final', is_removed=false, skill_tags IS NOT NULL): call `increment_behavioral_evidence(cluster_id)` for each

**Step 6: Chain healing** (opportunistic, every commit)
- If resolved quest has null `skill_tags`: call `classify-quest-skills` edge function, write result
- If resolved quest has `skill_tags` but no matching cluster links: run cluster linking

**Step 7: Context mapping** (if `set_context_mapping` provided)
- UPSERT into `quest_context_mappings`

**Step 8: Compute notable evidence** (read-after-write)
- Check if any skill just leveled up (compare XP before/after threshold)
- Check if any cluster just crossed behavioral_evidence >= 5 (re-gen ready)
- Count total protective_voice appearances for the recorded voice
- Check days since last 'lit_me_up' task_signal
- Check RP level thresholds crossed

### Response schema:

```typescript
interface CommitResult {
  synced: Array<{
    task_text: string
    quest_label: string
    skill_tags: string[]
    state: string
    rp_awarded: number
    xp_awarded: Record<string, number> | null  // null for fun/boring states
    clusters_updated: number
    identity_saved: string | null
    voice_recorded: string | null
  }>
  totals: {
    total_rp: number
    total_xp: number
    total_clusters_touched: number
    chains_healed: number
  }
  notable_evidence: {
    skill_level_ups: Array<{ skill: string, new_level: string }> | null
    rp_level_up: { new_level: string } | null
    regen_ready_clusters: Array<{ label: string, evidence: number }> | null
    voice_total: { voice: string, total_count: number } | null  // "ghost has now appeared 13 times"
    days_since_lit_me_up: number | null  // null if one was just recorded
    action_score_after: number | null    // so Claude can report zone shifts
  }
  context_mapping_saved: boolean
}
```

### Estimated lines: ~300

---

## Shared Module: `_shared/taxonomy.ts`

Port essential wheel taxonomy data for validation.

```typescript
// 10 skill IDs — used by commit_progress to validate skill_tags input
export const VALID_SKILL_IDS = [
  'storytelling', 'teaching', 'coaching', 'performing', 'creating',
  'building', 'designing', 'leading', 'connecting', 'speaking_up'
] as const

export const SKILL_DISPLAY_NAMES: Record<string, string> = {
  storytelling: 'Storytelling', teaching: 'Teaching', coaching: 'Coaching',
  performing: 'Performing', creating: 'Creating', building: 'Building',
  designing: 'Designing', leading: 'Leading', connecting: 'Connecting',
  speaking_up: 'Speaking Up'
}

// 10 branch IDs — for reference, not actively validated on commit
export const VALID_BRANCH_IDS = [
  'healing', 'movement', 'bonds', 'story', 'tools',
  'status', 'nourishment', 'shelter', 'fire', 'threat'
] as const

// Skill level thresholds (mirrors src/lib/skillProgress.js)
export const SKILL_THRESHOLDS = { L1: 3, L2: 8, L3: 15, L4: 25 }

export function getSkillLevel(xp: number): { level: number, name: string } {
  if (xp >= 25) return { level: 4, name: 'teaching' }
  if (xp >= 15) return { level: 3, name: 'charging' }
  if (xp >= 8) return { level: 2, name: 'practising' }
  if (xp >= 3) return { level: 1, name: 'testing' }
  return { level: 0, name: 'education' }
}

// RP level thresholds (mirrors CLAUDE.md)
export const RP_LEVELS = [
  { threshold: 5750, name: 'Movement Maker' },
  { threshold: 2750, name: 'Vibe Master' },
  { threshold: 1250, name: 'Vibe Rise' },
  { threshold: 500, name: 'Strong Foundation' },
  { threshold: 100, name: 'Habit Builder' },
  { threshold: 0, name: 'Getting Started' },
]

export function getRPLevel(total: number): string {
  return RP_LEVELS.find(l => total >= l.threshold)?.name || 'Getting Started'
}
```

### Estimated lines: ~60

---

## Shared Module: `_shared/chainHealer.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Heal quest with missing skill_tags by calling classify-quest-skills
export async function healMissingSkillTags(
  supabase: any, questId: string, label: string
): Promise<{ skill_tags: string[], branch: string | null }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const resp = await fetch(`${supabaseUrl}/functions/v1/classify-quest-skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ label }),
  })

  if (!resp.ok) return { skill_tags: [], branch: null }
  const result = await resp.json()

  await supabase.from('quests').update({
    skill_tags: result.skill_tags,
    branch: result.branch,
  }).eq('id', questId)

  return result
}

// Find clusters whose skill_tags overlap with given tags
export async function findMatchingClusters(
  supabase: any, userId: string, skillTags: string[]
): Promise<Array<{ id: string, skill_tags: string[] }>> {
  const { data } = await supabase
    .from('nikigai_clusters')
    .select('id, skill_tags')
    .eq('user_id', userId)
    .eq('cluster_stage', 'final')
    .eq('is_removed', false)
    .not('skill_tags', 'is', null)

  if (!data) return []
  return data.filter((c: any) =>
    c.skill_tags?.some((t: string) => skillTags.includes(t))
  )
}

// Get chain health counts
export async function getChainHealth(supabase: any, userId: string) {
  const [missingTags, staleQuests] = await Promise.all([
    supabase.from('quests').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'active').is('skill_tags', null),
    supabase.from('quests').select('id, updated_at', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'active')
      // stale = no task activity in 14+ days (approximation)
  ])

  return {
    quests_missing_skill_tags: missingTags.count || 0,
  }
}
```

### Estimated lines: ~80

---

## Implementation Sequence

### Sprint 1: Scoreboard + Foundation (~1 day)

**Build:**
1. Migration: `quest_context_mappings` table
2. `_shared/taxonomy.ts`
3. `_shared/chainHealer.ts`
4. `get_interior_scoreboard` tool (light mode)

**Test:**
- Call from Claude Code with your API key
- Verify scores match what the app shows
- Verify quests, skills, life paths return correctly
- Verify context_mappings returns empty (none set yet)

**Deliverable:** Claude can read the user's brain at session start. ~440 new lines.

**Confidence: 95%.** Pure read queries. Logic proven in scoreUtilities.js and zarloEngine.js. Only risk: life_path_sessions email lookup if user has no email (known tech debt, fails gracefully to empty array).

---

### Sprint 2: Commit Tool (~1 day)

**Build:**
1. `commit_progress` tool with all write logic
2. Validation: skill_tags against VALID_SKILL_IDS, quest ownership, task existence
3. State-dependent writes (identity → quest_completions, voice → nervous_system_checkins)
4. Skill XP + behavioral evidence (for vibe_rise/stress states only)
5. Chain healing on every commit
6. Notable evidence computation (level-ups, voice counts, days since lit_me_up)
7. Context mapping upsert

**Test:**
- Create a task on an existing quest → verify quest_tasks row + RP increment
- Complete with vibe_rise → verify identity saved, XP awarded, clusters updated
- Complete with stress → verify protective voice saved to nervous_system_checkins
- Complete with fun → verify only task_signal set, no extra XP/evidence
- Create quest from life path → verify career_id link, skill tagger fires
- Set context mapping → verify quest_context_mappings row

**Deliverable:** Full write pipeline works. Single tool call commits everything. ~300 new lines.

**Confidence: 85%.** Writes mirror existing app code. Risks:
- `classify-quest-skills` async call for new quests adds ~2s latency. Acceptable.
- `reflection_text` JSON shape must match app exactly (GroanCompletionModal format). Will verify against actual code during build.
- quest_completions created by MCP may surface unexpectedly in app UI if component doesn't expect `submitted_via='mcp'`. Will add this field and verify rendering.

---

### Sprint 3: /sync Skill + Evidence Mode (~0.5 days)

**Build:**
1. `/sync` skill for Claude Code
2. `get_interior_scoreboard` full mode (evidence queries)
3. Test full end-to-end flow

**The /sync skill prompt instructs Claude to:**
1. Check if scoreboard was loaded this session, load if not
2. Check context mapping for current directory/project
3. Review what was accomplished in the session
4. Match accomplishments to the mapped quest (or ask user which quest)
5. Tag skills from the scoreboard's taxonomy
6. Present batch proposal:
   ```
   "This session in /headset-rentals (mapped to 'Headset Rental Business'):

   1. Built landing page → building, designing
   2. Wrote 3 venue outreach emails → connecting, storytelling

   How did each feel while doing it? (Vibe Rise / Fun / Stress / Boring)"
   ```
7. Collect state responses + depth data per state
8. Call `commit_progress`
9. Report results conversationally (Zarlo-style, using notable_evidence)

**What counts as an accomplishment** (guidance in skill prompt):
- Code written/shipped, features built, bugs fixed
- Content created (emails, posts, copy, docs)
- Research completed, decisions made
- Conversations had, outreach done, meetings run
- NOT: routine git operations, file reads, config changes, typo fixes

**Test:**
- Full session: work on code → /sync → confirm → verify data in Supabase
- First-time context mapping: no mapping exists → skill asks which quest → saves mapping
- Multiple accomplishments in one sync
- Edge case: no accomplishments worth syncing → skill says "nothing to sync"

**Deliverable:** User types /sync, two conversational exchanges, data flows into Vibe Rise. ~50 lines (skill) + ~100 lines (evidence queries).

**Confidence: 80%.** The skill orchestration is straightforward. Risks:
- Claude might over-identify accomplishments (logging routine work)
- First-time setup friction if user has no quests yet (graceful fallback needed)
- Skill prompt needs iteration based on real usage

---

### Sprint 4: Deploy + Validate (~1 day)

**Build:**
1. Deploy updated MCP server edge function
2. Full end-to-end test with your real account

**Validation checklist:**
- [ ] Scoreboard returns accurate Clarity/Action/Zone matching app display
- [ ] Skills XP/levels match `user_skill_progress` table
- [ ] Active quests match what app shows on Quests tab
- [ ] Context mapping saves and persists across sessions
- [ ] Task creation appears on Quests tab in the app
- [ ] Task completion shows as done in the app
- [ ] task_signal renders correctly on the quest card
- [ ] Identity statements appear in Courage tab dropdown
- [ ] Protective voice appears in evidence counts (zarloEngine context)
- [ ] RP increments correctly (2 create + 3 complete = 5 per task)
- [ ] Skill XP increments on vibe_rise/stress tasks
- [ ] Behavioral evidence increments on matching clusters
- [ ] Chain healing fixes quests with missing skill_tags
- [ ] App doesn't crash when rendering MCP-created data

**Deliverable:** Live in production, validated against real data.

**Confidence: 90%** on deploy, **75%** on "app renders MCP data correctly." The app reads from the same tables but some components may have assumptions about data provenance. Will test each affected UI component.

---

## Sprint Summary

| Sprint | What | Lines | Days | Confidence |
|--------|------|-------|------|------------|
| 1. Scoreboard + Foundation | Read tool + shared modules + migration | ~440 | 1 | 95% |
| 2. Commit Tool | Write tool with all state logic | ~300 | 1 | 85% |
| 3. /sync Skill + Evidence | Skill prompt + full scoreboard mode | ~150 | 0.5 | 80% |
| 4. Deploy + Validate | Ship + test against real data | ~0 | 1 | 90%/75% |
| **Total** | | **~890** | **3.5** | |

---

## RP Values (Matching App Exactly)

| Action | RP | Category | App source |
|--------|----|----------|------------|
| Create task | 2 | courage | QuestBoardCard add task handler |
| Complete task | 3 | courage | QuestBoardCard toggleTask handler |
| **Total per synced task** | **5** | | |

For reference, courage challenge completions in the app award 7-10 RP (state-dependent). MCP sync creates TASKS, not courage challenges. The state data is captured for evidence but doesn't inflate RP to courage levels. If a user wants to log a proper courage challenge, they should use the app's courage flow.

## State → Data Mapping

| State | task_signal | Extra writes | Skill XP | Behav. evidence |
|-------|-----------|-------------|---------|----------------|
| vibe_rise | `lit_me_up` | identity_statement → quest_completions, cross_pollination | Yes | Yes |
| fun | `lit_me_up` | None | No | No |
| stress | `was_okay` | protective_voice → nervous_system_checkins | Yes | Yes |
| boring | `bored` | None | No | No |

**Why vibe_rise and stress get XP/evidence**: These are the courage-level states. Vibe Rise = pushed past comfort zone and felt alive. Stress = pushed past comfort zone and it was hard. Both are growth signals. Fun and boring are maintenance-level, captured via task_signal for Action Score but don't warrant extra XP.

---

## Context Mapping: How Quest Auto-Detection Works

### Claude Code
Working directory = quest context. On session start, Claude checks `context_mappings` from scoreboard.

```
Context: /Users/nichuzz/creations/headset-rentals
Mapping found: quest_id=uuid, label="Headset Rental Business"
→ All accomplishments auto-map to this quest
```

### Claude Desktop
Project folder = quest context. Same mapping logic IF project name is available in conversation context.

```
Context: Project "Content Creation"  
Mapping found: quest_id=uuid, label="Content Creation"
→ All accomplishments auto-map to this quest
```

**Note**: Claude Desktop may not expose project name programmatically. If not, Claude falls back to asking "which quest does this session map to?" every sync. Still works, just not automatic. Verify during Sprint 4.

### First-time setup (no mapping exists)
Claude asks:
```
"I don't have a quest linked to this directory yet.
Your active quests:
1. Headset Rental Business
2. Content Creation
3. Retreat Design

Or I can create a new quest. Which one fits?"
```
User picks → Claude includes `set_context_mapping` in the commit call → mapping persists.

### Cross-quest sessions
If work spans multiple quests in one session, Claude asks per accomplishment:
```
"The landing page maps to 'Headset Rental Business', but the outreach
emails seem more like 'Retreat Design'. Want to split them?"
```

---

## Data Flow: How Session Sync Feeds the Scoreboard

```
Session sync → task created + completed → task_signal set
  │
  ├─ task_signal feeds ACTION SCORE (7-day rolling aligned %)
  │    → vibe_rise/fun tasks count as "aligned"
  │    → stress/boring tasks count as "total but not aligned"
  │    → Action Score rises or falls
  │    → Zone detection updates
  │
  ├─ skill XP incremented (vibe_rise/stress only)
  │    → skill levels rise over time
  │    → dormant skills stay visible
  │    → Zone of Excellence detectable (high skill + 'was_okay' signals)
  │
  ├─ behavioral evidence incremented (vibe_rise/stress only)
  │    → clusters sharpen
  │    → at threshold 5: re-gen available (V2: Claude prompts re-rating → Clarity evolves)
  │
  ├─ protective voice recorded (stress only)
  │    → voice frequency evidence compounds
  │    → patterns become visible over time
  │    → Claude can surface: "ghost has appeared 13 times with speaking_up"
  │
  └─ identity statement saved (vibe_rise only)
       → reinforcement counts grow
       → repeated statements signal core identity
       → Claude can reflect: "you've proven 7 times you ship things"
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Claude mis-tags skills | Edge function validates against VALID_SKILL_IDS. Invalid tags rejected with error message. |
| Quest doesn't belong to user | Edge function checks user_id on quest before any writes. |
| Task already completed | Check quest_tasks.done before completing. If already done, skip and report in response. |
| New quest skill tagging fails | classify-quest-skills called async. If it fails, quest exists but chain_health reports it. Next commit heals it. |
| life_path_sessions email lookup fails | Graceful fallback: unstarted_life_paths returns empty array. User can still sync to existing quests. |
| App UI crashes on MCP-created data | Add `submitted_via: 'mcp'` to quest_completions. Test each affected component during Sprint 4. |
| User syncs same work twice | Check task text similarity against existing uncompleted tasks. If match found, suggest completing existing rather than creating duplicate. |
| Edge function timeout | Limit entries array to 10 per commit. Each entry is independent, partial success reported. |

## Testing Strategy

1. **Per-sprint**: Each tool tested immediately after build with real API key
2. **Data integrity**: After each commit, query all affected tables and verify chain intact
3. **App compatibility**: Open app after MCP commit, verify Quests tab / Courage tab / Mirror page render correctly
4. **Round-trip**: Sync from Claude Code → verify in Supabase → verify in app UI → load scoreboard again → verify updated values

## Files to Create/Modify

| File | Action | Lines |
|------|--------|-------|
| `supabase/migrations/YYYYMMDD_quest_context_mappings.sql` | CREATE | ~15 |
| `supabase/functions/_shared/taxonomy.ts` | CREATE | ~60 |
| `supabase/functions/_shared/chainHealer.ts` | CREATE | ~80 |
| `supabase/functions/mcp-server/index.ts` | MODIFY | +600 (~300 scoreboard + ~300 commit) |
| `findmyflow-plugin/skills/sync/SKILL.md` | CREATE | ~50 |
| `findmyflow-plugin/README.md` | MODIFY | +20 |

**Total new code:** ~825 lines across 4 new files and 2 modified files.

## V2 Roadmap (Deferred)

See memory: `project_mcp_v2_roadmap.md`

- Hero stage tracker + journey milestones in scoreboard
- Milestone celebrations in commit response
- `analyze_patterns` deep evidence tool with time ranges
- Cluster re-rating via Claude conversation (closes Clarity staleness gap)
- Auto-suggest /sync at session end via Claude Code hook
