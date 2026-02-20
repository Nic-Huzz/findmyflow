# Fantasy League Guide — Design Doc

**Created:** 2026-02-20
**Status:** Approved
**Route:** `/league/guide`

## Overview

A dedicated explainer page for users who are brand new to both FindMyFlow and the Fantasy League. Uses the same slide-based pattern as stage explainers (ValidationExplainer, FlowFinderExplainer, etc.) — full-screen purple gradient, progress dots, card content, Next/Back nav.

Reuses `FlowFinderExplainer.css` for consistent styling.

## Audience

People who haven't used FindMyFlow before but are joining because of the league. Need everything explained from scratch.

## 5 Slides

### Slide 1: "Welcome to Fantasy League"

- One-sentence pitch: a team competition that makes building your business fun
- You + 2 friends form a squad
- Compete head-to-head against other squads each week
- Highlight box: "The more you work on yourself and your business, the more your team wins"

### Slide 2: "How You Score Points"

- Every week you get quests in the 7-Day Challenge
- Quests help you: build your business, face your fears, and take care of yourself
- Completing quests = earning points
- Visual: 3 example quest types (Business task, Healing task, Courage task) with indicative point values

### Slide 3: "The 5 Categories"

- Grid of 5 category cards with icons and brand colors:
  - **Business** (purple, `#5e17eb`) — Project stage quests. Quality over quantity (efficiency scoring).
  - **Play-List** (gold, `#E9A23B`) — Courage challenges. Face your fears.
  - **Healing** (green, `#10b981`) — Self-care, daily & weekly rituals.
  - **Voice** (purple, `#8B5CF6`) — Deep dive exploration.
  - **Bonus** (gold, `#E9A23B`) — Tracker + social content submissions.
- Highlight: "Your team's combined scores compete in each category"

### Slide 4: "How Matchups Work"

- Each week: your squad vs another squad
- Your team's combined points compete across all 5 categories
- Visual: mini scoreboard mockup (Team A vs Team B with category comparison bars/numbers)
- Scoring rules:
  - Win 3+ categories = **Win** (3 match pts)
  - Tie 2-2 = **Draw** (1 pt each)
  - Win 0-1 = **Loss** (0 pts)

### Slide 5: "Ready to Play"

- Quick summary: Join a squad, do your quests, check the scoreboard
- CTA: "Join the League" → navigates to `/league`
- Secondary: "Back to Challenge" → navigates to `/7-day-challenge`

## Technical Details

- **Component:** `src/flows/LeagueGuide.jsx`
- **CSS:** Reuses `src/flows/FlowFinderExplainer.css` (import it directly)
- **Route:** `/league/guide` (add to AppRouter.jsx, lazy-loaded)
- **No quest completion:** Unlike stage explainers, this doesn't sync with the challenge system. It's purely informational.
- **Entry points:**
  - Link from `/league` Rules tab ("New to Fantasy? Read the full guide")
  - Direct URL sharing

## Navigation

- Back button on first slide → navigate to `/league`
- Last slide CTA → navigate to `/league`
- Last slide secondary → navigate to `/7-day-challenge`
