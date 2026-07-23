# Session Handoff: Rule Break Tree — 12 Branches Complete (2026-07-21)

## What was done

### 1. Merged 10 → 12 Branches into Source of Truth

The Rule Break Tree data file (`src/lib/ruleBreakTreeData.js`) was expanded from 10 to 12 primal branches. This was a mechanical merge from pre-computed extract files, not creative work.

**Structural changes:**
- `S` constant: `2*PI/10` → `2*PI/12` (30-degree spacing)
- 2 new primals added: **Play** (index 7, between Story and Fire) and **Rest** (index 10, between Healing and Threat)
- Fire shifted from index 7 → 8, Healing 8 → 9, Threat 9 → 11. All sub-branch baseAngles updated accordingly.
- 2 new Bonds sub-branches: **Exchange** (money/trade) and **Intimacy** (sex/partnership)
- 4 new bridge nodes: `b-play`, `b-sleep`, `b-exchange`, `b-intimacy`
- `defense-1620` replaced by `defense-1617` (corrected date)
- `med-2020b` (Telemedicine) replaced by `med-2015` (earlier, more accurate date)
- `MIN_YEAR` in `RuleBreakTree.jsx` changed from 1400 → 1100

**Gap-fill nodes added to existing branches:**
`car-1903` (Wright Brothers), `car-1952` (Commercial Aviation), `tech-1943` (Turing/Colossus), `energy-1901` (Oil/Spindletop), `media-1605` (Newspaper), `media-1954` (Music For All), `media-2008` (Spotify), `media-2012` (Online Education), `fashion-1926` (Chanel), `defense-1916` (WWI)

### 2. Designed Play + Rest Sub-Branches

Every existing primal has 6-7 sub-branches tracing deeper innovation trajectories. Play and Sleep now have 6 each.

**Play sub-branches (32 nodes):**

| Sub-branch | ID | Nodes | Trajectory |
|------------|-----|:-----:|------------|
| Board & Tabletop | `play-board` | 5 | Go/Mancala → Eurogames (Catan 1995) → Cooperative (Pandemic 2008) → Kickstarter → Board Game Cafes |
| Sport & Athletic Competition | `play-sport` | 6 | Ancient Olympics → Professional Leagues (1871) → Broadcast Sport → Title IX/Women's → Extreme Sport → Boutique Competition |
| Digital & Video Games | `play-digital` | 6 | Home Console (Atari 1977) → Online Multiplayer (Doom 1993) → Indie Games → Battle Royale → VR Gaming → Cloud Gaming |
| Gambling & Chance | `play-chance` | 5 | Knucklebones → State Lottery (1539) → Horse Racing/Bookmaking → Poker Boom (2003) → Sports Betting Apps (2018) |
| Toy & Material Play | `play-toy` | 5 | Dolls/Miniatures → LEGO (1932) → Action Figures (1964) → Trading Card Games (MTG 1993) → Fidget/Sensory Toys |
| Free & Unstructured Play | `play-free` | 5 | Village Free Play → Adventure Playground (1943) → UN Right to Play (1989) → Free Play Deficit → Nature Play |

**Rest sub-branches (29 nodes, hypnosis moved to Healing):**

| Sub-branch | ID | Nodes | Trajectory |
|------------|-----|:-----:|------------|
| Dream Science | `rest-dream` | 5 | Artemidorus → Jungian Dream Work (1913) → Lucid Dreaming (1975) → Targeted Memory Reactivation → Dream Engineering (MIT 2021) |
| Sleep Science | `rest-sleep` | 5 | Laudanum → Sleep EEG (1929) → Sleep Clinics (Stanford 1970) → CBT-I (1999) → Precision Sleep Medicine |
| Circadian Science | `rest-circadian` | 5 | Sundial Time → Plant Clock (de Mairan 1729) → Shift Work → Light Therapy (1984) → Chronotype Science (Roenneberg 2012) |
| Rest Technology | `rest-tech` | 5 | The Mattress → White Noise Machine (1962) → Smart Mattress (Eight Sleep 2014) → Sleep Coaching Apps → Oura/WHOOP |
| Rest Culture | `rest-culture` | 5 | Biphasic Sleep → Industrial Sleep Compression → Nap Pods → Rest as Resistance (Nap Ministry 2016) → Pandemic Sleep Reset |
| Consciousness States | `rest-states` | 5 | Yoga Nidra → Clinical Hypnosis (Braid 1843) → Sensory Deprivation (Lilly 1954) → TM Research (1972) → NSDR/Yoga Nidra Apps |

