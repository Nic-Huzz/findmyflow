# Animation Brand Guide

## The Philosophy

The app is about expanding what feels safe. The dome grows. The comfort zone widens. Courage happens at the edge, and the nervous system opens.

**Every animation in this app is one of three motions:**

### 1. Expansion — "You're bigger than you were"
The dome grows outward from centre. The radar spreads. A bar fills. A number climbs. These motions move **from small to large, from centre to edge, from closed to open.** This is the product thesis made visible: your world is getting bigger.

- **Direction:** outward, upward, or widening. Never inward, never shrinking (except on dismiss).
- **Easing:** `ease-out` (fast start, gentle landing). Expansion should feel like release, not effort.
- **When:** dome render, radar reveal, progress bars, score count-ups, capacity growth.

### 2. Arrival — "Something true about you just showed up"
Staggered reveals. Each insight lands with space around it, like placing stones on a table one at a time. The user absorbs one truth before the next arrives. This mirrors how the app builds safety: gradually, not all at once.

- **Direction:** fade up (opacity 0→1, translateY 12px→0). Subtle upward drift, as if surfacing.
- **Timing:** 800ms between items. Long enough to read, short enough to feel like a sequence.
- **When:** quiz results, essence mirror, multiplication reveal, gap summary, identity statements.

### 3. Ignition — "You did something that mattered"
Celebrations. But not for everything. Confetti for courage, not compliance. The celebration tier exists because every dopamine hit you don't earn cheapens the one you do. A daily check-in gets a quiet pulse. A first income gets fireworks.

- **Direction:** explosive, outward, upward. Confetti rises and falls. Points float up and dissolve.
- **Easing:** spring `cubic-bezier(0.34, 1.56, 0.64, 1)` for the initial pop. Then gravity (ease-out dissolve).
- **When:** challenge complete, level up, streak, stage graduation, first income. Never for opening the app, visiting a page, or filling out a form.

### What animation is NOT for

**Decoration.** If an animation doesn't communicate expansion, arrival, or ignition, it's moving pixels for no reason. Cut it.

**Attention-grabbing.** Pulsing buttons, bouncing badges, wiggling icons. These create anxiety, not engagement. The app moves people FROM anxiety. Don't reintroduce it through UI.

**Speed.** Animations are not faster-feeling than no animation. A 300ms fade is slower than instant. Only animate when the motion itself carries meaning.

---

## The Emotional Palette

| Motion | Feels like | NS state it serves | Used for |
|---|---|---|---|
| **Grow outward** | Opening, expanding, breathing out | Ventral (safe, open) | Dome, radar, progress |
| **Fade up** | Surfacing, arriving, being seen | Ventral (calm recognition) | Reveals, results, insights |
| **Spring pop** | Joy, surprise, earned reward | Vibe Rise (alive, energised) | Celebrations, level-ups |
| **Smooth fill** | Steady progress, momentum | Fun (enjoyable, flowing) | Bars, scores, streaks |
| **Gentle pulse** | Heartbeat, alive, present | Ventral (grounded) | Active states, live indicators |
| **Dissolve up** | Letting go, release, lightness | Ventral (release) | Floating points, toast exit |

Motions we **never use:**

| Motion | Feels like | Why not |
|---|---|---|
| **Shake/vibrate** | Error, alarm, danger | Sympathetic activation. The opposite of what we're building. |
| **Sharp snap** | Startling, abrupt | Triggers alertness. We move FROM alertness TO safety. |
| **Bounce loop** | Nagging, impatient | Creates urgency. Urgency is the old category. |
| **Slide from edge** | External intrusion | Things should surface FROM the user's data, not arrive FROM outside. |
| **Shrink/collapse** | Loss, contraction | The dome expands, it doesn't shrink. Dismiss motions should fade, not collapse. |

The one exception: `MysteryBoxModal` uses a brief **shake** (0.4s, 3deg rotation) during the "opening" state. This works because (a) the user chose to open it, (b) it's anticipatory not alarming, and (c) it's followed immediately by an expansion reveal. The shake is the "cracking open" before the prize appears — tension before release, which IS the courage challenge pattern.

---

## Colour in Motion

The dome already established the colour language. Animation should respect it:

