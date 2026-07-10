# Session Handoff: Phase 3 Theory + Ecosystem Design (Jul 3-10, 2026)

## What was done

### Code Built
- **Scale Score v2** (`src/pages/FacilitatorScore.jsx`) — Complete rewrite from 4-question AQAL to 3-pillar model (RETURN/BREAK/TRIBAL). 6 questions + branch selection. Score /15. Phase classification bands. Public lead magnet at `/try/facilitator-score`. DB migration applied: `score_ancestral`, `score_format`, `score_irreplaceable`, `score_alignment`, `score_mismatch`, `score_market`, `score_rulebreak`, `branch`, `total_score`, `phase_classification` columns on `scale_diagnostics`.
- **Remarkable Reach** (`src/flows/NarrativeBuilderFlow.jsx`) — Rewritten from "Narrative Builder." Added Vehicle Discovery screen (3 types: results-as-content, new medium, new action on existing medium). Paul brothers + Jackass examples. First Step screen removed (moved to Growth). DB migration: `vehicle_type`, `vehicle_desc` columns on `narrative_builders`.
- **Remarkable Growth** (`src/flows/AccessArchitectureFlow.jsx`) — Renamed from "Access Architecture." Copy changes only (badge, intro, CTA, recommendations). Flow logic unchanged.
- **Remarkable Results** (`src/flows/RemarkableFlow.jsx`) — Renamed from "Blow Up Brand." Badge change only.
- **Sequential locking** (`src/components/CreatorHome/CreatorHomeV2.jsx`) — Each flow card locked until previous completed. `hasReach`, `hasGrowth`, `hasScaleScore` states. Queries `narrative_builders`, `access_architectures`, `scale_diagnostics` for completion checks.
- **Pipeline reorder** — Playbook tab: Remarkable Results → Remarkable Reach → Remarkable Growth → Scale Score (was: Blow Up Brand → Scale Diagnostic → Narrative → Access).
- **Stale references fixed** — "Blow Up Brand" → "Remarkable Results" across `useRootScore.js`, `FacilitatorScore.jsx`, `CreatorHomeV2.jsx`. "Narrative Builder" → "Remarkable Reach" in `AccessArchitectureFlow.jsx`.
- **Host onboarding deck** (`public/vibe-rise-host-deck.html`) — 17-slide branded deck for recruiting Vibe Rise session hosts. Fitness x Wellness x Ambition gap slide, session format, community member wahoo, value stack (free Scale Portal + cost-price headsets), economics ($29/session, Fantasy League 80/20 split), scaling flywheel.

### Obsidian IP Created (15 notes)
All at `/Users/nichuzz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/Huzz/`

**Frameworks/ (10 notes)**
- `Creator Branch Phase Mapping.md` — 91 creators mapped to 10 branches + Phase classification
- `Branch Concentration Problem.md` — Gap analysis, 56% in Healing+Movement, 0% in Threat
- `Phase 3 Viability Diagnostic.md` — v1 (10-factor) + v2 (3-pillar RETURN/BREAK/TRIBAL)
- `Phase 3 Key Indicators Per Branch.md` — Gate factors per branch, one-question cheat sheet
- `MasterMind Branch Prescriptions.md` — 6 actionable features (Secret Wahoo, Quality of Attention, Fear-to-Purpose, Polarity Exercise, Grow One Thing, Flicker Protocol)
- `Rule Break Ingredients Framework.md` — Vehicle break (Type A/B) vs Results break, remarkability half-life, 3 paths for creators without results break
- `Phase 3 Modality Map.md` — 132 modality cells across all 10 branches with Phase 2/3 companies, gaps, merge opportunities, digital-as-bridge insight (Strava data)
- `Capacity Spectrum Per Branch.md` — 10 branches: baseline → deviation → entry → training → overshoot
- `Capacity Spectrum - Movement Modalities.md` — 10 modalities with L1-L5 + identity inflection
- `Capacity Spectrum - Healing Modalities.md` — 8 modalities with L1-L5
- `Capacity Spectrum - Nourishment Modalities.md` — 6 modalities
- `Capacity Spectrum - Remaining Branches.md` — 20 modalities across Bonds, Story, Status, Tools, Shelter, Fire, Threat
- `FindMyFlow x Category Pirates.md` — Copied from repo with frontmatter

