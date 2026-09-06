# Quest Hierarchy Restructure — Spec

## Context

The current quest model is too flat. Users pursue multiple life paths that eventually converge into brand visions, but the DB has no way to represent this hierarchy. "Vibe Rise" has 70 tasks dumped into one quest when they belong to separate life paths (Dance, App Building, Breathwork). The hierarchy needs to reflect the user's actual journey: separate paths → convergence → brand vision.

## The Three Phases of Path Convergence

This maps to the hero's journey stages 7-8:

**Phase 1 (Stages 1-6): Separate threads.** User pursues individual paths. Each has its own dome, growth edges, courage challenges. No suggestion they're connected.

**Phase 2 (Stage 7-8): Connection moment.** User has enough self-knowledge to see the thread. The Phase 2→3 Direction Bridge surfaces problem convergence: "These paths all solve the same problem." User DISCOVERS the connection — app doesn't force it.

**Phase 3 (Stage 8+): Brand vision.** User names the unified thing. Paths consciously feed one vision. Each path still has its own dome, but a brand-level aggregate dome shows the full picture.

## Ideal Hierarchy

```
Brand Vision (phase 3 label, named after convergence)
├── Life Path (ongoing, never closes, has its own dome)
│   ├── Project (time-bound, closes when done)
│   │   └── Tasks / Courage Challenges
│   └── Project
├── Life Path
└── Life Path
```

### Huzz's Actual Hierarchy

```
Brand Vision: "Vibe Rise"
├── Life Path: Dance Events (dome: high Vuln, Rarity, Context, People)
│   ├── Project: Monument Disco Tour (8 tasks, mostly done)
│   ├── Project: Bondi Series
│   └── Project: Opera House
├── Life Path: App Building (dome: high Stakes, Biz Commitment)
│   └── Project: Scale Portal
├── Life Path: Breathwork (dome: high Vuln, Context, Identity)
│   └── Project: Krislin Retreat
└── Life Path: Content (serves all brands, lives under Vibe Rise)

Brand Vision: "Financial Security"
├── Life Path: Buy Headsets
│   └── Project: Europe Launch
└── Life Path: AI Coding

Brand Vision: "Epic Travel Experiences"
├── Life Path: Tuk Tuk Tournament
└── Life Path: Travel Tournament
```

### Unsorted: "Fear Challenges" (48 tasks)
The original courage challenges that started everything. Predates the quest system. These are the inspiration for the whole journey — they belong somewhere meaningful but haven't been assigned. Some are dance (singing, magic, flash mobs), some are identity (ear piercing, spinny hat), some are content (IG stories, videos). Need manual redistribution to correct life paths OR kept as a special "origin" collection.

## Schema Changes

Additive only — no destructive changes.

```sql
ALTER TABLE quests
  ADD COLUMN IF NOT EXISTS quest_type text DEFAULT 'path',      -- 'brand' | 'path'
  ADD COLUMN IF NOT EXISTS brand_quest_id uuid REFERENCES quests(id);

ALTER TABLE quest_experiences
  ADD COLUMN IF NOT EXISTS experience_type text DEFAULT 'project';  -- 'project' | 'ongoing'
```

### What each level maps to in DB

| Concept | DB Table | Key Fields |
|---------|----------|------------|
| Brand Vision | `quests` (quest_type: 'brand') | label, status, user_id |
| Life Path | `quests` (quest_type: 'path') | label, brand_quest_id, dome data |
| Project | `quest_experiences` (experience_type: 'project') | label, quest_id, status |
| Task / Challenge | `quest_tasks` → `groan_challenges` | quest_id, experience_id |

### Why this works

- Quests already have dome infrastructure (dimension_values on linked challenges, NS checkins, skill_tags, branch, predicted_state)
- `useSafetyDome` already filters by quest_id — per-path domes work immediately
- Brand dome = aggregate of all child path domes (new query: filter by brand_quest_id)
- Experiences already group tasks — just rename conceptually to "projects"
- No new tables needed

## Data Migration (Huzz only)

### Step 1: Create brand quests

