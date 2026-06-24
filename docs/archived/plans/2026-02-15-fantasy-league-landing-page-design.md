# Fantasy League Landing Page — Design Doc

**Date**: 2026-02-15
**Route**: `/fantasy` (public, no AuthGate)
**Approach**: Single-file page component (Approach 1)
**Spec**: `docs/clawdbot/league-lp.md`

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Route | `/fantasy` | `/league` stays as in-app dashboard |
| Auth | Public (no AuthGate) | Marketing page — anyone can view |
| CTA target | `/try/earthquake` | Existing public Earthquake Quiz route |
| Images | Styled placeholders | Labeled boxes matching spec descriptions, easy to swap |
| Animations | Full spec | Scroll reveals, CSS particle hero, count-up scorecard, pulsing CTA |
| Architecture | Single file + CSS | Matches existing `LandingPage.jsx` pattern |

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/FantasyLeagueLanding.jsx` | Page component (~450 lines JSX) |
| `src/pages/FantasyLeagueLanding.css` | Scoped styles (~900 lines CSS) |

## Files to Modify

| File | Change |
|------|--------|
| `src/AppRouter.jsx` | Add lazy import + public route for `/fantasy`; add `/fantasy` to ConditionalBottomToolbar + ConditionalZarlo exclusion lists |

## Architecture

### Component Structure

One `FantasyLeagueLanding` component containing 12 sections in order:

1. **Header** — Fixed, transparent→solid on scroll. Logo + "Log in" button (same pattern as LandingPage)
2. **Hero** — "Season 1." large gold text, stats line, CTA, scarcity line. CSS-only particle grid background
3. **Problem** — "You've done the courses..." fade-in-on-scroll lines. White/cream background
4. **Reframe** — Gym/AA/CrossFit accountability argument. "They work because you can't hide." hero text
5. **League Intro** — 5 category cards in horizontal scroll (mobile) / grid (desktop). Each card: icon, name, description, example
6. **How It Works** — 4-step vertical timeline. Step text + image placeholder alternating sides (desktop), stacked (mobile)
7. **Scoring** — Transparent scoring explanation + animated scorecard mock (count-up numbers on scroll)
8. **Who This Is For** — Two-column "For you" (green checks) / "Not for you" (red crosses)
9. **Huzz's Story** — First-person origin story. Warm background. Photo placeholder
10. **Details** — Season 1 stats grid (duration, players, cost, etc.) + 4-week timeline graphic
11. **FAQ** — Expandable accordion (7 questions from spec, same pattern as LandingPage)
12. **Final CTA** — Mirrors hero with fuller context. Pulsing gold button. Trust badge
13. **Footer** — Minimal: logo, links, tagline

### State

Minimal React state:
- `expandedFaq: number | null` — which FAQ is open
- `headerSolid: boolean` — scroll-triggered header background
- `stickyCtaVisible: boolean` — show sticky mobile CTA after hero scrolls out

All three derived from scroll position via a single `useEffect` with `IntersectionObserver` (hero sentinel) and `scroll` listener (header).

### Animations

| Element | Technique | Trigger |
|---------|-----------|---------|
| Each section | `reveal-fade-up` + `useRevealAll` | Scroll into viewport |
| Hero particle grid | CSS-only: `::before` pseudo with radial gradient dots + subtle drift animation | On mount |
| Problem lines | Staggered `reveal-fade-up` children | Scroll |
| Category cards | `reveal-scale` with stagger | Scroll |
| Scorecard numbers | `useEffect` count-up animation on IntersectionObserver trigger | Scroll into view |
| CTA buttons | `@keyframes subtlePulse` (from LandingPage.css) | Continuous |
| Sticky mobile CTA | CSS transform slide-up | Hero exits viewport |
| FAQ accordion | CSS `max-height` transition | Click |
| Header | Background opacity transition | Scroll > 50px |

### Color System

From the spec, mapped to CSS custom properties scoped to `.fantasy-lp`:

```css
--flp-purple: #5e17eb;
--flp-gold: #ffdd27;
--flp-gold-dark: #E9A23B;
--flp-cream: #faf8f5;
--flp-dark: #0a0118;

/* Category accent colors (from leagueConfig.js) */
--flp-cat-business: #5e17eb;
--flp-cat-play: #E9A23B;
--flp-cat-healing: #10b981;
--flp-cat-voice: #8B5CF6;
--flp-cat-content: #3B82F6;
```

### Section Backgrounds (Alternating)

| Section | Background |
|---------|------------|
| Header | Transparent → `rgba(10,1,24,0.95)` on scroll |
| Hero | Dark purple-black gradient + particle overlay |
| Problem | White/cream (`--flp-cream`) |
| Reframe | Dark (`--flp-dark`) |
| League Intro | Dark (`--flp-dark`) |
| How It Works | Cream (`--flp-cream`) |
| Scoring | Dark (`--flp-dark`) |
| Who This Is For | Cream (`--flp-cream`) |
| Huzz's Story | Warm gradient (distinct from other sections) |
| Details | Dark (`--flp-dark`) |
| FAQ | Cream (`--flp-cream`) |
| Final CTA | Dark with glow |
| Footer | Dark |

### Image Placeholders

Styled `<div>` blocks with:
- Dashed border (`rgba(255,255,255,0.2)` on dark, `rgba(0,0,0,0.1)` on light)
- Spec description as label text (small, muted)
- Aspect ratio maintained via `aspect-ratio` CSS
- Background: subtle gradient matching section theme

### Sticky Mobile CTA

Below 768px, after the hero scrolls out of view:
- Fixed bar at bottom with "Apply for Season 1" gold button
- 60px height, backdrop-blur, slides up on appear
- Disappears when footer is in view (IntersectionObserver)

### Responsive Breakpoints

| Breakpoint | Changes |
|------------|---------|
| > 1024px | Full desktop: 2-col layouts, 5-col category grid, alternating image/text |
| 768-1024px | Tablet: 3-col category grid, stacked timeline |
| < 768px | Mobile: single column, horizontal swipe categories, sticky CTA, stacked everything |

### CSS Scoping

All styles scoped to `.fantasy-lp` to prevent conflicts:
```css
.fantasy-lp .hero-section { ... }
.fantasy-lp .problem-section { ... }
```

### Routing Integration

```jsx
// AppRouter.jsx additions:
const FantasyLeagueLanding = lazyRetry(() => import('./pages/FantasyLeagueLanding'))

// In Routes (public, no AuthGate):
<Route path="/fantasy" element={<FantasyLeagueLanding />} />

// In ConditionalBottomToolbar + ConditionalZarlo:
// Add location.pathname === '/fantasy' to exclusion checks
```

### Accessibility

- Semantic HTML: `<header>`, `<section>`, `<main>`, `<footer>`
- FAQ uses `<button>` + `aria-expanded` + `aria-controls`
- All image placeholders have descriptive `aria-label`
- Color contrast: white on dark purple passes WCAG AA, dark text on cream passes AA
- Reduced motion: respects existing `prefers-reduced-motion` via animation-tokens.css
- Skip-to-content link for keyboard users
- CTA buttons are `<a>` tags wrapping to `/try/earthquake` (not `onClick` navigation) for accessibility + SEO

### Performance

- Lazy-loaded via `lazyRetry()` (marketing page, not on critical path)
- No external dependencies (pure CSS animations, no GSAP/Framer)
- CSS-only particle effect (no canvas, no JS animation loop)
- Image placeholders are lightweight divs (swap to `<img loading="lazy">` when real assets arrive)
- Single scroll listener debounced for header; IntersectionObserver for everything else
