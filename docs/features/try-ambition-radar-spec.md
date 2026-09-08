# /try/ambition-radar — Lead Magnet Spec

## What This Is

A standalone public page at `/try/ambition-radar` (no login required) that lets someone see the gap between where they are and where they want to be on a visual radar. Extracts the path definition setup from `/choose-quests` as a free lead magnet.

## Why It Exists

- Gives immediate self-knowledge (the radar is the takeaway)
- Creates awareness of the gap (which is the motivation to sign up)
- Captures email for follow-up
- The radar result is shareable, creating organic spread

## User Flow

### Step 1: Dream Input
"What's a dream life path or ambition of yours?"
Free text input. e.g. "Run ecstatic dance events", "Start a coaching business", "Travel and write"

### Step 2: Dream Dimensions (Ambition Radar)
"If this came to life, what would it look like?"
User sets dream levels on all 8 dimensions using tier pickers from `domeDimensions.js` (`dreamQuestion` field). This builds their gold radar target.

### Step 3: Precursor
"Have you taken any steps on this already?"
5 single-select cards from `precursorDefaults.js`:
- Not yet
- I've tried it
- I do it for fun
- I've been paid
- It's my job

Pre-fills current levels on all 8 dimensions via `PRECURSOR_DEFAULTS`.

### Step 4: Reality Check
"Here's where we think you are. Update anything that doesn't feel right."
All 8 dimensions shown with current levels pre-filled from precursor. User taps to adjust any dimension to reflect where they actually are. Uses existing tier pickers with `current` styling (purple left border).

### Step 5: Results + Invitation
1. **Animated radar reveal**: current (purple) dome renders first, then dream (gold) layer animates outward. The visual expansion IS the gap.
2. **Gap summary**: plain language about the biggest gaps (e.g. "You're reaching 5 people but dream of 500. You're at hobby level but want full-time income.")
3. **Share button**: download/screenshot the radar image
4. **Email capture**: "Want help closing this gap?"
5. **CTA**: "Get my first challenge" → saves data, redirects to signup

## What to Reuse

| Component/Data | File | What to reuse |
|---|---|---|
| 8 dome dimensions + tiers | `src/data/domeDimensions.js` | `DOME_DIMENSIONS`, `dreamQuestion` field, tier levels |
| Precursor levels + defaults | `src/data/precursorDefaults.js` | `PRECURSOR_LEVELS`, `PRECURSOR_DEFAULTS` |
| Radar visualisation | `src/components/DomeOfSafety.jsx` | `domeEdges` (current/purple) + `edgeZone` (dream/gold) |
| CSS patterns | `src/flows/ChooseQuestsFlow.css` | `cqf-pd-*` classes for precursor cards, tier pickers |

## What's New

1. **Page component**: `src/pages/AmbitionRadar.jsx` + `AmbitionRadar.css`
2. **Route**: `/try/ambition-radar` in `AppRouter.jsx` (public, no AuthGate)
3. **Animated radar reveal**: current dome renders, then gold dream layer expands with CSS animation
4. **Share/download button**: captures radar SVG as downloadable image
5. **Lead storage**: save to `lead_captures` table (dream_text, precursor, current_dimensions, dream_dimensions, email)

## Design Notes

- No login required (public lead magnet)
- Light theme, `#f5f5f0` background
- Brand gradient on CTA (purple → gold)
- Mobile-first, max-width 480px
- No em dashes in copy
- 12-year-old language
- Step 2 dimensions shown one at a time (card stack), not all 8 at once
- Step 4 shows all 8 in a compact list, tap to expand/adjust

## Animated Reveal (Step 5)

1. Purple dome (current) fades + scales in (0.8s)
2. 0.5s pause
3. Gold ring (dream) expands outward from center (0.8s)
4. Gap labels fade in after both shapes settle
5. Share button + CTA appear last

## Gap Summary Logic

Find the 2-3 dimensions with the largest gap (dream - current). Generate plain language:
- Numeric dims: "You're reaching {current_tier_label} people but dream of {dream_tier_label}"
- Qualitative dims: "You're at '{current_label}' on {dim} but want '{dream_label}'"

## Data Saved to lead_captures

```json
{
  "source": "ambition-radar",
  "email": "user@example.com",
  "scores": {
    "dream_text": "Run ecstatic dance events",
    "precursor": "tried_it",
    "current_dimensions": { "people": 1, "money": 1, ... },
    "dream_dimensions": { "people": 6, "money": 4, ... }
  }
}
```

## Post-Signup Bridge

If the user signs up after the lead magnet, their data from `lead_captures` can pre-load their first quest in `/choose-quests`, skipping steps they've already answered.
