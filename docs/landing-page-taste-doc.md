# FindMyFlow Landing Page Taste Doc
### Design System & Style Reference

---

## Overview

Light, editorial minimalism adapted from the Greenhouse design system with FindMyFlow's purple-to-gold brand gradient. Clean and confident — lets the copy breathe. Premium without being flashy.

**Vibe in three words:** Clean. Confident. Warm.

**Reference implementation:** `src/pages/FantasyLeagueLanding.jsx` + `.css`

---

## Copy-Paste CSS Token Block

Drop this at the top of any new landing page CSS file. Scope everything to a unique root class (e.g., `.hlp` for Healing, `.wlp` for Workshop).

```css
@import url('https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&family=Inter:wght@300;400;500;600;700;800&display=swap');

.prefix {
  /* Core */
  --black: #000000;
  --dark: #1a1a1a;
  --white: #ffffff;
  --off-white: #fafafa;
  --warm-gray: #f5f4f0;

  /* Text hierarchy */
  --text: #1a1a1a;
  --text-2: #6b6b6b;
  --text-3: #999999;

  /* Borders */
  --border: #e5e5e5;
  --border-light: #eeeeee;

  /* Brand */
  --purple: #5e17eb;
  --purple-light: #ede9fc;
  --purple-dark: #4a11c0;
  --gold: #E9A23B;
  --gold-light: #fef6e8;

  /* Motion */
  --spring: cubic-bezier(0.16, 1, 0.3, 1);

  /* Base */
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text);
  line-height: 1.6;
  overflow-x: hidden;
  background: var(--white);
}

.prefix *, .prefix *::before, .prefix *::after {
  box-sizing: border-box;
}
```

---

## Color Palette

### Core

| Token | Hex | Usage |
|-------|-----|-------|
| `--black` | `#000000` | Headlines, primary text |
| `--dark` | `#1a1a1a` | Body text |
| `--white` | `#ffffff` | Primary background |
| `--off-white` | `#fafafa` | Hover states |
| `--warm-gray` | `#f5f4f0` | Warm section backgrounds |

### Text Hierarchy

| Token | Hex | Usage |
|-------|-----|-------|
| `--text` | `#1a1a1a` | Primary body text, bold emphasis lines |
| `--text-2` | `#6b6b6b` | Descriptions, supporting copy, card body text |
| `--text-3` | `#999999` | Labels, meta text, muted copy, losing scores |

### Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `--border` | `#e5e5e5` | Card borders, input borders, scorecard |
| `--border-light` | `#eeeeee` | Section dividers, subtle row separators, timeline bars |

### Brand — Purple to Gold

| Token | Hex | Usage |
|-------|-----|-------|
| `--purple` | `#5e17eb` | Primary accent, gradient start, focus rings, winning scores |
| `--purple-light` | `#ede9fc` | Badges, active radio states, icon backgrounds |
| `--purple-dark` | `#4a11c0` | Section labels, emphasis text, result highlights, timeline finals |
| `--gold` | `#E9A23B` | Gradient endpoint, secondary accent |
| `--gold-light` | `#fef6e8` | Warm gradient backgrounds (mixed with purple-light) |

### Brand Gradients

```css
/* Primary gradient — CTA buttons, step numbers, logo dot, checkbox active */
background: linear-gradient(135deg, #5e17eb 0%, #E9A23B 100%);

/* Gradient text — hero accent word, blockquote mark */
background: linear-gradient(135deg, var(--purple) 0%, var(--gold) 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;

/* Warm section background — alternating sections */
background: linear-gradient(180deg, var(--white) 0%, var(--warm-gray) 100%);

/* Results/highlight card — origin story results */
background: linear-gradient(135deg, #f5f0ff 0%, var(--gold-light) 100%);

/* Scorecard result bar / subtle highlight */
background: linear-gradient(135deg, var(--purple-light), var(--gold-light));

/* Hero background glow (centered, subtle) */
background: radial-gradient(
  circle,
  rgba(94, 23, 235, 0.045) 0%,
  rgba(233, 162, 59, 0.015) 40%,
  transparent 65%
);

/* Blockquote border — gradient left border */
border-left: 3px solid;
border-image: linear-gradient(to bottom, var(--purple), var(--gold)) 1;

/* Timeline finals bar */
background: linear-gradient(135deg, var(--purple), var(--gold));
```

