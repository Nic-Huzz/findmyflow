# Life Path States — Implementation Plan

## The exercise in one sentence

You name the careers you'd realistically pursue, then admit all the ones you wouldn't. The map shows the dreams you feel alive about are the ones you don't feel safe enough to count. Then you watch what happens when you do one brave thing.

---

## What it should feel like

**Facilitator version:** A magic trick. Clean, minimal, theatrical. The facilitator controls every beat. The silence between steps is the tool. The map is the reveal. The room should go quiet at the punchline.

**Self-guided version:** A tarot reading. Intimate, slightly mysterious. You're alone with your own truth. You entered thinking this was a career quiz. The map at the end is a mirror you didn't expect. You screenshot it.

---

## Architecture

```
src/
├── components/LifePathMap/
│   ├── LifePathMap.jsx       # Shared SVG engine (prop-driven, zero internal state)
│   ├── LifePathMap.css       # Scoped .lpm- styles, animations
│   └── lifePaths.js          # Constants, geometry helpers
│
├── pages/
│   ├── FacilitateLifePaths.jsx   # Version A
│   └── FacilitateLifePaths.css
│
├── flows/
│   ├── TryLifePaths.jsx          # Version B
│   └── TryLifePaths.css
```

### `<LifePathMap />` props

```
careers           — the career objects (label, emoji, predictedState, livedState, realistic, animateIn)
safety            — 0-1, cone expansion beyond initial
walkProgress      — 0-1, predicted→lived drift
theme             — 'dark' | 'light'
pulseActive       — triggers trunk pulse + ripple animation
showZoneLabels    — "what feels safe" / "what doesn't feel safe yet"
onCareerClick     — callback for tagging interactions
highlightId       — career currently being tagged (focus ring)
```

Everything else derived every render. No state stored in the component.

---

## The Script

### Version A — Facilitator

The facilitator reads (or paraphrases) the bold text. The regular text is what appears on screen.

---

**STEP 1: THE REALISTIC BET**

Screen: dark, centered, large type. Text input at bottom.

> *If you had to bet money today, what would you actually do?*
> *The realistic one or two.*

Facilitator types what the participant says. Each career appears as a pill. Enter to add, backspace on empty to remove last.

When done: facilitator hits → or clicks "Only these."

---

**STEP 2: TAG THE REALISTIC ONES**

Screen: the career name fills the screen, large. Four state buttons below.

> *When you picture doing this every day — what does your body do?*

**The four options (large, tappable):**

| Button | Copy | Color |
|--------|------|-------|
| 🔥 Vibe Rise | "Alive. Lit up." | Gold |
| 😌 Peace | "Fun. Settled." | Mint |
| 😰 Anxious | "Stressed. Tight." | Red |
| 😶 Shutdown | "Bored. Flat." | Grey |

Facilitator taps. Career animates onto the map at its state height. Cone positions itself. Auto-advance to next realistic career. After the last one → pause 0.5s → advance.

Keyboard: `1` = Vibe Rise, `2` = Peace, `3` = Anxious, `4` = Shutdown.

---

**STEP 3: THE SPRING**

Screen: the map is visible (showing 1-2 lit careers in the cone). Prompt appears over the map, centered, large:

> *Out of literally everything available to you...*
> *only these?*

**2 seconds of nothing.** No button. No input. Just the question hanging.

Then the input field fades in at the bottom with placeholder text: *"Actually, also..."*

Facilitator types each career the participant blurts. Each one:
1. Appears as text in the input
2. On Enter: **flies from the trunk** along a curved path to a scattered position in the dark (0.6s ease-out)
3. Lands dim, with its label barely visible

**The accumulation is the drama.** The screen fills. Each career is a dream they just admitted they weren't counting. Let it happen fast — the flood is the point.

When done: "That's all of them" or → to advance.

**THE SETTLING BEAT:** After the last career lands, 1 second of silence. The prompt fades out. The scattered dim dreams settle into place. A subtle shift in the visual — the contrast between the bright cone (1-2 safe careers) and the dark sky full of dreams becomes undeniable.

Then advance to tagging.

---

**STEP 4: TAG THE PARKED CAREERS**

Same UX as step 2 — career name large, four state buttons.

> *And this one — what does your body do when you picture it?*

Each tag slides the career from its scattered position to its state-band height. The pattern reveals itself as they go: the shutdown/anxious careers cluster near the cone, the vibe-rise careers float high above it in the dark.

The facilitator can see it building. The participant can feel it.

After the last tag → auto-advance to reading.

---

**STEP 5: THE READING**

Screen: full map, no controls visible. The facilitator controls panel is hidden.

1.5 seconds of silence. Let them look.

Then the punchline fades in (0.8s, centered below the map):

