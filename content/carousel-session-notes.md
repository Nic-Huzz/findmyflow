# Carousel Session Notes

**For any agent picking up carousel work.** This documents all carousels built, their status, design decisions, and the pipeline used.

**System doc:** `docs/carousel-system.md` — brand config, template structure, full pipeline docs.
**Skill:** `/graph-carousel` — automated workflow for Graph Series carousels.

---

## Pipeline

All carousels use the same system:
- **Python generator script** → self-contained HTML preview (420×525 viewport, IG frame wrapper)
- **Playwright export** → 1080×1350 PNGs (or 1080×1350 MP4s for video slides)
- **ffmpeg** for video slides with text overlays (Pillow creates PNG overlay, ffmpeg composites onto video)
- **Brand:** Purple (#5e17eb) → Gold (#E9A23B), Fraunces (headings) + Outfit (body), no italics on gold accent words, no em dashes

**Key files:**
- `scripts/export-carousel-pngs.py` — universal PNG exporter (update INPUT_HTML/OUTPUT_DIR/TOTAL_SLIDES before each run)
- `scripts/generate-crisis-image.py` / `scripts/generate-4r-images.py` — Gemini 3.1 Flash image generation with versioning
- Fonts cached at `/tmp/carousel-fonts/Fraunces-SemiBold.ttf` and `/tmp/carousel-fonts/Outfit.ttf`

---

## Carousels Built (in order)

### 1. Sprouter Sweet Spot (Carousel 1) ✅ POSTED Apr 9
- **Script:** `scripts/build-carousel-1-sprouter.py`
- **Draft:** `public/images/carousel/carousel-v2.html`
- **Export:** `public/images/carousel/export/` (7 slides)
- **Type:** Graph Series — Pixar photo backgrounds + text overlays
- **Content:** Hook → Pattern diagram → Unfulfilment → Crisis → Head Full of Dreams → Finding Flow → CTA
- **Images:** 7 Pixar JPGs generated via Gemini (in `public/images/carousel/images/`)
- **Performance:** 997 views, 13 likes, 2 comments, 2 shares, 2 saves
- **Notes:** First carousel. Established the entire pipeline. Pixar character: young man, curly brown hair, stubble, geometric kimono shirt. All style decisions (no italics, gold accents, dark gradient overlays, Fraunces+Outfit) were locked on this carousel.

### 2. Installation Map ✅ POSTED Apr 15
- **Script:** `scripts/build-installation-map-draft.py`
- **Draft:** `public/images/carousel/installation-map-draft.html`
- **Export:** `public/images/carousel/export-installation-map/` (8 slides)
- **Type:** Triptych + text — wound stages with 3 Pixar scene images per stage
- **Content:** Hook → 4 wound stages (When you were a kid / As you got older / At School / With Friends) → Protective voices (Controller, Ghost, Perfectionist, Auto-Pilot) → CTA
- **Design:** Option B triptych layout (vertical stacked cards: image left, text right). Brand purple background. "Which experience did you have?" subtitle on each stage.
- **Images:** Reused existing Pixar onboarding images from `public/images/onboarding/`
- **Key decisions:** Used new 4+1 archetype model (Controller/Ghost/Perfectionist/Auto-Pilot + People Pleaser mask). Zone headings: "Seen but not safe" / "Safe but not seen". Removed People Pleaser footer. CTA: "Ready to quieten your protective voice?"

### 3. Flow Finder (Career Clarity) ✅ POSTED Apr 19
- **Script:** `scripts/build-flow-finder-carousel.py`
- **Draft:** `public/images/carousel/flow-finder-draft.html`
- **Export:** `public/images/carousel/export-flow-finder/` (8 slides, but check — may need re-export)
- **Type:** Text-only, brand purple bg
- **Content:** Hook (best career clarity framework) → Steve Jobs quote → Collect (every experience is a dot) → Insight (business = problem + person + skills) → Connect (skills/problems/people) → Venn diagram → Application (job seekers vs entrepreneurs) → CTA
- **Key decisions:** Venn diagram with gold (Skills) + blue (Problems) + green→blue (People). "Experiences you don't want others to have" changed to "you're passionate about solving" for Problems. Diagram slide was removed then added back. Final version has both Venn + application slide.

### 4. Experience Creator Matching ✅ POSTED Apr 22
- **Script:** `scripts/build-experience-creator-carousel.py`
- **Draft:** `public/images/carousel/experience-creator-draft.html`
- **Export:** `public/images/carousel/export-experience-creator/` (7 slides)
- **Type:** Story-driven with Pixar creator portraits
- **Content:** Hook (scaling your experience business like the best) → 3-layer model → Brené Brown's journey → Tony Robbins' journey → Wim Hof's journey → Pattern comparison table → CTA
- **Key decisions:** Tracks 3 creators through the same 3-layer model (Attraction → Core → Continuity). Brené's attraction = "deep research" not TED talk. Wim Hof replaced James Clear (not an experience creator). Creator portraits from `public/images/creators/`.

### 5. Zone Calibration 📝 DRAFT (two versions)
- **Script:** `scripts/build-zone-calibration-carousel.py`
- **Draft:** `public/images/carousel/zone-calibration-draft.html`
- **Status:** Draft — v2 (corridor metaphor) built but not posted
- **Content v2:** Hook (nervous system decided how far you're allowed to go) → Setup (ceiling/floor/corridor) → Thesis (safety system, "don't go there again") → Corridor visual (SVG) → Identity example → Vulnerability example → 5 protectors → 8 domains → The shift → CTA
- **Notes:** Uses old 5-archetype model in the protectors slide (Performer still listed). Needs updating to 4+1 if posted. Corridor visual uses SVG with "you are here" pin.

### 6. Marketing Sweet Spot 📝 DRAFT
- **Script:** `scripts/build-marketing-sweet-spot-carousel.py`
- **Draft:** `public/images/carousel/marketing-sweet-spot-draft.html`
- **Status:** Draft — slide 7 (archetype → rule break mapping) needs replacing. User said it was "an oversimplification we decided not to pursue."
- **Content:** Hook → Trust×Attention equation → 4-zone graph → Trust axis (12yr avg) → Attention axis → 5 remarkable triggers (verified %s: 96/95/93/91/82) → [slide 7 TBD] → CTA

### 7. Fun Graph ✅ EXPORTED (single slide)
- **Script:** `scripts/build-fun-graph-carousel.py`
- **Draft:** `public/images/carousel/fun-graph-single.html`
- **Type:** Single-slide diagram — Joy × Presence
- **Zones:** Performing (top-left), Fun Sweet Spot (diagonal, gold), Numb (bottom-right)

### 8. Play-List (What is your Play-List?) ✅ POSTED Apr 27
- **Script:** `scripts/build-playlist-carousel.py`
- **Draft:** `public/images/carousel/playlist-draft.html`
- **Export:** `public/images/carousel/export-playlist/` (4 slides)
- **Content:** "What do you want to be when you grow up?" → "What experiences do you want to have?" → "What do you find fun?" → Fun = Engagement (gold) + Joy (blue) Venn diagram

### 9. The 4R's of Healing ✅ POSTED Apr 28
- **Script:** `scripts/build-4r-carousel.py`
- **Draft:** `public/images/carousel/4r-draft.html`
- **Export:** `public/images/carousel/export-4r/` (9 slides)
- **Type:** Personal story + Pixar images
- **Content:** Hook (quit job, go all in) → $30K on courses → Insight (body protecting from past experience) → The 4 R's list → Recognise (Pixar: door) → Reconnect (Pixar: inner child) → Release (Pixar: cloud dissolving) → Rewire (Pixar: walking through door) → CTA
- **Images:** 5 Pixar images generated via Gemini (`4r-hook.jpg`, `4r-recognise.jpg`, `4r-reconnect.jpg`, `4r-release.jpg`, `4r-rewire.jpg`)
- **Key decisions:** Personal story rewrite — "I wanted to quit my job and go all in on myself" + "$30K on 52 courses" + "shame of failure after past experiences in footy". Process branded as "Subconscious Shift" (saved to Obsidian). CTA: "Ready to remove the block and take action?"

### 10. Movement Makers ✅ POSTED Apr 30
- **Script:** `scripts/build-movement-makers-carousel.py`
- **Draft:** `public/images/carousel/movement-makers-draft.html`
- **Export:** `public/images/carousel/export-movement-makers/` (7 slides)
- **Type:** Product/sales carousel for the cohort offering
- **Content:** Hero (Get Paid To Have Fun) → Who inspires you? (3 creator portraits) → Transformation (where you are → where you're going) → System (4 phases) → Story (quote) → Proof (2×2 stats grid) → CTA
- **Key decisions:** Removed pricing slide. Removed badges from slide 1. Changed Setup → "Your Play Profile". Changed Pre-Event → "The Room-Filling System". CTA: "Keen to learn more about Movement Makers?"

### 11. My Work Explained ✅ POSTED May 3
- **Script:** `scripts/build-work-explained-carousel.py`
- **Draft:** `public/images/carousel/work-explained-draft.html`
- **Export:** `public/images/carousel/export-work-explained/` (6 slides)
- **Type:** Personal story with real photos
- **Content:** "My work explained" (dance photo) → Kid photo (superman shirt) → "I believe... unsafe" → Rainbow clothes photo (age 14 with dad) → Emotional splinter heartbreak → "What is healing? Removing fear."
- **Images:** Real personal photos copied to `public/images/carousel/images/work-explained-*.jpg`
- **Key decisions:** Slide 2 uses photo as background with purple background-color for gaps. Slide 4 uses the dad+Huzz rainbow clothes photo (replaced from solo shot). "14 years" changed to "12 years". Removed "Outcasting me."

### 12. Vibe Rise Challenge ✅ EXPORTED May 15
- **Script:** `scripts/build-vibe-rise-carousel.py`
- **Draft:** `public/images/carousel/vibe-rise-draft.html`
- **Export:** `public/images/carousel/export-vibe-rise/` (2 videos + 3 PNGs)
- **Type:** Mixed video + text slides
- **Content:** Shirt rip video (slide 1) → "I discovered it after 1 year of things that terrified me" video (slide 2) → "I was a Zoombie on auto-pilot" text → "Vibe Rise can be trained" + formula → "100 days of Vibe Rise"
- **Video pipeline:** Pillow creates transparent PNG overlay → ffmpeg composites onto cropped/padded video (4:5 aspect). Fonts: Fraunces-SemiBold.ttf + Outfit.ttf from Google Fonts cached at `/tmp/carousel-fonts/`.
- **Key decisions:** Multiple story arc iterations. Final: shirt rip as slide 1 (most engaging), 60s video as slide 2. "Zoombie" pun on Zoom. Expression × Safety = Vibe Rise formula. Condensed from 9 slides to 5.

### 13. Vibe Rise — The Game 📝 DRAFT (built Jun 5)
- **Script:** `scripts/build-vibe-rise-game-carousel.py`
- **Draft:** `public/images/carousel/vibe-rise-game-draft.html`
- **Status:** Draft — not yet exported or posted
- **Type:** Dark cinematic aesthetic (matching vibe-rise-story-v2.html presentation)
- **Content:** Hook (still stuck despite self-help) → VIBE RISE title → 5 defence patterns → Essence Voice → 3 weapons (Tune/Wahoo/Healing) → Equation → Fantasy League → Stakes (zombie vs alive) → CTA (download)
- **Notes:** Distilled from 30+ slide `public/vibe-rise-story-v2.html` presentation. Uses dark backgrounds (ink/deep purple) instead of brand purple. Outfit font only (no Fraunces). IG frame styled dark to match.

---

## Design Patterns Established

### Visual styles used across carousels:
1. **Brand purple text-only** — most carousels (Installation Map, Flow Finder, 4R's text slides, etc.)
2. **Pixar photo backgrounds** — Carousel 1, 4R's image slides. Dark gradient overlay anchored at bottom.
3. **Triptych** — Installation Map slides 2-5. Three vertical cards (image left, text right).
4. **Real photo backgrounds** — My Work Explained. Personal photos with dark overlay.
5. **Dark cinematic** — Vibe Rise Game. Ink/deep purple backgrounds, film grain aesthetic.
6. **Video + text overlay** — Vibe Rise Challenge. ffmpeg pipeline.

### Recurring elements:
- Gold tag labels (10px uppercase, letter-spacing 2.5px)
- Headlines: Fraunces 22-38px, weight 600, `<span style="color:#E9A23B;">` for gold accents
- Body: Outfit 13-15px, rgba(255,255,255,0.85)
- Bold punchline: white (#fff), weight 600
- Progress bar + swipe arrow on every slide (no arrow on last)
- IG frame wrapper for preview (420px wide, header, dots, actions, caption)

### Export pipeline:
```bash
# For text/image slides:
python3 scripts/build-{name}-carousel.py          # Generate HTML
python3 scripts/export-carousel-pngs.py            # Export PNGs (update INPUT_HTML/OUTPUT_DIR/TOTAL_SLIDES first)

# For video slides:
python3 -c "from PIL import ..."                   # Create text overlay PNG
ffmpeg -y -i input.mov -i overlay.png -filter_complex "..." output.mp4
```

---

## Content History (Supabase)

All 25 IG posts (as of Apr 29) are stored in `content_history` table with engagement data, IG post IDs, and permalinks. Query:
```sql
SELECT * FROM content_history WHERE platform = 'instagram' ORDER BY posted_at DESC;
```

**Top performers by likes:** "Essence yearning" carousel (108), Day 1 dancing reel (67), Talent show reel (56), Costume update (45), "Embrace your weird" reel (30).

**Pattern:** Reels outperform carousels on average. Personal/vulnerable posts massively outperform educational ones.

---

## Instagram

- **Handle:** @_huzz
- **Account type:** Business/Creator
- **Composio connected:** Yes (IG user ID: 34856592823989391)
- **Composio limitation:** Can't post carousels directly (needs publicly hosted image URLs). User posts manually from export folders.
- **Caption style:** "Day X/100 Play-list challenge:" opener, casual/warm, emoji-friendly, conversational, tags friends. No hashtags (removed by user preference).

---

## Archetype Model (for content)

Use the **4+1 model** (not the old 5-archetype model):

|              | Sympathetic (energised) | Dorsal (shutdown)       |
|--------------|-------------------------|-------------------------|
| **Toward**   | Controller (fight)      | Perfectionist (freeze)  |
| **Away**     | Ghost (flight)          | Auto-Pilot (collapse)   |

+ People Pleaser (fawn) — mask layered on any of the four.

**One-liners:**
- Controller: "Leaving it to chance isn't an option."
- Ghost: "I don't feel comfortable sharing."
- Perfectionist: "I'm not ready yet."
- Auto-Pilot: "I'm fine, just tired."

See `docs/carousel-system.md` and memory file `project_archetype_restructure.md` for full context.

---

## Key References

- `docs/carousel-system.md` — full system doc (brand, template, pipeline, style decisions)
- `docs/zone-calibration-framework.md` — all sweet spot graphs (Original IP)
- `docs/marketing-sweet-spot.md` — Trust × Attention framework + 5 remarkable triggers
- `docs/vibe-rise-ecosystem-architecture.md` — Vibe Rise scientific foundation + product architecture
- `docs/carousel-installation-map.md` — Installation Map carousel spec
- `data/carousels/01-sprouter.json` — JSON data format for template/data separation
- `scripts/build-graph-carousel.py` — universal Graph Series builder (reads from JSON)
- `~/.claude/commands/graph-carousel.md` — `/graph-carousel` skill for automated workflow

---

## Recommendations for Next Agent

### Pipeline improvements
1. **Parameterise the export script.** Currently `export-carousel-pngs.py` requires manual editing of INPUT_HTML, OUTPUT_DIR, and TOTAL_SLIDES before each run. Add argparse so it becomes: `python3 scripts/export-carousel-pngs.py --input vibe-rise-game-draft.html --slides 9`. Every export becomes a one-liner.

2. **Supabase Storage bucket for Composio posting.** Create a `carousel-exports` public bucket in Supabase. Then the export script can upload PNGs → get public URLs → Composio posts directly to IG. Eliminates manual posting. Blocked last time by RLS on bucket creation — needs service role key or dashboard creation.

3. **Video slide pipeline is fragile.** Currently: Pillow creates PNG overlay → ffmpeg composites. Font files cached in `/tmp/` (disappear on reboot). Move fonts to `public/fonts/` or `scripts/fonts/` permanently. Consider writing a `scripts/build-video-slide.py` utility that takes video path + text lines + output path.

### Drafts to finish
4. **Zone Calibration carousel** — strong content, needs protectors slide updated from old 5-archetype model to 4+1 (Controller/Ghost/Perfectionist/Auto-Pilot). Ready to post after that one fix.

5. **Marketing Sweet Spot carousel** — slide 7 (archetype → rule break mapping) was rejected as oversimplification. Options proposed but not chosen: (A) show one creator's triggers mapped, (B) diagnostic question "what do your people believe that nobody in your field is saying?", (C) craft vs channel insight, (D) remove and go 7 slides. Ask user which direction.

6. **Vibe Rise Game carousel** — built Jun 5, never exported. 9-slide dark cinematic aesthetic distilled from the 30-slide presentation. Ready to export and post.

### Content strategy observations
7. **Personal story carousels outperform framework carousels.** The user's IG data shows vulnerable/personal posts get 2-5x more engagement than educational ones. Future carousels should lead with personal story and land the framework through the story, not the other way around. The 4R's carousel is the best example of this pattern done well.

8. **Video slides are underexplored.** Only used on the Vibe Rise Challenge carousel. IG algorithm favours video. Future carousels should consider video slide 1 (hook) even on otherwise-image carousels — the shirt rip as slide 1 was the strongest hook we built.

9. **Caption style matters.** User's voice is casual, warm, emoji-friendly, no hashtags. "Day X/100" opener. Draft captions that sound polished get rewritten — match the voice from the start. Reference recent IG posts via Composio (`INSTAGRAM_GET_IG_USER_MEDIA`) to stay current on voice.

10. **The 100-day challenge is now "Vibe Rise" not "Play-List."** All future daily content should use "Vibe Rise Challenge" branding, not "Play-List Challenge." The equation: Expression × Safety = Vibe Rise.

### Template/data separation
11. **Only Carousel 1 (Sprouter) has a JSON data file** (`data/carousels/01-sprouter.json`). The universal builder (`scripts/build-graph-carousel.py`) works but was only tested on carousel 1. All other carousels have hardcoded Python scripts. For the Graph Series specifically, creating JSON files for each would make the `/graph-carousel` skill much more powerful. Low priority — the per-script approach works fine for non-Graph-Series carousels.

### Engagement tracking
12. **Content history table needs updating.** Only 25 posts stored (as of Apr 29). Run `INSTAGRAM_GET_IG_USER_MEDIA` via Composio and bulk-insert new posts to keep the CRM current. Also update engagement_data on older posts (likes/comments change over time).