### Section Backgrounds (Alternating Pattern)

Alternate between these to create rhythm:

| Pattern | CSS | When to use |
|---------|-----|-------------|
| White | `background: var(--white)` | Default, hero, steps, sneak peek |
| Warm gradient | `background: linear-gradient(180deg, var(--white), var(--warm-gray))` | Categories, sign-up form, ask section |
| Bordered | `background: var(--white); border-top/bottom: 1px solid var(--border-light)` | Origin story, narrative sections |
| Dark | `background: var(--black); color: var(--white)` | Footer only |

---

## Typography

### Font Stack

```css
/* Primary — all body text, headings, UI, form inputs */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Accent — labels, meta, logo, badges, scorecard teams, timeline weeks, footer */
font-family: 'Inconsolata', monospace;
```

Google Fonts import:
```
Inter: 300, 400, 500, 600, 700, 800
Inconsolata: 400, 700
```

### Type Scale

| Element | Size | Weight | Tracking | Line-height | Font |
|---------|------|--------|----------|-------------|------|
| Hero h1 | `clamp(2.5rem, 6vw, 4.5rem)` | 800 | -0.035em | 1.08 | Inter |
| Section h2 | `clamp(1.75rem, 4vw, 3rem)` | 700 | -0.025em | default | Inter |
| Hero subtitle | 1.25rem | 300 | — | 1.7 | Inter |
| Section subtitle | 1.1rem | 300 | — | 1.7 | Inter |
| Card titles | 1.1rem | 700 | — | 1.3 | Inter |
| Body / card desc | 0.95rem | 300 | — | 1.65 | Inter |
| Detail stat values | 1.05rem | 700 | — | 1.35 | Inter |
| Origin story lines | `clamp(1.0625rem, 2vw, 1.1875rem)` | 300 | — | 1.75 | Inter |
| Blockquote text | `clamp(1.25rem, 2.5vw, 1.5rem)` | 400 | -0.015em | 1.5 | Inter |
| Section label | 0.75rem | 700 | 0.2em | default | Inconsolata |
| Eyebrow | 0.85rem | 400 | 0.15em | default | Inconsolata |
| Badge | 0.8rem | 700 | 0.05em | default | Inconsolata |
| Scorecard teams | 0.8rem | 700 | 0.1em | default | Inconsolata |
| Detail labels | 0.7rem | 700 | 0.2em | default | Inconsolata |
| Footer | 0.8rem | 400 | — | default | Inconsolata |

### Text Rendering

```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
line-height: 1.6; /* base */
```

### Key Typography Patterns

- **Section labels**: Inconsolata uppercase, wide tracking (0.2em), `--purple-dark`, preceded by 16px × 2px purple line `::before`. Centered by default, `flex-start` for narrative sections.
- **Headlines**: Inter 700–800, tight negative tracking (-0.025 to -0.035em), `--black`
- **Descriptions**: Inter 300 (light weight), `--text-2`, generous line-height (1.65–1.7), `max-width` constrained
- **Bold emphasis**: Inter 600, `--text` color (within lighter 300-weight paragraphs)
- **Muted/italic**: `--text-3`, `font-style: italic`, for emotional subtext
- **Gradient text**: `-webkit-background-clip: text` with purple→gold. **Reserve for ONE hero accent word only.**

---

## Vertical Rhythm (Inner Section Spacing)

This is the exact margin sequence inside every section. Get this wrong and the page feels off.

