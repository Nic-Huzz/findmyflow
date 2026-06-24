# Quest Input Refactoring - Testing Checklist

**Date:** January 10, 2026
**Scope:** useSteppedForm hook and shared UI component migrations

## Summary of Changes

### Phase 1: useSteppedForm Hook
- Created `src/hooks/useSteppedForm.js`
- Provides: `step`, `formData`, `isSubmitting`, `isReviewStep`, `canContinue`, `handleNext`, `handleBack`, `goToStep`, `updateField`, `toggleArrayItem`, `handleSubmit`, `reset`

### Phase 2: Shared UI Components
- Created `src/components/QuestInputShared/`
  - `IntensityScale.jsx` - Before/after intensity slider with shift display
  - `IconGrid.jsx` - Selectable icon grid (not used in this migration, available for future)
  - `StepProgress.jsx` - Progress indicator (text/dots/bar variants)
  - `index.js` - Barrel export

### Phase 3-6: Component Migrations
- `ReleaseQuestInput.jsx` - Uses hook + IntensityScale + StepProgress
- `RecogniseQuestInput.jsx` - Uses hook + StepProgress
- `RewireQuestInput.jsx` - Uses hook + StepProgress
- `ReconnectQuestInput.jsx` - Uses hook + StepProgress

---

## Testing Checklist

### Phase 1: useSteppedForm Hook (Unit Testing)

**Hook API Verification:**
- [ ] `step` starts at 1
- [ ] `handleNext()` increments step when `canContinue()` returns true
- [ ] `handleNext()` does nothing when on final step
- [ ] `handleBack()` decrements step when step > 1
- [ ] `handleBack()` does nothing when step === 1
- [ ] `goToStep(n)` navigates to step n if valid
- [ ] `isReviewStep` is true only on final step
- [ ] `canContinue()` calls the passed `validateStep` function
- [ ] `updateField(field, value)` updates single field
- [ ] `toggleArrayItem(field, item)` adds/removes from array fields
- [ ] `handleSubmit()` sets `isSubmitting` true, calls `onSubmit`, then sets false
- [ ] `reset()` resets step to 1 and formData to initialData

---

### Phase 2: Shared UI Components

#### IntensityScale Component
Route: Any Release quest in `/7-day-challenge`

- [ ] Before slider displays 1-5 buttons
- [ ] After slider displays 1-5 buttons
- [ ] Selected button shows purple highlight
- [ ] Clicking button updates value and calls onChange
- [ ] Shift display shows correct calculation (before - after)
- [ ] Positive shift shows orange color
- [ ] Negative shift shows red color
- [ ] Neutral shift (0) shows gray color
- [ ] Emoji endpoints display correctly (low/high)

#### StepProgress Component
Route: Any multi-step quest in `/7-day-challenge`

- [ ] Shows "Step X of Y: [Title]" format
- [ ] Step number updates on navigation
- [ ] Step title matches current step

---

### Phase 3: ReleaseQuestInput

Route: `/7-day-challenge` > Healing tab > Release quests

#### Daily Release Challenge (`release_daily_challenge`)
- [ ] Step 1: Release type grid displays all 6 methods
- [ ] Step 1: Safety contract dropdown appears (if contracts exist)
- [ ] Step 1: Selecting release type enables Continue
- [ ] Step 2: Emotion grid displays all 6 emotions
- [ ] Step 2: Body location grid displays all 5 locations
- [ ] Step 2: Selecting both enables Continue
- [ ] Step 3: IntensityScale before/after works
- [ ] Step 3: Notes textarea is optional
- [ ] Step 4: Review shows all selections correctly
- [ ] Complete Quest saves data and closes modal
- [ ] Points awarded correctly

#### Processing Your Emotions (`release_negative_charge`)
- [ ] Step 1: Trigger grid displays all 6 triggers
- [ ] Step 1: Emotion grid displays all 6 emotions
- [ ] Step 1: Must select both to continue
- [ ] Step 2: Release method selection works
- [ ] Step 2: IntensityScale before/after works
- [ ] Step 3: Review shows all selections
- [ ] Complete Quest works correctly

