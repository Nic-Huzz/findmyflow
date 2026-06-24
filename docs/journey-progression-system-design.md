# Journey Progression System — Design Spec

**Date:** 2026-03-29
**Author:** Huzz Hurrell + Claude
**Source:** `docs/2026-03-27-journey-story-brainstorm.md`, `docs/zone-calibration-framework.md`
**Status:** Ready for implementation planning

---

## 1. Overview

Replace FindMyFlow's current fragmented progression (10 business stages + tension layers + priority tab) with a unified 7-level journey system grounded in the Zone Calibration Framework.

Users arrive at The Crack. The app moves them from Head Full of Dreams (self-knowledge without action) toward Self-Actualisation (self-knowledge + action moving together along the Sprouter diagonal).

---

## 2. Implementation Phases

| Phase | Scope | Dependencies |
|---|---|---|
| **Phase 1: Onboarding** | New 4-beat onboarding flow (pre-signup) | None. Standalone. |
| **Phase 2: Post-Login Questions** | 3+1 tension questions replacing HomeFirstTime | Phase 1 (onboarding data stored) |
| **Phase 3: Portal Restructure** | Rename tabs (Level, Play-list, Healing, Bonus). Add XP bar to header. Add journey graph popup. | None (tab rename + header addition) |
| **Phase 4: Level Template** | Build `LevelTemplate` component + `LEVEL_CONFIG` data. Populate Level tab. Wire up 3 progress bars. | Phase 3 (Level tab exists) |

---

## 3. Phase 1: Onboarding

### 3.1 Flow

4-beat story, pre-signup, full-screen purple gradient overlay.

**Beat 1 — The Hook** (3 swipeable slides, no interaction)
- Slide 1: "Take a moment to think about you as a kid. How playful you were. How full of love. How care-free."
- Slide 2: "Remember that?"
- Slide 3: "So where did they go?"
- Purple background, gold text. Tap or swipe to advance.

**Beat 2 — The Story** (4 interactive stages)
- Walk 4 wound installation stages. Each shows 3 Pixar scene cards (landscape 16:9, 155px height, text pill below).
- User taps the scene that resonates. Gold border + checkmark. Auto-advances after 700ms.
- Different child character per stage, same child across the 3 scenes of each stage.

| Stage | Title | Scenes |
|---|---|---|
| 1 (Infancy) | You Arrive | Overwhelmed Child / Secure Base / Invisible Child |
| 2 (Childhood) | You Learn What Works | Rejected Self / Unconditional Belonging / Adapted Self |
| 3 (School) | School Installs the OS | The Rebel / Grounded Student / The Good Student |
| 3.5 (Teens) | Your Friend Group Decides | The Chameleon / Found Their Tribe / The Withdrawn |

**Beat 3 — The Reframe** (no interaction, holds longer)
- "What if you could build a life that fits who you actually are, not who you were told to be?"
- No tap hint. User taps when ready.

**Beat 4 — The Promise** (sign up CTA)
- "That's what FindMyFlow is for."
- Gold CTA button: "Start My Journey" → auth flow.

### 3.2 Data Storage

Pre-auth: all selections stored in localStorage (`journey_onboarding_state`).
Post-auth: `persistJourneyOnboarding(userId)` saves to `journey_onboarding_selections` table.

| Column | Type | Description |
|---|---|---|
| user_id | UUID | FK to auth.users |
| stage_id | TEXT | stage1, stage2, stage3, stage3_5 |
| scene_id | TEXT | e.g. overwhelmed_child, adapted_self |
| zone | TEXT | top_left, diagonal, bottom_right |

### 3.3 Assets

12 pre-generated Pixar scene images stored in `public/images/onboarding/`. Already created for stages 1-3.5.

### 3.4 Component

`src/components/onboarding/JourneyOnboarding.jsx` — already built on worktree branch `worktree-agent-a19f2653`. Bugs fixed. Needs: remove avatar generation (moved to Stage 1), update to 4-beat flow (remove Beat 3 reveal, add reframe slide).