| Colour | Meaning | In animation |
|---|---|---|
| **Purple (#5e17eb)** | Where you are. Current. Safe. Integrated. | Fills, current dome, existing progress |
| **Gold (#E9A23B)** | Where you're growing. Edge. Courage. Dream. | Edge rings, dream radar, growth indicators, celebrations |
| **Green (#22c55e)** | Completion. Done. Verified. | Checkmarks, completion states |
| **Red (#ef4444)** | Drop-off, gap, stressed state | Funnel drop-off %, negative gap indicator |

When two colours animate together (dome reveal with purple fill then gold edge), purple always arrives **first**. The user sees where they are before seeing where they could go. Safety before stretch. This is the nervous system principle applied to colour sequencing.

---

## The Breath Curve

The default easing is `ease-out` — fast into the motion, gentle at the end. This mimics an exhale: release, not effort.

For emphasis moments (level up, reveal), use the **signature spring**: `cubic-bezier(0.34, 1.56, 0.64, 1)`. This overshoots slightly then settles — like the nervous system after a courage challenge. You push past your edge, then you regulate back. The overshoot IS the learning.

For data that's filling or progressing, use `ease-out`. Progress should feel like momentum, not struggle.

Never use `ease-in` (slow start, fast end) for user-facing animation. Ease-in feels like falling — acceleration without control. That's sympathetic activation.

Never use `linear`. Linear is mechanical. Bodies don't move linearly. The app tracks nervous systems, not machines.

| Easing | Feels like | Use for |
|---|---|---|
| `ease-out` | Exhale, release, landing | Progress bars, score fills, fade-ins |
| `ease-in-out` | Breathing, natural rhythm | Dome grow, radar expand, pulse loops |
| `cubic-bezier(0.34, 1.56, 0.64, 1)` | Pop with settle, courage + regulation | Level up, mystery box, celebration modal |
| `ease` (CSS default) | Neutral, unobtrusive | Hover states, colour transitions, subtle shifts |

---

## Constraints

**Page-level animations disabled.** iOS PWA navigation failures with opacity:0 start frames + React Router lazy loading. All motion is in-component only. This is a feature — it keeps the app fast and prevents the "fancy but broken" trap.

**No motion libraries.** Pure CSS + canvas-confetti. No Framer Motion, no React Spring. This keeps bundle size small and avoids lock-in.

**Reduced motion compliance required.** Every animated component must include `@media (prefers-reduced-motion: reduce)` that sets `animation: none; transition: none;`. All confetti uses `disableForReducedMotion: true`.

---

## The Four Animation Categories

### 1. Reveal Moments — "Something about you just appeared"

**When:** Dome shape, radar result, essence mirror, quiz diagnosis, multiplication reveal, gap visualization.

**The rule:** Reveals are staggered, not simultaneous. Each piece of information arrives with enough space for the user to absorb it before the next one lands.

**Pattern:**
- Stagger: **800ms between items** (setTimeout + state-driven)
- Each item: `opacity: 0 → 1` + `translateY(12px) → 0` over **0.4s ease**
- Final element (CTA or share button): arrives **after** all data, with a slightly longer delay (1.2s)

**Example (from ExperienceResultsReveal):**
```css
.metric { opacity: 0; transform: translateY(12px); transition: all 0.4s ease; }
.metric-visible { opacity: 1; transform: translateY(0); }
```

**Do not:** Reveal everything at once. The stagger IS the moment. Without it, results screens feel like a data dump.

**Used in:** ExperienceResultsReveal, MultiplicationReveal, AmbitionRadar results, AlivenessQuiz results, MysteryBoxModal.

---

### 2. Celebrations — "You did the thing"

**When:** Challenge complete, level up, streak milestone, stage graduation, first income.

**The rule:** Celebrations scale with achievement significance. Not everything gets confetti.

**Tiers:**

| Tier | Trigger | Treatment | Confetti |
|---|---|---|---|
| **Micro** | Daily check-in, single task done | Floating points (1.5s fadeUp) + hapticLight | None |
| **Standard** | Courage challenge complete, quest task done | Floating points + hapticSuccess + toast | None |
| **Major** | All tasks complete, streak milestone | Toast + triggerFireConfetti (orange/gold, 50 particles) | Fire theme |
| **Epic** | Level up, stage graduation, first income | Full modal + triggerSideCannons (200+ particles) + hapticSuccess | Side cannons |

**Confetti brand colors:**
- Default: `['#5e17eb', '#7c3aed', '#ffdd27', '#22c55e']` (purple + gold + green)
- Fire: `['#f97316', '#ea580c', '#ffdd27']` (streak milestones)
- Gold: `['#E9A23B', '#f59e0b', '#fbbf24']` (income, major achievements)

**Floating points pattern:**
```css
@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
}
/* Duration: 1.5s ease-out */
```

**Do not:** Use confetti for daily actions. Confetti fatigue kills the dopamine hit when something actually matters.

---

### 3. Data Transitions — "Your numbers are changing"

**When:** Progress bars filling, scores counting up, dome expanding, charts drawing.

**The rule:** Data should feel like it's arriving, not appearing.

**Patterns:**

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Progress bars | `width: 0 → N%` | 0.6s | ease-out |
| Score counters | JS increment (requestAnimationFrame) | 0.8s | ease-out (decelerate) |
| Dome radar vertices | SVG point interpolation | 0.8s | ease-in-out |
| Chart segments | CSS `stroke-dashoffset` | 0.6s | ease |
| Capacity bars | `width: 0 → N%` | 0.4s | ease-out, staggered 100ms |

**Dome-specific:**
```css
@keyframes domeGrow {
  from { transform: scale(0.85); opacity: 0.3; }
  to { transform: scale(1); opacity: 1; }
}
/* Duration: 0.8s ease-in-out */

@keyframes pulseVertices {
  0%, 100% { r: 3; }
  50% { r: 5; }
}
/* Duration: 1.5s ease-in-out, 2 iterations */
```

**Do not:** Animate data on every re-render. Animate on first mount or when values change, not on scroll-back or tab-switch.

---

### 4. Micro-interactions — "Your tap registered"

**When:** Button press, card select, toggle, chip tap, option pick.

**The rule:** Micro-interactions should be felt, not seen. If someone notices the animation, it's too slow.

**The signature spring:** `cubic-bezier(0.34, 1.56, 0.64, 1)`

This is the FindMyFlow spring — slightly bouncy, not cartoonish. Used on level-up modals, mystery box reveals, and celebration pops. Make it the default for any "element appears with emphasis."

**Patterns:**

| Interaction | Animation | Duration |
|---|---|---|
| Button hover | `transform: scale(1.02)` | 0.15s ease |
| Button active | `transform: scale(0.97)` | 0.1s ease |
| Card select (gold border) | `border-color` + `box-shadow` transition | 0.2s ease |
| Chip toggle | `background-color` + `color` transition | 0.15s ease |
| Option select (quiz) | `transform: scale(0.98) → 1` + color change | 0.15s ease |
| Modal enter | `opacity: 0 → 1` + `scale(0.95) → 1` | 0.3s spring |
| Modal exit | `opacity: 1 → 0` + `scale(1) → 0.95` | 0.2s ease |
| Toast enter | `translateY(100%) → 0` | 0.3s ease |
| Toast exit | `translateY(0) → 100%` | 0.3s ease |

**Haptic pairing:**
- `hapticLight`: option select, chip toggle, card tap
- `hapticSuccess`: challenge complete, save confirmed, level up

**Do not:** Add hover effects on mobile. Use `:hover` only in `@media (hover: hover)` queries.

---

## What NOT to Animate

| Category | Why |
|---|---|
| **Page transitions** | iOS PWA bug. React Router + opacity:0 = invisible pages. |
| **Scroll-triggered reveals** | `useReveal()` hooks exist but animation tokens are no-ops. Keep it this way until iOS fix is confirmed. |
| **List item entrance** | Staggering 20+ list items (experiences, quest tasks) creates jank on older phones. Just render them. |
| **Navigation tab switches** | Instant swap. Users tap tabs to get somewhere, not to watch a transition. |
| **Loading states for fast operations** | If it takes <200ms, don't show a spinner. Show the result. |

---

## Reduced Motion

Every animated component must include:

```css
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    transition: none;
    opacity: 1;
    transform: none;
  }
}
```

All confetti functions use `disableForReducedMotion: true`.

---

## CSS Naming Convention

Scope all keyframes to their component:

```css
/* Good */
@keyframes domeGrow { ... }
@keyframes errFadeIn { ... }      /* ExperienceResultsReveal */
@keyframes mbShake { ... }        /* MysteryBox */

/* Bad */
@keyframes fadeIn { ... }         /* Too generic, will collide */
@keyframes animation1 { ... }    /* Meaningless name */
```

---

## The Three Tests

Before adding any animation, it must pass all three:

**1. The Capcom Test — "Is this the parry glint?"**
The parry glint is the moment so small nobody would list it as a feature, that's actually why people come back. The dome growing into view. The gap number appearing. The radar overlay showing ambition vs reality. If the animation doesn't serve a moment like that, it's decoration. Cut it.

**2. The Nervous System Test — "Does this motion regulate or activate?"**
Watch your own body when you see it. Does it make you exhale (good — expansion, arrival) or tense up (bad — alarm, urgency)? If the animation creates the same feeling as a push notification, it's working against the product.

**3. The Silence Test — "Would the screen work without this?"**
If removing the animation loses nothing — no meaning, no emotional beat, no information — then it was never doing a job. Only animate what would feel flat or confusing without the motion.

---

## Quick Reference

| Need | Use | Duration | Easing |
|---|---|---|---|
| Item appears with emphasis | Spring scale | 0.3s | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Item fades in subtly | Fade + translateY | 0.4s | `ease` |
| Stagger multiple items | setTimeout chain | 800ms gap | — |
| Progress fills | Width transition | 0.6s | `ease-out` |
| Button feedback | Scale down/up | 0.1-0.15s | `ease` |
| Celebration (standard) | Floating points + haptic | 1.5s | `ease-out` |
| Celebration (major) | Confetti + toast | 2s | — |
| Modal enter/exit | Scale + opacity | 0.2-0.3s | spring / ease |

---

*Reference files:*
- `src/styles/animation-tokens.css` — disabled page animations (iOS constraint)
- `src/styles/flow-base.css` — active flow component animations
- `src/components/Celebrations/Confetti.jsx` — confetti trigger functions
- `src/hooks/useCelebrations.js` — celebration orchestration
- `src/components/Celebrations/Celebrations.css` — floating points, toasts, modals