#### Big Release (`release_weekly_big`)
- [ ] Step 1: Practice type grid displays all 6 types
- [ ] Step 1: Duration selector displays 4 options
- [ ] Step 1: Must select both to continue
- [ ] Step 2: Multi-select emotions works (select multiple)
- [ ] Step 2: Depth selector displays 4 levels
- [ ] Step 2: Outcome selector displays 4 options
- [ ] Step 2: Must select emotion, depth, and outcome to continue
- [ ] Step 3: Review shows all selections (emotions as icons)
- [ ] Complete Quest works correctly

---

### Phase 4: RecogniseQuestInput

Route: `/7-day-challenge` > Groans tab > Recognise quests

#### Protective Voice (`recognise_protective_observe`)
- [ ] Step 1: User's protective voice shows as primary option
- [ ] Step 1: "Other" dropdown shows remaining voices
- [ ] Step 1: Business area grid displays 6 areas
- [ ] Step 1: Must select voice AND area to continue
- [ ] Step 2: Fear trifecta allows multi-select
- [ ] Step 2: Vulnerability layer is optional
- [ ] Step 2: Must select at least 1 fear to continue
- [ ] Step 3: Situation textarea requires 10+ chars
- [ ] Step 3: Intensity slider works
- [ ] Step 4: Review shows all selections
- [ ] Complete Quest works correctly

#### Essence Voice (`recognise_essence_observe`)
- [ ] Step 1: User's essence archetype displays
- [ ] Step 1: Business area grid works
- [ ] Step 2: Situation textarea requires 10+ chars
- [ ] Step 2: Alignment slider works
- [ ] Step 3: Review shows essence + area + situation + alignment
- [ ] Complete Quest works correctly

#### Negative Frequency (`recognise_negative_frequency`)
- [ ] Step 1: All 6 negative frequencies display
- [ ] Step 1: Selecting one enables Continue
- [ ] Step 2: Area of life grid displays 6 areas
- [ ] Step 2: Intensity slider works
- [ ] Step 2: Situation textarea requires 10+ chars
- [ ] Step 3: Review shows all selections
- [ ] Complete Quest works correctly

#### Positive Frequency (`recognise_positive_frequency`)
- [ ] Step 1: All 6 positive frequencies display (different list)
- [ ] Step 1: Selected state uses different color (positive styling)
- [ ] Step 2: Same as negative frequency
- [ ] Step 3: Review shows all selections
- [ ] Complete Quest works correctly

#### Trigger Pattern (`recognise_trigger_pattern`)
- [ ] Step 1: All 6 trigger types display
- [ ] Step 2: Area, intensity, situation all required
- [ ] Step 3: Review shows all selections
- [ ] Complete Quest works correctly

---

### Phase 5: RewireQuestInput

Route: `/7-day-challenge` > Groans tab > Rewire quests

#### Embody Your Essence (`rewire_behavior_change`)
- [ ] Step 1: Autopilot moment textarea requires 10+ chars
- [ ] Step 2: Conscious shift textarea requires 10+ chars
- [ ] Step 3: Outcome selector (3 options) required
- [ ] Step 4: Review shows all fields
- [ ] Complete Quest works correctly

#### Protective to Essence Shift (`rewire_protective_to_essence`)
- [ ] Step 1: Voice selector works (primary + Other dropdown)
- [ ] Step 1: Protective message textarea requires 10+ chars
- [ ] Step 2: Essence response textarea requires 10+ chars
- [ ] Step 3: Outcome selector required
- [ ] Step 4: Review shows all fields
- [ ] Complete Quest works correctly

#### Dopamine Diet Change (`rewire_dopamine_diet`)
- [ ] Step 1: Fast-food joy grid (6 options) required
- [ ] Step 2: Nutritious joy grid (6 options) required
- [ ] Step 2: Comparison note is optional
- [ ] Step 3: Outcome selector required
- [ ] Step 4: Review shows all fields
- [ ] Complete Quest works correctly

#### Future Successful You (`rewire_future_successful_you`)
- [ ] Step 1: Action textarea requires 10+ chars
- [ ] Step 2: Outcome selector required
- [ ] Step 3: Review shows action + outcome
- [ ] Complete Quest works correctly