### 3.5 What Gets Deprecated

- `HomeFirstTime.jsx` onboarding flow (replaced, but keep for post-login questions in Phase 2)

---

## 4. Phase 2: Post-Login Tension Questions

### 4.1 Flow

After first sign-up, before /me page loads. 3 mandatory questions + 1 conditional. One tap each.

**Q1 — Identity/Direction (maps to Level 1):**
"When it comes to knowing how you want to show up in the world..."
- 0: "I have no idea. I don't know what change I want to make or how I fit"
- 1: "I have a sense of what I care about but I can't articulate it yet"
- 2: "I can describe it but I'm still testing whether it's really me"
- 3: "I know exactly how I want to show up and the change I want to make"

**Q2 — Vulnerability (maps to Level 2):**
"When it comes to letting people see where you're really at..."
- 0: "I keep it to myself. Letting people in feels unsafe"
- 1: "I open up occasionally but only when it feels controlled"
- 2: "I can be honest with a few people, but I still filter the messy parts"
- 3: "I let people see all of it. The uncertainty, the struggle, the real me"

**Q3 — Enough/Execution (maps to Levels 3-5):**
"When it comes to taking action on what matters..."
- 0: "I'm stuck. Fear of judgement and not being good enough keeps me frozen"
- 1: "I start things but fear of what people think stops me finishing"
- 2: "I take action, but I still hold back the bold stuff to stay safe"
- 3: "I move. The fear is there but it doesn't decide for me anymore"

**Q4 — Passion/Risk (conditional, maps to Level 6):**
Only shows if Q1-Q3 all score ≥ 2.
"When it comes to investing in the path you're on..."
- 0: "I don't feel safe putting real skin in the game"
- 1: "I invest a little but I always keep one foot in the safe option"
- 2: "I'm committing more, but the big bet still terrifies me"
- 3: "I feel safe going all in. The risk feels right because the path is mine"

### 4.2 Scoring

First score below 3 = starting level. All users start at Level 1 regardless (scores inform emphasis, not skip).

### 4.3 Data Storage

Update existing `tension-assessment.json` with new questions. Scores save to `user_stage_progress` (existing pattern).

### 4.4 What Gets Deprecated

- Old 4-question tension layer assessment (Discover/Regulate/Reveal/Value)
- Old `onboardingV2.js` path routing logic

---

## 5. Phase 3: Portal Restructure

### 5.1 Tab Changes

| Current | New | Change |
|---|---|---|
| Priority | **Level** | Renamed. Content replaced in Phase 4. |
| Play-list | Play-list | No change. |
| Healing | Healing | No change. |
| Bonus | Bonus | No change. |

### 5.2 Header Additions

Add below existing score block (keep weekly points + 3 category pills):

**XP Level Bar:**
- Label: "Level 2: Vulnerability"
- Progress: "680 / 800 XP"
- Gradient fill bar (purple → gold) with shimmer animation
- Stage markers along the bar (dots: completed/current/locked)

**Journey Button:**
- Small button in header bottom row: "📊 Journey"
- Opens Sprouter Sweet Spot graph popup (modal overlay)

### 5.3 Journey Graph Popup

Dark background modal showing:
- Sprouter Sweet Spot graph (X: Self-Knowledge, Y: Action)
- Misguided Zone (top left), Paralysis Zone (bottom right)
- Gold diagonal = Self-Actualisation
- Animated pulsing dot showing current position
- Trail line from start position through completed levels
- Dotted line showing future path
- "You started in the Paralysis Zone. You're moving toward the diagonal."

### 5.4 What Gets Deprecated

- Priority tab name and content (replaced by Level)
- Old stage progression dots (if any exist in header)

---

## 6. Phase 4: Level Template + Content

### 6.1 Architecture

