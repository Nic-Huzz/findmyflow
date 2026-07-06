---
name: Life Path States tool
description: Career visualization tool with cone of safety, facilitator + self-guided + widget versions. Built Jun 26-29 2026.
type: project
---

## What was built

Three versions of the Life Path States exercise:

1. **Facilitator** (`/facilitate/life-paths`) — live room tool, 8 steps: CLIENT → CURRENT → ENTER → TAG → SPRING → TAG_NEW → READING → WAHOOS → COMPLETE. Dark/light theme, keyboard shortcuts, projector-friendly. Saves to `life_path_sessions` table with client name/email.

2. **Self-guided** (`/try/life-paths`) — public lead magnet, 10 steps: HOOK → CURRENT → ENTER → TAG → SPRING → TAG_NEW → EMAIL (gate before reveal) → REVEAL (hard cut to dark, punchline) → WAHOOS → BRIDGE (conversion to /get-started). Purple/white/dark screens, mobile-first, progress dots.

3. **Widget** (`LifePathWidget.jsx`) — embeddable in the wahoo tab of 7-day-challenge. Progressive map (like facilitator), inline controls. Not yet wired into Challenge.jsx.

## Key files

- `src/components/LifePathMap/LifePathMap.jsx` — shared SVG engine, prop-driven
- `src/components/LifePathMap/lifePaths.js` — constants, geometry helpers, STATE_META
- `src/components/LifePathMap/LifePathMap.css` — animations (fly-in, pulse, ignite)
- `src/components/LifePathMap/LifePathWidget.jsx` — embeddable widget
- `src/pages/FacilitateLifePaths.jsx` + `.css` — facilitator version
- `src/flows/TryLifePaths.jsx` + `.css` — self-guided version
- `src/pages/LifePathTest.jsx` — scratch test page (can remove)
- `public/life-path-states-mockup.html` — original design mockup
- `docs/life-path-states-implementation-plan.md` — full plan with script
- `supabase/migrations/20260628000002_create_life_path_sessions.sql` — DB table

## Key design decisions

- State labels renamed: Peace→Fun, Anxious→Pressure, Shutdown→Uninterested (Vibe Rise unchanged)
- Cone anchors on current career state only (not all careers). All entered careers are `realistic: false`. Cone expands through wahoos.
- Trunk Y position is dynamic based on current career's state
- No classify/hesitate step — all careers treated equally. Cone is a progress indicator, not a safety assessment.
- Punchline: "We don't rise to the level of our ambitions. We fall to the level that feels safe."
- Self-guided email gate is BEFORE the reveal (stronger hook: "enter details to see your map")

## Still pending

- Wire LifePathWidget into Challenge.jsx wahoo tab
- Copy/script polish (facilitator prompts are scaffolding)
- PNG export for facilitator
- Wahoo nodes on the branch lines (v2)
- AI emoji matching for careers (v2)
- Update implementation plan to reflect final flow
