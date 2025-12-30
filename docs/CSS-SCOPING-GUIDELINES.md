# CSS Scoping Guidelines

## Problem: CSS Class Name Collisions

When multiple components use the same class names (like `.primary-button`, `.loading-state`, `.progress-dots`, etc.), styles can "leak" between pages and cause unexpected formatting issues.

---

## Quick Reference

| Pattern | Convention |
|---------|------------|
| Parent wrapper | `.flow-name` (e.g., `.lead-magnet-flow`, `.upsell-flow`) |
| Scoped selector | `.flow-name .class-name` |
| @keyframes | `flowNameAnimation` (e.g., `leadMagnetFadeIn`, `upsellGlow`) |
| Button width | `width: 100%; max-width: 320px;` |
| Text size (welcome) | `font-size: 18px;` |
| Stopwatch icon | `font-size: 4rem;` |

---

## 1. Always Scope Component Styles

Every CSS file should scope its selectors to the component's root class:

```css
/* ComponentName.css */

/* Root container - defines the scoping boundary */
.component-name {
  /* styles */
}

/* All child elements MUST be scoped */
.component-name .title { }
.component-name .card { }
.component-name .primary-button { }
```

### JSX Wrapper Requirement

The JSX component MUST have a matching wrapper class:

```jsx
// ComponentName.jsx
function ComponentName() {
  return (
    <div className="component-name">
      {/* content */}
    </div>
  )
}
```

---

## 2. HIGH CONFLICT Class Names

These class names are used across multiple components and MUST ALWAYS be scoped:

### Buttons
- `.primary-button`, `.primary-button:hover`, `.primary-button:disabled`
- `.secondary-button`, `.secondary-button:hover`
- `.glow-button`

### Progress Indicators
- `.progress-dots`, `.progress-dot`
- `.section-progress`, `.section-progress-fill`
- `.progress-bar`, `.progress-bar-fill`

### Loading States
- `.loading-state`
- `.typing-indicator`, `.typing-indicator span`

### Layout
- `.welcome-container`
- `.welcome-message`, `.welcome-message p`
- `.welcome-greeting`
- `.container`

### Forms & Cards
- `.option-card`
- `.question-container`, `.question-text`
- `.card`, `.card-header`

---

## 3. @keyframes Naming Convention

**Problem:** @keyframes are GLOBAL - they cannot be scoped with parent selectors.

**Solution:** Prefix animation names with the flow/component name:

```css
/* BAD - will conflict with other flows */
@keyframes fadeIn { }
@keyframes glow { }
@keyframes typing { }

/* GOOD - unique per flow */
@keyframes leadMagnetFadeIn { }
@keyframes leadMagnetGlow { }
@keyframes leadMagnetTyping { }

@keyframes upsellFadeIn { }
@keyframes upsellGlow { }
@keyframes upsellTyping { }
```

### Update References

When renaming keyframes, update ALL animation references:

```css
/* Update the animation property */
.lead-magnet-flow .primary-button.glow-button {
  animation: leadMagnetGlow 2s ease-in-out infinite;  /* NOT: glow */
}

.lead-magnet-flow .success-container {
  animation: leadMagnetFadeIn 0.5s ease;  /* NOT: fadeIn */
}
```

---

## 4. Standard Button Styles

### Primary Button
```css
.flow-name .primary-button {
  width: 100%;
  max-width: 320px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  margin: 24px auto 0;
  display: block;
}

.flow-name .primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(251, 191, 36, 0.4);
}

.flow-name .primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

### Secondary Button
```css
.flow-name .secondary-button {
  width: 100%;
  max-width: 320px;
  padding: 14px 28px;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 12px auto 0;
  display: block;
}

.flow-name .secondary-button:hover {
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  background: rgba(255, 255, 255, 0.05);
}
```

### Glow Effect
```css
.flow-name .primary-button.glow-button {
  animation: flowNameGlow 2s ease-in-out infinite;
}

@keyframes flowNameGlow {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  }
  50% {
    box-shadow: 0 4px 24px rgba(251, 191, 36, 0.6);
  }
}
```

---

## 5. Welcome/Time-Check Screen Layout

### Vertical Centering
```css
.flow-name .welcome-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  max-width: 600px;
  text-align: center;
  margin: 0 auto;
  padding-bottom: 40px;
  min-height: calc(100vh - 120px);
}
```

### Text Sizing
```css
.flow-name .welcome-message p {
  font-size: 18px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 16px;
}
```

### Stopwatch Icon
```css
.flow-name .time-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
}
```

---

## 6. Resume Prompt Styling

```css
.flow-name .resume-actions .secondary-button {
  width: 100%;
  max-width: 280px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

---

## 7. Checklist Before Committing CSS Changes

- [ ] All selectors are scoped to the component's root class
- [ ] JSX component has matching wrapper className
- [ ] @keyframes are prefixed with flow/component name
- [ ] All animation references updated to use new keyframe names
- [ ] Button widths use `width: 100%; max-width: 320px;`
- [ ] Text sizes follow standard (18px for welcome messages)
- [ ] Tested that styles don't affect other pages
- [ ] Media queries also use scoped selectors

---

## 8. How to Debug CSS Leaks

If styles are appearing on the wrong page:

1. Open browser DevTools (F12)
2. Inspect the affected element
3. Look at the Styles panel - it shows which CSS file each rule comes from
4. If you see rules from an unexpected CSS file, that file has unscoped selectors

### Common Issues

| Symptom | Likely Cause |
|---------|--------------|
| Button unstyled | Missing `.flow-name .primary-button` base styles |
| Animation not working | @keyframes name not updated in animation property |
| Page completely unstyled | JSX missing wrapper class (e.g., `flow-compass-page`) |
| Styles from wrong component | Unscoped selector (missing parent class prefix) |

---

## 9. File Structure Convention

| File | Root Class | @keyframes Prefix |
|------|------------|-------------------|
| `AttractionOfferFlow.css` | `.attraction-offer-flow` | `attractionOffer*` |
| `UpsellFlow.css` | `.upsell-flow` | `upsell*` |
| `DownsellFlow.css` | `.downsell-flow` | `downsell*` |
| `ContinuityFlow.css` | `.continuity-flow` | `continuity*` |
| `LeadsStrategyFlow.css` | `.leads-strategy-flow` | `leadsStrategy*` |
| `LeadMagnetFlow.css` | `.lead-magnet-flow` | `leadMagnet*` |
| `FlowFinder.css` | `.flow-finder-app` | `flowFinder*` |
| `NervousSystemHealingCompass.css` | `.ns-hc-app` | `nsHc*` |
| `Challenge.css` | `.challenge-container` | `challenge*` |

---

## 10. Adding a New Flow

When creating a new flow component:

1. **Create wrapper class**: Use kebab-case matching the component name
   ```jsx
   <div className="new-flow-name">
   ```

2. **Scope ALL selectors**:
   ```css
   .new-flow-name .primary-button { }
   .new-flow-name .secondary-button { }
   .new-flow-name .welcome-container { }
   ```

3. **Create unique @keyframes**:
   ```css
   @keyframes newFlowNameFadeIn { }
   @keyframes newFlowNameGlow { }
   @keyframes newFlowNameTyping { }
   ```

4. **Copy standard button/layout styles** from an existing flow and update:
   - Parent class prefix
   - @keyframes names
   - Animation references
