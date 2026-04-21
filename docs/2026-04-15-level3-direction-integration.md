# Level 3: Direction — Integration Plan

Date: 2026-04-15
Status: Planned
Affects: LevelConfig.js, LevelTab.jsx, People Matching, Career Clarity Quiz

## Context

By the time a user reaches Level 3 ("Direction — What do I build and who do I build it for?"), they already have:

- **Skills tagged** (Level 0: Curiosity Compass / Get Started)
- **Problems tagged** (Level 0: Identify Topics)
- **Essence archetype** (Level 0: Essence Mirror)
- **Zone Diagnosis for Identity + Vulnerability** (Levels 1-2)
- **Shadow Work** (Level 1 deep dive)
- **Healing Compass** (Level 2 deep dive)

They know WHO they are. Level 3 is where they decide what to DO with it.

## What changes

### 1. Level 3 Deep Dive: Flow Finder → Career Clarity Quiz

**Current:** `Flow Finder: Problems + Personas` at `/nikigai/problems`
**New:** `Career Clarity Quiz` at `/career-clarity`

Problems are already identified at Level 0 (Identify Topics). Repeating problem identification at Level 3 is redundant. The Career Clarity Quiz is the right deep dive because it answers the Level 3 question directly: "Should I stay in my job, pivot, or build my own thing?"

```js
deepDive: {
  id: 'career_clarity',
  name: 'Career Clarity Quiz',
  route: '/career-clarity',
  narrative: 'Should you stay, pivot, or build?',
  icon: '🧭',
}
```

The quiz already exists at `/career-clarity` (public route, no AuthGate). It saves results to `quiz_results` table. Completion detection: check `quiz_results` for the user's `user_id`.

### 2. Level 3 Extra Quest: People Matching (auto-unlocked)

Since users have skills + problems tagged by Level 0, People Matching can fire immediately when Level 3 is reached. No additional data collection needed.

```js
extraQuests: [
  {
    id: 'people_matching',
    name: 'People Who Built This',
    route: '/people',
    narrative: 'See who already built what you\'re dreaming of.',
    icon: '🌍',
  },
]
```

**Why it fits Level 3:** People Matching shows career models, trajectories, and revenue streams of people who share the user's skill + problem profile. That is literally "What do I build and who do I build it for?" answered through proof.

**Completion detection:** User has viewed the page and saved at least one favourite (tracked in localStorage key `findmyflow_saved_people`). Or simpler: mark complete on first visit (save a flag to `user_level_progress` or `quest_completions`).

### 3. Flow Finder: Problems + Personas — relocated

The existing deep dive (`/nikigai/problems`) isn't deleted. It already runs at Level 0 as "Identify Topics". Users who want to revisit problem identification can still access it from the Library or directly.

No route changes needed. Just removing it as Level 3's deep dive.

## Level 3 config (proposed)

```js
3: {
  name: 'Direction',
  question: 'What do I build and who do I build it for?',
  graph: 'Direction Sweet Spot',
  yAxis: 'Essence Expressed',
  xAxis: 'Service of Others',
  visibilityLayer: 'live',
  deepDive: {
    id: 'career_clarity',
    name: 'Career Clarity Quiz',
    route: '/career-clarity',
    narrative: 'Should you stay, pivot, or build?',
    icon: '🧭',
  },
  extraQuests: [
    {
      id: 'people_matching',
      name: 'People Who Built This',
      route: '/people',
      narrative: 'See who already built what you\'re dreaming of.',
      icon: '🌍',
    },
  ],
  milestone: {
    text: 'Know who you serve and what problems you solve from your essence',
    type: 'direction',
  },
  zones: {
    topLeft: { name: 'Martyr Zone', description: 'Essence absent from service', boss: 'Performer (serving without self)' },
    diagonal: { name: 'Direction Sweet Spot (Nikigai)', description: 'Essence expressed in service' },
    bottomRight: { name: 'Navel-Gazer Zone', description: 'Self-focused, no service', boss: 'Ghost (self-absorbed)' },
  },
  essenceQuestion: 'What code is blocking your essence from moving?',
  courageCount: 3,
  healingDaysRequired: 9,
}
```

## User journey through Level 3

1. **Zone Diagnosis** — "Where are you on the Direction graph?" (Martyr / Sweet Spot / Navel-Gazer)
2. **Career Clarity Quiz** (deep dive) — "Should I stay, pivot, or build my own thing?" Produces a clear recommendation.
3. **People Who Built This** (extra quest) — "Here are 5 people who share your skills and problems. Look at what they built." Provides proof and permission.
4. **Courage Challenges** (3 required) — Playlist challenges at this level.
5. **Boss Fight** — If diagnosed in Martyr or Navel-Gazer zone.
6. **Milestone** — "Know who you serve and what problems you solve from your essence."

## Completion tracking

| Quest | Detection | Table |
|-------|-----------|-------|
| Zone Diagnosis | `zone_diagnosis_zone` set | `user_level_progress` |
| Career Clarity Quiz | Row exists for user | `quiz_results` |
| People Matching | First visit or favourite saved | `quest_completions` or localStorage |
| Courage Challenges | 3 completed at this level | `groan_challenges` |
| Milestone | Commitment + reflection done | `user_level_progress` |

## Code changes required

### LevelConfig.js
- Update Level 3 `deepDive` from `flow_finder_direction` to `career_clarity`
- Add `extraQuests` array with `people_matching` entry

### LevelTab.jsx
- Add completion check for `career_clarity` deep dive (query `quiz_results` for user)
- Add completion check for `people_matching` extra quest
- Both need new state variables and useEffect queries

### Career Clarity Quiz (minor)
- Currently public (no AuthGate). Keep it public but pass `userId` when available so results save to `quiz_results.user_id`
- Add `?returnTo=/7-day-challenge` support for navigation back to the challenge portal

### People Matching (minor)
- Already behind AuthGate
- Consider adding a "Mark as explored" button or auto-complete on visit
- Already loads user's skills + problems from `nikigai_clusters`

## What this does NOT change

- Levels 0-2 and 4-8 are unchanged
- Flow Finder problems/personas route stays accessible (just not the Level 3 deep dive)
- Career Clarity Quiz stays public for non-authenticated users
- People Matching matching algorithm stays as-is (category overlap)
- No new database migrations needed (uses existing tables)

## Decisions (resolved)

1. **Career Clarity Quiz styling**: No restyle needed for now. Test at `/career-clarity` (public, live).
2. **People Matching completion**: Complete when user saves at least one favourite.
3. **Career Models in Zarlo**: Always visible, not gated to Level 3+.
