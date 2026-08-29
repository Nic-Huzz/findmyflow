# Handoff: Quest Card Visual Redesign

**Date:** Aug 29, 2026
**Branch:** `feature/phase2-restructure`
**Previous agent session:** 12+ hours, massive Phase 2 restructure
**Start by:** Reading `CLAUDE.md` and this handoff. Then `npm run dev` and open `http://localhost:5173/7-day-challenge` (Quests tab) AND `http://localhost:5173/mockups/quest-card-redesign.html` (target mockup) side by side.

---

## What's Done (don't redo)

### This session shipped:
- **Tab restructure**: Discover | Quests | Tune | Progress (was Journey/Quests/Courage/Tune)
- **DiscoverTab**: Essence Mirror, Life Map, Dome entry, "Experience to try this week", bridge CTA
- **ProgressTab**: Hero journey (movie refs + next step), zone matrix X/Y graph, stats, dimensions
- **WeeklyFocus**: courage merged into Quests tab, "one challenge a week" picker
- **Experience Game rewrite**: per-branch tick → rate → dome flow, common branches first
- **DomeRadar**: NS-state Y-axis (Vibe Rise = center), coloured concentric bands
- **WahooCreator rewrite**: 3-step conversation (text → dimensions → voice lie)
- **Zone matrix**: simplified to 4 boolean rules (discovery + courage this week)
- **Expansion dimensions**: 7 dimensions on `groan_challenges.expansion_dimensions`
- **Ghost league fixes**: completions 1000-row truncation, timezone on recap
- **Tab unlock**: Discover + Progress default, Quests/Tune unlock progressively
- **"Feeling stuck?"**: link on WeeklyFocus AND QuestBoardCard courage challenges
- **Experience Game brand**: pink → purple, solid progress bar, larger dome popup

### Key docs (source of truth):
- `docs/features/experience-dome-full-system-reference.md` — gospel for all three phases
- `docs/features/phase2-restructure.md` — tab structure, decisions, V2 ideas
- `docs/features/three-phase-journey.md` — phase definitions
- `docs/features/phase2-implementation-plan.md` — sprint plan (mostly done)

---

## What's NOT Done (the task)

### Quest Card Visual Redesign

The `QuestBoardCard.jsx` (757 lines) needs a **visual redesign** to match the mockup at `public/mockups/quest-card-redesign.html` (Option A: Minimal).

**Current state:** Functional changes done (add buttons, stuck link, WahooCreator wired) but the visual CSS/layout is still the old ugly design.

**Target state (from mockup):**
- Clean rounded card with proper spacing
- Experience sections as collapsible headers (tap to expand/collapse)
- Tasks nested cleanly under each experience with dimension pills (People, Location, etc.)
- Courage badge (⚡) and healing badge (💚) on task rows
- "Feeling stuck?" link under undone courage challenges
- Two clean add buttons at bottom: "⚡ Add courage challenge" | "+ Add task"
- Remove: "+ Add experience" link, "Map XX unmapped" link, "Show XX completed" clutter
- Hide "Close quest" behind a three-dot menu or long-press

**Key files:**
- `src/components/QuestBoardCard.jsx` — main component (757 lines)
- `src/components/QuestBoardCard.css` — styles
- `public/mockups/quest-card-redesign.html` — the target mockup (Option A section)

**Brand guide:**
- Purple: #5e17eb
- Gold: #E9A23B
- Light theme (bg: #f5f5f0, cards: #fff)
- Font: system (DM Sans in mockup, but app uses system fonts)
- No em dashes in copy
- CSS scoped with `qbc-` prefix

**What NOT to change:**
- Don't touch WahooCreator (just rewritten)
- Don't touch the toggle/completion logic (toggleTask, GroanCompletionModal wiring)
- Don't touch HealingFlowModal integration
- Keep the experience grouping (mission → products → brave actions hierarchy)

### Option C Popup (secondary task)

WahooCreator currently renders inline in a modal overlay (`.wc-modal-overlay` from QuestBoardCard). The "Add courage challenge" button opens it. The popup UX works but could be polished to match the conversation-style mockup (Option C in the mockup file). Lower priority than the card layout.

---

## Architecture Notes

- Another agent is simultaneously working on `ExperienceGameFlow.jsx`, `DomeRadar.jsx`, and `experienceDomeConfig.js`. Don't touch those files.
- `QuestBoardCard.jsx` and `QuestBoardCard.css` are exclusively yours.
- The WahooCreator is a 3-step conversation: text → dimensions (7 pills) → voice lie (5 options from `protectiveVoices.js`). Don't rewrite it, just ensure it renders cleanly in the popup.

---

## Data Shape

Quest card receives:
- `quest` — { id, label, predicted_state, status, depth_level, ... }
- `tasks` — array of quest_tasks (text, done, is_courage_challenge, groan_challenge_id, experience_id, ...)
- `experiences` — array of quest_experiences (label, capacity_state, ...)
- `userId`
- `onUpdate` callback

Expansion dimensions on courage challenges: `groan_challenges.expansion_dimensions text[]` — values: duration, frequency, medium, people, money, location, independence. Currently saved but NOT displayed on the card. The mockup shows them as coloured pills under each task.

To fetch dimensions for display, you need to join through `quest_tasks.groan_challenge_id` → `groan_challenges.expansion_dimensions`. The tasks array doesn't include dimensions directly.

---

## Known Issues in Current Code

1. `VOICE_META` constant in WahooCreator.jsx is dead code (no longer used in render). Can remove.
2. `QuestBoardCard.onWahooAccepted` callback receives `(null, voiceId)` — the `healingTask` arg is always null now. Dead code at lines 703-707 checks `if (healingTask?.id)` which never fires.
3. `showAssignTasks` state and "Assign" button for unassigned tasks — decide if keeping or removing.
4. `showMapCompleted` state and "Map XX unmapped" button — probably remove (internal tool).
5. Color picker for quest dot color — decide if keeping or removing.

---

## Hierarchy to Maintain

```
Life Path (quest)          e.g. "Vibe Rise"
├── Experience (product)   e.g. "Monument Disco Tour" [Vibe Rise]
│   ├── Courage challenge  e.g. "Rome Flash Mob" [People, Location] ⚡💚
│   │   └── "Feeling stuck? Explore what's blocking you"
│   └── Courage challenge  e.g. "Eiffel Tower Rave" [People, Duration, Location] ⚡
│       └── "Feeling stuck? Explore what's blocking you"
├── Experience (product)   e.g. "Made life feel like a game" [Fun]
│   └── Task               e.g. "Message quit-job people"
└── [Add courage challenge]  [+ Add task]
```

---

## Acceptance Criteria

1. Side-by-side with mockup, the card looks comparable in quality and spacing
2. Dimension pills show on courage challenges (fetch from groan_challenges)
3. Experiences collapse/expand on tap
4. "Add courage challenge" opens WahooCreator popup
5. "Add task" shows inline input
6. No clutter: removed + Add experience, Map unmapped, experience pills, courage checkbox, timeframe picker
7. Build passes (`npm run build`)
8. Existing functionality preserved: checkbox completion, GroanCompletionModal, HealingFlowModal
