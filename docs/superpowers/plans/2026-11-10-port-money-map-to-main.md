# Port feat/money-map to Main — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a fresh branch from main, manually port all feat/money-map features + our voice stem onboarding session work, then merge to main. This avoids cherry-pick/rebase conflicts from 70+ commits of divergence.

**Architecture:** Fresh branch `feat/port-money-map` from current `main`. Port features in logical groups: Money Map core → Passion Challenges → Tier 1 restructure → Voice Stem Onboarding → Misc fixes. Each group is a task that ends with a build check. Conflict files (AppRouter, ProgressTab, ExperienceGameFlow, VoiceStemFlow) handled manually with explicit resolution strategy.

**Session work committed:** `feat/money-map` commit `8c977f47` has all session changes (SignupGate, DownloadApp, mode split, bug fixes). Reference this commit for Voice Stem work.

## Execution Strategy

- **Tasks 1-4, 6:** Dispatch to subagents (clean copies + well-defined conflict resolutions)
- **Task 5 (Voice Stem Onboarding):** Execute INLINE in the orchestrating session — too context-dependent for a subagent. Main's VoiceStemFlow (~1400 lines) needs surgical additions from session commit `8c977f47`.
- **Task 7:** Final verification, can be inline or subagent
- **ALL AppRouter changes consolidated into Task 1** — no other task touches AppRouter

**Tech Stack:** React 18 + Vite + Supabase + Anthropic Claude API

**Spec:** This plan ports work from `feat/money-map` branch. Design specs at:
- `docs/superpowers/specs/2026-10-20-money-map-design.md`
- `docs/superpowers/specs/2026-11-10-voice-experience-game-design.md`
- `docs/superpowers/specs/2026-11-09-tab-restructure-voice-onboarding-design.md`

## Global Constraints

- Never merge an entire feature branch to main — port files manually
- Light theme throughout, no dark backgrounds
- No em dashes in user-facing copy
- CSS scoped to parent class
- 12-year-old readable copy
- Build must pass (`npm run build`) after every task

## Conflict Resolution Strategy (decided)

These files exist on BOTH main and feat/money-map with different changes. Resolution:

| File | Resolution | Reason |
|------|-----------|--------|
| `AppRouter.jsx` | **Merge both** — keep main's voice stem routes + add money-map routes + remove journey/workshop routes (lines 320-325, 786-790 on main) | Both add routes we need |
| `ProgressTab.jsx` | **Use feat/money-map** — simpler version without journey chapters. Must also remove `journeyChapters` import (line 24 on main) | Aligns with tab restructure spec (chapters removed) |
| `ExperienceGameFlow.jsx` | **Use feat/money-map** — remove GetPaidScreen + PathSuggestions + POSITIVE_STATES + want_paid tracking | Paid filter now lives in voice stem Stage 6, not Experience Game |
| `ExperienceGameFlow.css` | **Use feat/money-map** — remove 14 `.exp-game-getpaid-*` CSS rules | CSS for removed components |
| `VoiceStemFlow.jsx` | **Use main + apply session diff** — main has Stages 1-4 with months of fixes, session adds Stage 5-6 + signup gate + download screen | Main is the better base; session work is additive |
| `ChooseQuestsFlow.jsx` | **Use feat/money-map** — simpler onComplete (no paths param), CTA text change | Callers don't use paths param |
| `stemProcessing.js` | **Use feat/money-map** — extends to stages 5-6 | Additive, compatible |
| `process-stems/index.ts` | **Use feat/money-map** — adds Stage 5-6 prompts with activity ID fix | Additive + includes our bug fix |
| `DiscoverTab.jsx` | **Apply feat/money-map diff** — Money Map card replaces bridge CTA | Exists on both branches |
| `LevelTab.jsx` + `.css` | **Apply feat/money-map diff** — financial security section, "Find something new" link | Exists on both branches |
| `QuestBoardCard.jsx` + `.css` | **Apply feat/money-map diff** — Next Move UI, passion challenge display | Exists on both branches |
| `GroanCompletionModal.jsx` | **Apply feat/money-map diff** — simplified completion + stage advancement | Exists on both branches |
| `useDomeData.js` | **Apply feat/money-map diff** — want_paid column support in upsert | Exists on both branches |
| `AuthProvider.jsx` | **Apply feat/money-map diff** — removes `isAnon` guards on last_seen_at tracking | Small mechanical change |
| `JourneyTab.jsx` | **Apply feat/money-map diff** — remove `journeyChapters` import (line 11 on main), update direction handling | Exists on both branches |

