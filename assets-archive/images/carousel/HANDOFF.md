# Carousel 1: Sprouter Sweet Spot — Handoff

> **For the next agent:** This folder contains the assets and design for the first Instagram carousel in FindMyFlow's content series. The carousel is ~95% done. Below is everything you need to pick up where we left off.

---

## What This Is

A 6-slide Instagram carousel introducing the **Sprouter Sweet Spot** — the master map of FindMyFlow's Zone Calibration Framework. It uses Pixar-style imagery (the founder Nic's avatar — curly hair, colorful bandana, geometric kimono shirt) with text overlays.

**Category:** Find My Flow
**Promise:** Get Paid To Have Fun
**Audience:** Unfulfilled professionals (The Caged Creator)
**Hook:** "Does work feel heavy instead of fun?"

For full context on the brand, framework, and content strategy, read:
- `docs/content-strategy.md` (this is the master content strategy doc)
- `docs/zone-calibration-framework.md` (the original IP, 2200+ lines)
- `CLAUDE.md` (project overview)

---

## Files in This Folder

### Background images (Gemini 3.1 Flash generated, 1024x1024)
| File | Size | Purpose |
|---|---|---|
| `slide-1-hook.jpg` | 924 KB | Slide 1 — The crossroads (grey corporate vs golden creative path) |
| `slide-2-pattern.jpg` | 841 KB | Slide 2 — Aerial journey map showing the 3-stage path |
| `slide-2-misguided.jpg` | 921 KB | Slide 3 — Hamster wheel in corporate office |
| `slide-3-paralysis.jpg` | 936 KB | Slide 4 — Frozen in library with floating dreams |
| `slide-4-diagonal.jpg` | 911 KB | Slide 5 — Walking the golden diagonal between worlds |
| `slide-5-cta.jpg` | 738 KB | Slide 6 — Hand extended to viewer |

> **Note:** The filenames don't perfectly match the slide numbers because the carousel was restructured to add the journey map as slide 2. The original "slide-2-misguided" became slide 3 in the final order, etc.

### Overlay SVGs (1080x1080, transparent backgrounds)
Located in `overlays/`:
| File | Slide | Purpose |
|---|---|---|
| `slide-1-overlay.svg` | 1 | Hook headline |
| `slide-2-diagram.svg` | 2 | Journey diagram with axes, arrows, stage labels |
| `slide-3-overlay.svg` | 3 | Misguided Zone text |
| `slide-4-overlay.svg` | 4 | Paralysis Zone text |
| `slide-5-overlay.svg` | 5 | Self-Actualisation text |
| `slide-6-overlay.svg` | 6 | CTA text |

### Preview & docs
- `preview.html` — Live Instagram-style preview of all 6 slides. Open in browser. Currently uses inline SVG overlays.
- `overlays/README.md` — How to use the overlay SVGs in Canva/Figma.

### Hero image (parent folder)
- `../huzz-pixar-hero.png` (1.5 MB) — The original founder avatar used for the IG profile thumbnail in the preview.

---

## The 6 Slides — Final Structure

### Slide 1: The Hook
- **Image:** Crossroads scene
- **Text:** "Does work feel **heavy** instead of **fun?**"
- **Brand tag:** "FIND MY FLOW"
- **Status:** ✅ Locked

### Slide 2: The Pattern (Diagram Slide)
- **Image:** Aerial journey map
- **Headline:** "I've observed a pattern on the path to finding fulfilment"
- **Diagram contents:**
  - Action axis (Y), Self-Knowledge axis (X)
  - Faint gold diagonal in background
  - **Arrow 1:** From origin (0,0) curving up-and-left to UNFULFILMENT (top-left), label "Busy but empty"
  - **Arrow 2:** From Unfulfilment curving down-and-right to HEAD FULL OF DREAMS (bottom-right), label "Aware but stuck"
  - **Arrow 3 (gold):** Straight up from Head Full of Dreams to SELF-ACTUALISATION (positioned directly above), label "Action meets self-knowledge"
- **Status:** ✅ Locked. NO 0,0 dot, NO numbered badges, NO bubbles around zone names — just clean labels with subheadings.

### Slide 3: Step 1 — Unfulfilment
- **Image:** Hamster wheel in corporate office
- **Tag:** "STEP 1 — UNFULFILMENT"
- **Headline:** "Busy. Productive. **Quietly empty.**"
- **Body:** "High action. Low self-knowledge. Building the wrong life faster. **Busyness as armour.**"
- **Status:** ✅ Locked

### Slide 4: Step 2 — Head Full of Dreams
- **Image:** Frozen in library
- **Tag:** "STEP 2 — HEAD FULL OF DREAMS"
- **Headline:** "Head full of **dreams.**"
- **Body:** "10+ courses. Still stuck. 'I need to know more before I can start.' **Information is the drug. Integration is the cure.**"
- **Status:** ✅ Locked

### Slide 5: Step 3 — The Diagonal
- **Image:** Walking the golden diagonal
- **Tag:** "STEP 3 — THE DIAGONAL"
- **Headline:** "**Self-Actualisation.**"
- **Body:** "Action proportional to self-knowledge. Not hustling. Not stuck. **Just... flowing.**"
- **Status:** ⚠️ 85% confidence — "Just... flowing" might need sharpening

### Slide 6: CTA
- **Image:** Hand extended to viewer
- **Headline:** "Which zone are **you** in?"
- **Brand:** "Find My Flow / Get Paid To Have Fun"
- **Status:** ⚠️ 70% confidence — needs Nic's voice on the caption + confirmed handle

