# Session Handoff: Phase 3 × Spiral Dynamics — Complete (July 15-25 2026)

## What was done

### Framework + Research
- Rule Break Tree expanded from 10 → 12 primal branches (Play + Sleep added by another agent, integrated here)
- All 12 branches have verified frontier market research at `docs/research/frontier-*.md`
- Phase 2 vs Phase 3 adaptive framing on frontier cards (different labels per phase)
- Play analyzed by MasterMind Council: not a branch, but the PRINCIPLE that makes Phase 3 work. Saved to `Obsidian/Frameworks/Play as Principle.md`
- Fire branch renamed to "Energy" in user-facing labels (internal ID stays `fire`)

### CreatorPositionCard (Sprint 1 — shipped)
- `src/components/CreatorPositionCard.jsx` + `.css` — replaces PositioningSummary on CreatorHomeV2
- Monopoly hero (skills × problems × personas vs 299 profiles, exact matching)
- Branch intersection (primary × secondary with merge insight)
- Phase 2/3 adaptive frontier cards with verified research text (12yo language)
- "Your opportunity" personalized with user's skill/problem data
- AI monopoly statement generate button (Sprint 3, built by other agent)
- Competitive density chips from 33 branch-tagged experienceCreatorDNA profiles
- Positioning statement (life quake + transformation + 3 options picker)

### RemarkableFlow (Sprint 2 — shipped)
- "Recommended" tag on user's primary branch
- Collapsible "Stuck? Read this" hint box on assumption step
- Monopoly rarity shown on "Different" step ("Nobody combines X + Y + Z")

### Gap fixes (3 of 10 gaps closed)
- GAP 2: Scale Score branch pre-fill from useBranchScoring + recommended tag (`src/pages/FacilitatorScore.jsx`)
- GAP 3: "Design an experience for this gap" CTA on frontier card (`CreatorPositionCard.jsx`)
- GAP 4: Monopoly rarity on RemarkableFlow "Different" step

### Quest taxonomy tagging
- `classify-quest-skills` edge function now returns branch alongside skill_tags (deployed)
- `questSkillTagger.js` saves branch to quests table
- `useBranchScoring` uses `quest.branch` directly (falls back to keyword matching)
- `quests.branch` column added to DB, 15 existing quests retroactively tagged
- Courage challenge branch scoring removed (skill_tags = vehicles, not territories)

### Creator XP system
- Milestone-based (not per-action). No XP for creating empty experiences.
- Thresholds 4x higher: Builder 200, Launcher 600, Scaler 1500, Movement Maker 4000
- Rewards: positioning work, events run, fill rate, repeat rate, 3% improvements, total attendees

### Data
- 299 careerModels profiles classified with `primaryPersona` via Haiku batch job
- `spiralDynamicsMatrix.json`: 72 cells (12 branches × 6 SD levels), all with `simple` + `phase` fields
- 10 blog drafts at `docs/content/frontier-insights-draft.md`

### Bug fixes
- Origin overlay "Let's go" button wasn't dismissing (localStorage write didn't trigger re-render)
- Profile tab removed from Creator Portal toolbar (needs creator-specific version)
- Electron app paywall: stale `dist-creator/` build was the cause

## Decisions made

| Decision | Why |
|----------|-----|
| SD level removed from user-facing output | Depth levels measure skill progression, not value systems. Utility is Phase 3 trends, not developmental labels. |
| Phase 2 vs Phase 3 adaptive framing | Different branches need different cards. Phase 3 branches already have products; Phase 2 don't. |
| "Your opportunity" replaces Prediction | Personalized > generic. Both framings end with user's skill + problem data. |
| Play is a principle, not a branch | MasterMind Council: play permeates all branches. Tracked as delivery mode, not separate branch. But Rule Break Tree HAS it as a branch for structural reasons. |
| Fire → Energy in user-facing labels | "Energy frontier" is clearer than "Fire frontier" for creators. Internal ID stays `fire`. |
| Bonds reframe: sport club model | Sport clubs solved affordable belonging for movement. The gap is category-specific (career, healing, creative). |
| Status reframe: interior over exterior | "What have you become?" beats "What do you have?" DIY/transformation as status. |
| Branch scoring weights: action + wounds > curiosity > skills | Problems ×3, vibe quests ×3, curiosity ×2. Tested on real data. |
| Remarkable Flow: hint not pre-fill | Collapsible "stuck?" box, not textarea pre-population. User writes their own, with context available. |
| Experience-positioning alignment: ship value first | Low-sales diagnostic using existing data (Sprint 1). Delivery modes + personas deferred to later phases. |

## In progress / next steps

1. **Experience create/edit merge** — spec at `docs/features/experience-create-edit-merge.md`. Users can't edit event date after creation. Merge ExperienceCreate + ExperienceDetail into one page. 30-45 min build.

2. **Branch content review** — Healing, Movement, Bonds, Status, Nourishment, Shelter, Fire/Energy, Threat all approved. Play + Sleep frontier text updated with research but not word-by-word reviewed by user.

3. **Experience-positioning alignment** — spec at `docs/features/experience-positioning-alignment.md`. Phase 1: low-sales → Remarkable Flow diagnostic checklist. Phase 2: delivery modes + persona tracking. Phase 3: post-event mirror.

4. **Vibe Rise multi-gap strategy** — identified but not productized. Sessions touch 8 of 12 gaps. See `Obsidian/Business/Vibe Rise Multi-Gap Strategy.md`.

5. **Remaining data flow gaps** — 7 open gaps in `docs/architecture/creator-portal-data-flow.md`. GAPs 1, 5, 6, 7, 8, 9, 10.

6. **Branch feedback mechanism** — "Is this your primary branch? Change" link. Specced in personal-monopoly-finder.md Sprint 4. Not built.

## Gotchas discovered

- `questSkillTagger.js` was rewritten by another agent to use client-side keyword matching instead of the edge function for TASK classification. The edge function is still used for QUEST classification. Don't confuse the two.
- `dist-creator/` must be rebuilt (`npm run build:creator`) for Electron app changes to take effect. Easy to forget.
- `hasPositioningStatement` state was removed from CreatorHomeV2 — CreatorPositionCard handles its own state. Don't re-add it.
- The Obsidian note uses "Rest" not "Sleep" for the 12th branch name (another agent's choice). The codebase uses "sleep" as the ID. Both are correct in their context.
- `getGamificationState()` reads from localStorage at render time but doesn't trigger re-renders. Any UI gated on it needs local React state to dismiss (see origin overlay fix).

## Recommendations

1. **Merge ExperienceCreate + ExperienceDetail** — highest user-facing impact. Users can't change event dates. 30-45 min.
2. **Deploy to production** — all this work is on `feature/interior-scoreboard-sprint2` branch. Nothing is on main. When ready, merge the branch.
3. **Review Play + Sleep frontier card text** with the user — same word-by-word review process used for the other 10 branches.
4. **Build the low-sales diagnostic** (experience-positioning alignment Phase 1) — uses existing data, no new fields needed, high value for creators with underperforming events.