## Deletion Dependency Chain

Deleting journey/workshop files requires cleaning up references first. On main, these files are imported by:

- `src/AppRouter.jsx` lines 320-325 (imports), 786-790 (routes), 438-439 (toolbar condition)
- `src/components/ProgressTab.jsx` line 24 (`journeyChapters` import)
- `src/components/JourneyTab.jsx` line 11 (`journeyChapters` import)

**Order:** Remove imports/references FIRST, then delete files, then build check.

## Migration Notes

- Migrations `20261021000001_money_map`, `20261109000001_money_map_pulse`, `20261109000002_quest_skill_node_id` are NOT on main and need to be ported as files
- `want_paid` column on `experience_dome_ratings` was already applied to prod DB via MCP (this session) but has no migration file on either branch — create one
- `passion_challenge_recs` and `flow_statement` migrations are NOT on main, need porting
- `workshop_tables` migration exists on main and was already applied to prod — do NOT delete the migration file (breaks Supabase migration tracking). Leave it; add a cleanup migration later if needed to drop the tables

## Source Inventory

**Where to read each file from:**
- feat/money-map committed files: `git show feat/money-map:<path>`
- feat/money-map uncommitted (our session): working directory on feat/money-map
- main files: already on the new branch

---

### Task 1: Create Branch + Port Money Map Core

**Files:**
- Create: `src/flows/MoneyMapFlow.jsx`, `src/flows/MoneyMapFlow.css`
- Create: `src/lib/moneyMapUtils.js`, `src/lib/financialSecurityEngine.js`
- Create: `src/components/FinancialSecurityCard.jsx`, `src/components/FinancialSecurityCard.css`
- Modify: `src/AppRouter.jsx` (add MoneyMapFlow route)
- Modify: `src/components/DiscoverTab.jsx` (Money Map card changes)
- Modify: `src/components/level/LevelTab.jsx` + `.css` (financial security section)
- Modify: `src/components/GroanCompletionModal.jsx` (stage advancement)
- Modify: `src/hooks/useDomeData.js` (want_paid column support)
- Delete: `src/flows/CurrentJobFlow.jsx`, `src/flows/CurrentJobFlow.css`
- Delete: `src/flows/FindBridgeFlow.jsx`, `src/flows/FindBridgeFlow.css`
- Create: `supabase/migrations/20261021000001_money_map.sql`
- Create: `supabase/migrations/20261109000001_money_map_pulse.sql`
- Create: `supabase/migrations/20261109000002_quest_skill_node_id.sql`

**Interfaces:**
- Produces: MoneyMapFlow component (routed at `/money-map`), financialSecurityEngine (used by FinancialSecurityCard), moneyMapUtils (used by MoneyMapFlow)

- [ ] **Step 1:** Create branch from main
```bash
git checkout main && git pull
git checkout -b feat/port-money-map
```

