# Session Handoff: Measurement Framework Exploration (2026-07-11 to 2026-07-12)

## What was done

### Docs created
- `docs/features/measurement-framework-exploration.md` — Master doc: 12 hero journey stages, L0-L4 depth scale, 5x5 courage matrix, credibility score concept, figurine hub, wahoo cleanup spec, tab restructure proposal
- `docs/features/hero-journey-workshop-beats.md` — 2-hour live workshop structure walking through all 12 hero stages with key beats, timing (125 min + 5 buffer), energy arc
- `docs/features/credibility-score-explainer.md` — Scale Portal feature spec: 6 proof types, Proof Harvester bridge from Vibe Rise, connection to Hormozi value equation
- `public/mockups/courage-tab-merged.html` — HTML mockup of merged Courage + Healing tab with new structure

### Obsidian vault updates
- `Frameworks/Flow Map Metrics.md` — Updated from L0-L5 to L0-L4, added 5x5 matrix summary, hero stage connections, zone cal links
- `Frameworks/Hero Journey Stages.md` — NEW: Full 12-stage spec with graduation triggers, depth scale mapping, zone cal connections, links to all related frameworks. Written for other agents to reference.

### Git
- Branch `measurement-framework-exploration` created and pushed to remote (commit `1356186`) — contains the 3 docs
- Cherry-picked onto `light-portal` (commit `85d277c`)
- Subsequent commits on `light-portal`: doc updates (`5b5a6bc`), courage mockup (`9be6875`)

## Decisions made

### 12 Hero Journey Stages (all confirmed)
1. **The Matrix** — Career Alignment Score = retroactive measurement
2. **The Earthquake** — Option A: minimal capture at entry (NS check-in only). Build trust before vulnerability. Earthquake story captured later.
3. **Head Full of Dreams** — Life Paths exercise done + challenge identified + 0 wahoos = this stage
4. **Mirror → Mentor** — Essence Avatar starts as mirror (4a), shifts to future-self mentor (4b) once enough data collected
5. **First Vibe Rise** — Specifically first wahoo tagged as Vibe Rise state, not just any wahoo
6. **The Daily Loop** — Connected to completing a Fantasy League season (4 weeks)
7. **Pattern Revealed** — One protective voice identified 5 times. Objective: find ROOT trauma underneath surface patterns
8. **Reconsolidation** — Human-facilitated session with Huzz. THE session for the root pattern, not any session
9. **Flow Statement** — AI surfaces convergence, user names it. Raw discovery, not crafted copy. AI-first surfacing, user-first naming.
10. **Aligned Action** — Three paths: align current job / find new job / build own business. NOT optional.
11. **Structural Commitment** — Irreversible threshold: role change / new job / quit for business
12. **Your First Graduate** — Someone else transforms because of you. The 3% chain fires.

### Depth Scale (L0-L4)
- L0 Education, L1 Testing, L2 Practising, L3 Charging, L4 Teaching
- Maps cleanly to all 12 hero stages (no gaps)
- This IS the Y-axis on the life map / QuestPathMap
- Old `capacity_level` field in DB exists but is hardcoded to 0, never updated

### 5x5 Matrix (Depth x Visibility)
- Visibility layers (Screen/Live/Money/Vulnerable/Authority) manifest differently at each depth level
- Each cell = a specific courage challenge type with a specific pain point
- Matrix is the **courage challenge recommendation engine** for stuck users
- AI-only data layer (user sees simplified dots per life path, not the full grid)
- Confirmed: visibility layers back in wahoo creation as multi-select

### Two Characters, Not One
- **Figurine (Essence Avatar)** = rare, stage-aware, speaks at TRANSITIONS. Journey tab home. Mordecai energy.
- **Zarlo** = daily, reactive, pattern-detecting. Courage/Tune territory. Hypnos energy.
- Both confirmed as separate systems with different triggers, context needs, and UIs

### Tab Restructure
- New order: **Journey / Quests / Tune / Courage** (opens on Tune)
- Healing merges INTO Courage (healing intentions shown inline on wahoo cards)
- Journey tab content defined from Octalysis work: hero stage indicator, interim milestones, insight drops, life paths summary, Flow Map button, transformation evidence, Flow Statement, stuck mechanic, mentor button

