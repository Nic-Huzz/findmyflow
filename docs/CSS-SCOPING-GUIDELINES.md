# CSS Scoping Guidelines

## Problem: CSS Class Name Collisions

When multiple components use the same class names (like `.intro-title`, `.intro-text`, `.card`, etc.), styles can "leak" between pages and cause unexpected formatting issues.

### Example of the Bug (December 2024)

**What happened:** The `/archetypes` page had "Explore Your Archetypes" title turn orange and have extra spacing, even though ArchetypeSelection.css defined it as black.

**Root cause:** `PersonaAssessment.css` had unscoped selectors:
```css
/* BAD - applies globally to ANY .intro-title on ANY page */
.intro-title {
  background: linear-gradient(135deg, #ffdd27, #f59e0b, #d97706);
  margin: 0 0 24px;
}
```

**The fix:** Scope selectors to their parent container:
```css
/* GOOD - only applies within .persona-assessment */
.persona-assessment .intro-title {
  background: linear-gradient(135deg, #ffdd27, #f59e0b, #d97706);
  margin: 0 0 24px;
}
```

---

## Best Practices

### 1. Always Scope Component Styles

Every CSS file should scope its selectors to the component's root class:

```css
/* ComponentName.css */

/* Root container */
.component-name {
  /* styles */
}

/* All child elements should be scoped */
.component-name .title { }
.component-name .card { }
.component-name .intro-section { }
```

### 2. Common Class Names to Watch Out For

These generic class names are frequently reused and MUST be scoped:
- `.title`, `.intro-title`, `.page-title`
- `.card`, `.card-header`, `.card-body`
- `.intro-section`, `.intro-text`
- `.header`, `.header-top`
- `.content`, `.container`
- `.button`, `.btn`
- `.loading`

### 3. How to Debug CSS Leaks

If styles are appearing on the wrong page:

1. Open browser DevTools (F12)
2. Inspect the affected element
3. Look at the Styles panel - it shows which CSS file each rule comes from
4. If you see rules from an unexpected CSS file, that file has unscoped selectors

Console commands to help debug:
```javascript
// Check computed styles
getComputedStyle(document.querySelector('.intro-title')).color
getComputedStyle(document.querySelector('.intro-title')).marginBottom

// Measure gaps between elements
const el1 = document.querySelector('.intro-section');
const el2 = document.querySelector('.archetype-cards');
console.log('Gap:', el2.getBoundingClientRect().top - el1.getBoundingClientRect().bottom);
```

### 4. File Naming Convention

Each component should have its own CSS file with matching name:
- `PersonaAssessment.jsx` → `PersonaAssessment.css`
- `ArchetypeSelection.jsx` → `ArchetypeSelection.css`

And the root element should use a kebab-case version:
- `PersonaAssessment.jsx` → `<div className="persona-assessment">`
- `ArchetypeSelection.jsx` → `<div className="archetype-selection-container">`

---

## Checklist Before Committing CSS Changes

- [ ] All selectors are scoped to the component's root class
- [ ] No generic class names used without parent scope
- [ ] Tested that styles don't affect other pages
- [ ] Media queries also use scoped selectors
