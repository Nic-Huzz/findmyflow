# Interior Scoreboard — Implementation Plan

*Created: July 2026. Status: Ready to build.*

## What We're Building

One new metric (**Clarity**) alongside the existing Capacity Score. Plus supporting features that feed it.

### Consumer App (Vibe Rise)
- **Capacity Score** — exists, no changes needed
- **Clarity %** — new. Average resonance (1-5) across user's curated Life Map clusters. Sharpened by courage challenge data on taxonomy-tagged quests.

### Scale App (Creator Portal)
- **Monopoly Score** — taxonomy intersection rarity vs 299 careerModels. Build when ready.
- **Alignment** — income from aligned path. Needs L3 income prompts. Build when ready.

---

## Sprint Plan

### Sprint 1: Timeframe Tags + Identity Statement Dropdown (2-3 days)
**Confidence: 95%**

**Timeframe tags:**
- Add `timeframe` text field to `quest_tasks` table (week / month / quarter, default: week)
- Add 3-option picker to task creation UI (QuestBoardCard "add task" form)
- Group tasks by timeframe within each quest card on Quests tab

**Identity Statement Library:**
- In GroanCompletionModal, at the identity statement step:
  - Query all previous identity_statements from `quest_completions.reflection_text` (JSON parse, group by text, sort by frequency)
  - Show dropdown of previous statements + free-text input for new
  - Selected/new statement saves as usual to reflection_text JSON

**No open questions.**

---

### Sprint 2: Cluster Resonance Rating (3-4 days)
**Confidence: 85%**

