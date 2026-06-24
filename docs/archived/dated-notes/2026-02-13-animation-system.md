# Premium Animation System & Performance Pass

**Date**: 2026-02-13
**Branch**: `feature/content-review`
**Feel**: Apple-crisp — 200-400ms, ease-out, fast and precise. Pure CSS, zero dependencies.

---

## What Changed

### Phase 1: Core Animation System

Every page now benefits from smooth transitions with no per-page work needed.

**New files:**

| File | Purpose |
|------|---------|
| `src/styles/animation-tokens.css` | CSS custom properties (durations, easings, stagger), `.page-enter`, `.content-enter`, reveal classes, branded spinner, reduced-motion support |
| `src/hooks/useReveal.js` | `useReveal()` + `useRevealAll()` — IntersectionObserver scroll-reveal hooks using callback refs (works with conditional rendering) |
| `src/components/AnimatedOutlet.jsx` | `key={location.key}` wrapper — triggers `.page-enter` animation on every route change |
| `src/lib/preloadRoutes.js` | Preload functions for lazy-loaded route chunks |

**Modified files:**

| File | Change |
|------|--------|
| `src/App.css` | `@import './styles/animation-tokens.css'` (line 1) |
| `src/AppRouter.jsx` | MePage + Challenge lazy-loaded, branded spinner, AnimatedOutlet wrapping Routes, idle preloader |
| `src/components/BottomToolbar.jsx` | Preload-on-hover/touch for all nav targets |
| `src/components/crm/PageTransition.css` | Stagger extended to 12 children + `stagger-children-fast` variant (30ms/200ms) |
| `src/components/crm/CRMLayout.css` | `.crm-layout .page-enter { animation: none }` — prevents double animation |

### Phase 2: Key Page Polish

| Page | Changes |
|------|---------|
| `/me` (MePage) | Branded spinner, `.content-enter` fade-up, `flow-scale-in` avatar pop, `stagger-children` on badges + stats, `useReveal` on journey + quest sections |
| `/7-day-challenge` (Challenge) | `.content-enter` on main container, `stagger-children` on category tabs, `stagger-children-fast` on all quest grids |
| `/crm` (Dashboard) | `.content-enter` on dashboard, `useReveal` on DailyActions + EcosystemStatusWidget |

### Phase 3: Performance

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Initial JS bundle | 1,315 KB (360 KB gzip) | 765 KB (225 KB gzip) | **-42%** |
| MePage chunk | in main bundle | 304 KB lazy (separate) | code-split |
| Challenge chunk | in main bundle | lazy (separate) | code-split |

---

## Animation Tokens Reference

### CSS Custom Properties

```css
--anim-fast: 150ms      /* micro-interactions */
--anim-normal: 250ms    /* content transitions */
--anim-slow: 350ms      /* reveals, emphasis */
--anim-page: 300ms      /* route transitions */

--ease-out: cubic-bezier(0.16, 1, 0.3, 1)        /* Apple decelerate */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)  /* slight overshoot */
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1)

--stagger-base: 50ms
--translate-enter: 12px
--scale-enter: 0.97
```

### Classes

| Class | Usage | Trigger |
|-------|-------|---------|
| `.page-enter` | Auto-applied by AnimatedOutlet on route changes | Automatic |
| `.content-enter` | Add to content div when loading flips to false | On mount |
| `.reveal-fade-up` | Scroll-triggered fade + slide up | `.revealed` added by `useReveal()` |
| `.reveal-scale` | Scroll-triggered scale reveal | `.revealed` added by `useReveal()` |
| `.flow-scale-in` | One-time spring-scale pop | On mount |
| `.stagger-children` | Parent class — children cascade in (50ms intervals) | On mount |
| `.stagger-children-fast` | Dense lists — 30ms intervals, 200ms duration | On mount |
| `.app-loading-spinner` + `.app-spinner-ring` | Branded purple-gold spinner with 200ms fade-in delay | On mount |

### Nested Reveal Handling

When `.reveal-fade-up` or `.reveal-scale` is inside a `.content-enter` parent, opacity is handled by the parent only. The child animates transform only — no double-fade stacking.

### useReveal Hook

```jsx
import { useReveal } from '../hooks/useReveal'

function MyComponent() {
  const sectionRef = useReveal() // defaults: threshold 0.15, once: true

  return (
    <section className="reveal-fade-up" ref={sectionRef}>
      Content fades up when scrolled into view
    </section>
  )
}
```

Uses callback refs internally — works correctly with conditional rendering (loading states, auth gates).

---

## Preloading Strategy

Three layers ensure lazy-loaded pages feel instant:

1. **Idle preload** — `PreloadCoreRoutes` component in AppRouter uses `requestIdleCallback` to preload MePage + Challenge chunks after initial render
2. **Hover/touch preload** — BottomToolbar triggers `import()` on `onMouseEnter` / `onTouchStart` for all nav targets (~200-400ms head start)
3. **Browser cache** — after first load, `import()` returns the cached module instantly

Preload functions live in `src/lib/preloadRoutes.js` to avoid circular dependencies between AppRouter and BottomToolbar.

---

## Reduced Motion

All animations respect `prefers-reduced-motion: reduce`:
- CSS: all durations/delays zeroed, animations set to `none`, transitions disabled
- JS: `useReveal` immediately adds `.revealed` class (no observer, no delay)
- Spinner: rotation slowed but not removed (still indicates loading)

---

## Verification Checklist

- [ ] Route transitions: navigate /me -> /7-day-challenge -> /crm -> /library — each page fades-slides in
- [ ] No double animation on CRM pages
- [ ] Hard refresh a lazy route — branded purple-gold spinner appears (not emoji)
- [ ] Fast navigation (<200ms) shows no spinner flash
- [ ] /me: content fades in after loading, journey + quest sections reveal on scroll
- [ ] /me: avatar pops in with spring scale
- [ ] Challenge: quest cards cascade in with fast stagger
- [ ] Dashboard: stats grid cascades, DailyActions + Ecosystem reveal on scroll
- [ ] Reduced motion: DevTools -> Rendering -> prefers-reduced-motion: reduce — everything instant
- [ ] Mobile Safari: no jank (GPU-accelerated transforms + opacity only)
- [ ] `npm run build` succeeds