One reusable component, one config object per level:

```
src/
├── components/
│   └── level/
│       ├── LevelTab.jsx          # Template component
│       ├── LevelConfig.js        # Config data for all 6 levels
│       ├── ZoneDiagnosis.jsx     # 3 scene cards for zone check
│       ├── BossFightCard.jsx     # Pre/post session verification
│       ├── MilestoneCard.jsx     # Diagonal challenge card
│       └── ProgressBars.jsx      # 3 progress bars component
```

### 6.2 Level Config Shape

```javascript
export const LEVEL_CONFIG = {
  1: {
    name: 'Identity',
    question: 'Who am I really?',
    graph: 'Identity Sweet Spot',
    yAxis: 'Authenticity',
    xAxis: 'Belonging',
    visibilityLayer: 'screen',
    deepDive: {
      id: 'shadow_work',
      name: 'Shadow Work',
      route: '/shadow-work',
      narrative: 'Meet yourself.',
    },
    milestone: {
      text: 'Beginning to identify your essence + what to pursue',
      type: 'identity',
    },
    zones: {
      topLeft: {
        name: 'Outcast Zone',
        description: 'Fully authentic but excluded',
        boss: 'Fear of losing belonging',
        image: '/images/zones/l1-outcast.png',
      },
      diagonal: {
        name: 'Identity Sweet Spot',
        description: 'Authentic and accepted as yourself',
        image: '/images/zones/l1-sweet.png',
      },
      bottomRight: {
        name: 'Chameleon Zone',
        description: 'Belonging but self-erased',
        boss: 'Performer / People Pleaser',
        image: '/images/zones/l1-chameleon.png',
      },
    },
    essenceQuestion: 'Who were you before the world told you who to be?',
    healingDays: 14,
    courageCount: 6,
  },
  // 2-6 follow same shape
}
```

### 6.3 Level Tab Layout

The `LevelTab` component renders from config:

1. **Zone Diagnosis Card** — 3 Pixar scene cards (same format as onboarding). User taps their zone. If extreme → Boss identified. If diagonal → "This one didn't get you."

2. **Deep Dive Card** — Links to the stage-specific healing flow. Shows completion status.

3. **Boss Fight Card** — Pre-session: 3 verification questions (action scene, body tension 1-10, Boss voice prediction). Post-session: 5 verification questions (wound age, body location, tension re-measure, what younger self needed, self-set challenge). Self-set challenge auto-creates a Play-list challenge tagged "Boss Fight Challenge."

4. **Stage Milestone Card** — The diagonal challenge. Specific human moment per level.

5. **3 Progress Bars:**
   - Bar 1 (Level Quests): Checklist — zone diagnosis ✓, deep dive ✓, boss fight ✓, milestone ✓
   - Bar 2 (Healing Streak): 14 dots. 1 healing task per day = dot filled. Non-consecutive OK.
   - Bar 3 (Play-list Courage): Scales per level (L1=1, L2=2, ... L7=7). Any courage challenge at current visibility layer counts. No essence zone criteria. Each challenge includes compass check-in on completion (N/E/S/W).

### 6.4 Pre-Level: Flow Finder (Skills Only)

Before Level 1 begins, users complete Flow Finder skills identification. This is lightweight and gives the Play-list enough to generate challenges from. Problems and Personas come later at Level 3 (Direction).

### 6.5 All 7 Levels