### Wahoo Creation Cleanup
- Quest link: optional → **compulsory** (step 2)
- Depth L0-L4: **new step** (step 3)
- Visibility multi-select: **new step** (step 4, examples adapt to depth level)
- Categories (Appearance/Creation/Connection): **archived** (depth + visibility replaces them)
- Scary/wahoo scores: **removed** (NS state captures this post-completion)

### Flow Statement Design
- Format: one raw sentence, unpolished, from the gut
- AI-first surfacing ("Your curiosities share something"), user-first naming ("What would you call it?")
- Different from positioning/mission/ikigai: pre-business, identity-level, felt not analysed
- Refinement happens in Stage 10 via PositioningSummary.jsx
- "Double-dash" mechanic: app changes after Stage 9 (quest recommendations shift, Zarlo tone changes, new sections unlock, visual marker)

### Zone Calibration Mapping
- 10 High confidence, 1 Medium (Stage 11)
- **Paused** — utility unclear. Possible future use as graduation requirement questions. May overcomplicate.

## In progress / next steps

1. **Octalysis agent must finish first** — Defines celebrations, RP adjustments, Zarlo personality spec, insight drops, stuck mechanics. All confirmed in `docs/features/octalysis-alignment-implementation-notes.md` but the agent may still be refining.
2. **Wahoo cleanup implementation** — Fully specced, ready to build once Octalysis agent confirms post-wahoo response per state (Pressure gets +3 RP, Uninterested gets +2 etc.)
3. **Tab restructure implementation** — Needs mockups for Journey tab (content defined, no mockup yet). Courage mockup at `public/mockups/courage-tab-merged.html`.
4. **Figurine design session** — Dedicated session needed. Agent prompt drafted in measurement-framework-exploration.md section 7.
5. **Flow Statement UX flow** — Design confirmed but no component built. Needs: AI surfacing logic (convergence detection from cross-pollination + shared patterns), creation UI, storage (`flow_statement` field on `user_stage_progress` or new table).

## Gotchas discovered

1. **Branch coordination issue.** Two terminals running on `light-portal` simultaneously. Commits `ee96a96` and `fc5ee36` exist on local `light-portal` but were never pushed to remote. Another agent flagged these as lost. This session did NOT cause the loss — they were orphaned before we started. Cherry-pick `ee96a96` to restore LevelTab journey reorder changes.

2. **`capacity_level` is a ghost field.** Exists in `curiosity_clusters` table, hardcoded to 0 in CuriosityMapFlow.jsx line 286, never updated. The L0-L4 depth scale needs this wired up (either via user self-report in wahoo creation or AI inference from behaviour).

3. **`visibility_layer` on `groan_challenges` is single-value enum.** Needs to become multi-select (text array or new `visibility_layers text[]` column) to support the 5x5 matrix. Keep old column for backwards compat.

4. **Healing tab removal is safe.** HealingFlowModal is already triggered from QuestBoardCard (courage challenges), and HealingIntentionsList content can be inlined into wahoo cards. The standalone "What's blocking you?" input just needs to move to the Courage tab.

5. **PositioningSummary.jsx is framed for creators, not consumers.** It takes life quake + transformation → positioning statement. For the Flow Statement (consumer, Stage 9), it needs reframing or a separate component. The refinement step (Stage 10) can reuse PositioningSummary.

## Recommendations

1. **Finish Octalysis agent work first.** It defines HOW everything feels. Without it, building would produce structure without soul. The Octalysis spec (`docs/features/octalysis-alignment-implementation-notes.md`) has concrete specs for celebrations, RP, Zarlo, and stuck mechanics that directly affect the tab restructure and wahoo cleanup.

2. **Build the wahoo cleanup next.** It's the data capture layer everything else depends on. Without depth + visibility data being captured on each wahoo, the 5x5 matrix has no input, the AI has no signal, and the Journey tab has nothing to show. Small scope, high leverage.

3. **The workshop (hero-journey-workshop-beats.md) is ready to test live.** The 2-hour structure maps to Vibe Rise Sessions. Could be tested at the next Bali session. No tech needed — just the facilitator following the beats doc. Real-world testing would validate the hero journey stages before building them into the app.

4. **Save the Credibility Score explainer for another agent.** It's a Scale Portal feature, not Vibe Rise app. Self-contained doc at `docs/features/credibility-score-explainer.md` with full spec. Hand it to an agent working on `/create`.

5. **The Flow Statement is the most important unbuilt feature.** It's the Stage 9 reward — the emotional climax of the entire hero journey. Everything builds toward it. Design the convergence detection algorithm before the UI.
