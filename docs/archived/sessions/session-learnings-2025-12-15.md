# Session Learnings - December 15, 2025

## Go Back Button Implementation

### Pattern Used
Added consistent "Go Back" navigation across all flows:

```jsx
const BackButton = ({ fromScreen }) => (
  <button
    className="back-button"
    onClick={() => goBack(fromScreen)}
    style={{
      background: 'transparent',
      border: 'none',
      color: 'rgba(255,255,255,0.6)',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '4px 0 2px 0',
      marginTop: '16px',
      marginBottom: '0',
      display: 'block',
      width: '100%',
      textAlign: 'center'
    }}
  >
    ← Go Back
  </button>
)
```

### Button Order
- Continue button first
- Go Back button below with 16px gap

### Files Updated
- FlowFinderSkills.jsx
- FlowFinderProblems.jsx
- AttractionOfferFlow.jsx
- UpsellFlow.jsx
- DownsellFlow.jsx
- ContinuityFlow.jsx
- HealingCompass.jsx
- NervousSystemFlow.jsx

---

## Hint Text & Validation Spacing

### Final Working Values
For the "Aim for 5+" hint text:
```css
marginTop: '-6px'
marginBottom: '-24px'
```

For the validation message ("Please provide at least 3 answers"):
```css
marginTop: '40px'
marginBottom: '-28px'
```

### Key Learning
- Negative margins can pull elements closer together
- Use console debugging to check actual computed distances:
```javascript
const element = document.querySelector('.selector');
const styles = window.getComputedStyle(element);
console.log('marginTop:', styles.marginTop);
```

---

## CSS Transform vs Zoom

### The Problem
`transform: scale()` does NOT reduce layout space - the element visually shrinks but still takes up its original space in the document flow, causing overflow/clipping issues.

### The Solution
Use `zoom` property instead - it actually affects layout dimensions:
```css
.component-snapshot {
  zoom: 0.5; /* Actually reduces layout size */
}
```

### Caveat
`zoom` is non-standard but works in most browsers. For cross-browser compatibility, may need fallbacks.

---

## Onboarding Modal Component Preview

### Issues Encountered
1. Components overflowing container
2. Content getting cut off
3. Fixed heights causing clipping

### Final Working Solution
Desktop:
```css
.component-preview {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}

.component-snapshot {
  pointer-events: none;
  user-select: none;
  zoom: 0.7;
}
```

Mobile (media query):
```css
.component-preview {
  margin: 0 0 16px 0;
}

.component-snapshot {
  zoom: 0.5;
}
```

### Key Learning
Mobile media queries can override desktop styles - always check both when debugging!

---

## Git History for CSS Debugging

When CSS changes aren't working as expected, check previous working versions:
```bash
git log --oneline -20 -- src/File.css
git show <commit>:src/File.css | grep -A 30 "selector"
```

This helped us find the working onboarding modal styles from commit `056573b`.

---

## Console Debugging for Spacing

### Checking Element Distances
```javascript
const el1 = document.querySelector('.element1');
const el2 = document.querySelector('.element2');
const rect1 = el1.getBoundingClientRect();
const rect2 = el2.getBoundingClientRect();
console.log('Gap:', rect2.top - rect1.bottom, 'px');
```

### Checking Computed Styles
```javascript
const el = document.querySelector('.element');
const s = window.getComputedStyle(el);
console.log('marginTop:', s.marginTop);
console.log('marginBottom:', s.marginBottom);
console.log('paddingTop:', s.paddingTop);
console.log('paddingBottom:', s.paddingBottom);
```

---

## Progress Bar Fixed vs Scroll

### Current State
Progress bar uses `position: fixed` which keeps it at the top but can cover content.

### Attempted Fix
Removing `position: fixed` and compensating `padding-top` - needs further investigation.

### Open Issue
The progress bar on Skills/Problems flows still needs work to scroll with content instead of being fixed.

---

## Summary of Files Changed This Session

### JSX Files
- FlowFinderSkills.jsx - Go Back button, hint text, validation
- FlowFinderProblems.jsx - Go Back button, hint text, validation
- AttractionOfferFlow.jsx - Go Back button
- UpsellFlow.jsx - Go Back button
- DownsellFlow.jsx - Go Back button
- ContinuityFlow.jsx - Go Back button
- HealingCompass.jsx - Go Back button
- NervousSystemFlow.jsx - Go Back button
- Profile.jsx - Simplified captureComponentSnapshot

### CSS Files
- Profile.css - Onboarding modal and component preview styling
- FlowFinder.css - (reverted changes, still investigating)
