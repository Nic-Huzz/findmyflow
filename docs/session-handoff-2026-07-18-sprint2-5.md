# Session Handoff: Sprints 2-5 (2026-07-18)

*Continues from session-handoff-2026-07-18-creator-position-card.md (Sprint 1)*

---

## What was done

### Sprint 2: RemarkableFlow Hint Box
- Added `useBranchScoring` import to `src/flows/RemarkableFlow.jsx`
- **Branch selector** (`STEPS.BRANCH`): Gold "Recommended" pill tag on whichever branch matches the user's primary branch from their data. Does NOT pre-select.
- **Assumption step** (`STEPS.ASSUMPTION`): Collapsible "Stuck? Read this" hint box between the prompt and textarea. Shows frontier's "What most people assume" + "Why it no longer works" from `spiralDynamicsMatrix.json`. Does NOT pre-fill textarea.
- Hint label adapts: "Stuck? Read this" for new users, "What the market assumes" for returning users who already have assumption text.
- `hintOpen` state resets when `selectedBranch` changes.
- Files: `src/flows/RemarkableFlow.jsx`, `src/flows/RemarkableFlow.css`

### Sprint 3: AI Monopoly Statement
- DB migration: `ai_monopoly_statement TEXT` column added to `lead_flow_profiles` (migration `20260718000006`, applied to production)
- "Generate my position" button in CreatorPositionCard's "Your opportunity" section (inside frontier cards, when expanded)
- Calls existing `generate-positioning` edge function with a rich prompt containing: branches, rarity, frontier data, rule break, life quake, transformation, skills, problems, gap insight, competitive landscape
- Saves result to `lead_flow_profiles.ai_monopoly_statement`
- Replaces template text ("You [skill] people who experience [problem]...") with AI output when available
- "Regenerate" button when statement already exists
- Error state shown on failure
- Generate button placed OUTSIDE the `<button>` frontier card to avoid invalid nested buttons
- `profileIdRef === 'pending'` race condition handled via polling
- Files: `src/components/CreatorPositionCard.jsx`, `src/components/CreatorPositionCard.css`, `supabase/migrations/20260718000006_add_ai_monopoly_statement.sql`

### Sprint 5: Creator Competitive Map
- Classified all 33 `experienceCreatorDNA.json` profiles with `primaryBranch` and `secondaryBranch` via Haiku batch (`scripts/classify-creator-branches.cjs`)
- Distribution: healing (23), bonds (5), movement (2), nourishment (1), tools (1), story (1)
- Competitive density section in CreatorPositionCard monopoly block: "N of 33 experience creators work near your intersection" + tappable creator chips with branch labels
- Creator chips open existing creator detail modal via `onCreatorTap` prop from CreatorHomeV2
- Zero state: "No experience creators currently work at your intersection."
- AI monopoly prompt enriched with competitive landscape data
- DNA data imported directly into CreatorPositionCard (not shared hook) to avoid consumer app bundle bloat
- `nearbyCreators` useMemo uses 4-way branch overlap (primary-to-primary, primary-to-secondary, secondary-to-primary, secondary-to-secondary)
- Dependencies use scalar `primary?.branch`, `secondary?.branch` for stability
- Files: `public/data/experienceCreatorDNA.json`, `src/components/CreatorPositionCard.jsx`, `src/components/CreatorPositionCard.css`, `src/components/CreatorHome/CreatorHomeV2.jsx`, `scripts/classify-creator-branches.cjs`

---

## Decisions made

1. **RemarkableFlow hint is NOT pre-fill.** Collapsible hint box + recommended tag, user's decision. Confidence: 90%.
2. **AI monopoly uses `generate-positioning` edge function, not `agent-chat`.** Non-streaming is simpler for a one-shot "Generate" button. No new edge function needed.
3. **Monopoly statement saved to `lead_flow_profiles.ai_monopoly_statement`**, separate from `positioning_statement` (different content, different purpose).
4. **33 creators classified via AI batch, not keyword matching.** Edge cases (Phil Jackson, Sam Harris) justified the Haiku call over fuzzy keyword matching.
5. **DNA data imported into CreatorPositionCard directly**, not into useBranchScoring hook. Consumer app doesn't need competitive density data.
6. **No client-side differentiator built.** The AI monopoly statement handles differentiation via the enriched prompt. Simpler, better output.
7. **Sprint 4 (quest taxonomy tagging) skipped.** Sprint 5 done first because it's self-contained data enrichment. Sprint 4 requires more architectural decisions about the quest-to-taxonomy pipeline.

---

## In progress / next steps

1. **8 branches still need word-by-word content review** — Healing + Movement approved. Story, Tools, Status, Nourishment, Shelter, Fire, Threat, Bonds text in `public/data/spiralDynamicsMatrix.json` (simple objects on frontier/emerging cells) not yet reviewed with the user.
2. **PositioningSummary.jsx** — dead file, no longer imported. Can be deleted.
3. **Sprint 4: Quest taxonomy tagging** — add `skill_tags[]`, `problem_tags[]`, `persona_tags[]` to `quests` table. AI maps quest labels to taxonomy. Consumer courage challenges then feed creator portal branch scoring over time.
4. **Scaling creator dataset** — 33 is working. Next: enrich the 221 archived profiles with bios via AI, then classify those too. Target: 250+.

---

## Gotchas discovered

1. **Nested `<button>` inside `<button>` is invalid HTML.** The frontier card is a `<button>`. Generate/regenerate buttons must live OUTSIDE it, not inside. iOS WebKit particularly unreliable with nested interactive elements.
2. **`profileIdRef.current === 'pending'`** — the debounced `saveField` function sets this while an insert is in-flight. If `generateMonopoly` fires during that window, neither the update nor insert branch executes. Fixed with polling, but the pattern is fragile.
3. **`useMemo` with object dependencies** — `useBranchScoring` returns objects that are stable now (single `useState`), but would break `useMemo` if the hook is ever refactored to spread results. Always depend on scalar values (`primary?.branch`) not objects.
4. **experienceCreatorDNA.json is heavily healing-skewed** (23 of 33). This is accurate for the curated dataset, not a classification error. If/when scaled to 250+, distribution should be more balanced.
5. **`handleCreatorTap` in CreatorHomeV2 re-fetches experienceCreatorDNA.json over the network** despite it being statically imported in CreatorPositionCard. Pre-existing tech debt, not fixed this session.

---

## Recommendations

1. **Branch content review next** — 8 of 10 branches have unreviewed text. This is the lowest-effort, highest-risk item. If the text is wrong, every user sees it.
2. **Delete PositioningSummary.jsx** — dead code, clutters the repo.
3. **Sprint 4 (quest taxonomy tagging)** — highest leverage remaining sprint. Turns consumer app courage challenges into continuous signal for the creator portal.
4. **Verify `generate-positioning` edge function is deployed** — it's called by both the positioning generator and the new monopoly generator. If it's not deployed, both fail silently to template/error states.
5. **Check consumer build tree-shaking** — verify `CreatorHomeV2` is lazy-loaded in `AppRouter.jsx`. If it's eagerly imported, the experienceCreatorDNA.json data is in the consumer bundle unnecessarily.