| Level | Name | Graph | Deep Dive | Visibility Layer | Challenges Required | Milestone |
|---|---|---|---|---|---|---|
| 1 | Identity | Identity SS | Shadow Work | Screen | 1 | Beginning to identify your essence + what to pursue |
| 2 | Vulnerability | Vulnerability SS | Healing Compass | Live | 2 | Share with 2 vibe tribe support pillars |
| 3 | Direction | Direction SS | Flow Finder (Problems + Personas) | Live | 3 | Know who you serve and what problems you solve from your essence |
| 4 | Enough | Enough SS | Matrix Codes | Money | 4 | Deliver on your play-list for the first time |
| 5 | Growth | Growth SS | NS Boundaries | Vulnerable | 5 | How can you make it 3% better? |
| 6 | Execution | Execution SS | Limiting Belief Rewire | Authority | 6 | Identify a sustainable system of output |
| 7 | Passion-Risk | Passion-Risk | NEW: Passion Excavation | All Layers | 7 | Turn down something safe because it doesn't light you up |
| 8 | Play | Play SS | — (endgame) | All Layers | Ongoing | Experience genuine play without performing it |

**Level 8 (Play SS) is the endgame.** Safety + Freedom simultaneously. No boss fight. No graduation. This is the ongoing state. The proof of concept that the whole journey worked. Users at Level 8 are in maintenance mode: continued healing practices, play-list challenges from genuine play, compass diary tracking. The game doesn't end. It deepens.

**The 100 Day Challenge:** The full journey (Levels 1-7) is designed to take ~100 days. Campaign promise: "Transform your life in 100 days." Time-bound, tangible, shareable.

**Flow Finder split:**
- Pre-level: Skills only (lightweight, enables play-list challenge generation)
- Level 3 (Direction): Problems + Personas (deeper Nikigai work, requires Identity + Vulnerability self-knowledge first)

**Grief not included as a level.** The onboarding IS the grief landing. "So where did they go?" is the grief question. They answered it by signing up. Making grief a separate level with boss fights forces someone to sit in pain before they can start moving.

**Play-list challenges scale by level:** Level 1 = 1 challenge, Level 2 = 2, up to Level 7 = 7. Total across the journey: 28 challenges. Low friction at the start, earned capacity by the end.

### 6.6 Zone Diagnosis Per Level

| Level | Graph | Top Left (Boss) | Diagonal (Target) | Bottom Right (Boss) |
|---|---|---|---|---|
| 1 | Identity SS | Outcast Zone → Fear of losing belonging | Identity Sweet Spot | Chameleon Zone → Performer/People Pleaser |
| 2 | Vulnerability SS | Burden Zone → Performer (oversharing) | Vulnerability Sweet Spot | Shallow Zone → Ghost/Perfectionist (walls up) |
| 3 | Direction SS | Martyr Zone → Performer (essence absent from service) | Direction Sweet Spot (Nikigai) | Navel-Gazer Zone → Ghost (self-focused, no service) |
| 4 | Enough SS | Perfectionist Zone → Perfectionist (never finish) | Good Enough Sweet Spot | Procrastinator Zone → Ghost/Perfectionist (never start) |
| 5 | Growth SS | Failure Zone → Performer/Controller (overshoot) | Groan Zone | Safe Zone → Perfectionist/Ghost (comfort zone) |
| 6 | Execution SS | Ruthless Discipline → Performer/Controller (burnout) | Living Zone | Rely on Motivation → Ghost/Perfectionist (stall) |
| 7 | Passion-Risk | Reckless Zone → Performer/Controller (ego risk) | Project Sweet Spot | Secure Zone → Ghost/Perfectionist (uninspired) |

| 8 | Play SS | Reckless Zone → Performing liberation | Play Sweet Spot | Caged Zone → Comfortable captivity |

Zone diagnosis images: 24 total (3 per level × 8). Prompts in `docs/zone-diagnosis-image-prompts.md` (needs updating for Level 3 Direction + Level 8 Play).

### 6.6 Boss Fight Verification

**Pre-session (required before booking, practitioner sees these):**
1. "What's the action scene you're working with?" (free text)
2. "When you imagine that scene, what's the tension in your body, 1-10?" (slider)
3. "What does your body tell you will happen if you take that action?" (free text)

