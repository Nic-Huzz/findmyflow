# Session Handoff: Rule Break Tree — 12-Branch Expansion (2026-07-20)

## What was done

### IP Development (theory + thesis)
- MasterMind Council reviewed all 7 taxonomy questions → confirmed 12 branches
- "Vessels of experience" root reframe resolved Fire/Play/Sleep inclusion debates
- Original insights developed:
  - **AI = Tools × Fire merge** — AI is the first tool with its own nature (you negotiate with it, not direct it)
  - **Money was always energy** — dollar = stored human energy; AI shift = energy creating value is no longer human
  - **Three Phases** of branch innovation: Break → Optimise → Revert
  - **Experience Compression** formula split into Phase 2 + Phase 3 variants
  - **Outsider Proximity** refined as cross-branch pattern recognition
  - **Gambling** as the Play × Exchange defining merge
  - **Caffeine** as the Sleep × Nourishment merge ($460B industry built on overriding sleep biology)
- Musk energy thesis researched (4 key quotes + Fuller/Soddy precedents)
- All saved to Obsidian: `/Users/nichuzz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/Huzz/Frameworks/Rule Break Tree - 12 Branches.md`

### Data Research (nodes + merges)
- 8 research agents produced initial node data for Play (19), Sleep (12), Exchange (10), Intimacy (9)
- 4 fact-check agents verified all data, found 2 major date errors (Roblox 2006 not 2013, AI Game Master 2019 not 2024), ~10 minor corrections, 3 critical omissions (Gambling, Caffeine, Kinsey)
- Gap-fill agents added 17 more nodes to existing branches: Haber-Bosch, Wright Brothers, Phonograph, Oil/Spindletop, WWI, OnlyFans, Newspaper, Therapeutic Gaming, Advertising, Limited Liability, Commercial Aviation, Barrier Contraception, Turing/Colossus, Spotify, Online Education, Chanel, Esports
- 2 QA sweeps caught and fixed backwards merge links, invalid mergeWith references, stale IDs

### Visualization
- Updated `public/rule-break-tree.html` with full 12-branch data (~200 nodes, 75 merges)
- Created 3 layout mockups: `public/rule-break-tree-fan.html`, `public/rule-break-tree-vertical.html`, `public/rule-break-tree-timeline.html`
- Layout decision NOT made yet

## Decisions made

| Decision | Why |
|----------|-----|
| **12 branches, not 10** | "Vessels of experience" frame: Play and Sleep are irreducible domains of human experience |
| **Play + Sleep as full primals** | Pass the experience test: felt sense of purposeless exploration (Play) and surrendering/dreaming (Sleep) are distinct from any other branch |
| **Exchange + Intimacy as Bonds sub-branches** (not primals) | Money decomposes into Bonds (trust) × Fire (energy). Sex is experientially distinct but innovation tree tangles with Bonds. Both use industry fork pattern like Tech/AI under Tools |
| **Fire stays as its own branch** | "I harness this, it has its own nature" is distinct from "I direct this, it extends me" (Tools). AI = Tools × Fire merge validates the distinction |
| **Sleep included despite thin innovation tree** | The thinness IS the thesis — highest Experience Compression, most likely terrain for next wave of rule breaks |
| **Entertainment under Story, not Play** | Entertainment = passive consumption (receiving). Play = active participation (doing). Music is the merge point (making = Play, listening = Story) |
| **`ruleBreakTreeData.js` = sole source of truth** | React version at `/rule-break-tree` has timelapse, 390 nodes, 70+ sub-branches. HTML prototype was just that — a prototype |

## In progress / next steps

### PRIORITY 1: Merge into source of truth
The HTML prototype (`public/rule-break-tree.html`) has the new 12-branch data. The production React data file (`src/lib/ruleBreakTreeData.js`) still has old 10-branch data. These need merging:

1. Read full `src/lib/ruleBreakTreeData.js` (2,503 lines, 390 nodes, 164 merges, 70+ sub-branches)
2. Change `S` from `2 * Math.PI / 10` to `2 * Math.PI / 12`
3. Add Play + Sleep to `PRIMALS` array (Play at index 7 between Story and Fire, Sleep at index 10 between Healing and Threat)
4. Add to `PRIMAL_INDUSTRIES`: `play: ['play', ...]`, `sleep: ['sleep', ...]`, update `bonds` to include `exchange` and `intimacy`
5. Add `play`, `sleep`, `exchange`, `intimacy` to `INDUSTRIES` object with correct baseAngles
6. Update all shifted primal baseAngles: fire 7→8, healing 8→9, threat 9→11
7. Add all new nodes from HTML prototype, deduplicating against existing data (e.g., `food-1913` and `media-1877` already exist in React data)
8. Add branch links for 4 new chains
9. Add new merge links
10. Update `RuleBreakTree.jsx`: `MIN_YEAR` from 1400→1100, verify S usage

### PRIORITY 2: Layout decision
User has 4 options open in browser tabs. Pick one, then delete the 3 mockup files.

