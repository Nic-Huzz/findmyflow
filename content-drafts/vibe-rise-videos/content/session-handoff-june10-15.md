# Session Handoff — June 10-15, 2026

## Context

Building a content video pipeline for Vibe Rise's Instagram Reels. Three series based on the /create portal's experience creator data (58 creators mapped across revenue models, blow-up moments, and scale journeys).

---

## Key Decision: Talking Head + Pop-Up Overlays

**Original plan**: AI-generated cinematic b-roll (Higgsfield) composited with Remotion data overlays.

**Pivoted to**: Huzz films himself talking to camera (iPhone), Remotion composites animated pop-up overlays on top. This is better because:
- No Higgsfield credits needed (free plan, 0 credits)
- Talking head performs better on Instagram algorithm (faces > b-roll)
- More authentic for personal brand
- Pop-ups ARE the shareable moment (data reveals = screenshots)
- Way cheaper to produce at scale

---

## What's Built

### Remotion Project: `/Users/nichuzz/creations/vibe-rise-videos/`

#### 7 Overlay Components (all working, rendered, awaiting feedback)

| Component | File | What it does |
|-----------|------|-------------|
| **SeriesBumper** | `src/overlays/SeriesBumper.tsx` | "HOW THEY PAID RENT" + "VIBE RISE" glass card, bottom center. Accepts `seriesName` prop for other series. |
| **PortraitCard** | `src/overlays/PortraitCard.tsx` | Creator Pixar portrait + name + one-liner. Slides in from right, sits top-right. |
| **RevenueBadge** | `src/overlays/RevenueBadge.tsx` | Emoji + revenue model label pill. Spring-scale entrance. Can cascade for "5 models" reveal. |
| **StatCard** | `src/overlays/StatCard.tsx` | Ticking number counter + label (e.g. "12 years / before anyone noticed"). |
| **TimelineBar** | `src/overlays/TimelineBar.tsx` | Purple→gold gradient progress bar. "Started → Blow Up" with year counter. Bottom strip. |
| **EraCard** | `src/overlays/EraCard.tsx` | Accent bar + kinetic year + description. Left-aligned. Optional vintage grain. |
| **BlowUpReveal** | `src/overlays/BlowUpReveal.tsx` | "THE BLOW-UP MOMENT" eyebrow + massive gradient year + word-reveal description. Center screen climax. |

#### Shared Infrastructure

| File | Purpose |
|------|---------|
| `src/overlays/styles.ts` | `glassCard()` shared style, `eyebrowText` style |
| `src/common.ts` | `VR` brand colors, `lerp` helper, `EASE` presets |
| `src/HowTheyPaidRent.tsx` | Exported: `AuroraBackground`, `WordReveal`, `AnimatedLine`, `inter`, `fraunces` fonts, `MODEL_LABELS`, `MODEL_EMOJI` |
| `src/ComponentShowcase.tsx` | Renders each component one at a time with labels for feedback |
| `src/OverlayPreview.tsx` | All components sequenced together with face placeholder |
| `src/Root.tsx` | Fixed 2 data bugs (`early_revenue_model` key, `yearsToBlowUp` field), added slug overrides for accented names |

#### Preview Frames (in `out/`)

- `showcase-1-bumper.png` through `showcase-7-blowup.png` — one per component
- `overlay-preview-frame*.png` — combined preview frames

#### Scripts

- `scripts/video-scripts.md` — Full talking-head scripts for all 3 series intro videos

### Original Full-Scene Template (still works)

- `src/HowTheyPaidRent.tsx` — 4-scene aurora background template (Intro → Revenue → BlowUp → CTA)
- 3 compositions registered: Tony Robbins, Brene Brown, Wim Hof
- This is the pre-pivot version. Still useful for standalone renders without footage.

---

## The 3 Series

All feed from existing JSON data in `public/`:

### 1. "How They Paid Rent"
- **Core question**: What did they do for money before anyone knew their name?
- **Data**: `public/creatorEarlyRevenueModels.json` — 58 creators × 5 revenue models
- **5 models**: Day Job + Side Project (19), Institutional Salary (19), Small Group Paid (9), 1:1 Service (7), Free Events Paid Elsewhere (4)
- **/create flow**: Pay Rent Flow

### 2. "How They Blew Up"
- **Core question**: What was the one moment that changed everything?
- **Data**: `public/experienceCreatorDNA.json` — `blowUpMoment`, `blowUpYear`, `blowUpPatterns`, `yearsToBlowUp`
- **Key stat**: Average 16 years to blow up
- **Best examples**: Gabor Mate (44y, documentary), Jay Shetty (9y, viral FB video), Eckhart Tolle (20y, Oprah)
- **/create flow**: Blow Up Brand Flow

### 3. "How They Scaled"
- **Core question**: How did they go from 5 people to 5 million?
- **Data**: `public/experienceCreatorDNA.json` — `experienceEvolution` (stages 1→5 per creator)
- **Pattern**: Small room → bigger room → different medium → mass reach
- **Best examples**: Tony (5 stages, hotel→arenas→Netflix), Esther Perel (therapy→podcast), Jay Shetty (monk→Accenture→viral)
- **/create flow**: Scale Income Flow

---

## What Needs to Happen Next

### Immediate: Get Feedback on Components
Huzz has the 7 showcase images open in Preview. Waiting for visual feedback on:
- Glass card style (opacity, border, blur)
- Component sizing/prominence
- Positioning relative to face
- BlowUpReveal covering face zone (intentional as climax?)
- Any component that needs a different look

### After Feedback: Build Main Compositions

1. **`HowTheyPaidRentOverlay.tsx`** — Main overlay composition
   - Takes `bgVideoSrc` (talking head footage) via `<OffthreadVideo>`
   - Falls back to aurora bg when no footage (preview mode)
   - Uses declarative `buildScript()` function (array of timed overlay entries)
   - Same creator data props as existing template