> ***This gap isn't ability. It's safety.***

The facilitator can let it land for as long as they want. → to continue.

---

**STEP 6: THE WAHOOS**

Right panel reappears. Shows parked careers sorted by state (vibe rise first = the ones that glow brightest in the dark).

Facilitator: **"Pick the one that pulls you most."**

Taps a career → it highlights on the map. Panel shows:

> *What's one small brave thing you could do this week toward [career]?*

Text input. Facilitator types 2-4 wahoo steps. Each appears as a checklist item.

**Mark a wahoo done:**
1. Trunk **flashes bright** (0.15s)
2. A **ring expands** from the trunk outward (0.5s, gold, fading)
3. As the ring crosses the cone edge, the **cone widens** one step
4. If the career is now inside the cone: it **ignites** — opacity jumps, glow pulses, a brief flash

Each wahoo completed = `safety += 1 / total_wahoo_steps_for_this_career`

The participant watches their own map redraw. The dream that was sitting in the dark is now glowing inside their cone of safety.

---

### Version B — Self-Guided

Same exercise, different pacing. The user drives, the interface guides. 8 screens, ~3 minutes.

CSS prefix: `.lps-`. Branding: purple gradient headers, gold CTAs, Inter font, flow-base.css buttons, 480px max-width container, 100dvh screens, ProgressDots (8 dots).

---

**SCREEN 1: HOOK** (tap to advance)

Full-screen purple gradient. Large white text, centered.

> *What if the career you dream about*
> *isn't out of reach?*
>
> *It's just outside your cone of safety.*

Small "Tap to continue" at bottom, fades in after 1s.

---

**SCREEN 2: REALISTIC INPUT**

White background. Gentle entry.

> *Quick question.*
>
> *If you had to bet money today on what you'll actually end up doing — what would it be?*
>
> *Name the realistic one or two.*

Text input + "Add" button. Careers appear as pills below. Min 1 required.

Gold CTA: **"These are my realistic options"**

---

**SCREEN 3: TAG REALISTIC**

One career per screen. Purple header with career name. White body with 4 state buttons.

> *When you picture yourself doing [career] — what happens in your body?*

Large state buttons (2x2 grid on mobile):

| 🔥 Alive, lit up | 😌 Fun, settled |
| 😰 Stressed, tight | 😶 Bored, flat |

Tap → career state set → auto-advance to next career → auto-advance to spring prompt.

---

**SCREEN 4: THE SPRING PROMPT**

White background. Centered text. Gold CTA delayed.

> *Out of literally everything available to you...*
> *only [that/those]?*

**1.5 seconds of nothing.** Just the question.

Then gold CTA fades in: **"Actually, also..."**

---

**SCREEN 5: SPRING INPUT**

> *What else? Don't filter. If it's ever crossed your mind, write it down.*

Same text input + pills as screen 2. No minimum — but encourage 3+.

Below the input, in small muted text: *"The ones you're scared to say out loud are the important ones."*

Gold CTA: **"That's everything"**

---

**SCREEN 6: TAG PARKED**

Same one-per-screen tagging as screen 3.

> *And [career] — what does your body do?*

Same 4 state buttons. Tap and advance.

---

**SCREEN 7: THE REVEAL**