### 3. Phase 3 Reversion Opportunities Research

Scored top 20 reversion opportunities using multiplicative formula: `Drift x Measurement x Cultural Readiness`.

**Top 5:**

| Rank | Branch | Score | What Drifted |
|------|--------|:-----:|-------------|
| 1 | Healing / Somatic | 729 | Trauma stored in body, ignored by talk therapy |
| 2 | Play / Free | 720 | Adult play deprivation — no innovation map even includes Play |
| 3 | Sleep / Rest | 720 | Sleep culture collapse, hustle worship |
| 4 | Movement / Dance | 567 | Ecstatic communal movement lost to gym culture |
| 5 | Bonds / Ritual | 567 | Secular ceremony demand, church attendance collapse |

**Key finding:** Vibe Rise sits at the intersection of 5 simultaneous reversions (Play + Movement + Bonds + Healing + Fire). Single-branch reversions create products. Multi-branch convergences create movements.

Saved to Obsidian: `Frameworks/Phase 3 Reversion Opportunities.md`

### 4. Cleanup

- Deleted 3 layout mockup HTMLs (`rule-break-tree-fan.html`, `-vertical.html`, `-timeline.html`)
- Kept original radial tree layout (`public/rule-break-tree.html` as prototype reference, `src/pages/RuleBreakTree.jsx` as production)

## Current State

**Source of truth:** `src/lib/ruleBreakTreeData.js`

| Metric | Count |
|--------|:-----:|
| Primals | 12 |
| Industries (incl. sub-branches) | 81 |
| Bridge nodes | 14 |
| Industry nodes | 508 |
| — Trunk nodes | 162 |
| — Sub-branch nodes | 324 |
| — Prediction nodes | 22 |
| Branch links | 508 |
| Merge links | 245 |
| PILL_CONFIG entries | 81 |

**The 12 Primals (in order around the radial tree):**

| Index | Primal | Trunk Branch | Sub-branches | Trunk Nodes |
|:-----:|--------|-------------|:------------:|:-----------:|
| 0 | Movement | `cars` | 6 (endurance, strength, flexibility, temperature, outdoor, dance) | 15 |
| 1 | Nourishment | `food` | 6 (ancestral, ferment, fasting, industrial, personal, regen) | 10 |
| 2 | Tools | `tech` + `ai` | 0 | 17 |
| 3 | Status | `fashion` | 6 (fashion, beauty, luxury, digital, counter, craft) | 7 |
| 4 | Bonds | `comms` + `exchange` + `intimacy` | 6 (ritual, communal, ordeal, digital, coaching, couples) | 32 |
| 5 | Shelter | `property` | 6 (arch, urban, alt, indoor, proptech, sacred) | 6 |
| 6 | Story | `media` | 6 (oral, written, audio, video, immersive, creator) | 14 |
| 7 | **Play** | `play` | **6 (board, sport, digital, chance, toy, free)** | **21** |
| 8 | Fire | `energy` | 6 (combustion, grid, renewable, personal, light, ritual) | 9 |
| 9 | Healing | `medicine` | 6 (traditional, psychedelic, somatic, mindbody, mental, energy) | 10 |
| 10 | **Rest** | `rest` | **6 (dream, sleep, circadian, tech, culture, states)** | **12** |
| 11 | Threat | `defense` | 6 (weapons, insurance, safety, resilience, surveillance, cyber) | 8 |

**New branch details:**

