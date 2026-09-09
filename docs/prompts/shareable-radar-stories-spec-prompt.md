# Prompt: Spec + Build Shareable Radar Story Set

## What To Build

A "Share My Journey" feature that generates 3 sequential images from a user's per-quest radar data, designed to be shared as Instagram Stories (tap-through sequence). Each image shows one more layer of the radar, building a visual story of comfort zone expansion.

**Story 1:** Start shape only
> Text overlay: "Where my comfort zone started."

**Story 2:** Start + Now shapes overlaid
> Text overlay: "[X] courage challenges later." (X = actual count from quest data)

**Story 3:** Start + Now + Dream shapes overlaid
> Text overlay: "Where I still need to grow."

The tap-through creates the reveal. Each tap the shape gets bigger. That's the hook.

## Why This Matters

This is the first piece of the "become known" mechanism in the product. The thesis: comfort zone → experience → brand → career. The app covers comfort zone → experience. Shareable content like this closes the loop to brand — it turns invisible progress into visible evidence.

See `docs/frameworks/find-my-flow-x-category-pirates.md` (v3 section, "The Become Known Mechanism") for full strategic context.

## What Already Exists

### PerQuestRadar component (`src/components/PerQuestRadar.jsx`)

This component already renders all three layers on a single SVG:
- **Start** (purple dashed) — `quest.current_dimensions` from path definition in Choose Quests
- **Now** (purple filled) — max dimension levels from completed courage challenges (`actualProgress`)
- **Dream** (gold dashed) — `quest.dream_dimensions` from path definition

Key implementation details:
- Uses `DOME_DIMENSIONS` from `src/data/domeDimensions.js` (8 dimensions)
- `buildPolygon()` function converts dimension values to SVG polygon points
- SVG is 310x310 with rings, spokes, dimension labels with icons
- Gap highlighting: top 2 dimensions with biggest aspiration-actual gap get pulse rings
- Also renders Life Fuel bars (Choice/Connection/Mastery/Meaning) and "Biggest growth area" insight

### Data available per quest

From Supabase `quests` table:
- `quest.name` — e.g., "Dance Events"
- `quest.current_dimensions` — JSONB, starting values per dimension
- `quest.dream_dimensions` — JSONB, aspiration values per dimension
- Courage challenge count — from `groan_challenges` linked to quest

From computed `actualProgress`:
- Max dimension level reached from completed challenges (calculated in component)

### Existing styles
- `src/components/PerQuestRadar.css`
- `src/components/DomeOfSafety.css` (shared radar styles)
- Brand colors: purple `#5e17eb`, gold `#E9A23B`, background `#f5f5f0` or white
- Light theme throughout

## Spec Requirements

### 1. Three-Image Generation

Generate 3 separate images (not a gif, not a single image). Each image is a standalone radar visualization at story dimensions (1080x1920px or 9:16 aspect ratio).

**Image 1 — "Start":**
- Radar chart showing ONLY the Start polygon (purple dashed)
- All 8 dimension labels visible
- Rings/spokes visible for context
- Quest name at top (e.g., "Dance Events")
- Text overlay at bottom: "Where my comfort zone started."
- Vibe Rise branding subtle (small logo or wordmark in corner)

**Image 2 — "Now":**
- Radar showing Start (faded/ghost, thinner line) + Now polygon (purple filled)
- Same dimension labels, rings, spokes
- Quest name at top
- Courage challenge count badge (e.g., "9 courage")
- Text overlay: "[X] courage challenges later." where X is the actual count
- Optional: "Biggest growth area: [dimension]" insight line

**Image 3 — "Dream":**
- Radar showing Start (faded) + Now (purple filled) + Dream (gold dashed)
- Same dimension labels, rings, spokes
- Quest name at top
- Text overlay: "Where I still need to grow."
- Optional: highlight the gap dimensions with pulse or glow

### 2. Generation Method

Two possible approaches (recommend one):

**Option A: Canvas/SVG-to-image in browser**
- Render each frame as an SVG (reuse `buildPolygon` from PerQuestRadar)
- Convert to PNG via canvas (`drawImage` from SVG → `toDataURL`)
- Save to device or trigger native share sheet
- Pro: No server needed, works offline
- Con: Text rendering on canvas can be inconsistent, font loading

**Option B: Server-side generation via edge function**
- Send dimension data to a Supabase edge function
- Generate images server-side (e.g., Satori/Resvg for SVG→PNG)
- Return 3 image URLs
- Pro: Consistent rendering, can cache
- Con: Requires edge function, network dependency

### 3. Share Flow UX

