# Priority Tab Completions + Business Page + Mobile Play-list Picker

**Date:** 2026-03-05
**Status:** Approved

## Summary

5 features to improve the Priority tab, Business page, and Play-list mobile experience.

---

## Feature 1: Play-list Challenge Inline Completion (Priority Tab)

### What
"Complete" button on Play-list Challenge rows in Priority tab opens a standalone reflection modal.

### New Component: `GroanCompletionModal.jsx`
Self-contained modal, no dependency on Challenge.jsx state.

**Steps:**
1. Scary/Wahoo sliders (1-10)
2. 3% improvement yes/no
3. Reflection text (optional)
4. Voice check-in (essence/protective)
5. Compass check-in (N/E/S/W)
6. Confetti, close modal

**DB writes:**
- `completeGroanChallenge()` marks groan challenge done
- Insert `quest_completions` (quest_category: 'Groans', 7 XP)
- Insert `groan_reflections` for voice data
- Insert `flow_entries` for compass data

### Display Name Change
Priority tab quest list only: parse `Skill x LAYER -- Day` into `LAYER: Skill -- Day`.

---

## Feature 2: Play Profile Inline Completion (Priority Tab)

### What
"Complete" button on Play Profile row expands to show `ChallengeRating` component inline.

### Flow
1. Click "Complete" on DNA Challenge row
2. Row expands to show ChallengeRating (voice check-in + compass)
3. Submit saves and collapses

**DB writes:**
- Update `founder_dna_sessions` status to 'completed' with rating data
- Insert `quest_completions` (10 XP to Play-List category)

---

## Feature 3: /business Page Restyle

### What
Replace QuestCard list with clean v2 mockup row design.

### Quest Row Design
- Icon: checkmark (done) or type emoji (todo)
- Name (bold, strikethrough if done)
- Subtitle: Type + Free/Paid
- Action button: gold "Start" or grey "Done"

### Collapsible Learn More
- Tap row to expand/collapse description text
- Action button always visible
- Flow quests: "Start" navigates to flow page
- Inline input quests: "Start" expands row to show input area

### Source
Match `docs/mockups/business-page-v2.html` styling.

---

## Feature 4: Priority Layer Quest Recommendations

### What
Sort quests within Priority tab sections based on user's priority layer.

### Implementation
Extend `LAYER_RECOMMENDATIONS` in `usePriorityTab.js` to include per-quest ranking. Quests matching the layer sort to top of their section. No new UI, just ordering.

---

## Feature 5: Mobile Play-list Guided Picker

### What
On mobile (<768px), replace the Groan Matrix in the Play-list tab with a step-by-step guided flow matching the Priority tab's weekly picker pattern.

### Flow
1. Choose skill (from user's nikigai_clusters)
2. Choose visibility layer (screen/live/money/vulnerable/authority)
3. Choose day
4. Generate or write challenge text
5. Accept challenge
6. Complete -> existing reflection flow (scary/wahoo, voice, compass)

### Desktop
Keep the full Groan Matrix as-is. Only mobile gets the guided picker.

### Detection
CSS media query `@media (max-width: 767px)` to swap between matrix and picker, or a `useMediaQuery` hook to conditionally render.

---

## Implementation Order

1. GroanCompletionModal (Feature 1) -- standalone, no existing code changes
2. Play Profile completion (Feature 2) -- small PriorityTab change
3. Business page restyle (Feature 3) -- isolated to BusinessPage.jsx
4. Recommendation sorting (Feature 4) -- small usePriorityTab change
5. Mobile Play-list picker (Feature 5) -- largest, touches PlayListTab + Challenge.jsx

## Files Affected

**New:**
- `src/components/GroanCompletionModal.jsx`
- `src/components/GroanCompletionModal.css`
- `src/components/MobilePlaylistPicker.jsx`
- `src/components/MobilePlaylistPicker.css`
- `src/components/BusinessQuestRow.jsx` (extracted row component)

**Modified:**
- `src/components/PriorityTab.jsx` (Features 1, 2, 4)
- `src/hooks/usePriorityTab.js` (Feature 4)
- `src/pages/BusinessPage.jsx` (Feature 3)
- `src/pages/BusinessPage.css` (Feature 3)
- `src/components/PlayListTab.jsx` (Feature 5)