Exchange (Bonds sub-branch, `exchange`, 12 nodes): Coinage → Modern Banking → Stock Exchange → Central Bank → Advertising Agency → Limited Liability → Credit Card → ATM → Digital Payments → Mobile Money → Cryptocurrency → Energy As Currency

Intimacy (Bonds sub-branch, `intimacy`, 11 nodes): Marriage Contract → Courtly Love → Barrier Contraception → Kinsey Reports → The Pill → Porn Drives Tech → IVF → Dating Apps → AI Companions → Artificial Womb → Creator Intimacy (OnlyFans)

## Key Design Decisions

| Decision | Why |
|----------|-----|
| Play + Rest as full primals (not sub-branches) | Pass the "vessel of experience" test: purposeless exploration (Play) and surrender/dreaming (Sleep) are irreducible felt experiences |
| Exchange + Intimacy as Bonds sub-branches (not primals) | Money decomposes into Bonds (trust) x Fire (energy). Intimacy tangles with Bonds. Both use industry fork pattern like Tech/AI under Tools |
| 6 sub-branches each for Play and Sleep | Matches existing pattern (every primal has 6-7 sub-branches with 3-6 nodes each) |
| `mergeWith` must be an INDUSTRIES key | Not a node ID. Caught and fixed `sub-states-2022 -> sub-mindbody-2021` (was node ID, corrected to `med-mindbody`) |
| Pre-1400 events clamped to `year: 1400` | Matching existing convention. Actual date in `who` field. |

## Known Pre-Existing Issues (Not Introduced This Session)

- `car-1919` mergeWith `'finance'` — not an INDUSTRIES key
- `car-1956` mergeWith `'government'` — not an INDUSTRIES key
- `car-1966` mergeWith `'legal'` — not an INDUSTRIES key
- `car-1973` mergeWith `'manufacturing'` — not an INDUSTRIES key
- `media-1440` mergeWith `'tools'` — not an INDUSTRIES key (should be `'tech'`)

These are cosmetic (tooltip text only) and were present in the original 10-branch data.

## Not Yet Done (from `docs/rule-break-tree-next-session-prompts.md`)

| Prompt | Type | Status |
|--------|------|--------|
| 1. Merge 12-branch data | Code | Done |
| 2. Play + Rest sub-branches | Code | Done |
| 3. Finalize probability formula | Theory/Obsidian | Not started — resolve circular reference in Phase 3 formula, retrodict 5 historical breaks |
| 4. SD overlay design | Viz design | Not started — Spiral Dynamics color coding / filter mode |
| 5. Experience Compression Calculator | Product feature | Not started — interactive tool for Creator Portal |
| 6. "Money Was Always Energy" content | Content | Not started — 3 formats (carousel, essay, Reddit) |
| 7. "AI = Tools x Fire" content | Content | Not started — 3 formats (carousel, essay, X thread) |
| 8. Phase 3 Reversion data | Research | Done — top 20 scored, saved to Obsidian |

## Files Changed This Session

| File | Change |
|------|--------|
| `src/lib/ruleBreakTreeData.js` | 834 insertions, 46 deletions. 12 branches, sub-branches, nodes, links |
| `src/pages/RuleBreakTree.jsx` | MIN_YEAR 1400 → 1100 |
| `public/rule-break-tree-fan.html` | Deleted |
| `public/rule-break-tree-vertical.html` | Deleted |
| `public/rule-break-tree-timeline.html` | Deleted |
| Obsidian: `Frameworks/Phase 3 Reversion Opportunities.md` | New — 20 scored reversions + 5 deep dives + convergence table |

## Visual Check Still Needed

The tree has NOT been visually verified in browser at `/rule-break-tree`. The timelapse animation should show 12 radial branches with sub-branches fanning out. Potential issues:
- 30-degree spacing (was 36-degree) may feel tight
- Sub-branch angle offsets (-0.15 to +0.15) for Play and Sleep may overlap with adjacent primals
- Ancient nodes (year 1100) render closer to center than before

Run `npm run dev` and open `localhost:5173/rule-break-tree` to check.
