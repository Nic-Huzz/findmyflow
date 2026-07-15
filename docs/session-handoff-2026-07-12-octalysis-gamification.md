# Session Handoff: Octalysis Gamification Research + Unified Spec (2026-07-12)

## What was done

### Research (7 docs created)

| Doc | Path | Score/Content |
|---|---|---|
| DCC Octalysis analysis | `docs/research/octalysis-fiction-analysis-dcc.md` | 620 (Exceptional). Full 8-drive breakdown of Dungeon Crawler Carl book 1. |
| RPO Octalysis analysis | `docs/research/octalysis-fiction-analysis-rpo.md` | 447 (Strong). Comparative with DCC. Recognition vs Discovery curiosity. |
| DCC → Vibe Rise inspiration | `docs/research/octalysis-fiction-inspiration-for-vibe-rise.md` | 10 practical patterns from DCC mapped to app features. |
| Daily engagement analysis | `docs/research/octalysis-daily-engagement-analysis.md` | Duolingo (525), Hades (498), Celeste (312). Three-phase model. |
| Live experience apps | `docs/research/octalysis-live-experience-apps.md` | NRC, Strava, Peloton, Zombies Run!, Pokemon GO. Session bridge spec. |
| Gap analysis | `docs/research/octalysis-x-measurement-framework-gap-analysis.md` | Cross-reference of Octalysis research × measurement framework. 5 alignments, 3 tweaks, 7 gaps. |
| Implementation notes (THE SPEC) | `docs/features/octalysis-alignment-implementation-notes.md` | 1,027 lines. 10 sections. Sprint 1 build-ready. |

### Spec (unified implementation notes)

`docs/features/octalysis-alignment-implementation-notes.md` contains:

| Section | Content | Status |
|---|---|---|
| 1 | Protective Voice Counting | Build-ready (Sprint 1C) |
| 2 | L0-L4 Depth Scale | Existing plan, no additions |
| 3 | Flow Statement full spec | Build-ready (format, inputs, 5-step AI flow, examples, how-it's-different table, revelation mechanics) |
| 4 | Visibility × Depth Mismatch Detection | Spec'd, blocked by L0-L4 |
| 5 | Zarlo vs Figurine (two roles) | Confirmed: Zarlo = warm-but-direct companion, Figurine = warm empowering coach |
| 6 | Zarlo Utility (4 utilities + Zarlo Brief) | Spec'd: pattern detection, contradiction naming, convergence spotting, readiness signalling. Full data access via pre-computed daily Brief. 1/day proactive trigger, in-app only. |
| 7 | No Wasted Runs (RP + interim milestones) | Build-ready (Sprint 1B for RP). Interim milestones spec'd for stages 4→5, 6→7, 7→8, 8→9, 9→10. |
| 8 | Zero Punishment (post-wahoo responses) | Build-ready (Sprint 1A). Per-state copy, RP differentiation, Pressure voice capture. |
| 9 | Gap specs (7 gaps) | Graduation celebrations, stuck mechanics, social V1/V2/V3, feeling targets, matrix invisible, insight drops, session bridge |
| 10 | Research audit findings | Figurine branch audit + UI pattern audit results |
| Sprint 1 | Build guide | Exact file paths, line numbers, code snippets, success metrics, prioritisation rationale |

---

## Decisions made

1. **CD8 Loss Avoidance capped at 5/10.** Celeste proves engagement without fear. For burnt-out users with anxiety, fear-based motivation is the disease pretending to be the cure. Never increase loss aversion.

2. **Three-phase engagement model.** Week 1-2 = Duolingo (habit formation). Week 3-8 = Hades (failure-as-growth). Month 3+ = Celeste (meaning over mechanics). App tone should shift as user progresses through hero stages.

3. **Two characters, not one.** Zarlo = daily companion (warm-but-direct, always available, Hypnos/Donut model). Figurine = rare coach (warm-empowering, stage transitions + stuck moments, Mordecai/Achilles model). Different triggers, different UI, different tone.

4. **Zarlo gets ALL data, not just recent.** Pre-computed "Zarlo Brief" runs daily via Edge Function cron. Compresses full user history into ~500 token summary. Enables long-term pattern detection.

5. **Pressure wahoos earn SAME RP as Vibe Rise (10).** Hades inversion: the hardest state gives the richest reward. Pressure responses also capture protective voice objection text, feeding Stage 7 graduation.

6. **Daily check-in = 2 RP regardless of state.** All states equal. Showing up IS the work. Currently awards zero.

7. **Flow Statement format = one raw sentence, AI-first-but-user-writes.** Pre-business identity, not positioning. "I create spaces where people feel safe enough to fall apart." AI surfaces convergence signal from months of accumulated data, user names it in their own words.

8. **5×5 matrix stays invisible.** Zarlo uses it behind the scenes. Users don't see dots/grids. Too complex. Zarlo says the right thing at the right time instead.

9. **Stuck mechanics are Figurine-led (not Zarlo).** 3-step Unstick Flow: name what you're avoiding → what's the worst that could happen → smallest step (auto-creates wahoo). Timing calibrated per stage (7 days early stages, 1-2 weeks later stages).

10. **Insight Drops = Vibe Rise "loot boxes."** Self-knowledge as reward. Rarity tiers (Common/Uncommon/Rare/Legendary). V1 = styled cards on existing notifications. V2 = collection + skills system.

11. **V2 Self-Knowledge Skills.** Levels based on submission count (not quality). Each level changes what the AI does for you. L1 Zarlo is a stranger. L5 Zarlo predicts your state before you check in.

12. **North star metric = % of life paths trending toward Vibe Rise state.** Not engagement volume. Not check-in count. The actual outcome.

---

## In progress / next steps

### Sprint 1 (ready to build NOW)

| Item | File | Effort | What to do |
|---|---|---|---|
| **1A** Post-wahoo responses | `src/components/GroanCompletionModal.jsx` | 1 day | RP differentiation (lines 19, 129, 166), per-state copy (lines 255-262, 337-354), Pressure voice capture (line 132 JSON) |
| **1B** Daily check-in RP | `src/components/DailyCheckin.jsx` | Half day | Add +2 RP after line 96 insert. Import `getWeekStartLocal`. Date-stamped quest_id for dedup. |
| **1C** Voice counting | `src/lib/zarlo/zarloEngine.js` + `src/components/Zarlo/ZarloWidget.jsx` | 1-2 days | Count query on `healing_intentions.protective_voice`. Zarlo tiers at 3/4/5. Use existing `hasNotification` (plumbed but unused). |

### Sprint 2 (write implementation plan before building)

| Item | Depends On | Effort |
|---|---|---|
| Zarlo Brief Edge Function | Sprint 1C (voice counting establishes the pattern) | 2-3 days |
| Zarlo proactive bubble component | Sprint 1C (notification dot proves concept) | 1-2 days |
| Journey tab shell | Nothing | 1 day |
| Stage 6→7 interim milestones | Sprint 1C (voice count is the milestone data) | 1 day |

### Needs dedicated sessions

| Item | Why |
|---|---|
| L0-L4 depth scale | Schema + wahoo creation flow changes. Existing plan in measurement framework. |
| Social V1 deep dive | V1/V2/V3 split done but implementation details for Kudos + counters need discussion. |
| Session bridge | Nothing exists yet. Format defined (entrepreneur circle + beach meetups). Future RSVP system. |
| Figurine visual + interaction design | Branch exists with 1,600+ lines. Reuse intelligence scoring + archetype voice. Rebuild as coaching overlay, not chatbot. |

---

## Gotchas discovered

1. **`hasNotification` in ZarloWidget is already wired but never set to `true`.** This is the exact hook for proactive Zarlo messages. No new component needed for the notification dot.

2. **Figurine branch was designed to REPLACE Zarlo.** The new architecture wants them SEPARATE. Don't merge the Figurine branch as-is. Cherry-pick the reusable parts (intelligence scoring, archetype voice, memory table, CSS animations).

3. **`PLAY_LIST_POINTS` is used in TWO places** in GroanCompletionModal (line 129 quest_completions insert AND line 166 increment_scores RPC). Both must be updated to the per-classification RP values.

4. **Dark theme CSS** in both Zarlo chat (`--zarlo-bg: #1a1a2e`) and Figurine branch violates the light-theme convention in CLAUDE.md. Will need updating when those UIs are touched.

5. **Daily check-in currently awards ZERO RP.** `DailyCheckin.jsx` inserts to `nervous_system_checkins` but has no points/scoring calls anywhere.

6. **The stash from `measurement-framework-exploration` branch is still saved.** Run `git stash list` to see it. Contains unrelated changes to QuestPathMap, CuriosityMapFlow, CEODashboard.

7. **Gap analysis doc has OLD stuck timings (2/4/8/12 weeks generic)** that were superseded by per-stage timings in the spec doc. A note was added pointing to the spec as source of truth, but an agent reading only the gap doc could get confused.

---

## Recommendations

1. **Build Sprint 1A first (post-wahoo responses).** It's the highest-impact, lowest-effort change. 50% of wahoo outcomes currently feel like the "wrong" answer. One day of work changes how every wahoo completion FEELS.

2. **Don't write Sprint 3+ implementation plans yet.** The Zarlo Brief (Sprint 2) will teach you how the data actually flows. Sprint 3 decisions (Journey tab content, graduation animations, insight drop cards) should be informed by Sprint 2 learnings.

3. **Consider the Celeste model for the Figurine.** The Figurine branch built a chatbot. The spec says it should be a coaching overlay. The closest existing pattern in the codebase is `HealingFlowModal` (multi-step guided flow, auto-save, resumable). Build the Unstick Flow as a variant of that pattern, not as a new chat interface.

---

*Branch: `light-portal` (commit `091820c`)*
*Spec doc: `docs/features/octalysis-alignment-implementation-notes.md` (1,027 lines)*
*All research committed and pushed.*