```sql
-- Vibe Rise becomes a brand
UPDATE quests SET quest_type = 'brand' WHERE id = '8b07e527-...';

-- Create Financial Security brand
INSERT INTO quests (user_id, label, quest_type, status) VALUES (..., 'Financial Security', 'brand', 'active');

-- Epic Travel Experiences brand  
INSERT INTO quests (user_id, label, quest_type, status) VALUES (..., 'Epic Travel Experiences', 'brand', 'active');
```

### Step 2: Create life path quests under brands

New path quests for Vibe Rise:
- "Dance Events" (brand_quest_id → Vibe Rise)
- "App Building" (brand_quest_id → Vibe Rise) — absorbs AI Coding
- "Breathwork" (brand_quest_id → Vibe Rise) — reactivate from completed
- "Content" (brand_quest_id → Vibe Rise)

Existing quests get brand_quest_id:
- "Travel Experience Host" → brand_quest_id = Epic Travel Experiences
- "Buy Headsets Ecommerce Site" → brand_quest_id = Financial Security
- "AI Coding" → merge into App Building OR brand_quest_id = Financial Security

### Step 3: Redistribute Vibe Rise's 61 ungrouped tasks

Go through each task and assign to correct life path quest_id. Biggest manual step.

### Step 4: Redistribute Fear Challenges' 48 tasks

These are the origin story. Options:
- (a) Keep as a special "Origins" collection (not a path, not a brand — a historical archive)
- (b) Redistribute to correct life paths (dance tasks → Dance Events, identity tasks → wherever they fit)
- (c) Keep as-is (closed quest, referenced but not active)

**User's instinct:** "Fear Challenges is the inspiration for everything." Leaning toward (a) — a meaningful archive, not just a dump.

### Step 5: Move experiences to correct quests

- "Monument Disco Tour" → move from Vibe Rise to new "Dance Events" quest
- "Find My Flow app" → move from Vibe Rise to new "App Building" quest

## Paths Tab UI (Post-Restructure)

```
┌──────────────────────────────────────┐
│ 🔮 Vibe Rise              [brand dome]│
│                                      │
│  💃 Dance Events          [path dome] │
│    └ Monument Disco Tour    7/8 ✓    │
│                                      │
│  💻 App Building          [path dome] │
│    └ Scale Portal           →        │
│                                      │
│  🫁 Breathwork            [path dome] │
│                                      │
│  📱 Content               [path dome] │
│                                      │
├──────────────────────────────────────┤
│ 💰 Financial Security     [brand dome]│
│                                      │
│  🎧 Buy Headsets          [path dome] │
│    └ Europe Launch          →        │
│                                      │
│  🤖 AI Coding             [path dome] │
│                                      │
├──────────────────────────────────────┤
│ ✈️ Epic Travel Experiences [brand dome]│
│                                      │
│  🛺 Tuk Tuk Tournament    [path dome] │
│  🌏 Travel Tournament     [path dome] │
│                                      │
├──────────────────────────────────────┤
│ ⚡ Fear Challenges (Origins)  archive │
└──────────────────────────────────────┘
```

Each dome is tappable → expands to full radar view for that path or brand.

## Dome at Each Level

| Level | Dome computation | What it shows |
|-------|-----------------|---------------|
| Brand | Aggregate of all child path domes | Your full capacity across everything in this vision |
| Life Path | Challenges filtered by quest_id + after_state | Your capacity on this specific pursuit |
| Project | Challenges filtered by experience_id | How much this project stretched you (snapshot) |

## Connection to Prediction Error + Voice Patterns

Voice patterns are per-path, not per-brand. Ghost might live on Dance Events (vulnerability) but not on App Building (where Perfectionist lives). The pattern detection should scope to path-level, not brand-level.

The brand-level dome reveals which paths contribute which spokes. "Dance gives you Vulnerability. Coding gives you Business Commitment. Together they make a complete dome."

## Open Questions

1. **Fear Challenges disposition** — archive, redistribute, or special collection?
2. **Content path** — truly under Vibe Rise, or a cross-brand utility path?
3. **Phase 2 detection** — problem convergence happens at the Direction Bridge. Should the bridge be per-brand (one convergence per brand vision) or one global convergence?
4. **Can a life path move between brands?** If AI Coding starts under Financial Security but later the user realizes it serves Vibe Rise, can they reassign?
5. **Brand creation UX** — does the user name the brand during the Direction Bridge, or is it a separate moment?
