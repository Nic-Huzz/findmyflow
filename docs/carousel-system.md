# FindMyFlow Carousel System

**For any agent picking up carousel work.** Read this before touching anything.

---

## What This System Produces

7-slide Instagram carousels (1080x1350 PNGs) using Pixar-style photo backgrounds with text overlays, following the ClawdBot HTML system but adapted for FindMyFlow's visual brand.

**Pipeline:** JSON data → Python generator → self-contained HTML preview → Playwright PNG export → Instagram posting via Composio.

---

## Brand Config

```
Primary:       #5e17eb (purple)
Accent:        #E9A23B (gold)
Heading font:  Fraunces (Google Fonts, weight 600)
Body font:     Outfit (Google Fonts, weight 400-700)
Handle:        @_huzz
Brand name:    Find My Flow
Tagline:       Get Paid To Have Fun
```

**Typography rules:**
- Tags: 10px uppercase, weight 700, letter-spacing 2.5px, gold color
- Headlines: 28-38px Fraunces, weight 600, white with gold accent words (NOT italic)
- Body: 14px Outfit, rgba(255,255,255,0.85), max-width 340px
- Bold punchlines: white (#fff), weight 600
- No em dashes in copy. No italics on accent words (user explicitly removed them).

**Visual rules:**
- Pixar 3D photo backgrounds (1024x1024, generated via Gemini 3.1 Flash)
- Dark gradient overlay anchored at bottom for text contrast
- Text anchored to bottom of slide (justify-content: flex-end, padding: 0 36px 60px)
- Progress bar (white) + swipe arrow on every slide; no arrow on final slide
- 4:5 aspect ratio (420x525 viewport → 1080x1350 export)

---

## The Graph Series Template

15 carousels, all following this 7-slide structure:

| Slide | Type | Background | Content |
|-------|------|-----------|---------|
| 1 | Hook | Pixar scene (crossroads/tension) | Gold tag + bold question headline |
| 2 | Diagram | Pixar aerial + heavy dark overlay + inline SVG | Framework axes, arrows, zone labels |
| 3 | Zone 1 | Pixar scene (problem) | Zone name tag + headline + body |
| 4 | Crisis | Pixar scene (rupture/breakdown) | "THE CRISIS" tag + headline + body |
| 5 | Zone 2 | Pixar scene (paralysis) | Zone name tag + headline + body |
| 6 | Resolution | Pixar scene (freedom/flow) | Zone name tag + headline + body |
| 7 | CTA | Pixar scene (invitation) | Brand tag + question + body + @handle button |

**Carousel 1 (Sprouter Sweet Spot) is the reference implementation.** All decisions about typography, overlay strength, text positioning, and style were locked on this carousel. Future carousels should match it exactly.

---

## The 15 Carousels in Priority Order

1. **Sprouter Sweet Spot** — "Does work feel heavy instead of fun?" ✅ DONE
2. **Identity Sweet Spot** — "Who were you before the world told you who to be?"
3. **Enough Sweet Spot** — "Why you never start OR never finish"
4. **Execution Sweet Spot** — "Unhappiness = Happiness: the equation nobody told you about"
5. **Healing Sweet Spot** — "Is your healing making you more alive or less?"
6. **Vulnerability Sweet Spot** — "Why you overshare to strangers but can't be real with the people closest to you"
7-15. See `docs/zone-calibration-framework.md` for remaining sweet spot graphs.

Each follows the same 7-slide structure. The variables per carousel:
- Hook question
- Diagram (axes, zones, arrows)
- Zone names + descriptions
- Crisis framing
- Resolution framing
- CTA copy
- 6-7 Pixar background images (generated per carousel)

---

## File Structure

```
scripts/
├── build-carousel-1-sprouter.py    # Generator for carousel 1 (reference impl)
├── export-carousel-pngs.py         # Universal PNG exporter (works for any carousel)
├── generate-crisis-image.py        # Image generator with versioning (adapt per slide)
└── generate-finding-flow-image.py  # Another image generator example

public/images/carousel/
├── carousel-v2.html                # Generated HTML preview (DO NOT EDIT directly)
├── slide-1-hook.jpg                # Pixar backgrounds
├── slide-2-pattern.jpg
├── slide-2-misguided.jpg
├── slide-3-paralysis.jpg
├── slide-4-diagonal.jpg
├── slide-5-cta.jpg
├── slide-crisis.jpg
├── slide-finding-flow.jpg
├── overlays/                       # Original SVG overlays (reference only, superseded by HTML)
├── versions/                       # Archived image generations (timestamped)
├── export/                         # Final 1080x1350 PNGs for Instagram
│   └── slide_1.png ... slide_7.png
├── HANDOFF.md                      # Original handoff doc (partially stale)
└── preview.html                    # Original preview (v1, superseded by carousel-v2.html)
```

---

## How to Build a New Carousel

### Step 1: Copy and adapt the generator script

```bash
cp scripts/build-carousel-1-sprouter.py scripts/build-carousel-2-identity.py
```

Edit the new script:
- Update `TOTAL_SLIDES` if different from 7
- Update `OUTPUT_HTML` path
- Replace each `slide_N_*()` function's content (tag, headline, body, image filename)
- Update `slide_2_pattern()` with the new diagram SVG (new axes, zones, arrows)
- Update `build_html()` slide list and IG caption

### Step 2: Generate Pixar background images

For each slide, create a generation script (or adapt the existing ones):

```bash
cp scripts/generate-crisis-image.py scripts/generate-identity-hook-image.py
```

Edit the PROMPT to describe the new scene. Keep character consistency:
> "Pixar 3D cinematic animation style. A young man in his late 20s with curly brown hair, stubble, wearing his vibrant geometric-patterned open kimono shirt (purple, magenta, teal geometric pattern)..."

Run: `python3 scripts/generate-identity-hook-image.py`

Images save to `public/images/carousel/` with timestamped versions in `versions/`.

**Important:** Gemini 3.1 Flash Image Preview has NO free tier. Requires billing enabled on Google AI Studio. ~$0.05-0.15 per image. Budget ~$1 per carousel (7 images).

### Step 3: Build and preview

```bash
python3 scripts/build-carousel-2-identity.py
open public/images/carousel/carousel-identity.html
```

Iterate on copy/styling by editing the Python script and re-running. Refresh browser to see changes.

### Step 4: Export PNGs

Update `TOTAL_SLIDES` and `INPUT_HTML` in `export-carousel-pngs.py` if needed, then:

```bash
python3 scripts/export-carousel-pngs.py
```

PNGs land in `public/images/carousel/export/`.

### Step 5: Post to Instagram

Currently manual (upload PNGs from export folder). Composio integration is connected (@_huzz, IG user ID: 34856592823989391) but posting is done manually for now.

---

## Key References

- `docs/zone-calibration-framework.md` — The original IP. All 15 sweet spot graphs are defined here.
- `~/.claude/commands/carousel.md` — The `/carousel` slash command (ClawdBot system spec)
- `/Users/nichuzz/creations/ClawdBot/process/docs/INSTAGRAM-CAROUSEL-SYSTEM.md` — Full system spec with export rules, component snippets, design principles
- `docs/carousel-pipeline-plan.md` (in claude-portal repo) — Plan to productize this as Content Mode in Claude Portal

---

## Style Decisions Log (from Carousel 1)

These decisions were made during iteration and should carry forward:

1. **No italics on gold accent words** — user explicitly removed them. Just gold color, upright weight.
2. **No "Step N —" prefixes on tags** — just the zone name in uppercase (e.g., "UNFULFILMENT" not "STEP 1 — UNFULFILMENT").
3. **Body text pattern:** setup sentences (rgba white) + bold punchline (solid white, weight 600).
4. **Crisis slide:** uses same photo-background treatment as other slides (not a pattern-break dark gradient).
5. **CTA slide:** personal voice ("For the next 100 days I'm sharing how"), @_huzz handle in gold pill button.
6. **Finding Flow slide:** silent disco scene (character dancing with crowd wearing glowing headphones) — represents the community/movement, not a solo journey.
7. **Diagram slide (slide 2):** heavy dark overlay (0.62 opacity), inline SVG with white axes/arrows + gold Self-Actualisation label. Headline is Fraunces 50px.
8. **Image versioning:** every Gemini generation saves to `versions/` with timestamp. Canonical copy overwrites the main filename.

---

## Quick Start for a Fresh Agent

**Just run the skill:**

```
/graph-carousel Identity Sweet Spot
```

This loads all context, walks through every step, and enforces all style rules automatically.

**Or manually:**

1. Read THIS doc first
2. Read `docs/zone-calibration-framework.md` for the specific graph
3. Write a JSON data file following `data/carousels/01-sprouter.json` schema
4. Generate images via Gemini (`scripts/generate-crisis-image.py` as template)
5. Build: `python3 scripts/build-graph-carousel.py data/carousels/{NN}-{slug}.json`
6. Export: `python3 scripts/export-carousel-pngs.py`
7. Deliver PNGs from `public/images/carousel/export/`

The hard part (template, brand, typography, export pipeline) is solved. The per-carousel work is: write copy for 7 slides + generate 7 images + one diagram SVG.
