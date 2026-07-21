# Scale Gamification: Easy Tier Implementation Spec

**Date:** 2026-07-16
**Scope:** 11 Easy features (E1-E14, minus E3/E12/E13)
**Estimated total:** ~9 days (E6 Option B = 3 days)
**Branch:** light-portal
**Reference:** docs/research/octalysis-scale-gamification-recommendations.md

---

## Architecture Decisions (apply to all features)

### 1. Single localStorage object (not scattered keys)
All gamification state stored in one JSON object to prevent key sprawl:
```js
// Helper: src/lib/creatorGamification.js
const STORAGE_KEY = 'scale_gamification'

export function getGamificationState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

export function updateGamificationState(updates) {
  const current = getGamificationState()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...updates }))
}

// Usage:
// updateGamificationState({ origin_seen: true })
// updateGamificationState({ celebrated: { ...state.celebrated, results: true } })
// updateGamificationState({ stale_nudges: { ...state.stale_nudges, [expId]: dateStr } })
```
Per-device caveat accepted for v1. Cross-device sync would require a DB column (future).

### 2. Celebration queue with cooldown
Never fire two celebrations back-to-back. Minimum 3-second gap.
```js
// Inside useCelebrations or a wrapper:
const celebrationQueue = useRef([])
const lastCelebrationTime = useRef(0)

function queueCelebration(fn) {
  celebrationQueue.current.push(fn)
  processQueue()
}

function processQueue() {
  const now = Date.now()
  const timeSinceLast = now - lastCelebrationTime.current
  if (timeSinceLast < 3000 && lastCelebrationTime.current > 0) {
    setTimeout(processQueue, 3000 - timeSinceLast)
    return
  }
  const next = celebrationQueue.current.shift()
  if (next) {
    lastCelebrationTime.current = Date.now()
    next()
  }
}
```

### 3. Creator XP is separate from consumer XP
New state variable `creatorXP` (not reusing `movementXP`). Different calculation, different data sources.
- `movementXP`: reads from `quest_completions` (consumer wahoo/healing data). Keep for consumer app.
- `creatorXP`: computed client-side from creator-specific sources (playbook stages, experiences, 3% notes). New.

### 4. E1 + welcome banner dedup
If `?welcome=scale` is in the URL (payment redirect), skip the E1 origin story overlay. The welcome banner on CreatorLogin already serves the "welcome" moment. E1 only fires for users who sign in without the payment redirect (e.g., returning users on first portal visit, or users who were manually granted access).

Check: `const isPaymentRedirect = new URLSearchParams(window.location.search).get('welcome') === 'scale'`

### 5. Pipeline readiness accessibility
E9 needs Attract readiness %. Currently computed inside the pipeline component, not available at CreatorHomeV2 level. Two options:
- **(a)** Compute in CreatorHomeV2 by querying checklist completion for the Attract section of the nearest upcoming experience. Requires an additional Supabase query.
- **(b)** Simplify the trigger: instead of "Attract readiness < 20%", use "0 pipeline checklist items completed for this experience." Binary check, no percentage needed. Simpler and achieves the same goal.

Recommend (b). The user doesn't need a precise percentage for the nudge. "You haven't started marketing" is clearer than "Your marketing is 15% ready."

### 6. Checklist framing for paid users
These people paid $598. Do not use "Setup checklist" language. Frame as:

- Header: **"Your launch pad"** (not "Setup checklist")
- Sub: "The fastest path to your first packed event" (not "Complete your setup")
- Items use action language: "Find your rule break" not "Complete Remarkable Results"
- Tone: "here's what works" not "here's what you haven't done"

### 7. Verification plan
After all 11 features ship:

**Test protocol (30 min):**
1. Create a fresh Supabase test account (new email, no data)
2. Grant creator subscription manually
3. Open portal for the first time
4. Verify: origin story shows (E1), Movement Maker greeting appears (E2)
5. Verify: launch pad checklist shows on Identity tab (E6) with all items incomplete
6. Complete Remarkable Results flow
7. Verify: confetti fires (E4), XP updates (E5), checklist item checks off (E6), locked stage copy is value-framed (E7)
8. Create an experience with a date 10 days out
9. Verify: countdown badge is amber (E8)
10. Wait/advance, verify: staleness nudge appears on Experiences tab (E9)
11. Check Growth tab: "days since last event" shows (E10)
12. Verify: no double celebrations on page refresh
13. Verify: no celebrations fire on page load for pre-existing completions
14. Screenshot each moment for the record

**Kill criteria (revert if):**
- Celebrations fire on every page load (localStorage guard broken)
- Multiple confetti explosions overlap (queue broken)
- Checklist feels patronising (reframe or remove)

---

## E1: Origin Story Moment (0.5 days)

**What:** Full-screen welcome card on first creator portal login. Shows once, never again.

**Copy:**
> **The world is going to be a better place thanks to you and your work.**
>
> We're here to help you create that change.
>
> [Let's go →]

**Implementation:**
- File: `src/components/CreatorHome/CreatorHomeV2.jsx`
- Check: `getGamificationState().origin_seen` (from `src/lib/creatorGamification.js`)
- Also check: skip if `?welcome=scale` is in URL (Architecture Decision #4, payment redirect already welcomed them)
- If not seen AND not payment redirect: render full-screen overlay (purple gradient bg, centered white text, gold CTA button)
- On "Let's go" click: `updateGamificationState({ origin_seen: true })`, dismiss
- CSS: new `.ch2-origin-overlay` class in `CreatorHomeV2.css`
- Style: matches CreatorLogin (brand purple gradient, Inter 800 heading, gold button)
- z-index above everything, no toolbar visible

**Acceptance:**
- Shows on first portal visit only (not login page)
- Skipped entirely if arriving from payment redirect (`?welcome=scale`)
- Never shows again after dismissal
- "Let's go" dismisses and reveals the portal

---

## E2: Movement Maker Identity (0.5 days)

**What:** Change all portal copy from generic "Creator Portal" to "Movement Maker" identity.

**Files to change:**

| File | Current | New |
|---|---|---|
| `src/components/CreatorLogin.jsx` | "Your Impact + Income" | "Welcome, Movement Maker" (below Scale logo) |
| `src/components/CreatorLogin.jsx` | "Sign in" heading | "Sign in to your portal" |
| `src/components/CreateGate.jsx` | Badge: "Become a Movement Maker" | Keep as-is ✅ |
| `src/components/CreatorHome/CreatorHomeV2.jsx` | No greeting | Add "Welcome back, Movement Maker" as subtle text above hero (first name if available: "Welcome back, Nic") |
| `supabase/functions/stripe-webhook/index.ts` | Welcome email: "Welcome to Scale" | "Welcome, Movement Maker" (requires edge function redeploy: `npx supabase functions deploy stripe-webhook --no-verify-jwt --project-ref qlwfcfypnoptsocdpxuv`) |
| `src/components/BottomToolbar.jsx` | Download popup title: "Get the Scale app" | "Get the Movement Maker app" |

**Acceptance:**
- "Movement Maker" appears at least 3 times in the user journey (login, portal home, email)
- Never used as a product name (Scale = product, Movement Maker = identity)

---

## E4: Celebrate Completions (1 day)

**What:** Wire `useCelebrations` hook to 18 milestone moments in the creator portal.

**Dependency:** `src/hooks/useCelebrations.js` (already exists in consumer app)

**Implementation:**
- Import `useCelebrations` in `CreatorHomeV2.jsx`
- Hook exports: `celebrateTaskComplete(points, position)`, `celebrateLevelUp(newLevel)`, plus confetti/toast/haptic internals
- Wrap in celebration queue (Architecture Decision #2) to prevent rapid-fire confetti. 3-second minimum gap.
- On mount: read `getGamificationState().celebrated` to get already-celebrated set
- For each milestone: check if complete AND not in celebrated set
- If newly complete: `queueCelebration(() => celebrateTaskComplete(points))` and `updateGamificationState({ celebrated: { ...state.celebrated, [key]: true } })`
- No `useRef` needed: the localStorage check is idempotent. If milestone is complete AND not celebrated, fire. Otherwise skip. Safe on page refresh, remount, and focus-refetch.

**Milestone list + toast copy:**

| # | Milestone | Trigger | Toast Copy |
|---|---|---|---|
| 1 | Complete Remarkable Results | `remarkableAngle` becomes truthy | "Your rule break is locked in. Most creators never get this far." |
| 2 | Complete Remarkable Reach | `hasReach` becomes true | "You know how your story spreads. That's rare." |
| 3 | Complete Remarkable Growth | `hasGrowth` becomes true | "Barriers mapped. On-ramp designed. One more to go." |
| 4 | Complete Scale Score | `hasScaleScore` becomes true | "Scale Score complete. You now know exactly where you stand." |
| 5 | Generate positioning | `hasPositioningStatement` becomes true | "You have words for what you do now. That changes everything." |
| 6 | Create first experience | Experience count goes from 0 to 1 | "Your first experience exists. It's real now." |
| 7 | Run first pipeline | First `contact_experiences` completed | "First event through the pipeline. The system is working." |
| 8 | First sold-out event | attendees >= capacity | "Sold out. Let that sink in." |
| 9 | 10 lifetime attendees | Sum crosses 10 | "10 people showed up because of you." |
| 10 | 50 lifetime attendees | Sum crosses 50 | "50 attendees. You're building something real." |
| 11 | 100 lifetime attendees | Sum crosses 100 | "100 people. That's not a hobby. That's a movement." |
| 12 | First repeat attendee | Repeat rate > 0% | "Someone came back. That's the strongest signal there is." |
| 13 | Connect Instagram | Instagram connected flag | "Connected. Now we can see what's working." |
| 14 | First 3% improvement | 3% note count >= 1 | "First 3% logged. Small improvements compound into mastery." |
| 15 | Level up (any tier) | XP crosses threshold | "Level up: [Level Name]. Keep building." |
| 16 | Spider graph tier upgrade | Any axis tier crossed | "[Category] badge upgraded. Your shape is growing." |
| 17 | Weekly Creator Pulse completed | Review submitted | "Week reviewed. That's how momentum builds." |
| 18 | Building streak milestone | 4/8/12 weeks | "[X] weeks straight. You're in a rhythm now." |

Notes:
- Items 15-18 depend on features not yet built (XP display, spider graph, pulse, streak). **Do not wire these now.** Add `// TODO: wire celebration when feature ships` comments at the integration points. Wiring triggers for non-existent state will cause runtime errors.
- Confetti animation: reuse consumer app pattern (gold particles, 2 second duration)
- Haptic: `hapticSuccess()` on each

**Acceptance:**
- Each milestone fires confetti + toast exactly once per user
- Toast is Huzz-voiced, not generic
- Doesn't re-fire on page refresh (localStorage guard)

---

## E5: Movement XP + Levels (1 day)

**What:** Display Movement XP and creator level in the hero section.

**Level thresholds:**

| Level | Name | XP Required |
|---|---|---|
| 1 | Dreamer | 0 |
| 2 | Builder | 50 |
| 3 | Launcher | 150 |
| 4 | Scaler | 400 |
| 5 | Movement Maker | 1000 |

**XP sources (from existing data):**

| Action | XP | Data Source | Exists now? |
|---|---|---|---|
| Complete playbook stage | 25 | `remarkable_angles`, `narrative_builders`, `access_architectures`, `scale_diagnostics` | Yes |
| Create experience | 10 | Experience templates count | Yes |
| Run experience through pipeline | 15 | Past experiences with `experience_date` in past | Yes |
| Log 3% improvement | 5 | `contact_experiences` rows where `three_percent_note IS NOT NULL` | Yes |
| Fill event to 80%+ | 20 | attendees / capacity >= 0.8 (from experience data) | Yes |
| Weekly Creator Pulse | 10 | N/A | No (future feature) |

Note: `movementXP` currently sums from `quest_completions` (consumer app data). For the creator portal, we need to either: (a) compute XP client-side from the sources above (simpler, no migration), or (b) write creator XP to a new table. Recommend (a) for v1.

**Implementation:**
- File: `src/components/CreatorHome/CreatorHomeV2.jsx`
- Do NOT reuse `movementXP` (reads consumer `quest_completions` data). Create new `creatorXP` state (Architecture Decision #3).
- Compute client-side from creator-specific sources on mount (same data already fetched by CreatorHomeV2).
- Add XP display below the playbook progress bar in the hero section:
  - Level badge: `[icon] Builder` (purple pill)
  - XP bar: progress toward next level (e.g., "75 / 150 XP")
  - Current XP number
- Use `src/lib/stageConfig.js` pattern for level calculation
- V1 component (`CreatorHome.jsx` line 430) already has the render pattern. Port it.

**Visual:**
```
[⚡ Builder]  ████████░░░░  75 / 150 XP
```

**Acceptance:**
- XP and level visible in hero section at all times
- Progress bar fills toward next level
- Level name updates when threshold crossed (triggers E4 celebration)

---

## E6: Per-Section Launch Pad (3 days)

**What:** Each tab has its own contextual "launch pad" card showing the fastest path to their first event. Framed as guidance, not setup (Architecture Decision #6). Auto-hides when all items complete.

**Identity tab launch pad** ("Your launch pad: the fastest path to your first packed event"):

| Item | Check | Route |
|---|---|---|
| Discover your essence | `essenceAvatar` exists | `/essence-mirror` |
| Find your North Stars | `creatorSelection` exists | `/experience-creators` |
| Complete your positioning | `hasPositioningStatement` | Scroll to positioning section |
| Find your rule break | `remarkableAngle` exists | `/create/remarkable` |

**Experiences tab launch pad** ("Your next steps"):

| Item | Check | Route |
|---|---|---|
| Create your first experience | Experience count > 0 | `/create/experience/new` |
| Set up your first pipeline | Any pipeline node started | Click first experience |
| Run your first event | `contact_experiences` count > 0 | Click upcoming experience |

**Growth tab launch pad** ("Start tracking"):

| Item | Check | Route |
|---|---|---|
| Connect Instagram | Check via `InstagramConnect` component state (no top-level flag exists in CreatorHomeV2; need to lift connection status or query `instagram_metrics` table directly) | Instagram OAuth |
| Run your first experience | `contact_experiences` count > 0 | Experiences tab |
| Log your first 3% improvement | `contact_experiences` rows where `three_percent_note` is not null, count > 0 | Past experience |

**Implementation:**
- New component: `src/components/CreatorHome/SectionChecklist.jsx`
- Props: `items` (array of {label, done, route}), `sectionName`
- Visual: bordered card with checkmark items, gold accent on incomplete items, header per tab (see above). NOT labelled "checklist" or "setup" anywhere.
- Auto-hides when all items complete
- State stored in component (derived from existing data, not persisted)
- Renders at top of each tab panel in `CreatorHomeV2.jsx`

**Acceptance:**
- Each tab shows its own relevant checklist
- Completed items show checkmark, incomplete items show gold arrow + are tappable
- Card disappears when all items in that section are done
- "X of Y complete" progress indicator

---

## E7: Value-Framed Completion Copy (0.5 days)

**What:** Update the playbook stepper's locked stage descriptions to frame through value, not scarcity.

**Current copy → New copy:**

| Stage | Current | New |
|---|---|---|
| Reach (locked) | "Unlocks after Results" | "This is where you learn how your story spreads. Complete Results first." |
| Growth (locked) | "Unlocks after Reach" | "This is where you remove what stops people saying yes. Complete Reach first." |
| Score (locked) | "Unlocks after Growth" | "This is where you see exactly how ready your experience is to blow up. Complete Growth first." |

**Implementation:**
- File: `src/components/CreatorHome/CreatorHomeV2.jsx`
- Find the `BlowUpBrandCard` locked state copy
- Replace the locked description strings

**Acceptance:**
- Locked stages describe WHY they matter, not just WHEN they unlock
- Copy readable by a 12-year-old

---

## E8: Event Countdown Urgency (1 day)

**What:** Colour-coded countdown badge on upcoming events in the Experiences tab.

**Thresholds:**

| Days Out | Colour | Badge Style |
|---|---|---|
| 14+ | Grey (default) | Static |
| 7-13 | Amber (#E9A23B) | Static |
| 3-6 | Red (#dc2626) | Static |
| 0-2 | Red | Pulsing animation |

**Additional:** When countdown is amber or red AND pipeline readiness < 50%, show: "X tasks still incomplete" in muted text below the badge.

**Implementation:**
- File: `src/components/CreatorHome/CreatorHomeV2.jsx`
- Find `countdownLabel` logic (around line 82-89)
- Add CSS class based on days: `.ch2-countdown--amber`, `.ch2-countdown--red`, `.ch2-countdown--pulse`
- Add task incomplete count from pipeline readiness data (already loaded)
- CSS in `CreatorHomeV2.css`: colour overrides + `@keyframes ch2CountdownPulse`

**Acceptance:**
- Badge changes colour at 14/7/3 day thresholds
- Pulses at 0-2 days
- Shows incomplete task count when amber/red AND pipeline < 50%
- Experiences tab only

---

## E9: Pipeline Staleness Nudge (0.5 days)

**What:** Daily inline card on Experiences tab when an upcoming event has low pipeline readiness.

**Trigger:** Event is 7+ days out AND zero pipeline checklist items completed for that experience (Architecture Decision #5, binary check, no percentage needed).

**Copy:** "Your [event name] is in [X] days and your audience doesn't know about it yet. Start with your first attract post."

**Implementation:**
- File: `src/components/CreatorHome/CreatorHomeV2.jsx`
- Add computed check in the Experiences tab render
- If trigger met: show bordered warning card (amber left border, same style as consumer app nudges)
- CTA: "Start marketing →" links to `/create/experience/:id/attract` (route exists at AppRouter line 1066: `/create/experience/:id/:nodeKey`)
- Fires daily: use `updateGamificationState({ stale_nudges: { ...state.stale_nudges, [expId]: dateString } })` to show once per day per event
- Disappears when ANY pipeline checklist item is completed for that experience (not percentage-based)

**Acceptance:**
- Only shows when trigger conditions are met
- Shows once per day per event (not spammy)
- Disappears when Attract readiness crosses 20%
- Tapping CTA opens the correct pipeline node

---

## E10: Days Since Last Event (0.5 days)

**What:** Mirror on Growth tab showing days since last completed experience.

**Copy:** "It's been [X] days since your last experience. Your top fans are waiting."

**Implementation:**
- File: `src/components/CreatorHome/CreatorHomeV2.jsx`
- In Growth tab render, compute days since most recent completed experience. Data source: `contact_experiences` table is for attendee tracking, not event completion. Use the experiences list already loaded (past experiences with `experience_date` in the past).
- Show as muted text card below KPI grid
- Hide when: an experience is upcoming (countdown exists), OR days < 7

**Acceptance:**
- Only shows when no upcoming events AND last event was 7+ days ago
- Disappears when a new event is created/upcoming
- Growth tab only

---

## E11: Founding Member Badge (0.5 days)

**What:** Permanent "Founding" badge for first 50 Scale users by payment date.

**Implementation:**
- Determine founding status: `user_subscriptions.created_at` for plan_type 'creator', ordered by date, first 50
- Add a Supabase RPC function `is_founding_member(user_id)` that checks rank
- Display: gold "FOUNDING" pill badge next to level in hero section
- Also appears on creator share card

**Visual:**
```
[⚡ Builder] [✦ FOUNDING]  ████░░░░  75 / 150 XP
```

**Implementation detail:**
- RPC: `SELECT COUNT(*) < 50 FROM user_subscriptions WHERE plan_type = 'creator' AND created_at <= (SELECT created_at FROM user_subscriptions WHERE user_id = $1 AND plan_type = 'creator')`
- Cache result in component state (doesn't change)
- Test accounts excluded: only rows with `stripe_customer_id IS NOT NULL`
- **Caveat:** Manually inserted subscriptions (huzz@nichuzz.com, hurrellnic@gmail.com) have NULL `stripe_customer_id`. They will NOT get the founding badge unless we either: (a) backfill their `stripe_customer_id`, or (b) change the check to include a manual whitelist of founding user IDs. Recommend option (b) with a hardcoded array for the first few test users.

**Acceptance:**
- Badge shows for qualifying users permanently
- Never disappears even if more than 50 users join later
- Visible on hero section + share card

---

## E14: Low Attendance Reframe (0 days, copy only)

**What:** When an event has < 50% capacity filled, show encouraging context instead of letting the low number feel like failure.

**Copy options by attendance level:**

| Attendees | Copy |
|---|---|
| 1-5 | "Every movement starts with a handful. Wim Hof's first ice bath had 3 people." |
| 6-15 | "That's a room full of people who chose to be there. That matters." |
| 16-30 | "More than most creators get in their first year. Keep running events." |

**Implementation:**
- File: `src/components/pipeline/PastExperienceStats.jsx` (past event detail view) AND `src/components/CreatorHome/CreatorHomeV2.jsx` (past events list in Experiences tab, around line 899 where `ch2-past-3pct` renders)
- Show as muted italic text below the attendee count when attendees < 50% of capacity
- Only shows for events with capacity set

**Acceptance:**
- Copy appears below attendee count for under-capacity events
- Tone is encouraging, never guilt-inducing
- Disappears once event hits 50%+ capacity

---

## Build Sequence

| Order | Feature | Days | Dependencies |
|---|---|---|---|
| 0 | `src/lib/creatorGamification.js` (localStorage helper + celebration queue wrapper) | 0.5 | None |
| 1 | E4: Celebrations (wire hook + 14 toasts, defer 4) | 1 | Step 0 |
| 2 | E5: `creatorXP` + Levels display | 1 | Step 0 |
| 3 | E2: Movement Maker identity copy (+ webhook redeploy) | 0.5 | None |
| 4 | E1: Origin story overlay (skip if `?welcome=scale`) | 0.5 | Step 0 |
| 5 | E6: Per-section launch pads | 3 | Step 2 (references level) |
| 6 | E7: Value-framed completion copy | 0.5 | None |
| 7 | E8: Event countdown colours | 1 | None |
| 8 | E9: Staleness nudge (binary trigger, not %) | 0.5 | Step 0 |
| 9 | E10: Days since last event | 0.5 | None |
| 10 | E11: Founding badge (with manual whitelist) | 0.5 | None |
| 11 | E14: Low attendance reframe | 0 | None |
| 12 | **Verification protocol** (Architecture Decision #7) | 0.5 | All above |

**Total: ~10 days** (includes Step 0 foundation + verification)

**Phase 1 (3 days):** Steps 0-4 (foundation + celebrations + XP + identity + origin story). Can run in parallel after Step 0.
**Phase 2 (6 days):** Steps 5-11 (launch pads + urgency + nudges + badge + reframe). Independent.
**Phase 3 (0.5 days):** Step 12 (fresh account walkthrough, screenshot every moment, verify no double-fires).