---

## Outstanding Decisions

### 1. Final design tool
The user is deciding between:
- **Continuing in HTML/SVG with this agent** (fast iteration, but limited)
- **Importing overlays into Canva** (visual editing, but slower iteration)
- **Importing into Figma** (full vector control)

The overlay SVGs in `overlays/` are designed to be importable into any of these tools. The README.md in that folder explains the workflow.

### 2. Slide 6 caption
The Instagram caption needs Nic's actual voice. Current draft is in `preview.html` near the bottom. Confirm the @findmyflow handle and adjust the CTA copy.

### 3. Slide 5 headline
"Just... flowing" might be too soft. Possible alternatives:
- "Just... aligned."
- "This is flow."
- Or something punchier from Nic.

### 4. Export workflow
Once finalized, each slide needs to be exported as 1080x1080 JPG/PNG for Instagram upload. Currently the preview.html shows them at 430x430 in phone frames. Final export hasn't been done yet.

---

## Brand Specs

**Colors:**
- Purple: `#5e17eb`
- Gold: `#E9A23B`
- White text on dark gradients

**Font:**
- Inter (800-900 weight for headlines, 500 for body)

**Image dimensions:**
- All Pixar backgrounds: 1024x1024 (Gemini default, scales fine to 1080)
- Overlay SVGs: 1080x1080 (Instagram standard)
- Final exports should be 1080x1080

**Visual style:**
- Pixar 3D animated, cinematic quality
- Consistent character across all slides: young man, curly brown hair, colorful geometric bandana, small hoop earring, light moustache, vibrant geometric-patterned open kimono shirt
- Purple-to-gold color palette
- Dramatic lighting, contrast between grey/cold (problem) and warm/golden (solution)

---

## How to Iterate

### To regenerate a Pixar background image
Use Gemini 3.1 Flash via the Google AI API. Prompts are saved in `docs/carousel-1-sprouter-image-prompts.md`. The API key is in `.env.local` as `GOOGLE_API_KEY`.

```bash
GOOGLE_API_KEY=$(grep GOOGLE_API_KEY .env.local | cut -d= -f2)
curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=$GOOGLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "YOUR PROMPT HERE"}]}],
    "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
  }' | python3 -c "
import json, sys, base64
d = json.load(sys.stdin)
for p in d.get('candidates',[{}])[0].get('content',{}).get('parts',[]):
    if 'inlineData' in p:
        img = base64.b64decode(p['inlineData']['data'])
        open('output.jpg','wb').write(img)
        print(f'Saved ({len(img)} bytes)')
        break
"
```

### To edit overlay text
Open the SVG file in any text editor. Change the `<text>` element contents. The SVGs are deliberately simple and editable.

### To preview changes
Open `preview.html` in a browser. It uses the same overlay structure inline so you can see how it looks immediately.

---

## Known Issues

### 1. Git is broken in this project directory
At time of handoff, `.git/HEAD` reads were timing out at the filesystem level. `cat .git/HEAD` hangs. `git status` returns "fatal: not a git repository" even though the .git folder exists with files.

**Workarounds:**
- Re-clone fresh: `git clone https://github.com/Nic-Huzz/findmyflow.git Findmyflow-fresh`, then copy these carousel files in
- Or work with files directly without git (current state)

This needs to be resolved before any git operations work in this project.

### 2. Slides 5 and 6 text are at lower confidence
See "Outstanding Decisions" above.

---

## What's Next After Slide 6

This is **Carousel 1 of ~15** in The Graph Series. The full series is documented in `docs/content-strategy.md` under "Pillar 1: The Graph Series".

**Next carousels in priority order:**
1. **Identity Sweet Spot** — "Who were you before the world told you who to be?"
2. **Enough Sweet Spot** — "Why you never start OR never finish"
3. **Execution Sweet Spot** — "Unhappiness = Happiness: the equation nobody told you about"
4. **Healing Sweet Spot** — "Is your healing making you more alive or less?"
5. **Vulnerability Sweet Spot** — "Why you overshare to strangers but can't be real with the people closest to you"

Each follows the same 6-slide structure: Hook > Pattern Diagram > Two Failure Zones > The Diagonal > CTA.

There's also a separate content pillar — **"Letters to Little Nic"** — mapped to wound stages. Don't confuse the two pillars.

---

## Key Files in the Project

- `docs/content-strategy.md` — Master strategy (read this first)
- `docs/zone-calibration-framework.md` — Original IP framework
- `docs/carousel-1-sprouter-image-prompts.md` — Image generation prompts
- `public/images/carousel/` — This folder
- `public/images/carousel/overlays/` — Editable SVG overlays
- `public/images/huzz-pixar-hero.png` — The hero avatar image
- `CLAUDE.md` — Project overview and tech stack

---

## Quick Start for the Next Agent

1. Read `docs/content-strategy.md` to understand the brand and strategy
2. Open `public/images/carousel/preview.html` in a browser to see the current state
3. Ask the user what they want to iterate on
4. For text changes: edit the inline SVGs in `preview.html` AND the standalone SVGs in `overlays/` to keep them in sync
5. For new background images: use the Gemini prompt template above
6. For final export: each slide needs to be rendered at 1080x1080 (currently the preview is at 430x430 inside phone frames)

Good luck. The hard work is done — Nic loves the direction, the framework is locked, the brand is clear. Just need to finish the polish and export.