**Post-session:**
4. "What age was the wound from?" (number/range)
5. "Where was the wound in your body?" (body location selector)
6. "When you imagine the same scene now, what's the tension in your body, 1-10?" (slider)
7. "What did the younger version of you need?" (free text)
8. "What's one challenge you're going to do in the next 2 weeks to test the new wiring?" (free text → auto-creates Boss Fight Challenge in Play-list)

**System uses this data for:**
- Q2 vs Q6 delta = quantified shift
- Q3 = Zarlo references the Boss voice
- Q4 + Q5 = healing profile (wound age + body location over time)
- Q7 = essence anchor for voice check-ins
- Q8 = required graduation challenge in Play-list courage bar
- Session transcripts (Fireflies) + structured answers = AI analysis of themes, patterns, breakthroughs

### 6.7 Compass Check-In + Flow Journey Diary

**After each play-list challenge completion**, user logs a compass direction:
- N (Flow): ease + excited — on the diagonal, current level work is landing
- E (Redirect): resistance + excited — Boss is active, blocking something the essence wants
- S (Rest): resistance + tired — nervous system needs recovery
- W (Honour): ease + tired — sustainable pace, honouring capacity

Resistance can be external (client said no, market pushed back) not just internal. The compass captures how the user EXPERIENCED it.

**Flow Journey river on /me page becomes a visual diary:**
- Each day is a tappable dot on the river
- Tap a dot → popup shows all challenges completed that day + compass direction + reflection text
- Level graduation markers appear as gold markers
- Boss defeat markers appear as special icons
- Patterns emerge over time ("South all last week, then hit North after the boss fight")
- Dominant compass direction over the last week tells the user (and Zarlo) whether current level work is landing

### 6.8 Essence Archetype Integration

- Essence archetype revealed at Level 1 (Shadow Work deep dive)
- Becomes the anchor for the entire journey
- Every subsequent level frames challenges as "essence vs protective voice"
- Hero avatar generated AFTER essence reveal (photo upload + AI generation reflecting archetype)
- Uses `generate-avatar-public` edge function with archetype-specific prompt

### 6.8 Flows That Need Building

| Flow | Level | Status |
|---|---|---|
| Shadow Work | 1 | Archived. Un-archive + update with Zone Calibration language. |
| Healing Compass | 2 | Exists. No changes needed. |
| Matrix Codes | 3 | Exists. No changes needed. |
| NS Boundaries | 4 | Exists. No changes needed. |
| Limiting Belief Rewire | 5 | Exists. Reframe as "time machine" usable at any level. |
| Passion Excavation | 6 | NEW. Needs building. |

---

## 7. Data Model Changes

### 7.1 New Tables

**`journey_onboarding_selections`** (already in migration)
- user_id, stage_id, scene_id, zone

**`boss_fight_sessions`** (new)
- user_id, level_number, pre_action_scene, pre_tension_score, pre_boss_prediction, post_wound_age, post_body_location, post_tension_score, post_child_need, post_challenge_text, session_transcript_url, created_at

**`user_level_progress`** (new)
- user_id, current_level, zone_diagnosis_zone, zone_diagnosis_boss, deep_dive_completed, boss_fight_completed, milestone_completed, healing_days_count, courage_challenges_count, boss_fight_challenge_id, graduated_at

### 7.2 Modified Tables

**`user_stage_progress`**
- Add: hero_avatar_url, journey_onboarding_completed, current_journey_level

### 7.3 Deprecated

- Old tension layer scores (discover/regulate/reveal/value) — replaced by new Q1-Q4
- Old stage progression fields — replaced by user_level_progress

---

## 8. /me Page Changes

Keep current design system (purple gradient hero, white cards, gold CTAs, glass morphism). Component swaps only, not a redesign.

**Section 1: Hero Identity** (update content, keep styling)
- Avatar ring — no change (hero avatar appears after Level 1 essence reveal)
- Name + tagline — no change
- XP bar — **UPDATE**: "Level 2: Vulnerability" with stage markers (8 dots along bar)
- **ADD**: Boss badge next to streak: "Fighting: The Performer"
- **ADD**: Journey graph button below XP bar → opens Sprouter popup