- [ ] **Step 2:** Copy new files from feat/money-map (no conflicts — these don't exist on main)
```bash
git show feat/money-map:src/flows/MoneyMapFlow.jsx > src/flows/MoneyMapFlow.jsx
git show feat/money-map:src/flows/MoneyMapFlow.css > src/flows/MoneyMapFlow.css
git show feat/money-map:src/lib/moneyMapUtils.js > src/lib/moneyMapUtils.js
git show feat/money-map:src/lib/financialSecurityEngine.js > src/lib/financialSecurityEngine.js
git show feat/money-map:src/components/FinancialSecurityCard.jsx > src/components/FinancialSecurityCard.jsx
git show feat/money-map:src/components/FinancialSecurityCard.css > src/components/FinancialSecurityCard.css
```

- [ ] **Step 3:** Copy migration files
```bash
git show feat/money-map:supabase/migrations/20261021000001_money_map.sql > supabase/migrations/20261021000001_money_map.sql
git show feat/money-map:supabase/migrations/20261109000001_money_map_pulse.sql > supabase/migrations/20261109000001_money_map_pulse.sql
git show feat/money-map:supabase/migrations/20261109000002_quest_skill_node_id.sql > supabase/migrations/20261109000002_quest_skill_node_id.sql
```

- [ ] **Step 4:** Delete replaced flows
```bash
git rm src/flows/CurrentJobFlow.jsx src/flows/CurrentJobFlow.css
git rm src/flows/FindBridgeFlow.jsx src/flows/FindBridgeFlow.css
```

- [ ] **Step 5:** Port modified files — for each file, run `git show feat/money-map:<path>` and `git show main:<path>`, diff them, and apply feat/money-map's changes to main's version:
- `src/components/DiscoverTab.jsx` — Money Map card replaces bridge CTA. Read both versions with `git diff main..feat/money-map -- src/components/DiscoverTab.jsx`
- `src/components/level/LevelTab.jsx` + `.css` — financial security section added below quest list
- `src/components/GroanCompletionModal.jsx` — simplified completion flow + stage advancement logic
- `src/hooks/useDomeData.js` — add `want_paid` to upsert row objects in `setState` and `bulkSetStates`

- [ ] **Step 6:** Clean up AppRouter — ALL AppRouter changes for the entire plan happen here. No other task touches this file. Edit `src/AppRouter.jsx`:
1. ADD: `const MoneyMapFlow = lazyRetry(() => import('./flows/MoneyMapFlow'))` import
2. ADD: MoneyMapFlow route `<Route path="/money-map" ...>`
3. ADD: `/try/onboarding` route: `<Route path="/try/onboarding" element={<Suspense fallback={<LoadingSpinner />}><VoiceStemFlow mode="onboarding" /></Suspense>} />`
4. CHANGE: existing `/try/voice-stems` route to pass `mode="workshop"` prop: `<VoiceStemFlow mode="workshop" />`
5. REMOVE: `import JourneyContainer` (line 323 on main)
6. REMOVE: `import FacilitatorDashboard` (line 324 on main)
7. REMOVE: `import WorkshopCreatePage` (line 325 on main)
8. REMOVE: `const ChildhoodReflectionFlow = lazyRetry(...)` (line 320 on main)
9. REMOVE: Journey routes at lines 786-790 (`/journey`, `/journey/create`, `/journey/:code/facilitate`, `/journey/:code`)
10. REMOVE: `isJourneyRoute` from toolbar condition (line 438-439 on main)
11. REMOVE: CurrentJobFlow and FindBridgeFlow imports (if still referenced)
12. VERIFY: VoiceStemFlow lazy import exists (should already be on main: `const VoiceStemFlow = lazy(() => import('./flows/VoiceStemFlow'))`)

- [ ] **Step 7:** Remove journeyChapters references from consumers BEFORE deleting the file:
- `src/components/ProgressTab.jsx` line 24: remove `import { JOURNEY_CHAPTERS, getChapterForStage } from '../data/journeyChapters'` and all usage
- `src/components/JourneyTab.jsx` line 11: remove `import { getChapterForStage, getStepsWithStatus } from '../data/journeyChapters'` and all usage
(These files are being replaced with feat/money-map's versions in Task 2, but the import removal must happen here to avoid build failure after deletion.)

- [ ] **Step 8:** Delete old journey/workshop files (NOT the migration — it's already applied to prod)
```bash
git rm src/flows/JourneyContainer.jsx src/flows/JourneyContainer.css
git rm src/flows/ChildhoodReflectionFlow.jsx src/flows/ChildhoodReflectionFlow.css
git rm src/components/journey/CheckpointScreen.jsx
git rm src/components/journey/FacilitatorDashboard.jsx
git rm src/components/journey/JoinScreen.jsx
git rm src/components/journey/WorkshopCreatePage.jsx
git rm src/hooks/useWorkshopChannel.js
git rm src/data/journeyChapters.js
```

- [ ] **Step 9:** Build check
```bash
npm run build
```
If build fails, grep for remaining references to deleted files:
```bash
grep -r "JourneyContainer\|ChildhoodReflection\|FacilitatorDashboard\|JoinScreen\|WorkshopCreatePage\|useWorkshopChannel\|journeyChapters" src/ --include="*.jsx" --include="*.js" -l
```

- [ ] **Step 10:** Commit
```bash
git add -A && git commit -m "feat: port Money Map core — MoneyMapFlow, FinancialSecurityCard, remove journey/workshop flows, migrations"
```

---

### Task 2: Port ProgressTab + StageCard + JourneyTab Changes

**Files:**
- Modify: `src/components/ProgressTab.jsx`, `src/components/ProgressTab.css`
- Modify: `src/components/StageCard.jsx`, `src/components/StageCard.css`
- Modify: `src/components/JourneyTab.jsx`
- Modify: `src/components/PerQuestRadar.jsx`, `src/components/PerQuestRadar.css`
- Modify: `src/components/QuestBoardCard.jsx`, `src/components/QuestBoardCard.css`
- (journeyChapters.js already deleted in Task 1 Step 8)
- Modify: `src/pages/MePage.jsx`

**Interfaces:**
- Consumes: FinancialSecurityCard from Task 1
- Produces: Simplified ProgressTab (needed for tab restructure later)

- [ ] **Step 1:** Port ProgressTab — use feat/money-map's version (simpler, no journey chapters)
Read main's current `ProgressTab.jsx`, then read feat/money-map's version. Replace main's with feat/money-map's. Verify imports resolve (FinancialSecurityCard from Task 1 must exist).

- [ ] **Step 2:** Port StageCard, JourneyTab, PerQuestRadar, QuestBoardCard
Read each file from feat/money-map, compare with main's version, apply the money-map changes.
- StageCard: simplified UI
- JourneyTab: changes to directionComplete handling
- PerQuestRadar: aliveness dimension bars replace life fuel bars
- QuestBoardCard: Next Move UI + passion challenge display

- [ ] **Step 3:** Port MePage changes
Read feat/money-map's version, apply diff to main's.

- [ ] **Step 4:** Build check
```bash
npm run build
```

- [ ] **Step 5:** Commit
```bash
git add -A && git commit -m "feat: port ProgressTab simplification, QuestBoardCard Next Move UI, PerQuestRadar aliveness bars"
```

---

### Task 3: Port Passion Challenge Engine + Tier 1 Restructure

**Files:**
- Create: `src/lib/passionChallengeEngine.js`
- Create: `src/data/tier1Challenges.js`
- Create: `supabase/functions/generate-passion-challenge/index.ts`
- Create: `supabase/migrations/20261110000001_create_passion_challenge_recs.sql`
- Create: `supabase/migrations/20261110000002_migrate_product_design_to_coding.sql`
- Modify: `src/data/experienceDomeSubNodes.js` (Tier 1 restructure: 5→4)
- Modify: `src/data/domeSkillInference.json` (remove exp-product-design)
- Modify: `src/flows/PathDefinitionFlow.jsx` (challenge generation wiring)
- Modify: `src/lib/experienceDomeConfig.js` (remove exp-product-design node)

**Interfaces:**
- Produces: passionChallengeEngine (used by QuestBoardCard from Task 2), generate-passion-challenge edge function

- [ ] **Step 1:** Copy new files from feat/money-map
```bash
git show feat/money-map:src/lib/passionChallengeEngine.js > src/lib/passionChallengeEngine.js
git show feat/money-map:src/data/tier1Challenges.js > src/data/tier1Challenges.js
git show feat/money-map:supabase/functions/generate-passion-challenge/index.ts > supabase/functions/generate-passion-challenge/index.ts
git show feat/money-map:supabase/migrations/20261110000001_create_passion_challenge_recs.sql > supabase/migrations/20261110000001_create_passion_challenge_recs.sql
git show feat/money-map:supabase/migrations/20261110000002_migrate_product_design_to_coding.sql > supabase/migrations/20261110000002_migrate_product_design_to_coding.sql
```

- [ ] **Step 2:** Port modified files
Apply feat/money-map's changes to:
- `experienceDomeSubNodes.js` — Tier 1 restructure
- `domeSkillInference.json` — remove exp-product-design
- `experienceDomeConfig.js` — remove exp-product-design node
- `PathDefinitionFlow.jsx` — passion challenge wiring

- [ ] **Step 3:** Build check
```bash
npm run build
```

- [ ] **Step 4:** Commit
```bash
git add -A && git commit -m "feat: port passion challenge engine + Tier 1 skill restructure (5→4 categories)"
```

---

### Task 4: Port ExperienceGameFlow + ChooseQuestsFlow + Aliveness

**Files:**
- Modify: `src/flows/ExperienceGameFlow.jsx`, `src/flows/ExperienceGameFlow.css`
- Modify: `src/flows/ChooseQuestsFlow.jsx`
- Modify: `src/flows/AlivenessQuiz.jsx`
- Modify: `src/flows/EssenceMirrorFlow.jsx`
- Modify: `src/flows/VibeRiseRadar.jsx`, `src/flows/WoundMapFlow.jsx`, `src/flows/ZoneCalRadar.jsx`
- Modify: `src/components/Celebrations/LevelUpModal.jsx`
- Modify: `src/hooks/useCelebrations.js`

**Interfaces:**
- Consumes: None from prior tasks
- Produces: Simplified ExperienceGameFlow (no GetPaidScreen — paid filter now in voice stem)

**Conflict resolution:**
- ExperienceGameFlow: use feat/money-map's version (removes GetPaidScreen + PathSuggestions). The paid question now lives in the voice stem flow Stage 6.
- ChooseQuestsFlow: use feat/money-map's simpler onComplete (no paths param)

- [ ] **Step 1:** Port ExperienceGameFlow.jsx — read main's version (`git show main:src/flows/ExperienceGameFlow.jsx`), then read feat/money-map's (`git show feat/money-map:src/flows/ExperienceGameFlow.jsx`). Apply these specific removals to main's version:
1. Remove `POSITIVE_STATES` constant
2. Remove entire `GetPaidScreen` component (~70 lines)
3. Remove entire `PathSuggestions` component
4. Remove `wantPaidStates` from useDomeData destructuring
5. Remove `'get-paid'` phase from flow state machine
6. Remove `exp-product-design` from EXPERIENCE_DESC
7. Remove `Link` import from react-router-dom (if unused after removals)
8. Also port ExperienceGameFlow.css — remove all 14 `.exp-game-getpaid-*` CSS rules. Run: `git show main:src/flows/ExperienceGameFlow.css | grep -n "getpaid"` to find them.

- [ ] **Step 2:** Port ChooseQuestsFlow — simpler onComplete, CTA text change.

- [ ] **Step 3:** Port minor flow changes (AlivenessQuiz, EssenceMirrorFlow, VibeRiseRadar, WoundMapFlow, ZoneCalRadar — these are small onComplete/prop additions).

- [ ] **Step 4:** Port Celebrations/useCelebrations changes if any.

- [ ] **Step 5:** Build check
```bash
npm run build
```

- [ ] **Step 6:** Commit
```bash
git add -A && git commit -m "feat: port ExperienceGameFlow simplification, ChooseQuestsFlow, minor flow updates"
```

---

### Task 5: Port Voice Stem Onboarding (Session Work)

> **EXECUTE INLINE — do NOT dispatch to subagent.** This task requires understanding the structural differences between main's VoiceStemFlow (Stages 1-4, ~1400 lines with months of mobile/session/avatar fixes) and the session additions on feat/money-map commit `8c977f47`. A subagent won't have this context.

**Files:**
- Modify: `src/flows/VoiceStemFlow.jsx` (add mode prop, SignupGate, DownloadApp, Stage 5-6 screens, handleSignupComplete bridge)
- Modify: `src/flows/VoiceStemFlow.css` (signup gate + download styles)
- Modify: `src/lib/stemProcessing.js` (extend to stages 5-6)
- Modify: `src/data/voiceStems.js` (add EXPERIENCE_ACTIVITIES — does NOT exist on main)
- Replace: `supabase/functions/process-stems/index.ts` (use feat/money-map's version with Stage 5-6 prompts + activity ID fix)

Note: AppRouter changes (`/try/onboarding` route, `mode="workshop"` prop) were consolidated into Task 1 Step 6.

**Interfaces:**
- Consumes: `useAuth` from AuthProvider, `supabase` from supabaseClient
- Produces: `/try/voice-stems` (workshop mode), `/try/onboarding` (onboarding mode)

**Source of truth:** `git show feat/money-map:src/flows/VoiceStemFlow.jsx` (commit `8c977f47`) has the complete working version. Read it alongside main's version and surgically port the additions.

- [ ] **Step 1:** Read main's VoiceStemFlow — confirm Stages 1-4 are intact. Identify: (a) where the export default function signature is (for mode prop), (b) where to insert SignupGate + DownloadApp components (before ProcessingScreen), (c) where essence_reveal onContinue handler is (for mode branching), (d) where to add Stage 5-6 state variables and processing functions.

- [ ] **Step 2:** Apply additions to main's VoiceStemFlow. The specific changes (reference `git diff feat/money-map~1..feat/money-map -- src/flows/VoiceStemFlow.jsx`):
1. Add imports: `useAuth` from `../auth/AuthProvider`, `supabase` from `../lib/supabaseClient` (NOT useNavigate — removed in session)
2. Add `mode` prop: `VoiceStemFlow({ mode = 'workshop' })` + `const isOnboarding = mode === 'onboarding'`
3. Add `SignupGate` component (~120 lines, includes `completedRef` guard, `safeComplete` wrapper, OTP email/code flow)
4. Add `DownloadApp` component (~65 lines, shows archetype + path activity tease, Apple/Android/email links)
5. Add Stage 5-6 state: `stage5Results`, `stage6Results`, `stage5ResultsRef`, `paidBatchesRef`, `paidBatchRef`, related constants (`EXP_BATCH_SIZE`, `EXP_RECORD_SECONDS`, `EXP_BATCHES`)
6. Add Stage 5-6 processing functions: `processPaidFilter`, `startPaidBatch`, `handlePaidBatchDone`, `processPaidFilter`, `retryPaidProcessing`
7. Add `handleSignupComplete` bridge (ns_state = 'fun' for all fun, want_paid separate column, upserts to experience_dome_ratings, then setScreen('download_app'))
8. Change essence reveal button: `onContinue={() => setScreen(isOnboarding ? 'experience_intro' : 'final_results')}`
9. Add render blocks: `experience_intro`, `experience_game`, `experience_results`, `paid_filter`, `signup_gate`, `download_app` screen sections

- [ ] **Step 3:** Apply CSS additions to main's VoiceStemFlow.css. Copy from feat/money-map:
- `.vs-signup-gate` + child selectors
- `.vs-signup-form`
- `.vs-signup-desc`
- `.vs-download-buttons` + child selectors
- `.vs-btn-secondary`
- `.vs-download-archetype`

- [ ] **Step 4:** Update stemProcessing.js — add `activities` and `funActivities` to the context body passthrough. Reference: `git show feat/money-map:src/lib/stemProcessing.js`.

- [ ] **Step 5:** Replace process-stems edge function entirely with feat/money-map's version:
```bash
git show feat/money-map:supabase/functions/process-stems/index.ts > supabase/functions/process-stems/index.ts
```
This includes Stage 5-6 prompts with activity ID fix (IDs in brackets in prompt text).

- [ ] **Step 6:** Port EXPERIENCE_ACTIVITIES to voiceStems.js — does NOT exist on main. Append the export from feat/money-map:
```bash
git show feat/money-map:src/data/voiceStems.js | grep -A 100 "EXPERIENCE_ACTIVITIES"
```
These are ~30 `{ id, label, branch }` objects used by Stage 5.

- [ ] **Step 7:** Build check
```bash
npm run build
```

- [ ] **Step 8:** Commit
```bash
git add -A && git commit -m "feat: port voice stem onboarding — mode split, Stage 5-6, signup gate, download screen"
```

---

### Task 6: Port CuriosityMapFlow + Category Creation + Auth + Misc

**Files:**
- Modify: `src/flows/CuriosityMapFlow.jsx`, `src/flows/CuriosityMapFlow.css`
- Modify: `src/auth/AuthProvider.jsx`
- Modify: `src/Challenge.jsx`
- Modify: `src/lib/bridgeJobUtils.js`, `src/lib/domeSummary.js`, `src/lib/huzzDomeData.js`, `src/lib/directionEngine.js`
- Create: `supabase/functions/generate-flow-statement/index.ts`
- Create: `supabase/migrations/20261110000001_add_flow_statement_to_quests.sql`
- Copy: tab restructure spec `docs/superpowers/specs/2026-11-09-tab-restructure-voice-onboarding-design.md` (already on main)

**Interfaces:**
- Consumes: None from prior tasks
- Produces: Extended CuriosityMapFlow with category creation

- [ ] **Step 1:** Port CuriosityMapFlow changes (Find Your Flow CTA, category creation extension).

- [ ] **Step 2:** Port AuthProvider changes — compare main vs feat/money-map, apply the diff. These are likely signInWithCode/verifyCode additions.

- [ ] **Step 3:** Port Challenge.jsx changes — tab references, minor updates.

- [ ] **Step 4:** Port utility file changes (bridgeJobUtils, domeSummary, huzzDomeData, directionEngine — small diffs).

- [ ] **Step 5:** Copy generate-flow-statement edge function + migration.

- [ ] **Step 6:** Port any remaining uncommitted lint fixes from feat/money-map working directory (CreatorHomeV2, ContentIntel, InstagramConnect, etc.) — these are small one-line fixes.

- [ ] **Step 7:** Build check
```bash
npm run build
```

- [ ] **Step 8:** Commit
```bash
git add -A && git commit -m "feat: port CuriosityMapFlow category creation, AuthProvider updates, misc fixes"
```

---

### Task 7: Final Verification + Deploy

- [ ] **Step 1:** Full build
```bash
npm run build
```

- [ ] **Step 2:** Verify no broken imports — grep for deleted file references
```bash
grep -r "CurrentJobFlow\|FindBridgeFlow\|JourneyContainer\|ChildhoodReflection\|FacilitatorDashboard\|JoinScreen\|WorkshopCreatePage\|useWorkshopChannel" src/ --include="*.jsx" --include="*.js" -l
```

- [ ] **Step 3:** Verify routes — check AppRouter has all needed routes and no references to deleted components.

- [ ] **Step 4:** Deploy edge functions
```bash
npx supabase functions deploy process-stems --remote=qlwfcfypnoptsocdpxuv --yes
npx supabase functions deploy generate-passion-challenge --remote=qlwfcfypnoptsocdpxuv --yes
npx supabase functions deploy generate-flow-statement --remote=qlwfcfypnoptsocdpxuv --yes
```

- [ ] **Step 5:** Run migrations (if not already applied — check with `supabase migration list`)

- [ ] **Step 6:** Merge to main
```bash
git checkout main
git merge feat/port-money-map
git push
```

- [ ] **Step 7:** Verify Vercel deploy succeeds.
