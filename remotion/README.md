# Remotion Video Studio

## Quick Start

```bash
npm run studio          # Open Remotion Studio (preview + edit props)
npm run render:nikigai  # Render Nikigai explainer to out/nikigai-explainer.mp4
```

## Creating a New Video

Just ask Claude. Tell me:
- What it's about (topic, message, vibe)
- Roughly how long
- Any specific text/copy you want

I'll create a new composition in `compositions/`, any new scenes/components needed, register it in `Root.tsx`, and add a render script to `package.json`.

## Tweaking an Existing Video

**No-code option:** Open Studio (`npm run studio`), select the composition, and edit props in the right panel - text, colors, examples all update live.

**Code changes:** Ask me to change animations, timing, scene order, or add new scenes.

## Adding Audio

1. Drop an `.mp3` file in `remotion/public/`
2. In Studio, set the `audioSrc` prop to the filename (e.g. `background-music.mp3`)
3. Or tell me the filename and I'll wire it up

Royalty-free music sources that match the FindMyFlow vibe:
- **Artlist.io** - Best quality, $10/mo. Search "inspirational ambient"
- **Epidemic Sound** - $15/mo. Try "hopeful", "transformation"
- **Pixabay Music** - Free. Search "inspirational piano"
- **Uppbeat.io** - Free tier available

## Rendering

```bash
npm run render:nikigai  # Specific video
npm run render          # Generic (needs composition ID + output path)
```

Output goes to `out/` (gitignored).

## Project Structure

```
remotion/
├── index.ts                    # Entry point
├── Root.tsx                    # Composition registry
├── brand.ts                    # Colors, fonts, spring configs
├── compositions/
│   └── NikigaiExplainer.tsx    # Nikigai framework explainer (45s)
├── scenes/
│   ├── BrandIntro.tsx          # Purple gradient reveal + title
│   ├── HookStatement.tsx       # Kinetic word-by-word text
│   ├── ThreeCircles.tsx        # Animated Venn diagram
│   ├── CircleDeepDive.tsx      # Zoom into one circle with examples
│   ├── Intersection.tsx        # Circles converge, gold center glow
│   └── CallToAction.tsx        # End card with gradient + URL
├── components/
│   ├── KineticText.tsx         # Word/letter/line reveal animations
│   ├── GradientBackground.tsx  # Animated gradient background
│   ├── Circle.tsx              # Glowing circle with pulse + examples
│   ├── SceneWrapper.tsx        # Layout wrapper
│   └── Subtitle.tsx            # Lower-third caption text
└── public/
    └── (audio files go here)
```

## Reusable Components

The component library grows with each video:

- **KineticText** - Word-by-word, letter-by-letter, or line-by-line text reveals with spring physics
- **Circle** - Animated circle with glow, pulse, label, and optional example bullets
- **GradientBackground** - Animated gradient with angle interpolation
- **SceneWrapper** - Consistent padding and centering
- **Subtitle** - Lower-third caption text with fade-in

## Brand System

Defined in `brand.ts`:

| Token | Value | Use |
|-------|-------|-----|
| `purple` | `#5e17eb` | Primary brand |
| `gold` | `#E9A23B` | Accent, CTAs |
| `skills` | `#8b5cf6` | Nikigai skills circle |
| `problems` | `#E9A23B` | Nikigai problems circle |
| `people` | `#10b981` | Nikigai people circle |
| `dark` | `#0f0a1a` | Backgrounds |

Fonts: **DM Serif Display** (headlines) + **Plus Jakarta Sans** (body).

Three spring configs: `springPlayful` (bouncy), `springSmooth` (elegant), `springSnappy` (quick pop).
