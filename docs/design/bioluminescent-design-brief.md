# Bioluminescent Dark Theme — Design Style Brief

## Overview

Deep ocean dark theme inspired by bioluminescent reef organisms. The design creates a sense of being underwater at night, with living light emerging from darkness. Every element should feel like it's glowing from within.

## Philosophy

**Darkness is the canvas. Light is earned.**

- The dark background is not "dark mode" — it's the ocean floor. Elements emerge from it.
- Color is used sparingly and intentionally. When something glows, it means something.
- Pink = action, energy, the thing you're doing now
- Gold = achievement, completion, reward
- White/lavender = information, readability
- The animated spore particles and reef glow blobs create a living, breathing environment

## Color Palette

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-page` | `#0A0812` | Page background, body |
| `--bg-surface` | `#12101C` | Cards, modals, containers |
| `--bg-surface-hover` | `#1A1628` | Hover states on cards |
| `--bg-muted` | `#12101C` | Secondary surfaces, inputs |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#F2EEF8` | Headings, item names, primary content |
| `--text-secondary` | `#BAB0D0` | Descriptions, subtitles, secondary info |
| `--text-muted` | `#8478A0` | Labels, hints, helper text |
| `--text-faint` | `#5a4e70` | Disabled states, faint separators |
| `--text-on-accent` | `#0a0a0a` | Text on gradient buttons (dark on bright) |

### Accent Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-primary` | `#FF3CAC` | Pink — primary accent, active states, CTAs |
| `--accent-primary-light` | `#E040FB` | Magenta — gradient mid-point, secondary accent |
| `--accent-primary-dark` | `#cc2d8a` | Dark pink — hover states |
| `--accent-gold` | `#FFB800` | Gold — achievements, success, completion |
| `--accent-gold-light` | `#FFD060` | Light gold — gradient end-point |

### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#FFB800` | Gold (NOT green) — completion, done states |
| `--color-danger` | `#FF5A6E` | Soft red — errors, destructive actions |
| `--color-warning` | `#FF8C42` | Orange — warnings, attention |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--border-default` | `rgba(255, 255, 255, 0.05)` | Card borders, dividers |
| `--border-light` | `rgba(255, 255, 255, 0.08)` | Subtle separators |
| `--border-input` | `rgba(255, 255, 255, 0.1)` | Input field borders |

## Gradients

### Primary Gradient (Pink → Magenta → Gold)
```css
linear-gradient(135deg, #FF3CAC 0%, #E040FB 40%, #FFB800 100%)
```
Used for: active tab pills, CTA buttons, progress bars, the "LET'S PLAY" toolbar button, gradient text on major headings.

### Bar Gradient
```css
linear-gradient(90deg, #FF3CAC, #E040FB, #FFB800)
```
Used for: horizontal progress bars, XP bars.

### Gold Gradient
```css
linear-gradient(135deg, #FFB800 0%, #FFD060 100%)
```
Used for: gold-specific CTAs, achievement highlights.

## Typography Hierarchy

### When to use gradient text
Major page headings only: "Find My Flow", "BREAKTHROUGH", chapter names. Apply with:
```css
background: linear-gradient(135deg, #FF3CAC 0%, #E040FB 40%, #FFB800 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### When to use white (`--text-primary`)
- Item names: "Sleep 8+ hrs", "Exercise", quest names
- Card titles: "Stuck", "Your Paths"
- Body text, descriptions
- Any text that needs to be clearly readable

### When to use pink (`--accent-primary`)
- Section headers: "DAILY PRACTICES", "YOUR PATHS"
- Active states, selected items
- Links, interactive text
- Score highlights

### When to use gold (`--accent-gold`)
- Completion counts: "0/16", "151 completed"
- Success states: "All tasks done"
- Achievement indicators
- Points: "3pts", "5pts"

### When to use muted (`--text-secondary` / `--text-muted`)
- Subtitles: "Low on both", "1 of 5 complete"
- Helper text, timestamps
- Inactive tab labels
- Placeholder text (use `--text-faint`)

## Component Patterns

### Cards
```css
background: #12101C;          /* var(--bg-surface) */
border: 1px solid rgba(255, 255, 255, 0.05);
border-radius: 16px;
```
No box-shadow in dark theme — borders define edges. Cards float on the dark page.

### Buttons — Primary CTA
```css
background: linear-gradient(135deg, #FF3CAC 0%, #E040FB 40%, #FFB800 100%);
color: #0a0a0a;
border: none;
border-radius: 14px;
font-weight: 700;
```

### Buttons — Secondary
```css
background: #1A1628;
color: #BAB0D0;
border: 1px solid rgba(255, 255, 255, 0.08);
```

### Buttons — Ghost/Dismiss
```css
background: transparent;
color: #8478A0;
border: none;
```

### Input Fields
```css
background: #1A1628;
border: 1px solid rgba(255, 255, 255, 0.1);
color: #F2EEF8;
border-radius: 12px;
```
Focus state: `border-color: #FF3CAC; box-shadow: 0 0 0 3px rgba(255, 60, 172, 0.1);`

### Checkboxes / Radio (unchecked)
```css
border: 2px solid #FF3CAC;
background: transparent;
border-radius: 50%;
```

### Checkboxes (checked)
```css
background: #FF3CAC;
border-color: #FF3CAC;
```

### Streak/Progress Dots
- Empty: `rgba(255, 255, 255, 0.06)`
- Filled: `#FFB800` (gold)
- Active: `#FF3CAC` (pink)

### Divider Lines
```css
border-color: rgba(255, 60, 172, 0.1);  /* pink-tinted */
```
Or for subtle dividers: `rgba(255, 255, 255, 0.06)`

### Tags / Pills (inactive)
```css
background: #1A1628;
border: 1px solid rgba(255, 255, 255, 0.08);
color: #F2EEF8;
```

### Tags / Pills (active/selected)
```css
background: rgba(255, 60, 172, 0.1);
border-color: #FF3CAC;
color: #F2EEF8;
```

## Radar / Spider Charts

### Grid lines
Nearly invisible: `rgba(255, 255, 255, 0.06)`. The data should dominate, not the grid.

### Data polygon
- Fill: `rgba(255, 60, 172, 0.15)` — pink wash
- Stroke: `#FF3CAC` — solid pink line
- Vertex dots: `#FF3CAC`

### Dream/target polygon
- Stroke: `#FFB800` dashed — gold outline
- Fill: `rgba(255, 184, 0, 0.05)`

## Background Animation

Three layers (all `position: fixed; inset: 0; pointer-events: none; z-index: 0`):

1. **Reef Glow** — 4 large blurred circles (60px blur) in pink/magenta/gold/teal that pulse slowly
2. **Living Texture** — subtle SVG noise pattern at 1.5% opacity
3. **Spore Layer** — small glowing particles that drift upward from the bottom

## Bottom Toolbar
```css
background: #0A0812;
border-top: 1px solid rgba(255, 255, 255, 0.05);
```
- Inactive icons: `#8478A0`
- Active icon: `#FF3CAC`
- Center button: full gradient (Pink → Magenta → Gold), dark text

## Splash / Loading Screen
```css
background: #0A0812;
```
Title text: gradient text (Pink → Magenta → Gold)

## Implementation Pattern

### For new components
1. Use `var()` tokens in the base CSS — they auto-switch when `.theme-bioluminescent` is applied
2. For gradients and rgba values that can't use tokens, add `.theme-bioluminescent .your-class` overrides at the bottom of the component's own CSS file
3. Never put component overrides in the central `bioluminescent-theme.css` — Vite's CSS injection order makes them unreliable

### For pages
1. Add `theme-bioluminescent` to the root container className
2. Import and render `<BioluminescentBackground />` as the first child
3. If the page defines its own local CSS variables (like MePage.css), override them in a `.your-page.theme-bioluminescent` block

### What NOT to do
- Don't use `!important` (fix cascade order instead)
- Don't hardcode dark colors in JSX inline styles (use `var()` or CSS classes)
- Don't use green for success — use gold `#FFB800`
- Don't add the theme to pages that shouldn't be dark (onboarding flows, auth pages still use light theme)
