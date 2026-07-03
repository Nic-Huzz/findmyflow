# Blow-Up Engine: Data Corrections & Nuances

Date: 2026-06-01
Status: Reference doc for any agent building the "Deploy Your Blow-Up Engine" flow
Related: `docs/experience-creator-world-tour.md`, Obsidian `Blow-Up Recipes - Category, Content, Portable.md`

## Number corrections

The DNA file (`public/data/experienceCreatorDNA.json`) has already been corrected. Any brief or flow copy should use these numbers:

| Claim in original brief | Corrected value | Why |
|---|---|---|
| Category Creation avg 2.8 years | **3.0 years** | Jeff Krasno's `yearsToBlowUp` was missing, now set to 1 |
| "Viral Content" 7/32 | **"Content Vehicle" 8/32** | 4 strictly viral + 3 documentary + 1 new media format. "Viral" is a misnomer for Esther Perel (podcast), Dispenza and Beckwith (cinema documentaries) |
| Making It Portable 11/32 | **10/32** | Actual `book_crystallization` count in data is 10 |
| Median 14 years to blow-up | **16 years** | Recalculated with all 32 now having complete `yearsToBlowUp` data |

Added `yearsToBlowUp` for: Jeff Krasno (1), Esther Perel (25), Michael Beckwith (20). All 32 profiles now have complete data.

Meta section `blowUpStats` and `blowUpPatterns` counts in the JSON have been corrected to match.

## The engines overlap (critical for user-facing copy)

The 4 engines are NOT mutually exclusive. Many creators used 2-3 engines sequentially:

| Creator | Engine 1 | Engine 2 | What actually happened |
|---|---|---|---|
| Deepak Chopra | Portable (book) | Bridge (Oprah) | Book existed first. Oprah found it and amplified. |
| Marianne Williamson | Portable (book) | Bridge (Oprah) | Book had modest sales. Oprah devoted a full show to it. |
| Michael Singer | Portable (book) | Bridge (Oprah) | Book sat 5 years before Oprah discovered it. |
| Sahara Rose | Portable (book) | Bridge (Chopra) | Book got Chopra's endorsement after she pursued him. |
| Gabor Mate | Content Vehicle (documentary) | Portable (books preceded it) | 4 books before the documentary, but the documentary went viral. |

**5 of 7 bridge creators also have `book_crystallization`.** The book made the bridge possible. Oprah needs something to POINT her audience to. The Portable engine often ENABLES the Bridge engine.

The brief's counts (7+5+7+11 = 30) don't add up to 32 because of this overlap. The `blowUpType` field (event/product/content/action/movement) IS mutually exclusive and totals 32, but `blowUpPatterns` is an array allowing multiple patterns per creator.

## Implication for user-facing copy

**Don't say:** "You ARE a Category Creator."

**Do say:** "Your **strongest engine** is Category Creation. Here's how to build toward it."

The reveal should frame it as a primary strategy, not an identity. The action items should acknowledge the sequence: "Category Creation is your fastest path. As your method matures, Making It Portable becomes your next engine."

## Implication for scoring

The current scoring design (DNA match +2, selected creators +1, Q1 +1, Q2 +1) handles the overlap well because it's probabilistic. One suggestion: if the user's DNA match has MULTIPLE `blowUpPatterns`, the +2 weight could be split across the relevant engines rather than assigned to just one.

Example: Deepak Chopra should give +1 to Portable and +1 to Bridge, not +2 to one engine.

## Data field mapping

The `blowUpType` field uses different names than the engine names:

| Engine name (user-facing) | `blowUpType` values | `blowUpPatterns` values |
|---|---|---|
| Bridge Person | (no dedicated type) | `oprah_amplification`, `bridge_person` |
| Category Creation | `event` (partially) | `first_event`, `institution_creation` |
| Content Vehicle | `content` | `viral_content`, `film_documentary`, `new_media_vehicle` |
| Making It Portable | `product` (partially) | `book_crystallization`, `scientific_validation` |

**Use `blowUpPatterns` array for engine scoring, not `blowUpType`.** The patterns are more granular and allow for overlap.

## Engine-specific action items (post-diagnostic)

After the engine reveal, the "3 action items" should be the FIRST STEP of the actual recipe process:

### If engine = Category Creation
1. Answer: "What two worlds do you live in?" (pull from user's skills data in `nikigai_clusters`)
2. Answer: "What does everyone assume is REQUIRED in your space?"
3. Design a 20-person first event that removes that assumption

### If engine = Content Vehicle
1. Platform Timing Check: "What's your natural format?" → map to 2026 platform playbook (TikTok 60-180s for discovery, YouTube video podcast for trust, Substack for ownership)
2. Core Insight Compressor: state your method in one sentence, then in 5 words
3. Felt Shift Test: record 90 seconds of your method in action, show to 5 people — did they feel something shift or just learn something?

### If engine = Making It Portable
1. Portability Test: Can you state it in one sentence? Can someone else teach it? Does it work without your personality?
2. If yes to all 3 → choose format: book (conceptual), study (physiological), certification (embodied), someone else's book (powerful story)
3. List 3 people who could teach your method tomorrow. What would they need?

### If engine = Bridge Person
1. You can't plan for this. Focus on being undeniable at small scale.
2. Do you have a portable product (book, course, method) a bridge person could point their audience to?
3. Does your work fill a gap in someone bigger's content, legacy, or audience needs?

## Connection to World Tour strategy

The `experience-creator-world-tour.md` doc's 5-section newsletter template maps directly to our blow-up engine data:

| Newsletter section | Maps to DNA field |
|---|---|
| The Wedge | `blowUpContext` + `experienceEvolution[0]` (how they started) |
| The Brand Engine | `blowUpPatterns` + Content Vehicle recipe |
| The Money Engine | `experienceCreatorOfferMap.json` (attraction/core/scale/continuity) |
| The Compounding Move | `blowUpMoment` + `blowUpYear` (THE blow-up moment) |
| If This Is You | DNA sliders + matcher CTA |

The `experienceEvolution` field (4-5 stages per creator) IS the narrative arc for each newsletter post. The `blowUpMoment` and `blowUpContext` fields are the "Compounding Move" section pre-written.

## Full reference docs (Obsidian)

For deep context on the recipes and patterns, read these notes in the Obsidian vault at `/Users/nichuzz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/Huzz/`:

- `Frameworks/Blow-Up Recipes - Category, Content, Portable.md` — the 3 actionable playbooks with process questions
- `Frameworks/Platform Timing 2026-2027.md` — current platform analysis for Content Vehicle recipe
- `Frameworks/Blow-Up Deep Dive - Bridge, Category, Viral, Portable.md` — deep analysis of each engine
- `Frameworks/Experience Creator Blow-Up Patterns.md` — parent analysis (meta-patterns, universal patterns, stats)
- `Product/Blow-Up Recipes - App Integration Map.md` — where each recipe lands in the codebase