Where this lives in the app:
- **Primary:** Button on PerQuestRadar card on Progress tab — "Share my journey" or share icon
- **Secondary:** Could also appear in Weekly Review completion screen

Share flow:
1. User taps share icon on their quest radar card
2. Brief loading state while 3 images generate
3. Preview screen showing all 3 frames as a horizontal scroll (so they can review)
4. "Share" button triggers native share sheet (via Capacitor Share API on iOS, Web Share API on web)
5. User picks Instagram Stories (or any other target)

On iOS (Capacitor): use `@capacitor/share` plugin. For Instagram Stories specifically, can use the Instagram Stories share scheme (`instagram-stories://share`) which accepts background images.

### 4. Text Overlay Customization

The default text works for most users, but power users might want to customize:
- Allow editing the text overlay on each frame before sharing
- Keep defaults pre-filled
- Character limit ~60 per frame (IG story readability)

### 5. Branding

- Light background (#f5f5f0 or white)
- Purple (#5e17eb) for the Now polygon
- Gold (#E9A23B) for the Dream polygon  
- Light grey/purple for the Start polygon
- Vibe Rise wordmark or small logo in bottom corner (not dominant)
- Quest name in Inter 700 at top
- Overlay text in Inter 600, large enough to read on mobile
- No cluttered UI chrome — clean, minimal, the radar is the hero

### 6. Data Model

New table or additions needed:

```sql
-- Track share events for flywheel measurement
CREATE TABLE share_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  share_type text NOT NULL, -- 'radar_journey', 'dome_shape', 'weekly_review', etc.
  quest_id uuid REFERENCES quests, -- nullable, only for quest-specific shares
  platform text, -- 'instagram_stories', 'whatsapp', 'copy_link', 'other'
  metadata jsonb DEFAULT '{}', -- frame count, which frames shared, custom text used
  created_at timestamptz DEFAULT now()
);

-- RLS: users can only insert/read their own
ALTER TABLE share_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own shares" ON share_events
  FOR ALL USING (auth.uid() = user_id);
```

### 7. Edge Cases

- **No Start data:** User skipped path definition in Choose Quests. Show only Now + Dream (2 stories instead of 3). Text: "My comfort zone now." → "Where I'm headed."
- **No Dream data:** User hasn't set aspirations. Show only Start + Now (2 stories). Text: "Where I started." → "[X] courage challenges later."
- **No Now data (no challenges completed):** Show Start + Dream (2 stories). Text: "Where I'm starting." → "Where I'm going."  
- **Only 1 layer available:** Don't show share button. Need at least 2 layers for a story to make sense.
- **Zero courage challenges:** Don't show the count badge. Adjust text accordingly.

### 8. Privacy

- Share is always user-initiated (never auto-shared)
- Images contain: quest name, dimension labels, shape data, courage count
- Images do NOT contain: user name, profile photo, specific challenge details, healing data
- User can see exactly what will be shared before sharing (preview screen)

### 9. Implementation Priority

Build in this order:
1. SVG-to-image generation for the 3 frames (reuse existing `buildPolygon`)
2. Preview screen with horizontal scroll
3. Native share sheet integration
4. `share_events` table + tracking
5. Text customization (optional, can defer)
6. Instagram Stories deep link (optional, can defer)

### 10. Future Extensions (Don't Build Now)

- Animated version (video/gif) for Reels
- "Compare with last month" variant
- Community feed where shared radars are visible in-app
- Auto-generated caption suggestions based on growth data
- QR code overlay linking to user's public profile

## Codebase Reference

- Radar component: `src/components/PerQuestRadar.jsx`
- Radar styles: `src/components/PerQuestRadar.css`, `src/components/DomeOfSafety.css`
- Dome dimensions: `src/data/domeDimensions.js`
- Capacitor share: check if `@capacitor/share` is already installed in `package.json`
- Existing share buttons: search for `navigator.share` or `Share` in codebase for patterns
- Supabase client: `src/lib/supabaseClient.js`
- Strategy context: `docs/frameworks/find-my-flow-x-category-pirates.md` (v3 "Become Known" section)
- Shareable content master spec prompt: `docs/prompts/shareable-experience-content-spec-prompt.md`

## Design Constraints

- **Light theme throughout.** Never dark backgrounds.
- **Write so a 12-year-old would understand.** No jargon on text overlays.
- **Never use em dashes** in user-facing text.
- **iOS app via Capacitor** — must work with native share sheet.
- **9:16 aspect ratio** for story format (1080x1920px).
- Brand colors: Purple (#5e17eb) → Gold (#E9A23B). Background #f5f5f0 or white.
