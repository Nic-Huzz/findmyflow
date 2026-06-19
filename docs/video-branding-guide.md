# Vibe Rise — Video & Presentation Branding Guide

For Claude Desktop, Remotion, and any agent creating visual content.

---

## Brand Identity

**Name:** Vibe Rise
**Tagline:** Find which model fits you.
**Domain:** viberise.nichuzz.com
**Instagram:** @_huzz

---

## Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `ink` | #06030f | Background, glass card fills |
| `purple` | #5e17eb | Primary brand, gradient start |
| `purpleBright` | #8b5cf6 | Accents, glows |
| `gold` | #E9A23B | Highlights, numbers, CTAs, gradient end |
| `goldBright` | #f5c45a | Glow effects |
| `bone` | #efe6d4 | Secondary text |
| `white` | #ffffff | Primary text |
| `gray.600` | #52525b | Eyebrow text, labels |

**Primary gradient:** Purple (#5e17eb) → Gold (#E9A23B). Use for hero numbers, progress bars, decorative lines.

**Glass card style:**
```
background: rgba(6, 3, 15, 0.88)
border: 2px solid rgba(233, 162, 59, 0.25)
backdrop-filter: blur(20px)
border-radius: 24px
box-shadow: 0 8px 40px rgba(0,0,0,0.6)
```

---

## Typography

**Primary font:** Inter (Google Fonts)
**Weights:** 400 (body), 700 (labels), 900 (headlines, numbers)

### Size tiers for video overlays (1080x1920 canvas)

| Tier | Size | Usage |
|------|------|-------|
| Hero | 80-140px | Big numbers, hook text ("12 YEARS") |
| Emphasis | 60px | Emphatic moments ("There's four models.") |
| Headline | 44-56px | Model headers, brand name, creator names |
| Body | 38px | Longer sentences, descriptions, subtitles |
| Eyebrow | 18-24px | Labels ("MODEL 1", "THE AVERAGE"), letter-spacing 4-8px, uppercase |

**Rule:** Never go below 38px on a 1080x1920 video. Below that is unreadable on a phone.

---

## Subtitle Style (Pop Subtitles)

- Words spring in one-by-one with overshoot animation
- Key words (numbers, names, action words) highlighted in **gold** with drop-shadow glow
- Non-highlighted words are **white** with dark text shadow for readability
- Phrases grouped to match natural speech rhythm (2-5 words)
- Position: around chin/neck area (top: 60% on 1920px canvas)
- Always have a **bottom gradient** behind subtitles for readability

### Highlight rules
- **Numbers** always gold: "12", "34", "25", "100"
- **Creator names** always gold: "Tony", "Robbins", "Wim", "Hof"
- **Action/key words** gold when they're the point: "blow up", "paid rent", "scale", "impact"
- **Model names** gold: "Day Job", "Small Group"
- Everything else white

---

## Animation Patterns

### Spring configs (Remotion)
| Type | Config | Usage |
|------|--------|-------|
| Pop-in | `damping: 10, stiffness: 200, mass: 0.4` | Word reveals, portraits, badges |
| Smooth enter | `damping: 16, stiffness: 120, mass: 0.6` | Glass cards, containers |
| Overshoot | `damping: 10, stiffness: 200, mass: 0.5` | Keyword pops, emphasis |
| Gentle | `damping: 18, stiffness: 100, mass: 0.7` | Lower thirds, slides |

### Exit animations
- Fade out over 8-15 frames
- Optional: slide direction (left for lower thirds, up for bumpers)
- Scale down to 0.9 for glass cards

### Permanent effects
- **Gold glow pulse:** `Math.sin(frame * 0.06) * 0.1 + 0.25` on portrait borders
- **Bottom gradient:** Always on, 30% height, `rgba(6, 3, 15, 0.7)` to transparent
- **Zoom punch:** 6% scale bump on video cuts (sine wave over 15 frames)

---

## Overlay Components (Remotion)

Located at `vibe-rise-videos/src/overlays/`:

| Component | Usage | Position |
|-----------|-------|----------|
| `PopSubtitle` | Word-by-word animated subtitles | Top 60% (chin area) |
| `SeriesBumper` | Series intro/outro badge | Bottom 12%, centered |
| `LowerThird` | Name + title bar | Bottom-left, slides from left |
| `KeywordPop` | Big emphatic word, brief (1.5-2s) | Top 10%, centered |
| `RevenueBadge` | Revenue model label + emoji | Bottom, centered |
| `StatCard` | Big number + label | Top, centered |
| `TimelineBar` | Progress bar with year counter | Bottom, full width |
| `EraCard` | Year + description, slides from left | Top-left |
| `BlowUpReveal` | Year + moment + decorative line | Center (use sparingly) |

### Layout rules for talking-head videos
- **Face zone (30-70% vertical) stays clear** of persistent overlays
- Glass cards hug top 5% or bottom 6-10%
- Subtitles at 60% (chin area)
- KeywordPops are the only exception (brief, 1.5-2s, top 10%)

---

## Creator Portraits (Pixar Style)

**Prompt template (Gemini 3.1 Flash Image):**
```
Pixar 3D cinematic animation style — the EXACT rendering quality of Pixar's Inside Out 2, Soul, and Coco. Smooth subsurface-scattering skin, large expressive eyes with visible iris detail and specular highlights, slightly exaggerated proportions, volumetric atmospheric lighting with visible light rays, depth of field with subtle bokeh.

Portrait of [NAME], [DESCRIPTION — age, ethnicity, distinguishing features, clothing]. [BACKGROUND SETTING]. Purple to gold gradient ambient lighting. Square 1:1 portrait format. No text or words anywhere in the image.
```

**Must be:** 3D rendered (NOT 2D/watercolor/flat)
**Format:** 1:1 square, PNG
**Border in video:** 3px solid gold at 50% opacity, 20px border-radius, gold glow pulse

---

## Presentation Decks (HTML)

**Background:** `#06030f` (ink)
**Text:** White primary, bone secondary, gold for emphasis
**Gradient accents:** Purple → Gold on key elements
**Font:** Inter, same weight rules as video
**Slide transitions:** Fade or slide, keep it simple
**Cards/panels:** Use glass card style (see Colors section)

---

## Content Series Visual Identity

| Series | Badge Text | Emoji |
|--------|-----------|-------|
| How They Paid Rent | HOW THEY PAID RENT | (none, text only) |
| What Made Them Remarkable | THE 4 INGREDIENTS | (none) |
| The Rule They Broke | THE RULE THEY BROKE | (none) |
| Trust Years | TRUST YEARS | (none) |

All series badges use: gold text, letter-spacing 10px, 42px font, glass card background.

---

## Writing Style (Video Copy)

- **Never use em dashes** in any user-facing copy
- Subtitles match what's spoken, not a cleaned-up version
- Numbers always shown as digits, not words: "12" not "twelve"
- Creator names always full: "Tony Robbins" not "Tony R."
- Keep subtitle phrases to 2-5 words for readability
- CTA always ends with "Vibe Rise" as the brand closer

---

## Progress Indicators

**Progress dots** (for list/model videos):
- 4 dots, horizontal, top of screen (24px from top)
- Inactive: 12px wide, `rgba(255,255,255,0.15)`
- Active: 32px wide (pill shape), gold with glow
- Visible only during the list section, hidden during hook/CTA

---

## File Locations

| Asset | Path |
|-------|------|
| Remotion project | `/Users/nichuzz/creations/vibe-rise-videos/` |
| Overlay components | `vibe-rise-videos/src/overlays/` |
| Common styles/colors | `vibe-rise-videos/src/common.ts` |
| Creator portraits | `vibe-rise-videos/public/images/` |
| Canonical creator data | `vibe-rise-videos/public/experienceCreatorCanonical.json` |
| Rendered outputs | `vibe-rise-videos/out/` |
| Brand voice (app copy) | `Findmyflow/docs/BRAND_VOICE.md` |
| Page design guide (app) | `Findmyflow/docs/page-component-design-guide.md` |