2. **3 Intro Compositions** — one per series
   - `HowTheyPaidRentIntro` — 5 revenue badges cascade + 3 creator examples rapid-fire
   - `HowTheyBlewUpIntro` — 3 blow-up moments + trust years stat
   - `HowTheyScaledIntro` — evolution stage diagrams + 3 creator journeys
   - All reuse the same 7 components with different scripts

3. **Individual Episode Template** — per-creator deep dive overlay
   - Same `buildScript()` pattern, different timing per creator
   - Data-driven from JSON props

4. **Batch Render Script** — `scripts/render-overlays.sh`
   - Loops all creators, passes footage path via `--props`
   - Registers all 58 creators via data-driven `<Composition>` loop in Root.tsx

### Architecture Notes (from code-architect agent)

- **Script pattern**: `OverlayScript` = array of `{ startFrame, durationInFrames, component, props, position }`. Composition loops the array, renders `<Sequence>` per entry. Timing changes = edit one data structure.
- **Exit convention**: Every component gets `exitAtFrame = durationInFrames - 20` (20 frames = 0.67s exit budget)
- **Font loading**: Only in `HowTheyPaidRent.tsx`, exported and imported by overlay components. Never call `loadFont` twice.
- **`OffthreadVideo`** (not `<Video>`) for background footage — decodes off main thread, correct for rendered output.
- **`staticFile()`** resolves to `public/` — footage goes in `public/footage/` (gitignored)

---

## Higgsfield Status

- **Authenticated**: Yes (OAuth done via /mcp)
- **Workspace**: Private, free plan, 0 credits
- **Not needed for current approach** (talking head + overlays)
- **Future use**: Virality prediction on finished videos, possible scene illustrations for pop-ups, upscaling final exports
- **If upgrading**: PLUS monthly ($49, 1,000 credits) is enough to test. ULTRA ($99, 3,000 credits) for batching.

### Video Model Recommendations (if we go back to AI video)
- **Seedance 2.0**: Best for image-to-video, 9:16, genre hints (drama/epic), up to 1080p. 54 credits per 6s clip.
- **Grok Imagine**: Cheapest at 9 credits per clip, decent quality.
- **Recraft 4.1**: Best image model for storyboard frames (brand color palette control, 9:16).

---

## Key Data Files

| File | Contents | Used by |
|------|----------|---------|
| `public/experienceCreatorDNA.json` | 32+ deep creator profiles (bio, blowUp, evolution, dimensions) | All 3 series |
| `public/creatorEarlyRevenueModels.json` | 58 creators × 5 revenue models | "How They Paid Rent" |
| `public/images/*.png` | Pixar-style creator portraits | PortraitCard component |

---

## File Tree (what exists now)

```
vibe-rise-videos/
├── content/
│   └── session-handoff-june10-15.md    ← this file
├── out/
│   └── showcase-*.png                  ← 7 component preview frames
├── public/
│   ├── creatorEarlyRevenueModels.json
│   ├── experienceCreatorDNA.json
│   └── images/                         ← Pixar portraits
├── scripts/
│   └── video-scripts.md               ← 3 series talking-head scripts
├── src/
│   ├── common.ts                      ← VR colors, lerp, EASE
│   ├── ComponentShowcase.tsx          ← Individual component viewer
│   ├── HowTheyPaidRent.tsx            ← Original full-scene template (exports shared primitives)
│   ├── HowTheyPaidRentOverlay.tsx     ← NOT YET BUILT
│   ├── OverlayPreview.tsx             ← Combined preview
│   ├── Root.tsx                       ← Composition registry
│   ├── index.ts                       ← Entry point
│   └── overlays/
│       ├── styles.ts                  ← glassCard, eyebrowText
│       ├── BlowUpReveal.tsx           ← ✅ Built
│       ├── EraCard.tsx                ← ✅ Built
│       ├── PortraitCard.tsx           ← ✅ Built
│       ├── RevenueBadge.tsx           ← ✅ Built
│       ├── SeriesBumper.tsx           ← ✅ Built
│       ├── StatCard.tsx               ← ✅ Built
│       └── TimelineBar.tsx            ← ✅ Built
├── package.json
└── tsconfig.json
```

---

## Recommendations Before Next Session

1. **Film a test clip first** — even 30 seconds of you talking about Tony Robbins into your phone. Drop it in `public/footage/test.mp4`. Next session can immediately wire it up with the overlays and you'll see the real thing.

2. **Read the scripts at `scripts/video-scripts.md`** before filming. They're structured as beats, not word-for-word. Know the beats, improvise the words.

3. **Component feedback is the blocker** — the 7 showcase images are in `out/showcase-*.png`. Before next session, decide what you'd change (size, position, opacity, the BlowUpReveal covering center). That way the next agent can adjust and build the full compositions without a back-and-forth loop.

4. **Don't buy Higgsfield credits yet** — the talking head approach costs $0. Get the first video out, test it on Instagram, then decide if AI b-roll adds anything.

5. **The next agent's first task** should be: build `HowTheyPaidRentOverlay.tsx` (the main composition that layers overlays on your footage) + the 3 intro compositions. Everything they need is in this handoff doc.

---

## Quick Commands

```bash
cd /Users/nichuzz/creations/vibe-rise-videos
npm run dev                    # Remotion Studio (select ComponentShowcase or OverlayPreview)
npx tsc --noEmit               # Type-check
npx remotion still src/index.ts ComponentShowcase out/test.png --frame 130  # Render single frame
npx remotion render src/index.ts OverlayPreview out/preview.mp4            # Render full preview video
```
