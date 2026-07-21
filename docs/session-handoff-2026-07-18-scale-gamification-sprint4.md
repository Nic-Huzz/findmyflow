# Session Handoff: Scale Gamification Sprint 4 + G15 Zarlo (Jul 18)

## What was done

**Branch:** `feature/interior-scoreboard-sprint2` (NOT merged to main)

### Sprint 4 Features (8 total, all committed)

| Feature | Files | Commit |
|---|---|---|
| G11 Hidden Achievements | `src/lib/creatorGamification.js` (HIDDEN_ACHIEVEMENTS), `src/components/CreatorHome/CreatorCelebrations.jsx/css` | 027b28f |
| G8 Building Streak | `src/lib/creatorGamification.js` (updateBuildingStreak, weekToDate), `CreatorHomeV2.jsx/css` | 027b28f |
| G19 Spider Celebrations | `src/lib/creatorGamification.js` (checkSpiderTierUpgrades, storeSpiderTiers), `CreatorCelebrations.jsx` | 027b28f |
| G12 Quarterly Planning | `src/components/CreatorHome/QuarterlyPlanner.jsx/css`, mounted in `CreatorHomeV2.jsx` Experiences tab | 027b28f |
| G9 Alt Positionings | `src/components/CreatorPositionCard.jsx/css`, `supabase/functions/generate-positioning/index.ts` | 027b28f |
| G7 Sequential Score Reveal | `src/components/CreatorHome/ExperienceResultsReveal.jsx/css`, `src/components/pipeline/PastExperienceStats.jsx` | 027b28f |
| G16 Creator Insight Drops | `src/hooks/useCreatorInsightDrops.js`, mounted in `CreatorHomeV2.jsx` | 027b28f |
| G15 Zarlo for Creators | `src/hooks/useCreatorZarloTriggers.js`, `src/lib/zarlo/zarloPageContent.js`, mounted in `CreatorHomeV2.jsx` | 525c17d |

### Edge Function Deployed
- `generate-positioning` — modified to accept `count` param, returns 3 options via `|||` separator. **Deployed live** to Supabase.

### Docs Updated
- `docs/research/octalysis-scale-portal-analysis.md` — Score progression: 140 → 260 → 375 → 424
- `docs/superpowers/plans/2026-07-18-scale-gamification-implementation-plan.md` — G7/G15/G16 specs fully rewritten with confirmed architecture decisions

### User Modified (during session)
- `src/lib/creatorGamification.js` — XP level thresholds rebalanced (50→200, 150→600, 400→1500, 1000→4000) for months-not-days progression

## Decisions made

1. **G7 trigger:** Option A (auto on first view of past event, no manual close-out button)
2. **G15 data access:** Props from CreatorHomeV2 (no extra Supabase queries for triggers)
3. **G15 frequency:** Max 2/day, 2h cooldown, most urgent trigger wins (mirrors consumer)
4. **G15 bubble action:** Tap opens Zarlo chat with `/create` context pre-loaded
5. **G16 no edge function:** All 5 insight types are client-side templates. 2 use hardcoded percentile benchmarks. Swap for RPC at 50+ users.
6. **G16 trigger priority:** Waterfall (same as consumer useInsightDrops.js)
7. **G16 vs Zarlo separation:** Insight Drops = template data observations (passive). Zarlo = AI conversational (active). No overlap.
8. **Hidden achievement `sold_out` key:** Renamed to `ach_sold_out` to avoid collision with regular milestone celebration
9. **Night Owl hours:** 23:00-04:59 (not just midnight-5am)
10. **weekDiff:** Date-based computation (not year*52) to handle 53-week years

## In progress / next steps

Nothing in progress. All features committed and build-passing.

**To hit 450 target (currently 424, gap = 26 points):**
1. Monthly Scale call (0 code, CD5+2) — schedule with first 3 paying users
2. Accountability pairs (0 code, CD5+1) — manual matching after 4+ users
3. Creator Profile page (G17, 3 days, CD4+1) — public page at `create.nichuzz.com/creator/[id]`

## Gotchas discovered

- **`hasActivityThisWeek` (building streak)** uses lifetime data as proxy. A returning user with ANY data counts as active. Streak advances once per week on portal open. This is a design decision (v1), not a bug. Proper fix requires date-aware queries.
- **Consumer Zarlo + Creator Zarlo overlap:** ZarloWidget has its own internal proactive system (reads `zarlo_briefs`). For creator-only users, that table is empty so it no-ops. If a user has BOTH consumer + creator data, both systems could theoretically fire on same session. Unlikely, not visually conflicting.
- **`generate-positioning` edge function** now uses `|||` as separator. If Claude doesn't follow the instruction, fallback returns single statement. Deployed live.
- **QuarterlyPlanner** uses `crypto.randomUUID()` for plan IDs — works in all modern browsers + Capacitor WKWebView.
- **CreatorHomeV2.jsx** is now ~1400 lines. Getting chunky. Future refactor candidate (extract Zarlo integration, extract trigger data computation).

## Recommendations

1. **Test with a real user** (Week 3 gate still applies). Open the portal, verify: origin story → launch pads → positioning picker → Zarlo bubble fires after 1500ms delay if trigger conditions met. The sequential score reveal needs a past event with attendees.
2. **Don't merge to main** until tested. Branch has 5+ commits ahead.
3. **Next code feature:** Creator Profile page (G17). It's the last CD4 lever and creates a shareable URL that drives social proof.
4. **Next non-code action:** Schedule the first monthly Scale call. This is the single biggest remaining CD5 lever (community) and costs zero development time.
5. **Consider extracting** `CreatorHomeV2` gamification logic into a `useCreatorGamificationData()` hook to reduce the 1400-line file.
