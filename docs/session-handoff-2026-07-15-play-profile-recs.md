# Session Handoff: Play Profile Workflow Recommendations (2026-07-15)

## What was done

### Play Profile Recommendations (new feature)
- **`src/components/CreatorHome/PlayProfileRecs.jsx`** (NEW) — Two components:
  - `PlayProfileEventRec` — event format recommendation card for Experiences tab. Parses the user's 5 DNA sliders from `dna_code` and recommends event format, size, and cadence. Evolves with data: Stage 1 (no experiences) shows recommendation + CTA. Stage 2+ compares their actual `experience_type` against the recommendation and shows aligned/misaligned/mixed/exploring feedback.
  - `PlayProfileContentRec` — content channel recommendation card for Growth tab. Recommends channel (newsletter, podcast, Reels, etc.), format, and cadence based on orientation + knowledgeStyle + workRhythm sliders.
- **`src/components/CreatorHome/CreatorHomeV2.jsx`** — Wired both components:
  - `PlayProfileEventRec` in Experiences tab (after LaunchPad, before QuarterlyPlanner)
  - `PlayProfileContentRec` in Growth tab (after ContentIntel, before KPIs)
  - Both guard on `dnaResult?.dna_code` existing (only show after Play Profile quiz completed)
- **`src/components/CreatorHome/CreatorHomeV2.css`** — Added `.ppr-*` styles (self-contained, no specificity coupling with `.ch2-id-section`)

### Canonical Creator Data cleanup (continued from Jun 29)
- **`docs/content-drafts/vibe-rise-videos/public/experienceCreatorCanonical.json`** v4.6 — fuelType inversion fixed (21 profiles), LOW_CONFIDENCE values resolved (9), bios/oneLiners filled (10/11), em dashes purged (112), Jay Shetty + John Gottman remarkableResult corrected
- **`public/data/experienceCreatorDNA.json`** — fuelType synced from canonical (21 values), affects live Play Profile matcher
- **`docs/dev-guides/video-branding-guide.md`** — updated to 5 ingredients, file paths corrected

### Obsidian
- **`Frameworks/Play Profile Workflow Recommendations.md`** — Full framework: 5 sliders with recommendations per position, NS signal framing (Sympathetic/Dorsal when working against type), 7 combo archetypes with creator proof points

## Decisions made

- **Play Profile = workflow design tool, not identity quiz.** The purpose is "how do YOU work best" so users stop copying someone else's system. The famous creator match is proof that the workflow works, not an identity to aspire to.
- **Event recs in Experiences tab, content recs in Growth tab.** Events are "what to build" (Experiences). Content is "how to grow" (Growth). Originally both were in Experiences but content belongs with the Instagram/BrandPulse data.
- **Alignment feedback uses experience_type field.** `checkAlignment()` compares the recommended format against the user's actual past experience types. `FORMAT_TO_TYPES` maps each recommendation to DB values (workshop, retreat, circle, online, one_on_one, popup, course).
- **NS signal framing over "anti-patterns."** Instead of "stop doing X, you'll underperform" we say "forced sprints push you into Sympathetic" — connects to the app's core NS model and is testable via daily check-ins.
- **No specific time prescriptions for sprints.** Dropped "2-week cycles" (80% confidence). Principle only: "intense bursts followed by deliberate recovery." User finds their own cycle.

## In progress / next steps

- **Visual confirmation needed.** Build passes but nobody has seen the cards render on dev server. Run `npm run dev` and navigate to `/create` (Experiences tab) and Growth tab with a user who has completed the Play Profile.
- **`FORMAT_TO_TYPES` mapping may need tuning.** The mapping of recommended formats to `experience_type` values is a best guess. Real user data will show if "Weekly intimate class" correctly maps to `['workshop', 'circle', 'one_on_one']`.
- **Pre-existing bug:** `computeCreatorXP` in CreatorHomeV2.jsx reads stale `dashboardKPIs` state. Not from this session, flagged by code reviewer.

## Gotchas discovered

- **`dna_code` format is "WR-FT-OR-KS-SA"** (5 numbers joined by dashes). `parseSliders()` validates length and NaN. Old quiz results with different formats will return null and the cards won't render (fails safe).
- **Only 3 of 5 sliders are user-facing in the quiz.** `workRhythm`, `fuelType`, `scaleApproach` are direct sliders. `orientation` and `knowledgeStyle` are inferred from game selections. The user never directly sets them.
- **fuelType was inverted in the DNA file.** Fixed this session. The app's Play Profile matcher now uses corrected values. Match results will differ from before the fix for returning users who retake the quiz.
- **`ppr-card` is self-contained CSS, not stacked with `ch2-id-section`.** The code reviewer caught a specificity coupling bug with the dual-class approach. Fixed by making `ppr-card` standalone.

## Recommendations

1. **Run `npm run dev` and visually confirm the cards** on `/create` with a test user who has a Play Profile result. This is the single highest-value next step.
2. **Test the fuelType correction impact** on Play Profile matching. A known user's top match may have shifted. Verify the matches still make sense.
3. **Consider surfacing the NS signal in the 7-day challenge.** If a Marathon creator's daily check-ins show repeated Sympathetic, the Tune tab could reference their Play Profile: "Your profile says you're a marathon creator. You've been Activated 4 of 5 days. Are you pushing a sprint?"
4. **Draft video #3: "The Rule They Broke"** — all data is ready in the canonical JSON.

## Key files

| File | Status |
|------|--------|
| `src/components/CreatorHome/PlayProfileRecs.jsx` | NEW — event + content rec components |
| `src/components/CreatorHome/CreatorHomeV2.jsx` | MODIFIED — wired both components |
| `src/components/CreatorHome/CreatorHomeV2.css` | MODIFIED — added `.ppr-*` styles |
| `public/data/experienceCreatorDNA.json` | MODIFIED — fuelType corrected |
| `docs/dev-guides/video-branding-guide.md` | MODIFIED — 5 ingredients, paths |
| `Obsidian: Frameworks/Play Profile Workflow Recommendations.md` | NEW |