```
Section label:    margin: 0 0 1.25rem
Section h2:       margin: 0 0 0.75rem
Section subtitle: margin: 0 auto 3rem    (max-width: 580px, centered)
Content grid:     margin: 0 auto          (or margin-top for specific offsets)
```

### Hero Rhythm

```
Eyebrow:    margin: 0 0 2rem
H1:         margin: 0 0 2rem
Subtitle:   margin: 0 auto 2rem   (max-width: 540px)
Badges:     margin: 0 0 2.5rem
CTA:        no margin (last element)
```

### Card Inner Rhythm

```
Icon/Emoji: margin-bottom: 0.875rem–1rem
Title:      margin: 0 0 0.375rem–0.625rem
Description: margin: 0
```

### Origin Story Rhythm

```
Label:              margin: 0 0 1.25rem
Story paragraphs:   margin: 0 0 0.5rem     (spaced lines)
Story block:        margin-bottom: 2.5rem
Turn block:         margin-bottom: 3rem
Results card:       margin: 1.25rem 0 0     (within turn)
Blockquote:         margin: 0 0 2.5rem
Closing line:       margin: 0
```

---

## Shadow Scale

| Level | Value | Usage |
|-------|-------|-------|
| Rest | None | Cards, inputs at rest (border only, no shadow) |
| Subtle | `0 4px 24px rgba(0, 0, 0, 0.04)` | Scorecard, success card, image preview |
| Hover | `0 12px 40px rgba(0, 0, 0, 0.06)` | Card hover state |
| CTA rest | `0 4px 20px rgba(94, 23, 235, 0.25)` | Purple-tinted button shadow |
| CTA hover | `0 8px 32px rgba(94, 23, 235, 0.35)` | Intensified on hover |
| Image | `0 20px 60px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.06)` | Phone mockup / hero image |
| Nav scroll | `0 1px 20px rgba(0, 0, 0, 0.04)` | Fixed nav after scroll |
| Focus ring | `0 0 0 3px rgba(94, 23, 235, 0.1)` | Input focus |

---

## Layout

### Container

```css
max-width: 1100px;
margin: 0 auto;
padding: 0 3rem;

@media (max-width: 768px) { padding: 0 1.5rem; }
```

### Section Spacing

| Section type | Desktop | Mobile |
|-------------|---------|--------|
| Standard | `padding: 7rem 0` | `padding: 5rem 0` |
| Hero | `padding: 10rem 0 6rem` | `padding: 8rem 0 4rem` |

### Grid Patterns

| Pattern | Columns | Gap | Max-width | Usage |
|---------|---------|-----|-----------|-------|
| 3-column | `repeat(3, 1fr)` | 2rem | 960px | Sell points, steps, ask cards |
| 5-column | `repeat(5, 1fr)` | 1.25rem | none | Category cards |
| 4-column | `repeat(4, 1fr)` | 1.25rem | 800px | Detail stats, timeline |
| Narrow centered | single column | — | 640px | Origin story, narrative |
| Form centered | single column | — | 480px | Sign-up forms |
| Scorecard | `1fr auto 1fr` | — | 640px | VS comparison data |

### Mobile Collapse Rules

| Desktop | Mobile (< 768px) |
|---------|-------------------|
| 3-col grid | 1-col stack |
| 5-col grid | Horizontal scroll (see below) |
| 4-col grid | 2-col grid |
| Narrow (640px) | Full-width |
| Form (480px) | Full-width |

### Mobile Horizontal Scroll Pattern

For category-style cards that should swipe on mobile:

```css
@media (max-width: 768px) {
  .prefix-grid {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 1rem;
    padding-bottom: 1rem;
    margin: 0 -1.5rem;           /* Bleed to screen edge */
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .prefix-card {
    min-width: 220px;
    flex-shrink: 0;
    scroll-snap-align: start;
  }
}
```

### CSS Scoping

**All styles must be scoped** to a unique root class to prevent conflicts with the app:

```css
.flp .flp-hero { ... }    /* Fantasy League Landing Page */
.hlp .hlp-hero { ... }    /* Healing Compass Landing Page */
```

Pattern: `.{prefix} .{prefix}-{element}`

---

## Section Type Catalog

These are the 8 reusable section patterns. Mix and match for any new landing page.

### 1. Hero Section

**When:** Always first. Above the fold.
**Background:** White with subtle radial glow behind content.
**Animation:** CSS `@keyframes` (not IntersectionObserver) to prevent flash.
**Elements:** Eyebrow → H1 (with gradient accent) → Subtitle → Badges → CTA

```jsx
<section className="prefix-hero" ref={heroRef}>
  <div className="prefix-hero-glow" aria-hidden="true" />
  <div className="prefix-container prefix-hero-inner">
    <p className="prefix-eyebrow">EYEBROW TEXT</p>
    <h1 className="prefix-h1">
      Main Headline<br />
      <span className="prefix-h1-accent">Gradient Word.</span>
    </h1>
    <p className="prefix-hero-sub">One-sentence supporting line.</p>
    <div className="prefix-hero-badges">
      <span className="prefix-badge">Badge Text</span>
    </div>
    <button className="prefix-cta" onClick={scrollToSignup}>
      CTA Text &rarr;
    </button>
  </div>
</section>
```

### 2. Content Grid Section (3-column sells / ask)

**When:** Explaining 3 key benefits, features, or asks.
**Background:** White or warm gradient.
**Layout:** Label → H2 → Subtitle → 3-col grid of icon + title + description.

```jsx
<section className="prefix-section">
  <div className="prefix-container">
    <p className="prefix-label reveal-fade-up">LABEL</p>
    <h2 className="prefix-h2 reveal-fade-up">Headline.</h2>
    <p className="prefix-sub reveal-fade-up">Subtitle.</p>
    <div className="prefix-grid-3">
      {items.map((item, i) => (
        <div key={i} className="prefix-card reveal-fade-up" style={{ transitionDelay: `${i * 100}ms` }}>
          <div className="prefix-card-icon">{item.emoji}</div>
          <h3 className="prefix-card-title">{item.title}</h3>
          <p className="prefix-card-desc">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

### 3. Narrative Section (Origin Story)

**When:** Personal story, founder story, "what makes this different."
**Background:** White with border-top/bottom dividers.
**Layout:** Narrow (640px), left-aligned label, staggered paragraph reveals.
**Special elements:** Bold emphasis lines, muted italic lines, results card, blockquote.

```jsx
<section className="prefix-origin">
  <div className="prefix-container prefix-origin-inner">
    <div className="prefix-origin-text">
      <p className="prefix-label prefix-label--left reveal-fade-up">LABEL</p>
      <p className="prefix-origin-line reveal-fade-up">Regular line.</p>
      <p className="prefix-origin-line prefix-origin-bold reveal-fade-up">Bold emphasis line.</p>
      <p className="prefix-origin-line prefix-origin-muted reveal-fade-up">Muted italic line.</p>
    </div>
    <div className="prefix-origin-turn">
      <p className="prefix-origin-line reveal-fade-up">Transition line.</p>
      <div className="prefix-origin-results reveal-fade-up">
        <p><strong>Metric:</strong> result.</p>
      </div>
    </div>
    <blockquote className="prefix-origin-quote reveal-scale">
      <div className="prefix-quote-mark" aria-hidden="true">&ldquo;</div>
      <p>Quote text.</p>
    </blockquote>
    <p className="prefix-origin-close reveal-fade-up">Closing insight.</p>
  </div>