**Hard cut to dark.** The entire screen goes dark (#0a0a14) — a deliberate break from the light flow. This IS the moment.

The `<LifePathMap />` renders their complete map. Dark theme. Cone pointing at their realistic careers. Dreams scattered in the sky above.

1.5 seconds of silence.

Then, fade in below the map (0.8s):

> ***This gap isn't ability. It's safety.***

Below that, smaller, after 0.5s more:

> *The careers that light you up are sitting outside*
> *the part of yourself that feels safe.*
> *Every brave thing you do widens the cone.*

Gold CTA: **"What do I do about it?"**

---

**SCREEN 8: EMAIL GATE + NEXT STEP**

Use existing `<PublicEmailGate />` component.

> *Enter your details to save your map and get your first step.*

After email submit → final screen:

Their top parked vibe-rise career shown prominently:

> *Your brightest dream in the dark: **[career name]***
>
> *Your first wahoo (one small brave thing toward it):*

Show 1 suggested wahoo step (hardcoded template based on career type, not AI for v1):
- Generic: "Tell one person you're considering this."
- If includes "teach/workshop": "Run a 15-minute version for one friend."
- If includes "write/book": "Write the first paragraph. Just one."
- If includes "move/travel": "Research one neighbourhood. Save a listing."

Below that, the conversion bridge:

> *This map is one moment in time.*
> *Vibe Rise tracks your cone expanding week by week.*

Gold CTA: **"Start my 7-day challenge"** → links to `/7-day-challenge` or signup

Secondary link: "Download my map" → PNG export of the SVG

---

## Edge Cases as Design Decisions

**Both realistic careers tagged as the same state:**
Good. The cone is a narrow sliver pointing at one band. The reveal is SHARPER because the contrast is maximum. No special handling needed.

**A realistic career tagged as Vibe Rise:**
The cone starts high. Parked careers might sit below (peace/anxious/shutdown). The story inverts: "you feel safe being alive but not safe being bored/stable." This is a valid reading — some people are adventure-addicted but terrified of settling. Let it play. The punchline still works because the gap is still visible, just in the other direction.

**All careers tagged as the same state:**
The cone covers everything or nothing. The visual is boring. The exercise's truth is: "you don't actually differentiate — you're numb to the difference." This is itself a diagnosis. Show the flat map, adjust the punchline: *"Every path feels the same. That's not clarity. That's shutdown."* (v2 — for v1, let the standard punchline play.)

**15+ parked careers:**
Soft cap at 12. After 12, show "and [N] more you haven't named yet" instead of stacking more. Within each state band, stagger Y offsets ±15px per career. Reduce label font to 10px if >4 in one band. Labels alternate left/right of the dot if they'd overlap.

**0 parked careers ("only those" → "yes, only those"):**
Skip the spring. Go straight to the reveal. The map shows ONLY the lit cone with nothing in the dark. The punchline changes to: *"If that's really everything, you're either fully safe... or the rest is so far outside your cone you can't even see it yet."* (v2 — for v1, show the standard punchline, it still reads.)

**1 realistic career only:**
Works fine. "Only that?" is more pointed than "only those?" The cone is a thin beam. Good drama.

---

## Animation Specifications

### Career fly-in (the spring, step 3)

Each career added in the spring animates FROM the trunk TO its final position.

- **Duration:** 0.6s
- **Easing:** cubic-bezier(0.2, 0.8, 0.3, 1) — fast launch, soft landing
- **Path:** straight line (not along the branch bezier — simpler, still reads as "flying out")
- **Opacity:** 0 → parked opacity (0.12 dark / 0.3 light)
- **Stagger:** if multiple careers are added rapidly, each starts 0.15s after the previous
- **Implementation:** CSS animation with custom properties `--fly-from-x`, `--fly-from-y` set to trunk position. On creation, the career `<g>` has class `.lpm-fly-in` which runs once.

### State tag slide (steps 2 & 4)

When a career is tagged, it slides from its current position to its state-band Y.

- **Duration:** 0.5s
- **Easing:** ease-out
- **Implementation:** track previous Y in state. On tag, apply CSS transition to the `<g>` transform. Since we rebuild innerHTML, we'd need to use `requestAnimationFrame` to interpolate, OR maintain the position in React state and animate via React.

**Pragmatic choice:** Don't animate the SVG elements directly (innerHTML rebuild kills it). Instead, maintain an `animatingCareers` map in the parent component. When a career is tagged, add it to the map with `{ fromY, toY, startTime }`. In a rAF loop, compute the interpolated Y and pass it to `<LifePathMap>` as an override. Remove from the map after 0.5s. This keeps LifePathMap stateless.

### Trunk pulse (wahoo completion)

1. **Flash:** trunk circle r jumps 6 → 10, opacity → 1, gold fill brightens. Duration: 0.15s.
2. **Ring:** a new `<circle>` at trunk, r expands 6 → 120, stroke-width 3 → 0.5, opacity 0.6 → 0. Duration: 0.5s. Gold stroke.
3. **Cone step:** safety value increments. The cone visually widens (handled by re-render with new safety prop).
4. **Ignition:** if a career crosses into the cone, its opacity jumps from parked → lit and a 0.3s brightness flash plays.

**Implementation:** parent component sets `pulseActive = true`, waits 0.6s, then sets it false. LifePathMap renders the pulse circle when `pulseActive` is true with CSS animation. Parent increments safety after a 0.3s delay (so the ring reaches the edge before the cone moves).

### The settling beat (end of spring)

After the last career lands:
- 1s pause (no input accepted)
- The prompt text fades out (0.5s)
- The scattered careers do a subtle "settle" — each one shifts ±2px randomly in position, as if finding their resting spot. This is purely cosmetic.
- Then the tagging step begins with a new prompt fading in.

---

## Conversion Path (Self-Guided → Vibe Rise)

The self-guided exercise just proved something to the user. The conversion leverages that proof:

**What they now believe:** "The careers I dream about aren't unrealistic. I just don't feel safe enough to count them."

**What Vibe Rise offers:** "A system that widens your cone of safety through daily practices, wahoos, and healing."

**The bridge on screen 8:**

> *This map is one moment in time.*
> *Vibe Rise tracks your cone expanding week by week.*
>
> **Start my 7-day challenge** [gold CTA → /get-started or signup]

**The bridge in the follow-up email** (if email captured):
- Day 1: "Here's your map again. The [career] sitting in the dark? Let's talk about what it would take."
- Day 3: "You've done one wahoo. Here's what changed." (Even without the app — just the reframe.)
- Day 7: "Ready to see your cone expand for real?" → CTA to the app.

Email sequence is post-v1 but the bridge screen is in v1.

---

## File Inventory

### New files (7)

| File | Purpose |
|------|---------|
| `src/components/LifePathMap/LifePathMap.jsx` | Shared SVG engine |
| `src/components/LifePathMap/LifePathMap.css` | Engine styles + animations |
| `src/components/LifePathMap/lifePaths.js` | Constants + geometry helpers |
| `src/pages/FacilitateLifePaths.jsx` | Facilitator page |
| `src/pages/FacilitateLifePaths.css` | Facilitator styles |
| `src/flows/TryLifePaths.jsx` | Self-guided flow |
| `src/flows/TryLifePaths.css` | Self-guided styles |

### Modified files (2)

| File | Change |
|------|--------|
| `src/AppRouter.jsx` | Add 2 routes (no AuthGate) |
| `CLAUDE.md` | Add routes to Routes section |

---

## Build Phases

### Phase 0 — Engine (half day)

Extract mockup rendering into `<LifePathMap />`. Hardcode sample careers. Verify: cone geometry, theme toggle, state bands, zone labels all match the approved mockup.

**Test:** render in a scratch page, flip props, map responds correctly.

### Phase 1 — Facilitator steps 1-5 (1 day)

Build the 6-step state machine. Steps 1-5 (realistic → tag → spring → tag → reading). No wahoos yet. Focus on:
- The 2-second silence in step 3
- The accumulation moment (careers flying in)
- The settling beat
- The punchline fade-in
- Keyboard shortcuts (→, 1-4, R, H, ?)

**Test:** run a full session end to end. The punchline should land without you needing to explain anything.

### Phase 2 — Facilitator wahoos + all animations (half day)

Add step 6 (wahoo breakdown). Implement trunk pulse, ring expansion, cone widen, career ignition. Add presenter mode (H hides controls). Add reset.

**Test:** add wahoo steps for a parked vibe-rise career. Mark them done. Watch the cone reach it. The ignition moment should feel earned.

### Phase 3 — Self-guided flow (1 day)

Build the 8-screen flow. Match /7-day-challenge branding: purple headers, gold CTAs, ProgressDots, flow-base buttons, 480px container, 100dvh, safe-area padding. The hard cut to dark on screen 7 (the reveal) is the most important transition in the entire build.

Wire PublicEmailGate. Build the conversion bridge screen. PNG export for "download my map."

**Test:** complete the full flow on a phone in under 3 minutes. The reveal should make you pause.

### Phase 4 — Polish (half day)

- `prefers-reduced-motion`: snap instead of animate
- Keyboard shortcut overlay (facilitator `?` key)
- Error boundary
- og:image meta tag for self-guided (so shared links look good)
- Update CLAUDE.md routes
- Light mode tuning pass on both versions

---

## What "done" looks like

**Facilitator:** Huzz opens `/facilitate/life-paths` on a projector. Types "corporate job" and "freelance." Tags them shutdown and anxious. The cone points down. Asks "only those?" Two seconds of silence. Then "actually, also..." and the participant blurts six more. Each one flies from the trunk into the dark. The screen fills with dim dreams. A beat of settling. Then Huzz cycles through each parked career: "And this one?" Tap. It slides to Vibe Rise. Another. Peace. Another. Vibe Rise. The pattern is now undeniable: the gold dreams float high above the cone, the grey safe bets sit inside it. The punchline fades in. The room goes quiet. Huzz picks "Run retreats," types three wahoo steps, marks the first done. The trunk pulses. The cone widens. Two more. The cone reaches the dream. It ignites. Someone in the room takes a breath.

**Self-guided:** Someone finds `/try/life-paths` from an Instagram link. "What if the career you dream about isn't out of reach? It's just outside your cone of safety." They tap. Type "teaching" as their realistic bet. Tag it anxious. "Out of literally everything... only that?" 1.5 seconds of nothing. Then the gold button: "Actually, also..." They add "run a retreat," "write a book," "start a community," "move to Bali." Tag each one. Then the screen goes dark. Their map builds. One red line pointing down into a narrow cone. Four gold dots floating above in the dark. 1.5 seconds. Then: *"This gap isn't ability. It's safety."* They screenshot it. They enter their email. They see their first wahoo: "Tell one person you're considering running a retreat." They click "Start my 7-day challenge."
