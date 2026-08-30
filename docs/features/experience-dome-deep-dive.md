# Experience Dome Deep Dive — Layer 1 + Layer 2

## Purpose

The Experience Dome rates experiences at a high level (vibe_rise / fun / pressure / bored). The Deep Dive adds two layers that turn broad ratings into actionable quest paths:

- **Layer 1 (Format Variations)**: Which specific formats of this experience light you up?
- **Layer 2 (Career Vector)**: What role do you want to play in this experience?

Together they solve three problems:
1. Quest paths are too vague ("I love dance" → which kind? doing what?)
2. No distinction between hobby and career (someone who loves yoga to attend vs teach)
3. 3% capacity challenges are generic (knowing the "why" targets the right next step)

## How It Works

### Current Flow (`/choose-quests`)
```
INTRO → SELECT dome experiences → PROCESSING (AI) → PICK paths → STUCK POINTS → SAVING → DONE
```

### New Flow
```
INTRO → SELECT dome experiences (which vibe_rise/fun nodes?)
       ↓
DEEP DIVE (per selected node)
  Layer 1: "Which formats specifically?" (multi-select checkboxes)
    □ Silent disco  □ Morning dance  □ Contact improv  □ Rave
  Layer 2: "What role excites you?" (multi-select checkboxes)
    □ Doing it — this becomes my work
    □ Guiding others through it — teaching, facilitating, coaching
    □ Building around it — platform, brand, space, content
    □ Keeping this as a hobby — love it, don't want it as work
       ↓
PROCESSING (AI suggest-life-paths, receives enriched input)
       ↓
PICK paths → STUCK POINTS → SAVING → DONE
```

### Layer 2 "Hobby" Behaviour
If a user selects only "Keeping this as a hobby" for a node, that node is **excluded from the AI prompt** — no quest path is generated for it. It stays tagged as `vector: 'hobby'` in the data for future use (3% challenges, capacity building) but doesn't feed quest creation.

If a user selects "hobby" alongside another vector (e.g., hobby + doing it), the non-hobby vectors are sent to the AI.

### Skip Rules
- **Layer 1**: Skipped for nodes without format variations (e.g., `exp-farmers-market`, `exp-pets`, `exp-cinema`). Use `hasSubNodes(nodeId)` to check. User goes straight to Layer 2.
- **Layer 2**: Always shown for every selected node. Multi-select checkboxes.

## Data Model

### Layer 1: Format Variations

**File**: `src/data/experienceDomeSubNodes.js` (exists, complete)
**References**: `src/lib/experienceDomeConfig.js` (core node IDs, experience labels)

```javascript
// Each core dome node maps to an array of format sub-nodes.
// Sub-nodes sourced from Rule Break Tree siblings + cultural additions.
// Nodes with no meaningful format variations are omitted (Layer 1 skipped).
export const DOME_SUB_NODES = {
  'sub-dance-1975': [
    { id: 'fmt-dance-5rhythms', label: '5Rhythms' },
    { id: 'fmt-dance-silent-disco', label: 'Silent disco' },
    { id: 'fmt-dance-morning', label: 'Morning sober dance (Daybreaker, Morning Gloryville)' },
    { id: 'fmt-dance-contact', label: 'Contact improvisation' },
    { id: 'fmt-dance-burning-man', label: 'Burning Man / art festival' },
    { id: 'fmt-dance-rave', label: 'Rave / electronic event' },
    { id: 'fmt-dance-tribal', label: 'Tribal / ceremonial dance' },
    { id: 'fmt-dance-social', label: 'Partner dance class (swing, salsa, bachata)' },
    { id: 'fmt-dance-freeform', label: 'Freeform / no instruction, just move' },
  ],
  // ... 68 of 74 core nodes mapped (6 omitted — no format variations)
}
```

**Sub-node ID convention**: `fmt-{parentShortName}-{variation}`

**Helper functions** (exported from the same file):
- `hasSubNodes(nodeId)` — returns `true` if Layer 1 data exists for this node
- `getSubNodes(nodeId)` — returns array of `{ id, label }` sub-nodes (empty array if none)

### Layer 2: Career Vectors

Exported from `src/data/experienceDomeSubNodes.js` alongside Layer 1 data:

```javascript
export const CAREER_VECTORS = [
  { id: 'do_it', label: 'Doing it', subtitle: 'This becomes my work' },
  { id: 'guide_it', label: 'Guiding others through it', subtitle: 'Teaching, facilitating, coaching' },
  { id: 'build_around', label: 'Building around it', subtitle: 'Platform, brand, space, content' },
  { id: 'hobby', label: 'Keeping this as a hobby', subtitle: "Love it, don't want it as work" },
]
```

