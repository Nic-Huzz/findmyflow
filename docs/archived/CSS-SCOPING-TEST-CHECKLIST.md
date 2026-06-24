# CSS Scoping Test Checklist

Master checklist for testing all CSS scoping changes. Test each component after all scoping work is complete.

---

## 1. FlowFinder.css (`.flow-finder-app`)

**Routes:** `/nikigai/skills`, `/nikigai/problems`, `/nikigai/persona`, `/nikigai/integration`

- [ ] Progress bar displays correctly at top
- [ ] AI conversation bubbles render properly
- [ ] Input fields styled correctly
- [ ] Primary buttons (gold/orange) display properly
- [ ] Loading spinner animation works
- [ ] Cluster cards display correctly
- [ ] Summary/completion screens render properly

---

## 2. PersonaSelectionFlow.css (`.persona-selection-flow`)

**Route:** `/persona-selection`

- [ ] Progress dots show current step
- [ ] Welcome container displays correctly
- [ ] Option cards render with proper styling
- [ ] Selected state shows on chosen options
- [ ] Primary button styling correct
- [ ] Persona reveal animation works
- [ ] Mobile responsive layout works

---

## 3. HomeFirstTime.css (`.home-first-time`)

**Route:** `/me` (first-time users)

- [ ] Welcome header displays correctly
- [ ] Archetype cards (essence/protective) render properly
- [ ] Card badges show correct colors
- [ ] Loading spinner animation works (`homeFirstTimeSpin`)
- [ ] Question screens display correctly
- [ ] Progress dots animate properly
- [ ] Option buttons show hover/selected states
- [ ] Persona reveal screen renders correctly
- [ ] Project type selection cards work
- [ ] CTA section buttons styled correctly

---

## 4. ExistingProjectFlow.css (`.existing-project-flow`)

**Route:** Triggered from HomeFirstTime "Existing Project" path

- [ ] Progress bar shows correctly
- [ ] Flow step headings display properly
- [ ] Text inputs styled correctly
- [ ] Textarea inputs styled correctly
- [ ] Tag input and tags list display properly
- [ ] Stage selection options render correctly
- [ ] Selected stage shows proper styling
- [ ] Loading spinner animation works (`existingProjectSpin`)
- [ ] Success screen with checkmark displays
- [ ] Button row layout correct on mobile

---

## 5. ChallengeProjectSelector.css (`.project-selector`)

**Route:** `/7-day-challenge` (project selection modal)

- [ ] Loading state displays correctly
- [ ] Loading spinner animation works (`projectSelectorSpin`)
- [ ] Empty state renders properly
- [ ] Project cards display correctly
- [ ] Primary project badge (gold) shows
- [ ] Selected project shows checkmark indicator
- [ ] Stage badges display correctly
- [ ] Points badges render properly
- [ ] Primary/secondary buttons styled correctly
- [ ] Hover states work on project cards

---

## 6. GroansSummary.css (`.groans-summary`)

**Route:** `/7-day-challenge` (Groans insights panel)

- [ ] Summary header with back button displays
- [ ] Days progress bar renders correctly
- [ ] Archetype balance bar shows essence/protective split
- [ ] Insight hero section animates (`groansFadeInUp`)
- [ ] Celebration state animation works (`groansCelebrate`)
- [ ] Emoji bounce animation works (`groansBounce`)
- [ ] Streak card displays correctly
- [ ] Next action card renders with green styling
- [ ] Overview stats grid displays
- [ ] Type bars (recognise/rewire/reconnect) show correctly
- [ ] Layer grid displays all 5 layers
- [ ] Area grid displays correctly
- [ ] Frequency comparison columns render
- [ ] Intensity display bar works
- [ ] Empty state shows when no data
- [ ] Mobile responsive layout works

---

## 8. PersonaAssessment.css (`.persona-assessment`)

**Route:** `/` (login/signup page)

- [ ] Progress dots show current step correctly
- [ ] Welcome screen greeting and message display
- [ ] Option cards render with hover states
- [ ] Animated text paragraphs fade in sequentially
- [ ] EAR highlight glow animation works (`personaEarPulse`)
- [ ] Transformation journey animation works
- [ ] Pattern list items fade in correctly (`personaPatternFadeIn`)
- [ ] Reveal screens display archetype info correctly
- [ ] Capture form inputs styled correctly
- [ ] Primary button styling and hover states work
- [ ] Success icon animation works (`personaScaleIn`)
- [ ] Typing indicator animation works (`personaTyping`)
- [ ] Mobile responsive layout works

---

## 9. FlowLibrary.css (`.library-container`)

**Route:** `/library`

- [ ] Back button displays correctly
- [ ] Empty state renders when no responses
- [ ] Primary/secondary buttons styled correctly
- [ ] Flow group cards display properly
- [ ] Flow count badges show
- [ ] Response cards render correctly
- [ ] Card headers show expand/collapse
- [ ] Card content slides down animation works (`librarySlideDown`)
- [ ] Detail items show with purple left border
- [ ] Safety contracts list renders with gold border
- [ ] Action buttons (view/export/delete) styled correctly
- [ ] Hover states work on all interactive elements
- [ ] Mobile responsive layout works

---

## Quick Smoke Test

Run through these core flows to catch any major issues:

1. **New User Flow:** Sign up → HomeFirstTime → Persona questions → Project type → ExistingProjectFlow OR FlowFinder
2. **Challenge Flow:** `/7-day-challenge` → Select project → View quests → Open Groans summary
3. **Flow Finder:** `/nikigai/skills` → Complete a few questions → View clusters
4. **Library:** `/library` → Expand a response card → Check styling

---

## Notes

- All `@keyframes` animations have been renamed to component-specific names to prevent conflicts
- If any component looks broken, check browser console for CSS errors
- Test on both desktop and mobile viewports