</section>
```

### 4. Category Grid Section (5-column with accent bars)

**When:** Showing 4–6 categories/features with icons.
**Background:** Warm gradient.
**Layout:** 5-col (desktop) → 3-col (tablet) → horizontal scroll (mobile).
**Special:** Each card has a `--cat-accent` custom property for the hover bar color.

### 5. Scorecard Section

**When:** Showing a comparison, VS matchup, or scoring example.
**Background:** Inherits from parent section.
**Layout:** Centered (640px), `1fr auto 1fr` grid per row.
**Special:** Winning scores get `--purple` + weight 800. Result bar gets gradient background.

### 6. Details + Timeline Section

**When:** Showing key stats/facts + a progression timeline.
**Background:** White.
**Layout:** 4-col stat cards (top) + 4-col timeline (bottom, separated by border-top).
**Special:** Timeline has colored bars above each item. Final item gets gradient bar + purple-dark text.

### 7. Form Section

**When:** Sign-up, contact, or capture form.
**Background:** Warm gradient.
**Layout:** Centered (480px).
**Elements:** Text inputs, radio card options, CTA button.
**Special:** Radio options are full-width cards (not traditional radio buttons). Active state uses purple-light bg.

### 8. Image Showcase Section

**When:** App preview, screenshot, mockup.
**Background:** White.
**Layout:** Centered image (320px max) with large border-radius and dramatic shadow.

---

## Components

### CTA Button

```css
display: inline-flex;
align-items: center;
justify-content: center;
padding: 1.125rem 2.75rem;
border-radius: 10px;
font-family: inherit;
font-size: 1.1rem;
font-weight: 600;
letter-spacing: -0.01em;
border: none;
cursor: pointer;
color: var(--white);
background: linear-gradient(135deg, var(--purple), var(--gold));
box-shadow: 0 4px 20px rgba(94, 23, 235, 0.25);
transition: all 0.3s var(--spring);

/* Hover */
transform: translateY(-2px);
box-shadow: 0 8px 32px rgba(94, 23, 235, 0.35);

/* Active */
transform: translateY(0);

/* Full-width form variant */
width: 100%;
padding: 1.125rem;
margin-top: 0.5rem;

/* Disabled */
opacity: 0.6;
cursor: not-allowed;
```

### Secondary Button (Nav)

```css
background: none;
border: 1px solid var(--border);
color: var(--text);
padding: 0.5rem 1.25rem;
border-radius: 8px;
font-size: 0.875rem;
font-weight: 600;
transition: all 0.3s var(--spring);

/* Hover */
border-color: var(--black);
transform: translateY(-1px);
```

### Cards (Standard)

```css
border: 1px solid var(--border);
border-radius: 14px;              /* 16px for step cards */
padding: 1.75rem 1.25rem;         /* 2.25rem 2rem for step cards */
text-align: center;               /* left-aligned for step cards */
transition: all 0.4s var(--spring);

/* Hover */
transform: translateY(-3px);      /* -4px for category cards */
box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
border-color: rgba(94, 23, 235, 0.15);
```

### Cards with Accent Bar (Category cards)

```css
position: relative;
overflow: hidden;

&::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--cat-accent, var(--purple));  /* Set via inline style */
  opacity: 0;
  transition: opacity 0.4s var(--spring);
}

