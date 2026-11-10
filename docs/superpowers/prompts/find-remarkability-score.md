# Find the Remarkability Score implementation

## What you're looking for
The Remarkability Score in the RemarkableFlow — a self-assessed 3-dimension rating that gates AI generation and the rest of the Blow Up Your Brand pipeline.

## Where to look
- **Flow file:** `src/flows/RemarkableFlow.jsx` — search for `STEPS.SCORE` (the score screen), `scoreUnique`, `scoreShare`, `scoreSimple`
- **DB columns:** `remarkable_angles` table — `score_unique`, `score_share`, `score_simple` (all smallint 1-5)
- **Display in creator home:** `src/components/CreatorHome/BlowUpBrandCard.jsx` — shows the multiplied score in the expandable Results detail row

## How it works
- **3 dimensions**, each self-rated 1-5 by the user:
  - **Uniqueness** — "How many others do this thing this way?"
  - **Shareability** — "If you saw someone doing this, would you tell a friend?"
  - **Simplicity** — "Could a stranger get it in under 10 seconds?"
- **Formula:** Uniqueness × Shareability × Simplicity = score out of 125
- **Gate logic:** If any dimension < 3, user gets "Sharpen" buttons looping back to the relevant step (Assumption, Different, or Compression). If all >= 3, AI generation unlocks.
- **Downstream:** The score is saved to `remarkable_angles` and displayed in BlowUpBrandCard. The existence of a `remarkable_angles` row unlocks Step 2 (Reach) in the Blow Up pipeline.

## Key lines in RemarkableFlow.jsx
- State: ~line 140 (`scoreUnique`, `scoreShare`, `scoreSimple`)
- Score screen render: ~line 940 (`if (step === STEPS.SCORE)`)
- Save to DB: ~line 286 and ~line 346
- Low-score feedback + sharpen buttons: ~line 1001-1024