**Section 2: Flow Journey** (add diary features)
- HorizontalFlowRiver — keep as-is
- **ADD**: level graduation markers (gold) + boss defeat markers to timeline
- **ADD**: tap any day dot → popup with all challenges, compass direction, reflections (diary mode)
- Remove project selector (journey is user-level)

**Section 3: Today's Quest** (replace content, keep card styling)
- **REPLACE** old 3-state logic with Current Level card:
  - Level name + question + Boss name
  - 3 mini progress bars (level quests, healing days, courage challenges)
  - CTA: "Continue Level" → `/7-day-challenge`

**Section 4: Hero Profile** (no change)
- Essence + protective + voice tracker stays as-is

---

## 9. Level Graduation Celebration ("100 Day Challenge")

When all 3 bars fill, the graduation sequence triggers automatically:

1. **Celebration animation** — confetti, gold particles, level-up sound. "You defeated [Boss name]!"
2. **Encouraging words** — personalised: "Your [essence archetype] is getting louder. The [Boss name] doesn't run this part of your life anymore."
3. **Next level story** — auto-transitions into the zone diagnosis for the next level. The 3 Pixar scene cards appear immediately. "Where are you now?"
4. **New Boss reveal** — user picks their zone. If extreme: "Your next Boss: [protective voice]. Ready?" If diagonal: "This one didn't get you. Nice."

Seamless loop: celebrate → story → diagnosis → new mission. No dead air. The momentum carries them straight into the next level.

---

## 10. What Gets Deprecated

| Current Feature | Replaced By | Action |
|---|---|---|
| Priority tab | Level tab | Rename + new content |
| HomeFirstTime onboarding | JourneyOnboarding | Replace component |
| 4-question tension layers | 3+1 tension questions | Update questions + scoring |
| 10-stage business progression | 7-level journey (business as add-on) | Decouple |
| Old onboardingV2.js path routing | Level-based routing | Remove |
| Matrix Codes standalone quiz | Embedded in Level 4 (Enough) + onboarding | Reposition |
| Push/Flow/Rest/Launch weekly planning | Removed | Simplify |
| Fantasy League competition | Paused (future: compete on categories, levels separate) | Pause |

---

## 11. Key Design Principles

1. **No 4 R's labels visible to users.** Used behind the scenes for task design.
2. **XP bar IS the progression visualization.** No vertical node maps.
3. **3 bars per level, not 1 combined XP pool.** Can't grind healing to skip courage.
4. **Play-list challenges scale by level.** L1=1, L2=2, ... L7=7. Low friction at start, earned capacity by end.
5. **Healing streak = healing tasks only.** 14 days, 1 task minimum per day. Separate from play-list.
6. **Low bar to show up.** 1 healing task = a day counts. Any challenge = counts for play-list.
7. **Template architecture.** One `LevelTemplate`, config per level. New levels = new config object.
8. **Business stages as add-on.** Works for business builders AND employment careers.
9. **All existing users start at Level 1.** Clean migration.
10. **Zone diagnosis uses Pixar scene cards.** Same format as onboarding. Direct self-assessment.
11. **Boss Fight self-set challenge = graduation requirement.** User can't graduate without doing what they told themselves they'd do.
12. **Compass check-in after every play-list challenge.** Feeds the Flow Journey river diary.
13. **Flow Journey = tappable diary.** Each day is a dot. Tap to see challenges, compass, reflections.
14. **Graduation is seamless.** Celebrate → next level story → zone diagnosis → new Boss. No dead air.
15. **Flow Finder split.** Skills = pre-level (enables play-list). Problems + Personas = Level 3 (Direction).
16. **No grief level.** Onboarding IS the grief landing. "So where did they go?" is the grief question.