**Insights/ (4 notes)**
- `Phase 2 Market Size Is Not a Factor.md` — Every branch maps to a primal need. No small markets. Phase 3 redirects existing demand.
- `Format Change Is The Rule Break.md` — Format change IS the rule break. Two ingredients (vehicle + result). Remarkability half-life.
- `Five Meta-Patterns From The Tree.md` — Merge pattern, pendulum overshoot, Phase 2 decline signal, Phase 2.5 trap, bimodal blow-up
- `The Two Enemies.md` — Enemy 1: Self-help ("clarity problem"). Enemy 2: Education ("specialise"). Both wrong: bottleneck is safety, not knowledge.

**Product/ (3 notes)**
- `Vibe Rise Sessions.md` — Session format, variants, pricing, scaling, app bridge, superconsumer profile
- `Vibe Rise Ecosystem Vision.md` — 3-product stack, AI/human split, macro thesis, timeline
- `Curiosity Map Feature.md` — Content inputs → curiosity clusters → career alignment → cone of safety → experiences → life paths → merge → flow

**Thought Notes/ (1 note)**
- `Purpose to Experiences Evolution.md` — 2020 purpose obsession → 2026 experiences realisation. Serving others = one type of experience.

### Docs Updated
- `CLAUDE.md` — Added Blow Up Brand pipeline section (#12), 3-product distinction, DB schema for pipeline tables, vibe-rise-sessions reference
- `docs/frameworks/find-my-flow-x-category-pirates.md` — v2 header: category redefined, pipeline renamed, Scale Score v2, Phase 3 theory layer, 3-product distinction, updated 3 Movement Questions + DAM statement
- `docs/vibe-rise-sessions.md` — Session format, fitness x wellness x ambition gap, app bridge (Strava model), pricing, variants, scaling

## Decisions made

1. **Scale Score is 3 pillars, not 10 factors.** RETURN (ancestral + body), BREAK (format + result), TRIBAL (identity + shareability). Scored /15. The 10 factors were accurate but impossible to remember. 3 pillars produce the same discrimination. WHY: consulting tool must be memorable in a 5-minute conversation.

2. **Phase 2 Market Size dropped as a factor.** Every branch maps to a primal human need shared by 8B people. There's no small market. The only thing it measured was "do you need to educate the market?" — Phase 3 answer is always no. WHY: doesn't differentiate.

3. **Facilitator Irreplaceability dropped.** For experience creators (the target audience), the human IS the experience. It's a given, not a differentiator. WHY: asking "could AI do this?" to experience creators is asking "are you a person?"

4. **Format Change IS the Rule Break.** Not two separate things. The blow-up is almost never a content change. Gabor Mate had the same insight for 31 years. Documentary triggered the blow-up. Rule break has two ingredients: Vehicle (how you deliver) and Result (what happens). Results break gives vehicle break for free (novel results = novel content). WHY: validated against 91 creators.

5. **Blow Up Brand pipeline renamed to Remarkable Results → Reach → Growth → Scale Score.** All four are steps in one recipe under "Blow Up Brand" umbrella. Sequential locking. WHY: clearer journey, each flow does a distinct job.

6. **Scale Score comes LAST, not second.** It's a capstone diagnostic that pulls from all previous flows. WHY: more data to pull = richer diagnostic.

7. **Three products, three categories.** Vibe Rise Sessions (CrossFit), Vibe Rise App (Nike Run Club/Strava), Creator Portal (CRM for experience creators). WHY: each has its own category, audience, and revenue model.

8. **The two enemies are Self-Help and Education.** Self-help says "find your passion" (clarity trap). Education says "specialise" (kills merge points). Both wrong: bottleneck is safety (cone), not knowledge. WHY: Category Pirates requires naming the old category you reject.

9. **Never overwrite Obsidian content.** Add new sections, create v2 headers, or create separate notes. Never delete existing content in the vault. WHY: evolution of ideas matters as much as current state.

10. **Digital works as bridge, not replacement.** Strava data: users in clubs 2x more likely to train weekly. The app is a progress ledger for real-world community, not a substitute. WHY: Phase 2.5 trap (Peloton, BetterHelp) proves digital-only caps transformation.

## In progress / next steps

### Needs testing
- The 4 Remarkable flows (Results, Reach, Growth, Scale Score) — built and compiling but user testing in progress with another agent. Bugs may surface.

### Needs building (ranked by impact)
1. **Curiosity Map v1** — Content inputs (books/podcasts/docs) + career alignment diagnostic. The consumer lead magnet. Concept fully scoped at `Obsidian/Product/Curiosity Map Feature.md`. DB: `curiosity_inputs`, `curiosity_clusters`, `career_alignment` tables needed.
2. **Modality Map as JSON** — Convert the 132-cell Obsidian markdown to queryable JSON so Remarkable Reach vehicle discovery can show branch-specific data ("In Healing, here's what exists, here are the gaps").
3. **MasterMind prescriptions** — 4 buildable features: Secret Wahoo (new category in Play-List), Quality of Attention (post-practice prompt), Fear-to-Purpose Bridge (AI reads wahoo avoidance patterns), Grow One Thing (Tune Tab toggle). All small builds.
4. **Fantasy League monetisation** — $49/month, 80/20 split to hosts. Needs Stripe integration for this revenue share model.
5. **Host deck refinements** — Slide 4 (Dawnbreak 13K unverified), Slide 12 (Scale Portal $500 value claim needs backing), Slide 13 (Fantasy League $49/mo pricing untested).

### Not started but scoped
- Tag 465 Rule Break Tree nodes with Phase 2/3 property
- Content series from the IP (modality map, capacity spectrum, L3 rule — each is 10+ pieces)
- Convergence visual in QuestPathMap component (Polymath University)
- Career Alignment Diagnostic as public lead magnet (`/try/career-alignment`)

## Gotchas discovered

1. **`score_access` column backward compat** — Old `scale_diagnostics` records have `score_access`. New Scale Score sets it to `null`. `AccessArchitectureFlow` reads it with `if` guard — safe. `NarrativeBuilderFlow` reads it — `null < 4` returns `false` in JS, which is safe behaviour.

2. **`first_step_desc` no longer written** — Remarkable Reach removed the First Step screen. `AccessArchitectureFlow` reads `first_step_desc` from `narrative_builders` — returns null for new users, guarded by `if` check. Old users keep their pre-filled value.

3. **`gate_passed` still needed** — Scale Score still writes `gate_passed: scoreBody >= 4 && scoreShareability >= 4` because `AccessArchitectureFlow` reads it.

4. **Stale "Blow Up Brand" references remain** in: `pipelineConfig.js`, `pipelineNudges.js`, `ExperienceCreatorFlow.jsx`, `CreateGate.jsx`, some component comments. These are internal/dev-facing, not user-visible. Low priority to rename.

5. **The old `ScaleDiagnosticFlow.jsx` is orphaned** — Both `/scale-diagnostic` and `/try/facilitator-score` now point to `FacilitatorScore.jsx`. The old file can be deleted.

6. **69 uncommitted files** including all session work. Significant amount of code and docs to commit.

## Recommendations

1. **Build the Curiosity Map v1 as the next major feature.** It's the missing top-of-funnel for the consumer app AND the most shareable lead magnet ("Career Alignment: 15%. No wonder Tuesdays feel empty."). It connects everything: curiosities → cone of safety → experiences → life paths → merge → flow. Scoped at `Obsidian/Product/Curiosity Map Feature.md`.

2. **Commit and deploy the Remarkable flows.** 69 uncommitted files is risky. The Scale Score, Remarkable Reach vehicle discovery, sequential locking, and host deck are all ready. Ship them.

3. **Convert the Modality Map to JSON** and wire it into Remarkable Reach. When a creator selects their branch, show them: "Here's what exists. Here are the gaps. What's your merge?" This turns the Scale Score from a diagnostic into a strategy engine.

4. **Run the first Vibe Rise Session.** All the frameworks, decks, and app features exist to support it. The session format (Connect → Heal → Wahoo → Close) is designed. The host deck is built. The next step is doing it IRL with 10-15 people and seeing what happens.

5. **Write the session handoff as an Obsidian note too** so it's cross-referenced with all the framework notes created this session.