&:hover::before { opacity: 1; }
```

### Icon Boxes (Emoji containers)

```css
width: 48px;
height: 48px;
margin: 0 auto 0.875rem;
display: flex;
align-items: center;
justify-content: center;
font-size: 1.5rem;
border-radius: 12px;
background: linear-gradient(135deg, var(--purple-light), #f0eaff);
```

### Section Label

```css
font-family: 'Inconsolata', monospace;
font-size: 0.75rem;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.2em;
color: var(--purple-dark);
display: flex;
align-items: center;
justify-content: center;           /* flex-start for narrative sections */
gap: 0.75rem;
margin: 0 0 1.25rem;

&::before {
  content: '';
  width: 16px;
  height: 2px;
  background: var(--purple);
}
```

### Badge (Pill)

```css
font-family: 'Inconsolata', monospace;
font-size: 0.8rem;
font-weight: 700;
letter-spacing: 0.05em;
color: var(--purple-dark);
background: var(--purple-light);
padding: 0.4rem 1rem;
border-radius: 100px;
```

### Form Input

```css
width: 100%;
padding: 1rem 1.25rem;
background: var(--white);
border: 1px solid var(--border);
border-radius: 10px;
color: var(--text);
font-family: 'Inter', sans-serif;
font-size: 1rem;
font-weight: 400;
transition: all 0.3s var(--spring);
outline: none;

&::placeholder { color: var(--text-3); }

&:focus {
  border-color: var(--purple);
  box-shadow: 0 0 0 3px rgba(94, 23, 235, 0.1);
}
```

### Radio Card Options

```css
display: flex;
align-items: center;
gap: 0.75rem;
padding: 0.875rem 1.25rem;
background: var(--white);
border: 1px solid var(--border);
border-radius: 10px;
cursor: pointer;
font-size: 0.95rem;
color: var(--text-2);
transition: all 0.3s var(--spring);
user-select: none;

/* Hover */
border-color: rgba(94, 23, 235, 0.3);

/* Active/Selected */
border-color: var(--purple);
background: var(--purple-light);
color: var(--purple-dark);
font-weight: 600;

/* Hidden native input */
input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0; height: 0;
  pointer-events: none;
}
```

### Results Card (Origin story highlight)

```css
padding: 1.5rem 2rem;
background: linear-gradient(135deg, #f5f0ff 0%, var(--gold-light) 100%);
border-radius: 12px;

p { font-size: 1.0625rem; font-weight: 300; color: var(--text); margin: 0 0 0.375rem; }
strong { font-weight: 700; color: var(--purple-dark); }
```

### Blockquote (Gradient border)

```css
padding: 2.5rem 2rem;
margin: 0 0 2.5rem;
border-left: 3px solid;
border-image: linear-gradient(to bottom, var(--purple), var(--gold)) 1;
text-align: left;

/* Gradient quote mark */
.quote-mark {
  font-size: 3rem;
  font-weight: 800;
  line-height: 0.8;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--purple), var(--gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p { font-size: clamp(1.25rem, 2.5vw, 1.5rem); font-weight: 400; line-height: 1.5; }
```

### Nav (Glass morphism)

```css
position: fixed;
top: 0; left: 0; right: 0;
z-index: 100;
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
border-bottom: 1px solid transparent;
height: 64px;
transition: all 0.3s ease;

/* On scroll (>80px) */
background: rgba(255, 255, 255, 0.95);
border-bottom-color: rgba(0, 0, 0, 0.06);
box-shadow: 0 1px 20px rgba(0, 0, 0, 0.04);
```

Logo: Inconsolata 700 + 8px gradient dot.

### Image Preview Frame

```css
max-width: 320px;
margin: 0 auto;
border-radius: 24px;
overflow: hidden;
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.06);
border: 1px solid var(--border-light);

img { display: block; width: 100%; height: auto; }
```

### Footer

```css
padding: 2.5rem 0;
background: var(--black);
border-top: 1px solid rgba(255, 255, 255, 0.05);
text-align: center;
/* Add padding-bottom: 5rem on mobile for sticky CTA clearance */

.footer-text {
  font-family: 'Inconsolata', monospace;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.3);
}
```

---

## Animation System

### Easing

```css
--spring: cubic-bezier(0.16, 1, 0.3, 1);  /* Use everywhere */
```

### Hero Entrance (CSS Keyframes — prevents flash)

Above-the-fold content must use `@keyframes` with `animation-fill-mode: both`, NOT IntersectionObserver (which fires async and causes a flash of unstyled content):

```css
@keyframes prefixFadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

.prefix-hero .prefix-eyebrow,
.prefix-hero .prefix-h1,
.prefix-hero .prefix-hero-sub,
.prefix-hero .prefix-hero-badges,
.prefix-hero .prefix-cta {
  animation: prefixFadeUp 0.9s var(--spring) both;
}

