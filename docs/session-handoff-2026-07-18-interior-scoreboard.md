# Session Handoff: Interior Scoreboard + Monopoly Engine (July 16-18 2026)

## What was done

### Shipped to main
- `9b63c11` — New onboarding slides (Ikigai hero's journey, 3 slides)
- `d478350` — 3% reflection fix: reverted to reflection_text (column exists, was incorrectly changed to response_data)
- `0c2723d` — Weekly focus intention persists across weeks (removed getWeekStartLocal scope on setup query)
- `9fca732` — Sprint 0 data integrity: quest_id on groan_challenges + FK constraint + code paths updated
- `0ec157a` — Monopoly Score calculation methodology with Huzz worked example
- `aa03018` — Implementation plan (7 sprints with 12yo explanations)
- `76631b0` — Per-completion experience design + data gaps doc
- `f78a1c7` — Sprint restructure (split S3, moved re-gen to S4, added guidance layer)
- CareerModels dataset: 292 → 299 (added Disney, Barnum, Jose Andres, Jesse Itzler, Tim Ferriss, Hormozi, Naval), cleaned 34 under-tagged profiles

### On feature branch `feature/interior-scoreboard-sprint1`
- `344c2b0` — Sprint 1: timeframe tags on quest_tasks + identity statement library dropdown on GroanCompletionModal
- `e46ab46` — Data gaps doc for agent review
- Migration applied: `add_timeframe_to_quest_tasks` (timeframe text DEFAULT 'week')
- Migration applied: `add_quest_id_to_groan_challenges_and_fk` (quest_id column + FK + backfill 116/138 records)

### Spec docs created
- `docs/features/interior-scoreboard-spec.md` — full spec: Capacity × Clarity, per-completion UX, design evolution appendix
- `docs/features/monopoly-engine-spec.md` — Collect → Connect → Your Flow spine, taxonomy, 299 dataset, behavioral scoring, Huzz worked example
- `docs/features/interior-scoreboard-implementation-plan.md` — 7 sprints, Sprint 0 done
- `docs/features/interior-scoreboard-data-gaps.md` — 3 gaps + 3 opportunities for agent review
- Obsidian: `Frameworks/Collect Connect Your Flow.md` — spine framework with hero journey mapping + Capacity × Clarity model

## Decisions made

1. **Two consumer metrics only**: Capacity (existing, Y axis) × Clarity (new, X axis) = Zone Calibration diagonal. Everything else is noise. Evolved through 5 iterations (5 metrics → 3 → 2).

2. **Scale app gets Monopoly + Alignment**: Personal monopoly score (taxonomy rarity vs 299 dataset) and income alignment moved to creator portal. Not relevant for consumer users still finding their path.

3. **Clarity = cluster resonance**: User rates Life Map clusters 1-5 ("This IS me" → "That's not me"). Average of kept clusters = Clarity %. Updates when AI re-generates clusters after 5 courage challenges on shared skill tags.

4. **Skills-only quest tagging**: Quests tagged with skills (10 taxonomy segments). Problems + personas stay at user level (Life Map clusters). The AI can confidently map "Dance Facilitator" → performing but can't guess personas.

5. **One underlying taxonomy for consumer**: skills (10) + problems (12) + personas (12) from wheel taxonomy. Branches (10) are Scale-only for market positioning. classify-curiosities edge function to be extended to output skills[] + problems[] alongside branch.

6. **Skill tree via L0-L4**: Track XP per taxonomy skill from courage challenges. User sets starting level. Display later. L0-L4 only makes sense for skills, not problems or personas.

7. **reflection_text EXISTS on quest_completions**: Column is TEXT type with 32 historical JSON entries. The earlier "fix" that moved writes to response_data was wrong. Reverted. Always verify DB schema with `information_schema.columns` before changing column references.

8. **Belief sliders dropped**: Vibe Rise wahoo classification already captures identity fit. "I'm getting good at this" slider is less relevant than the identity statement. Simplified to: 4-state classification + identity statement dropdown + 3% check.

9. **To-do "lit me up" signal for ALL to-dos**: Not just learning tasks. "Email 3 venues" → Bored is useful signal too. One optional tap.

10. **Huzz's monopoly**: performing + building + voice_taken = 0/299 matches. Tested with real data.

## In progress / next steps

### Sprint 2: Cluster resonance rating + Clarity score
**Status**: Scoped. LifeMapFlow.jsx read and understood. The resonance rating screen should be a new screen `rate_mirror` inserted after the `nikigai` screen (which shows clusters) in the SCREENS array at line 57-60.

**Exact next step**: 
1. Add `rate_mirror` to SCREENS array
2. Add state: `const [clusterRatings, setClusterRatings] = useState({})`
3. New screen renders clusters as title-only cards (no description) with 1-5 dot rating + remove button
4. On "Continue", save `resonance_rating` to each `nikigai_clusters` row
5. Calculate Clarity % = average of kept ratings
6. Display Clarity % on Journey tab (JourneyTab.jsx, above "Your Skills" section)

**Open question from user**: The resonance rating + curiosity additions + life path updates should converge on a "Mirror page" — a living page users can return to. This may be a new route (/mirror) or an expansion of the /me page. Decide during Sprint 2.

### Remaining sprints (all scoped in `docs/features/interior-scoreboard-implementation-plan.md`)
- Sprint 3: Quest skill tagging (2 days)
- Sprint 4: Mirror re-generation + Clarity that moves (2-3 days) 
- Sprint 5: Per-completion progress + guidance layer (3-4 days)
- Sprint 6: Skill tree background + curiosity extension (3-4 days)

### Feature branch
`feature/interior-scoreboard-sprint1` has Sprint 1 code + data gaps doc. Needs PR to main when ready.

## User answers to clarifying questions (shapes Sprint 2-6)

**Sprint 2 — Cluster resonance rating:**
- New STEP after Life Map results (not inline on results page) — less clutter, only titles without descriptions
- Clarity % displays on Journey tab, above "Your Skills" section
- Users can remove clusters (score 1-2) and add custom ones. Clarity = average of KEPT clusters only.
- Huzz rated all his clusters 4/5 → Clarity = 80%

**Sprint 4 — Mirror re-generation:**
- BOTH push notification AND in-app banner
- Opens to a "Mirror page" — a new convergence point where users can also update curiosity additions, re-rate clusters, see life path updates. This becomes the HOME for Clarity, the place all updates converge. Could be a new route (/mirror) or expansion of /me page — needs design decision.

**Sprint 5 — Guidance layer:**
- Shows INLINE on quest cards + journey page (not only in Zarlo chat)
- Zone of Excellence warning: shows on quest card when 3+ "Pressure" outcomes in a row

**Sprint 6 — Skill tree:**
- When quest is created → AI auto-tags skills → immediately asks "what level are you at with these?" L0-L4 picker per skill, right at quest creation
- Only shows skills that appear on the quest, not all 10

## How Clarity % is calculated

```
1. User completes Life Map → AI generates skill/problem/persona clusters (freeform names)
2. New "rate_mirror" screen: each cluster shown with title + items + 1-5 rating
   - 5 = "This IS me" (goosebumps)
   - 4 = "Yeah, that's right"
   - 3 = "Partly"
   - 2 = "Not quite"
   - 1 = "That's not me"
3. User can REMOVE clusters (is_removed = true) or ADD custom ones
4. Clarity % = average resonance of KEPT clusters × 20
   (e.g., all 4s = 4.0/5 = 80%)
5. Saves resonance_rating + resonance_updated_at on nikigai_clusters table
6. Later (Sprint 4): after 5 courage challenges on quests sharing skill tags,
   AI re-generates cluster → user re-rates ONE cluster → Clarity updates
```

DB fields needed (migration): `resonance_rating integer`, `resonance_updated_at timestamptz`, `behavioral_evidence integer DEFAULT 0`, `is_removed boolean DEFAULT false` — all on nikigai_clusters table.

## Pre-existing bugs found during code review (not from our changes)

1. **`gcm-wahoo-alive` CSS class missing** — `GroanCompletionModal.jsx:362` uses class `gcm-wahoo-alive` for the "Fun" button but `GroanCompletionModal.css` has no `.gcm-wahoo-alive.selected` definition. Fun button selected state looks identical to Pressure/Uninterested. Fix: add `.gcm-wahoo-alive.selected { border-color: #10b981; background: rgba(16, 185, 129, 0.06); }`

2. **Courage task with no groan_challenge_id gets silently done** — `QuestBoardCard.jsx:103` intercept only fires when BOTH `is_courage_challenge` AND `groan_challenge_id` are truthy. If groan_challenge_id is null (from HealingIntentionsList path), task gets checked off with no classification modal, no RP, no NS check-in. Pre-existing, documented in Sprint 0 investigation.

3. **Mystery box count check may read null** — `QuestBoardCard.jsx:199-205` chains `.then({ count })` on a Supabase query builder without proper await. Count could be null, preventing mystery box trigger on first quest achievement. Pre-existing.

## Gotchas discovered

1. **quest_tasks.groan_challenge_id has NO FK constraint** — we added one via migration. But HealingIntentionsList.jsx creates courage quest_tasks WITHOUT groan_challenges intentionally (healing tasks aren't wahoos). Don't "fix" those 8 records.

2. **groan_challenges link to quests via source_label (text matching), not a real join** — we added quest_id column and backfilled 116/138. 22 remain null (orphans from old flows). The source_label field only matches 9/108 records.

3. **LifeMapFlow.jsx is ~1400 lines** with complex screen flow. The SCREENS array defines order. Adding a screen requires: adding to array, adding the screen render block, and updating navigation (goToScreen calls + the CTA button on the previous screen).

4. **Multiple Life Map runs create duplicate clusters** — Huzz has overlapping skill clusters from 2 runs. The `step_id IS NULL` filter scopes to Life Map clusters, but within that scope there can be duplicates. The resonance rating needs to handle this (show deduplicated clusters or most recent run only).

5. **classify-curiosities edge function currently only outputs branch** — not skills or problems. Extension designed but not implemented. The prompt change is clear (add skill + problem definitions). Output schema adds `skills[]` and `problems[]` per cluster.

## Recommendations

1. **Merge Sprint 1 to main** — it's built, tested, build passes. Timeframe tags + identity library are user-facing improvements that don't depend on anything else.

2. **Start Sprint 2 with the `rate_mirror` screen** — cleanest next step. Read LifeMapFlow.jsx lines 1030-1120 (the nikigai screen) to understand the cluster card rendering, then add the rating screen after it.

3. **Test AI quest tagging before Sprint 3** — run the 7 Huzz quests through an AI prompt to validate accuracy. The simulated output is in the session conversation. User needs to confirm tags before we build the auto-tagger.

4. **The "Mirror page" concept needs design** — Sprint 4 introduces a page where cluster re-generation, curiosity updates, and life path changes all converge. This could be a new route or an expansion of /me. Design this before building Sprint 4.
