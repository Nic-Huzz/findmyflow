# Session Handoff: Gamification + Mystery Boxes + Skills + Zarlo (2026-07-13)

## What was done

### Community Feed Fixes
- `src/pages/CommunityFeed.jsx` — Display names now fetch `user_name` + `essence_archetype` from `lead_flow_profiles`. Avatar photos from `custom_essence_image` or `hero_avatar_url`. Wahoo counter redesigned as horizontal card with ⚡ icon. Stage graduation subtitle hidden (was leaking raw persona value like "Vibe Riser").
- `src/pages/CommunityFeed.css` — Avatar image styles, counter card styles.
- `src/components/PlayListTab.jsx` — Community Courage section fetches real user names instead of splitting titles.
- `src/AppRouter.jsx` — `/community` added to ConditionalBottomToolbar hidden routes.
- `src/lib/heroStageChecker.js` — Removed persona subtitle from stage graduation feed events.

### Community Feed Auto-Events Wired
- `src/components/GroanCompletionModal.jsx` — `first_wahoo` event + mystery box trigger.
- `src/Challenge.jsx` — `streak_milestone` events at 7/14/30/60/100 days + streak mystery box.

### Figurine Fixes
- `src/components/Figurine/FigurineFAB.jsx` — Chat panel rendered via `createPortal(document.body)` to fix broken layout (was clipped inside FAB's fixed container).
- `src/components/Figurine/FigurineOverlay.jsx` — Larger avatar (100px), emoji as badge, Safari zoom tooltip suppressed, all timers properly cleaned up on unmount.
- `src/components/Figurine/FigurineOverlay.css` — Full redesign: spring animation, premium shadows, pointer-events: none on avatar.
- `src/components/Figurine/FigurineChat.jsx` — Prompt bubbles per intelligence phase (3 suggestions when chat empty).
- `src/components/Figurine/FigurineChat.css` — Prompt bubble styles.
- `src/hooks/useFigurine.js` — SSE parse fix (edge function sends `{delta: "text"}` not `{type: "content_block_delta"}`), phase names → "Your Essence Voice Mentor", system prompt improvements (no em dashes, 12yo language, specificity rule), skill-based tone instructions, skills injected into prompt.
- `src/Challenge.jsx` — Figurine overlay copy updated: "I'm the essence you've always felt but couldn't name."

### Mystery Boxes v1 (Full Feature)
- `supabase/migrations/20260713000003_create_mystery_boxes.sql` — `mystery_boxes` table with unique constraint on `(user_id, trigger_type)`.
- `supabase/functions/generate-mystery-insight/index.ts` — Edge function reads 30 days of user data, picks content type (Pattern Mirror / Shadow Reveal / Capacity Insight) based on data thresholds, generates personalised insight via Haiku. Deployed v3.
- `src/lib/mysteryBoxes.js` — Helper functions: `earnMysteryBox`, `openMysteryBox`, `fetchMysteryBoxes`, `checkFirstWahooBox`, `checkStreakBox`, `checkNewCategoryBox`, `checkZoneTransitionBox`.
- `src/components/MysteryBox/MysteryBoxNotification.jsx` — Pulsing 🎁 badge in ChallengeHeader with unopened count.
- `src/components/MysteryBox/MysteryBoxModal.jsx` — Full-screen opening animation (sealed → shaking → AI insight reveal with tier-specific confetti).
- `src/components/MysteryBox/MysteryBox.css` — All mystery box + AI Mirrors collection styles.
- `src/components/MysteryBox/AIMirrorsCollection.jsx` — Opened insight gallery on `/me` page.
- `src/components/ChallengeHeader.jsx` — MysteryBoxNotification wired next to streak badge.
- `src/Profile.jsx` — AIMirrorsCollection added above "Ready To Find Your Flow" section.
- `src/hooks/useCapacityScore.js` — Zone transition mystery box trigger (dynamic import).

**10 Triggers wired:**
1. First wahoo (bronze) — `GroanCompletionModal.jsx`
2. 7-day streak (bronze) — `Challenge.jsx`
3. 30-day streak (gold) — `Challenge.jsx`
4. New wahoo category (silver) — `GroanCompletionModal.jsx`
5. Capacity zone transition (gold) — `useCapacityScore.js`
6. First healing flow (bronze) — `HealingFlowModal.jsx`
7. First quest achieved (silver) — `QuestBoardCard.jsx`
8. Hero stage 4 (gold) — `heroStageChecker.js`
9. Hero stage 7 (legendary) — `heroStageChecker.js`
10. 4th weekly review (silver) — `WeeklyReview.jsx`

### Self-Knowledge Skills (Full Feature)
- `supabase/migrations/20260713000004_recovery_curiosity_skill_rpcs.sql` — `compute_recovery_count` + `compute_curiosity_count` RPCs + performance index. Applied to Supabase.
- `src/hooks/useSkills.js` — Computation hook. 5 parallel queries. Exports `SKILL_THRESHOLDS`, `computeLevel`, `formatSkillsForPrompt`.
- `src/components/journey/SkillsDisplay.jsx` + `.css` — Journey tab display: dot indicators, tap-to-expand detail.
- `src/components/JourneyTab.jsx` — SkillsDisplay added below Figurine presence section.
- `src/hooks/useFigurine.js` — 3 extra queries (depth, recovery, curiosity), skills computed and injected into system prompt with skill-based tone instructions.
- `supabase/functions/generate-mystery-insight/index.ts` — Skill levels added to all 3 prompt templates.

### Zarlo Light Theme
- `src/components/Zarlo/Zarlo.css` — Full dark→light theme swap via CSS variables. White bg, dark text, light gray message bubbles, purple user messages, softer shadows, 22px border radius.

### Zarlo V2 Spec (Design Doc, Not Built)
- `docs/features/zarlo-v2-dcc-companion-spec.md` — Full spec for DCC-inspired companion upgrade. 4 phases, hybrid AI/scripted model, character bible, disagree triggers, navigation-aware reactions, free-text input, CD6 scarcity mechanics.

### Octalysis Score Updated
- `docs/research/octalysis-application-analysis.md` — Score progression: 217 → 337 → 361 → 404 → 436 → 487. 7 of 8 drives at target.

---

## Decisions made

1. **Mystery box content types limited to 3** (Pattern Mirror, Shadow Reveal, Capacity Insight). Founder DNA Shift deferred because mapping wahoo categories to DNA slider dimensions is speculative with limited data. Better to have 3 high-quality types than 6 mediocre ones.

2. **Skills don't gate Figurine phases.** Originally spec'd as phase gates (Phase 1 = Presence L3 + Courage L2). Changed to skill-aware tone instructions injected into the prompt. Each skill unlocks a specific dimension of directness independently. A user with high Courage but low Depth gets challenged on wahoos but treated gently on inner work.

3. **Skill thresholds calibrated for 5-month L5** at ~5 active days/week. Presence: 7/20/40/70/100. Courage: 3/10/25/45/65. Depth: 2/5/10/15/20. Recovery: 2/5/10/18/30. Curiosity: 1/2/3/4/5.

4. **Depth counts `recognised` + `released` healing stages** (completed the 7-step flow). Not `in_progress` (might be abandoned).

5. **Mystery box dedup** uses a global unique constraint on `(user_id, trigger_type)` rather than a partial index. Simpler, covers all trigger types including dynamic ones like `new_category_screen`.

6. **Zarlo V2 uses hybrid model**, not full AI. Navigation, intake flow, accountability, commitment, routing stay scripted. Greeting + context responses + free-text become AI-streamed. Cost: ~$5/month at 100 DAU.

7. **No momentum window or morning surge** in Zarlo V2. User rejected time-pressure mechanics. CD6 addressed through data-gated reveals + weekly countdown only.

8. **Figurine overlay copy**: "I'm the essence you've always felt but couldn't name. I'm here now, and I'm not going anywhere. Talk to me whenever you need."

9. **Linter strips static imports** of `earnMysteryBox` from components. All mystery box triggers use dynamic `import('../lib/mysteryBoxes').then(m => m.earnMysteryBox(...))` pattern.

10. **Community feed display format**: `userName: essenceName` (e.g. "huzz: Playful Alchemist"). Fetches `user_name` from `lead_flow_profiles`.

---

## In progress / next steps

### Zarlo V2 Build (Next Session)
Spec complete at `docs/features/zarlo-v2-dcc-companion-spec.md`. Recommended: new agent with fresh context window.

**Phase 1 (highest impact, 1 session):**
1. Build `buildZarloPrompt()` in `src/lib/zarlo/zarloEngine.js`
2. Add free-text input to `src/components/Zarlo/ZarloChat.jsx`
3. Replace `showPageContext()` greeting with streaming AI call via `agent-chat` edge function
4. Replace `handleContextPrompt()` responses with streaming AI
5. Add `getRecentActions()` — 3 parallel LIMIT 1 queries from existing tables
6. Keep intake, accountability, commitment, routing as scripted

**Key files to read before building:**
- `docs/features/zarlo-v2-dcc-companion-spec.md` (the full spec)
- `src/components/Zarlo/ZarloChat.jsx` (current implementation, 914 lines)
- `src/lib/zarlo/zarloEngine.js` (data loading + scripted responses)
- `src/components/Figurine/FigurineChat.jsx` (reference for free-text + streaming pattern)
- `src/hooks/useFigurine.js` (reference for SSE streaming + system prompt injection)

### Other Pending
- **CD6 Scarcity gap**: Only drive below target. Data-gated reveals + weekly countdown in Zarlo V2 Phase 4 would close it.
- **Additional mystery box triggers**: L1/L2/L3 depth (zone deep dive/boss fight/milestone) can't be wired until those flows write to `user_level_progress.deep_dive_completed` etc.
- **`celebrateStreakMilestone` is dead code** in `useCelebrations.js` (never called anywhere). Noted but not fixed.

---

## Gotchas discovered

1. **Linter strips unused-looking imports.** Any import used only inside an async `.then()` callback gets removed. Use dynamic `import()` for mystery box triggers in completion handlers.

2. **`agent-chat` edge function SSE format** sends `{delta: "text"}` (string), NOT Anthropic's raw `{type: "content_block_delta", delta: {text: "..."}}`. The Figurine's parser now handles both formats. Zarlo V2 should use the same pattern.

3. **`challenge_weekly_scores` column naming**: `business_score` = Tune tab scoring. The column name is misleading. Don't call it "tune" in AI prompts without verifying the actual data.

4. **`weekly_user_scores` table doesn't exist.** The correct table is `challenge_weekly_scores` with columns `business_score`, `healing_score`, `courage_score`.

5. **`user_level_progress` columns**: `current_level` (not `level`), `zone_diagnosis_zone` (not `zone_result`), `zone_diagnosis_boss` (not `protective_voices`). Multiple edge functions had wrong column names.

6. **FigurineChat must render via portal** (`createPortal(document.body)`) because the FAB container is `position: fixed` with explicit bottom/left coords. Without portal, the overlay gets clipped.

7. **Recovery skill RPC** does a self-join on `nervous_system_checkins`. Added index `idx_nsc_drain_recovery` to prevent performance issues with power users.

---

## Recommendations

1. **Build Zarlo V2 Phase 1 next.** It's the single highest-impact change remaining. The spec is detailed enough for a fresh agent. Everything else (phases 2-4, CD6 closing) builds on top of Phase 1's AI personality layer.

2. **Test mystery boxes with real users.** I seeded 3 test boxes for huzz@nichuzz.com (reset to unopened). The AI insight quality was good on Pattern Mirror and Shadow Reveal. Capacity Insight was less impressive because `business_score` (Tune) is all zeros. More user data = better insights.

3. **Deploy edge function updates** for `generate-mystery-insight` after any further prompt tweaks. Current version is v3 on Supabase.

4. **Don't touch the Figurine until Zarlo V2 ships.** The two characters need clear differentiation, and Zarlo V2's personality layer will define the boundary.