/* Stagger delays: 0s, 0.08s, 0.16s, 0.24s, 0.32s */
```

### Scroll Reveals (Below fold)

Uses `useRevealAll` hook from `src/hooks/useReveal.js`. Adds `.revealed` class via IntersectionObserver.

```css
.prefix .reveal-fade-up {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.9s var(--spring), transform 0.9s var(--spring);
}
.prefix .reveal-fade-up.revealed {
  opacity: 1;
  transform: translateY(0);
}

.prefix .reveal-scale {
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.8s var(--spring), transform 0.8s var(--spring);
}
.prefix .reveal-scale.revealed {
  opacity: 1;
  transform: scale(1);
}
```

### Stagger Delays

Applied via inline `style={{ transitionDelay }}`:

| Use case | Increment |
|----------|-----------|
| Category cards | 70ms per card |
| Step cards, sell cards, ask cards | 100ms per card |
| Detail stat cards | 80ms per card |

### Hover Transitions

| Element | Duration | Lift | Shadow |
|---------|----------|------|--------|
| Cards | 0.4s var(--spring) | 3–4px | `0 12px 40px rgba(0,0,0,0.06)` |
| Buttons | 0.3s var(--spring) | 1–2px | Intensified existing shadow |
| Inputs | 0.3s var(--spring) | none | Focus ring appears |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .prefix-hero [animated elements] { animation: none; }
  .prefix .reveal-fade-up,
  .prefix .reveal-scale {
    transition: none;
    opacity: 1;
    transform: none;
  }
}
```

---

## Sticky Mobile CTA

Below 768px, appears when hero scrolls out of view:

```css
display: block;           /* hidden by default on desktop */
position: fixed;
bottom: 0;
left: 0; right: 0;
z-index: 90;
padding: 0.75rem 1rem;
padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border-top: 1px solid rgba(0, 0, 0, 0.06);
transform: translateY(100%);          /* Hidden */
transition: transform 0.4s var(--spring);

/* Visible state */
&--show { transform: translateY(0); }
```

Controlled by IntersectionObserver on the hero ref element.

---

## Responsive Breakpoints

| Breakpoint | Changes |
|------------|---------|
| > 1024px | Full desktop: 5-col categories, 4-col details, 3-col steps/sells |
| 768–1024px | Tablet: 3-col categories, everything else same |
| < 768px | Mobile: horizontal swipe categories, 2-col details, 1-col steps/sells/asks, sticky CTA, full-width forms, reduced section padding (5rem), container padding (1.5rem), hero line-break hidden |
| < 480px | Small: tighter badge spacing/size |
| < 400px | Tiny: 2-col detail grid with smaller text |

---

## Copy Tone Guide

The copy style is punchy, direct, and warm. Never corporate. Never long.

### Headlines (H2)

- **Length:** 3–7 words
- **Tone:** Declarative, confident. Period at the end.
- **Examples:** "Making accountability fun." / "Win 3 to take the week." / "Grab your spot."
- **Never:** Questions, exclamation marks, or "We help you..."

### Subtitles

- **Length:** One sentence, max two.
- **Tone:** Conversational, explains the headline. Light (300 weight).
- **Examples:** "You want to do these things anyway. This just makes it more fun."
- **Never:** Repeating the headline in different words.

### Card Titles

- **Length:** 3–8 words
- **Tone:** Benefit-focused, active voice.
- **Examples:** "Score points for what you're already doing" / "Be on a team with friends"

### Card Descriptions

- **Length:** One sentence.
- **Tone:** Specific, punchy. Adds detail the title didn't.
- **Examples:** "When they're counting on you, procrastinating stops working."

### Section Labels

- **Length:** 1–3 words, uppercase
- **Tone:** Factual category marker.
- **Examples:** "WHY IT WORKS" / "5 CATEGORIES" / "THE ASK"

---

## React Patterns

### State (minimal)