### PRIORITY 3: Cleanup
- Delete `public/rule-break-tree.html` (prototype, replaced by React version)
- Delete `public/rule-break-tree-fan.html`, `public/rule-break-tree-vertical.html`, `public/rule-break-tree-timeline.html` (mockups)
- Sync `public/rule-break-matrix.html` and `public/rule-break-radar.html` with new 12-branch data (or rebuild to import from `ruleBreakTreeData.js`)

### PRIORITY 4: Design sub-branches for Play + Sleep
The existing 10 primals each have 6-7 sub-branches (e.g., Movement has Endurance, Strength, Flexibility, Temperature, Outdoor, Dance). Play and Sleep need their own sub-branch designs.

## Gotchas discovered

1. **Two versions of the tree exist** — `public/rule-break-tree.html` (standalone HTML, prototype) and `src/lib/ruleBreakTreeData.js` + `src/pages/RuleBreakTree.jsx` (React, production, has timelapse). The React version is at route `/rule-break-tree` and is the one the user remembers and uses. Do NOT update the HTML prototype further — merge into the React data file.

2. **Builder agents go rogue** — when given node data as text in a prompt, agents often invent their own nodes instead of using the researched data. Always provide nodes as exact JavaScript objects to paste, not descriptions. And verify the output matches the input.

3. **Year clamping** — ancient nodes (pre-1400) are clamped to year 1100 in the HTML prototype. The React version uses `MIN_YEAR = 1400`. This needs updating to 1100 when merging.

4. **`mergeWith` values must be INDUSTRIES keys** — not primal IDs. Common trap: using `'tools'` instead of `'tech'`, `'nourishment'` instead of `'food'`. The HTML prototype had this bug and it was fixed.

5. **Existing React data already has some "missing" nodes** — `food-1913` (Haber-Bosch) and `media-1877` (Phonograph) already exist. Dedup carefully when merging.

6. **Pre-existing `mergeWith` bugs** — `car-1956` ('government'), `car-1966` ('legal'), `car-1973` ('manufacturing') reference non-existent INDUSTRIES keys. Cosmetic only (tooltip text) but technically wrong. Not introduced this session, not fixed.

## Merge Cheat Sheet

**Pre-computed files for the merge (next session agent: USE THESE, don't reinvent):**
- `docs/rule-break-tree-new-nodes-extract.js` — exact JS node objects to paste (312 lines)
- `docs/rule-break-tree-dedup-map.txt` — which nodes are new vs already exist

**Summary:** 77 nodes to ADD, 123 nodes already exist in both (dedup — compare content for any updates), 342 React-only sub-branch nodes to KEEP untouched.

**Structural changes needed in `src/lib/ruleBreakTreeData.js`:**
```javascript
// Line 1: Change S constant
export const S = 2 * Math.PI / 12 // was /10

// PRIMALS: Add Play at index 7 (between Story and Fire), Sleep at index 10 (between Healing and Threat)
// All primals after Story shift: Fire 7→8, Healing 8→9, Threat 9→11

// PRIMAL_INDUSTRIES: Add
play: ['play'],  // sub-branches TBD
sleep: ['sleep'], // sub-branches TBD
// Update bonds: add 'exchange', 'intimacy' to existing array

// INDUSTRIES: Add 4 new entries
play: { primal: 'play', color: '#10b981', baseAngle: -Math.PI/2 + 7*S + 0.04 }
sleep: { primal: 'sleep', color: '#6366f1', baseAngle: -Math.PI/2 + 10*S + 0.04 }
exchange: { primal: 'bonds', color: '#14b8a6', baseAngle: -Math.PI/2 + 4*S - 0.10 }
intimacy: { primal: 'bonds', color: '#f9a8d4', baseAngle: -Math.PI/2 + 4*S + 0.20 }

// Update ALL existing baseAngles that reference fire (7→8), healing (8→9), threat (9→11)
// This affects: energy, fire-*, medicine, med-*, defense, threat-*
```

**In `src/pages/RuleBreakTree.jsx`:**
```javascript
// Line 9: Change MIN_YEAR
const MIN_YEAR = 1100 // was 1400
```

## Recommendations

1. **Start next session with the merge** — read `ruleBreakTreeData.js` in full, map what exists vs what's new, then make surgical edits. Don't let an agent rewrite the file.

2. **Design Play + Sleep sub-branches** after the merge. Pattern: 6-7 sub-branches per primal, each with 3-6 nodes. For Play, candidates: Board Games, Sport, Digital Games, Gambling, Music-Making, Creative Making. For Sleep: Dream Science, Sleep Medicine, Circadian Tech, Rest Culture.

3. **Build the timelapse scrubber on the chosen layout** — the React version already has the animation infrastructure (`animationYear`, `isPlaying`, `SPEEDS`). Just needs the new branches wired in.

4. **Consider the formula as a product feature** — the Experience Compression formula could be an interactive calculator on the Creator Portal, helping experience creators identify where the next rule break in their branch is likely to happen.