**After Life Map completion (one-time onboarding moment):**
- New screen after Life Map results: "Here's what we found. Does this feel right?"
- Show each cluster (skills, problems, personas) with:
  - Cluster name (freeform AI label)
  - Items underneath
  - 1-5 dot rating
  - Remove button (for clusters that don't fit)
  - "Add a cluster that's missing" at bottom
- Save `resonance_rating` (1-5) + `resonance_updated_at` on nikigai_clusters
- Calculate Clarity % = average resonance of kept clusters
- Show Clarity % on /me page or quest tab header: `Clarity 80% ↑`

**Re-generation trigger (later — after Sprint 4):**
- After 5 courage challenges on quests sharing taxonomy tags with a cluster:
  - AI re-generates the cluster description using original + challenge data
  - In-app prompt: "Based on your recent challenges, we think [old] has evolved to [new]. Does this feel more right?"
  - User re-rates ONE cluster (10 seconds)
  - Clarity % updates

**DB changes:**
- `nikigai_clusters`: add `resonance_rating` integer, `resonance_updated_at` timestamp, `behavioral_evidence` integer
- Add `is_removed` boolean for clusters user has rejected

**Where Clarity % shows:**
- /me page or quest tab header — one number, tappable for detail
- No permanent "Your Mirror" screen — cluster ratings only appear at Life Map completion and re-generation moments

---

### Sprint 3: Quest Taxonomy Auto-Tagging (2-3 days)
**Confidence: 85%**

**Auto-tag at quest creation:**
- When a life path becomes a quest (in Life Paths flow), immediately after Supabase insert:
  - Call AI (edge function or inline): "Given quest label '[X]' and user's Life Map clusters, return skill_tags[], problem_tags[], persona_tags[]"
  - Update quest row with tags

**Backdate existing quests:**
- Script: query all quests with null skill_tags, call AI for each, update
- ~21 users × ~3-5 quests = ~80 quests. One batch job.

**DB changes:**
- `quests`: add `skill_tags` text[], `problem_tags` text[], `persona_tags` text[]

**Tag at cluster level too:**
- After Life Map's nikigai-conversation runs, post-process each cluster:
  - AI maps freeform label + items → taxonomy IDs
  - Save `skill_tags[]`, `problem_tags[]`, `persona_tags[]` on nikigai_clusters

**DB changes:**
- `nikigai_clusters`: add `skill_tags` text[], `problem_tags` text[], `persona_tags` text[]

---

### Sprint 4: Extend classify-curiosities + Cluster Re-generation (3-4 days)
**Confidence: 90%**

**classify-curiosities extension:**
- Add to prompt (after existing branch definitions):
  ```
  SKILL TAGS (also tag each cluster with relevant skills):
  storytelling, teaching, coaching, performing, creating,
  building, designing, leading, connecting, speaking_up

  PROBLEM TAGS (also tag with the wound/motivation addressed):
  kids_deserved_better, voice_taken, pain_not_believed, world_losing,
  life_not_yours, feeling_stupid, locked_out, work_treated_nothing,
  left_behind, forgot_what_for, stopped_wondering, work_hollows
  ```
- Update output schema: each cluster gets `skills[]` and `problems[]` alongside existing `branch`
- Update CuriosityMapFlow.jsx to save new fields to curiosity_clusters

**Cluster re-generation trigger:**
- After saving a courage challenge completion, check: how many challenges exist on quests sharing taxonomy tags with any cluster?
- If ≥ 5 for a given cluster's tags: trigger re-generation
- Edge function (new `regenerate-cluster`): takes original cluster + challenge outcomes + identity statements → returns updated cluster name/description
- Show in-app prompt to re-rate

---

### Sprint 5: Per-Completion Progress + To-do Signal (2-3 days)
**Confidence: 85%**

**Quest card progress (Quests tab):**
- Progress bar: X/Y tasks done (already calculable from quest_tasks)
- Courage trend: last N wahoo classifications shown as emoji row (🔥🔥😌🔥)
- Top identity statement with frequency: "takes risks to follow passions (×3)"
- Quest alignment %: tag overlap with user's top clusters (free from Sprint 3 data)

**To-do "lit me up" signal:**
- After tapping ✓ on a to-do, show inline on the quest card:
  - Three options: 🔥 Lit me up / 😐 Was okay / 😴 Bored
  - One tap, then disappears
  - Saves `task_signal` on quest_tasks

**DB changes:**
- `quest_tasks`: add `task_signal` text (lit_me_up / was_okay / bored)

---

## Total Estimate: ~13-17 days across 5 sprints

## Dependencies

```
Sprint 1 → no dependencies
Sprint 2 → no dependencies (can run parallel with Sprint 1)
Sprint 3 → Sprint 2 (need resonance rating UI to exist before tags feed it)
Sprint 4 → Sprint 3 (need taxonomy tags on quests/clusters before re-generation)
Sprint 5 → Sprints 3+4 (need tags + challenge data to show alignment/trend)
```

Sprints 1+2 can run in parallel. Sprints 3→4→5 are sequential.

---

## All Database Changes (consolidated)

### quest_tasks table
- `timeframe` text — week / month / quarter (default: week)
- `task_signal` text — lit_me_up / was_okay / bored

### nikigai_clusters table
- `resonance_rating` integer 1-5
- `resonance_updated_at` timestamp
- `behavioral_evidence` integer (count of supporting challenge completions)
- `is_removed` boolean (user rejected this cluster)
- `skill_tags` text[] — mapped taxonomy skill IDs
- `problem_tags` text[] — mapped taxonomy problem IDs
- `persona_tags` text[] — mapped taxonomy persona IDs

### quests table
- `skill_tags` text[] — skill segment IDs
- `problem_tags` text[] — problem segment IDs
- `persona_tags` text[] — persona segment IDs

### curiosity_clusters table (extend existing)
- `skills` text[] — skill segment IDs (from extended classify-curiosities)
- `problems` text[] — problem segment IDs (from extended classify-curiosities)

---

## Related Docs

- `docs/features/interior-scoreboard-spec.md` — full spec with Clarity definition, Capacity Score reference, per-completion UX
- `docs/features/monopoly-engine-spec.md` — Monopoly Score calculation with Huzz worked example, 299 careerModels dataset
- Obsidian: `Frameworks/Collect Connect Your Flow.md` — spine framework