```javascript
const [headerSolid, setHeaderSolid] = useState(false)    // scroll > 80px
const [stickyVisible, setStickyVisible] = useState(false) // hero out of viewport
const [formData, setFormData] = useState({})               // form fields
const [submitted, setSubmitted] = useState(false)
const [submitting, setSubmitting] = useState(false)
```

### Scroll Detection

```javascript
// Header solid state
useEffect(() => {
  const onScroll = () => setHeaderSolid(window.scrollY > 80)
  window.addEventListener('scroll', onScroll, { passive: true })
  return () => window.removeEventListener('scroll', onScroll)
}, [])

// Sticky CTA visibility
useEffect(() => {
  const el = heroRef.current
  if (!el) return
  const obs = new IntersectionObserver(
    ([e]) => setStickyVisible(!e.isIntersecting),
    { threshold: 0 }
  )
  obs.observe(el)
  return () => obs.disconnect()
}, [])
```

### Smooth Scroll to Section

```javascript
const scrollToSignup = () => {
  document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })
}
// Target section needs: scroll-margin-top: 80px (nav clearance)
```

### Form Submission (Supabase)

```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  setSubmitting(true)
  try {
    const { error } = await supabase.from('table').upsert(
      { ...formData },
      { onConflict: 'unique_field' }
    )
    if (error) console.warn('Save failed:', error)
  } catch (err) {
    console.warn('Error:', err)
  }
  setSubmitted(true)
  setSubmitting(false)
}
```

### Routing

```jsx
// Lazy import in AppRouter.jsx
const Page = lazyRetry(() => import('./pages/Page'))

// Public route (no AuthGate)
<Route path="/page" element={<Page />} />

// Add to ConditionalBottomToolbar + ConditionalZarlo exclusion lists
```

---

## Accessibility Checklist

- [ ] Semantic HTML: `<header>`, `<section>`, `<footer>`, `<form>`, `<fieldset>`, `<legend>`
- [ ] Decorative elements: `aria-hidden="true"` on glows, quote marks, dots
- [ ] Hidden radio/checkbox inputs: visually hidden but still focusable
- [ ] Image alt text: descriptive of content, not "screenshot"
- [ ] Color contrast: white on purple gradient passes WCAG AA
- [ ] Reduced motion: `prefers-reduced-motion` disables all animations
- [ ] `env(safe-area-inset-bottom)` on sticky CTA for notched phones
- [ ] `scroll-margin-top: 80px` on scroll targets (nav clearance)
- [ ] `loading="lazy"` on below-fold images

---

## Do's and Don'ts

### Do
- Use generous whitespace — `7rem` section padding, constrained `max-width`
- Keep body text light (300 weight) for elegance
- Use the purple→gold gradient sparingly — CTAs, one hero accent, step numbers, blockquote border
- Animate elements on scroll reveal (staggered, never all at once)
- Use Inconsolata for anything "systematic" (labels, badges, meta, nav, scorecard, footer)
- Let hover states add delight (lift + shadow + border color shift)
- Alternate white / warm-gray backgrounds between sections
- Scope ALL CSS to a root class to prevent conflicts with the app
- Use `@keyframes` (not IntersectionObserver) for above-the-fold hero content
- Keep forms centered and narrow (480px max)

### Don't
- Use heavy borders or thick outlines (1px max, `--border` color)
- Fill backgrounds with solid bright colors (use subtle gradients)
- Make animations faster than 0.4s on cards (feels rushed)
- Use bold (700+) weights for descriptions — keep them light (300)
- Overuse gradient text — one hero accent word ONLY
- Add decorative elements that compete with the content
- Use dark backgrounds for main page sections (footer only)
- Forget `prefers-reduced-motion` support
- Use `box-shadow` at rest state for cards (shadows appear on hover only)
- Mix Inter and Inconsolata within the same element

---

*Last updated: February 2026*
*Reference implementation: `src/pages/FantasyLeagueLanding.jsx` + `.css`*
*Based on: Greenhouse editorial design system + FindMyFlow brand*
