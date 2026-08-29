# Phase 2 Restructure

Tracking changes needed to align the consumer app with the three-phase journey (see `docs/features/three-phase-journey.md`).

---

## Tab Structure

Current: Journey | Quests | Courage (merged into Quests this session) | Tune
Proposed: Discover | Quests | Tune | Progress
(Earlier "Social" tab idea dropped in favour of Progress.)

| Tab | Role | What lives here |
|-----|------|-----------------|
| Discover | Phase 1 ongoing | Experience Dome, Essence Mirror, Life Map. "Ready to go deeper?" bridge CTA |
| Quests | Phase 2 action | Quest board, Weekly Focus, courage challenges |
| Tune | All phases | Daily practices, drains. NS maintenance is phase-agnostic |
| Progress | All phases | Hero journey narrative, Zone Matrix, Capacity Score, expansion dimensions, skill XP, streak |

Courage merged into Quests (done — `WeeklyFocus.jsx` shipped).
Hero journey lives in Progress (spans all phases, it's the meta-narrative).
Reporting (Zone Matrix, Capacity Score) moves from Journey into Progress.

---

## Quest Map (`/quest-map`)

**Change Y-axis from domain tiers to time-based.**

Current: Y-axis = L1 (Learning) → L2 (Testing) → L3 (Practising) → L4 (Charging)
New: Y-axis = date order of courage challenges completed for that path (earliest at bottom, most recent at top)
X-axis: NS state (Uninterested → Stress → Fun → Vibe Rise) — unchanged

Drop domain labels (Learning/Testing/Practising/Charging/Teaching) from quest map and quest creation.

---

## Expansion Dimensions on Courage Challenges

Replace domain labels with 7 expansion dimensions. Each courage challenge tags which capacities are being stretched (multi-select):

**Craft dimensions (primary):**
1. Duration — stretching how long
2. Frequency — stretching how often
3. Medium — stretching the format
4. People — stretching the audience size (skill-wise)

**Scale dimensions (secondary):**
5. Money — stretching towards charging/pricing
6. Location — stretching to new places
7. Independence — stretching towards autonomy

Applies to: WahooCreator, QuestBoardCard courage creation (dimension tagged on the challenge itself, not the stuck point).
Remove: domain picker (Education/Testing/Practising/Charging/Teaching) from quest creation flow.

---

## Experience Dome → Quest Pipeline

The dome feeds quests, not a standalone viz.

```
Life Map clusters ──┐
                    ├──► Quest Map (life paths you're pursuing)
Experience Dome ────┘     with NS state + expansion progress
```

- Life Map: extracts clusters from your life story → Vibe Rise clusters pre-populate the Life Paths flow when user taps "Ready to go deeper?"
- Experience Dome: ~380 experiences rated with NS → Vibe Rise ones surface as potential life paths/quests
- Dome fills gaps Life Map misses (experiences you haven't lived yet but want to try)
- Both converge on the same quest board

---

## Life Map Changes

Drop domain segmenting (was Education/Testing/etc). Life paths plotted by:
- Branch (healing, movement, story, etc.)
- NS state (Vibe Rise, Fun, Stress, Uninterested)
- Skill tags
- Time (chronological)

---

## Phase 1 → Phase 2 Handoff

**Phase 1 core loop (12-year-old simple):**
1. Life Map first (what have you already experienced?) → auto-populates dome nodes
2. Browse dome → pick an experience to try next
3. Try it in real life
4. Come back, rate it with NS state
5. Repeat from step 2

**Bridge CTA:** Always visible somewhere on the Discover tab: "Ready to go deeper on a life path?"
- User-declared, not app-triggered. No gates or thresholds.
- When tapped → opens the Life Paths questionnaire flow
- Life Paths flow pre-populated with Vibe Rise data from both Life Map clusters AND dome nodes
- User confirms which to pursue → creates quests → activates Quests tab

**Life Paths flow update needed:**
- Currently asks "what careers/paths are you pursuing?" from scratch
- Should ingest dome data: "Based on what lights you up, here are paths worth exploring"
- User confirms, removes, or adds paths
- Confirmed paths → quests with courage challenges

**The 12-year-old test across phases:**
- Phase 1: "Pick your next experience" (one action)
- Bridge: "Ready to go deeper?" (one question)
- Phase 2: "Pick your brave action for this week" (one action, WeeklyFocus)

---

## Hero Journey Placement

Hero journey stages span all three phases (2-4 = Phase 1, 5-9 = Phase 2, 10-12 = Phase 3).
It doesn't belong inside Quests (that's Phase 2 action) — it's the meta-narrative.

**Decision:** Hero journey starts in the Progress tab as narrative context at the top,
with expansion data (dimensions, XP, zone matrix) below it as evidence.
Progress = "where am I in the story?" + "how far have I come?"

**Future exploration:** Hero journey could show contextually across tabs (Discover shows stages 2-4, Quests shows stages 5-9) instead of being locked to Progress. Start with Progress, explore contextual later.

---

## Game Language as Connective Tissue

The "Life as a Video Game" rules (see `docs/research/life-as-game-inspiration.md`) map across all three phases. "Rules of Your Game" onboarding slides could set up the entire journey before they even touch the dome.

| Rule | Phase | Application |
|------|-------|-------------|
| 1. Choose your main quest | Phase 1→2 bridge | "Ready to go deeper?" IS choosing your quest |
| 2. Spawn point is random | Phase 1 | Essence Mirror reveal |
| 3. Base stats are fixed | Phase 1 | Essence archetype = your base class. Build from it, don't force the wrong one |
| 4. Build is flexible | Phase 1-2 | Dome + skill tree = your explored map. Respecs cost time, not identity |
| 5. Failing isn't game over | Phase 2 | Courage completion after a Pressure rating |
| 6. XP only comes from action | Phase 2 | Action Score, RP system |
| 7. Consistency beats talent | Phase 2 | Streaks, Tune practices |
| 8. Single-player with co-op | Phase 2-3 | League, community |
| 9. Side quests matter | Phase 2 | Healing as "unlocking late-game perks" |
| 10. You decide what winning means | All phases | Interior Scoreboard |

---

## Phase 1: Discover Tab — Life Map and Dome

Both live in the Discover tab, both unlocked. App suggests Life Map first, Dome second.

- **Life Map** = your past (what experiences have you already had?) — add node map UX/UI so life map experiences plot as dome nodes
- **Dome** = fills gaps Life Map missed (experiences you haven't tried yet but want to)
- Both feed the same quest pipeline

**Onboarding order:** sign up → Essence Mirror (who are you?) → Discover tab: Life Map (what have you experienced?) → Dome (what else could you try?). Similar to current Journey tab onboarding order but feeding the dome visualization.

---

## Phase 2→3 Bridge: Direction Layer

The direction layer (Persona, Problem, Industry, Buyer Types) emerges organically during Phase 2 through courage challenges. Phase 3 systematizes what Phase 2 revealed.

- **Phase 2 discovery:** "I noticed burnt-out professionals keep coming to my breathwork sessions"
- **Phase 3 systematization:** "How do I build a funnel for burnt-out professionals?"

**Multiplication Screen (NOT BUILT):** Skill x Problem = Career direction, Dome = sustainability check.
This belongs at the Phase 2→3 bridge, NOT Phase 1→2. By Phase 2→3, the user has built skill through courage challenges and knows their craft. The multiplication reveals: "Who do you serve? What problem do you solve for them?" Problem derived from Life Map data, not asked cold.

**Phase 1→2 bridge is simpler:** "Which Vibe Rise experiences do you want to go deeper on?" Pick your life paths. No formula needed.

Career Clarity: hidden until Phase 2→3 bridge (hero stage 10+). Redundant for new users since dome + life paths does the same job better.

---

## 11 Explainer Flows

Dead weight. They explain the old 7-stage business model (validation → product → testing → offer → campaign → launch) which is Phase 3 content. The 3 healing explainers might have Phase 2 value but the other 8 can be archived. Routes: `/flow-finder-explainer`, `/play-list-explainer`, `/validation-explainer`, `/product-explainer`, `/testing-explainer`, `/offer-creation-explainer`, `/campaign-explainer`, `/launch-explainer`, `/what-is-healing-explainer`, `/emotional-splinter-explainer`, `/how-do-we-heal-explainer`.

---

## Decided This Session

- Dome-sourced vs life-map-sourced paths: no visual distinction. A quest is a quest regardless of source.
- Essence Mirror: before dome (who are you? → what lights you up?). Same onboarding order as current Journey.
- Experience Check-in: not currently accessible, dead code. Drop from restructure scope.
- First-open: sign up → Essence Mirror → Discover tab: Life Map (with node map UX/UI) → Dome fills gaps.
- Life Map first, Dome second. Life Map experiences auto-populate dome nodes.

## Dome Visualization: Safety Dome Concept

The dome is a **decision tool for the Phase 1→2 bridge**, not an ongoing dashboard. 56 core nodes. Its job is to help the user decide which life paths to pursue, then it's done. Users can revisit but it's not the core loop after Phase 2 begins.

**Layout:**
- User's hero avatar at the center
- 12 branches arranged radially (like a radar/spider chart)
- Distance from center = NS state:
  - Vibe Rise = closest (your safe zone, your foundation)
  - Fun = next ring out
  - Stressful = further out (you can do it but it costs you)
  - Unrated/untried = at the edge (the unknown, outside your dome)

**How it works:**
- Each experience node sits on its branch's axis at the distance matching its NS rating
- The filled area IS your dome of safety — unique to each person
- Gaps show where you haven't explored or where things stress you

**Data model:** `experience_dome_ratings` already stores `(user_id, node_id, ns_state)`. Each node maps to a branch via `experienceDomeConfig.js`. The viz plots nodes on polar coordinates: branch → angle, ns_state → radius.

**Life Map connection:** Branch-level only. Life Map classifies clusters into branches, dome nodes live in branches. No node-level mapping needed. They're separate discovery tools that both reveal which branches light you up.

**After the bridge:** Dome's job is done. Phase 2 core loop is courage challenges (Weekly Focus), not dome exploration. Discover tab's ongoing value comes from Life Map re-visits and Experience Check-in, not dome browsing.

---

## Post-Sprint Refinements (approved)

### 1. Tab unlock progression (12-year-old test)
New users see only Discover unlocked. Others unlock progressively:
- Discover: always open (Phase 1 home)
- Quests: unlocks after first life path created (bridge CTA)
- Tune: unlocks after first courage challenge completed
- Progress: always visible but sparse until data exists

### 2. "Experience to try this week" on Discover tab
Same WeeklyFocus pattern but for Phase 1. User picks a dome node they haven't tried yet.
Core Phase 1 loop: pick experience → try in real life → come back and rate with NS state.

### 3. Skill level labels
Remove old domain labels ("Lteaching", "Lpractising") from skill display.
Show: skill name, L1-L4 (XP-based), XP count. No domain reference.

### 4. Action Score review
Currently mixes courage challenge outcomes + daily check-in states + task signals.
Daily check-ins dilute the score because they outnumber courage challenges.
Needs design decision: should Action Score only count courage-related actions?

### 5. ProgressTab missing features from JourneyTab
Hero stage needs: movie references per stage, "next step" CTA, stage-specific guidance.
Also lost: protective voices tracker, life paths summary, stuck detection, streak milestone,
clarity nudge, figurine display, orphaned wahoo linker, completed quests list.
Decision needed on each: bring back into Progress, move to Discover, or drop.

---

## V2 Ideas (not V1)

- **Re-rating experiences**: how do users update NS ratings after their state changes? Re-visit dome? Inline on Discover tab?
- **Daily experience logging**: log what you did today + NS state, building a record over time. Richer data for the dome.
- **Experiences spanning branches**: e.g. "silent disco" = Movement + Play + Bonds. Multi-branch tagging.
- **Discover tab post-bridge**: what does it look like after Phase 2 begins? Mostly archival or evolving?
- **Dome viz polish**: ring labels, node icons vs dots, animations on state change