### Storage

Deep dive selections are passed to the `suggest-life-paths` edge function as part of an enriched `domeProfile`.

**Current payload** (pre-feature, via `formatDomeForPrompt` in `src/lib/domeSummary.js`):
```javascript
{
  selected: ['Ecstatic dance', 'Creating / editing video'],  // flat label strings
  vibeRise: [...],
  fun: [...],
  pressure: [...],
  essence: 'Playful Alchemist',
}
```

**Proposed enriched payload** (post-feature):
```javascript
{
  selected: [
    {
      nodeId: 'sub-dance-1975',
      label: 'Ecstatic dance',
      formats: ['Silent disco', 'Morning sober dance'],  // Layer 1 picks
      vectors: ['guide_it'],                               // Layer 2 picks
    },
    {
      nodeId: 'sub-video-2005',
      label: 'Creating / editing video',
      formats: null,                                       // Layer 1 skipped
      vectors: ['do_it', 'build_around'],                  // Multi-select
    },
  ],
  vibeRise: [...],  // unchanged
  fun: [...],       // unchanged
  pressure: [...],  // unchanged
  essence: '...',   // unchanged
}
```

Nodes where `vectors` contains only `'hobby'` are filtered out before sending to AI. Selections also persist in `life_path_sessions.careers` JSON for session replay.

## AI Prompt Changes

The `suggest-life-paths` edge function prompt needs updating to use the enriched input:

**Before**: "The user loves: Ecstatic dance, Video editing, Public speaking"

**After**: "The user loves:
- Ecstatic dance (specifically silent disco + morning formats) — wants to GUIDE others through it
- Video editing — wants to DO this as their career
- Public speaking — wants to DO this + BUILD around it (speaking brand, courses)"

This gives the AI enough context to generate paths like:
- "Host morning conscious dance events" (not "attend more ecstatic dances")
- "Freelance video editor" (not "teach video editing workshops")
- "Speaking + course business" (combines do_it + build_around)

## Skill Taxonomy Connection

Layer 2 vectors correlate with skills from `playSkillTaxonomyV2.json`:

| Vector | Primary Skills |
|---|---|
| Do it | performing, creating, building, storytelling |
| Guide it | coaching, teaching, connecting |
| Build around it | leading, designing, building |
| Hobby | (no skill signal for quest creation) |

This is a correlation, not a hard rule. The actual skill tagging still happens via `questSkillTagger.js` after quest creation.

## Relationship to Other Features

- **Experience Dome** (`/experience-game`): Upstream. Provides the vibe_rise/fun ratings that feed this flow.
- **Choose Quests** (`/choose-quests`): Where this lives. New step inserted between SELECT and PROCESSING.
- **Quest Board** (Quests tab): Downstream. Quests created here appear on the board.
- **3% Capacity Building** (Phase 2): Layer 2 vector determines challenge type. "Guide it" → "facilitate your first one". "Do it" → "get your first paid gig".
- **Skill Taxonomy** (`playSkillTaxonomyV2.json`): Layer 2 informs which skills get tagged on created quests.
- **Rule Break Tree** (`ruleBreakTreeData.js`): Layer 1 sub-nodes sourced from tree siblings, extended with cultural knowledge.

## Design Notes

- Both Layer 1 and Layer 2 are multi-select checkboxes
- Layer 1 is skipped for nodes without format variations (check with `hasSubNodes()`)
- Layer 2 is always shown
- "Hobby" selection excludes the node from AI quest suggestions but doesn't delete the rating
- For V1, deep dive runs for every selected experience (may be long; optimise later)
- Sub-node data lives in its own file (`experienceDomeSubNodes.js`) separate from dome config

## Files to Modify

| File | Action |
|---|---|
| `src/data/experienceDomeSubNodes.js` | **Done** — Layer 1 format data + Layer 2 vectors + helpers |
| `src/flows/ChooseQuestsFlow.jsx` | **TODO** — add DEEP_DIVE step between SELECT and PROCESSING |
| `src/lib/domeSummary.js` | **TODO** — update `formatDomeForPrompt` to include formats + vectors |
| `supabase/functions/suggest-life-paths/index.ts` | **TODO** — accept + use enriched domeProfile |
| `docs/features/experience-dome-deep-dive.md` | **Done** — this doc |