#### Make It A Hell Yea (`rewire_hell_yea`)
- [ ] Step 1: Type selector (Organic/Transformed) required
- [ ] Step 2: Event description requires 10+ chars
- [ ] Step 3: What made it requires 10+ chars
- [ ] Step 4: Review shows all fields
- [ ] Complete Quest works correctly

#### Essence Voice Groan (`reconnect_groan_wheel`)
- [ ] Step 1: Fear multi-select (at least 1 required)
- [ ] Step 1: Vulnerability layer required
- [ ] Step 2: Action textarea requires 10+ chars
- [ ] Step 3: Intensity slider required
- [ ] Step 3: Outcome selector required
- [ ] Step 4: Review shows all fields
- [ ] Complete Quest works correctly

---

### Phase 6: ReconnectQuestInput

Route: `/7-day-challenge` > Reconnect tab

#### Meditation (`reconnect_morning_meditation`)
- [ ] Step 1: Duration selector (4 options) required
- [ ] Step 2: Before/after state selectors required
- [ ] Step 2: Shift display shows calculation
- [ ] Step 3: Review shows duration + shift
- [ ] Complete Quest works correctly

#### Rise & Vibe Dance (`reconnect_morning_dance`)
- [ ] Step 1: Before/after state selectors required
- [ ] Step 1: Shift display shows calculation
- [ ] Step 2: Review shows energy shift
- [ ] Complete Quest works correctly

#### Breathwork (`reconnect_morning_breathwork`)
- [ ] Step 1: Breathwork type grid (4 options) required
- [ ] Step 2: Before/after state selectors required
- [ ] Step 3: Review shows type + shift
- [ ] Complete Quest works correctly

#### Self-Identified Activity (`reconnect_self_identified`)
- [ ] Step 1: Dimension selector (5 options) required
- [ ] Step 1: Activity description requires 10+ chars
- [ ] Step 2: Before/after state selectors required
- [ ] Step 3: Review shows dimension + activity + shift
- [ ] Complete Quest works correctly

#### Daily Prayer (`reconnect_daily_prayer`)
- [ ] Step 1: Prayer elements multi-select (at least 1 required)
- [ ] Step 2: Prayer note is optional
- [ ] Step 2: Connection rating slider required
- [ ] Step 3: Review shows elements + rating
- [ ] Complete Quest works correctly

#### Weekly Reconnection Task (`reconnect_weekly_task`)
- [ ] Step 1: Dimension selector required
- [ ] Step 1: Duration selector required
- [ ] Step 2: Practice description requires 10+ chars
- [ ] Step 2: Meaningfulness rating required
- [ ] Step 3: Review shows all fields
- [ ] Complete Quest works correctly

#### Environment Hygiene (`reconnect_remove_negative`)
- [ ] Step 1: Drain type selector (5 options) required
- [ ] Step 2: Action description requires 10+ chars
- [ ] Step 3: Difficulty selector required
- [ ] Step 3: Outcome selector required
- [ ] Step 4: Review shows all fields
- [ ] Complete Quest works correctly

---

## Cross-Component Tests

- [ ] All quests show correct StepProgress format
- [ ] Back button works on all steps (except step 1)
- [ ] Back button is hidden on step 1
- [ ] Continue button is disabled when validation fails
- [ ] Continue button is enabled when validation passes
- [ ] Complete Quest button shows on final step
- [ ] Complete Quest button shows "Saving..." while submitting
- [ ] Data is saved correctly to database
- [ ] Points are awarded after completion
- [ ] Modal closes after successful completion

---

## Regression Tests

- [ ] Build completes without errors (`npm run build`)
- [ ] Dev server starts without errors (`npm run dev`)
- [ ] No console errors on page load
- [ ] No console errors during quest completion flow
- [ ] Quest completion data matches expected format in database
- [ ] Existing completed quests display correctly in history

---

## Performance Verification

- [ ] No noticeable lag on step navigation
- [ ] No flickering during form state updates
- [ ] Multi-select (fear/emotions) responds instantly

---

## Notes

- IntensityScale component is currently only used in ReleaseQuestInput
- IconGrid component is available but not used in this migration (future use)
- All components still maintain their original CSS files for styling
- The hook provides a `goToStep()` function not currently used (for future "edit from review" feature)
