# Feature Brief: Experience Creator Matching

Date: 2026-04-21
Status: **COMPLETE (all 3 phases shipped 2026-04-22)**
Route: `/experience-creators` (public, no auth required)
Level: Standalone flow, accessed from Career Clarity Quiz "build" fork

> **Full handoff doc:** `docs/2026-04-22-experience-creator-matching-handoff.md` — contains complete file map, schema, archetype definitions, offer templates, and all design decisions.

## What it is

A flow where users browse experience creators (workshop leaders, retreat hosts, cohort builders, performers, facilitators) organized by business model archetype, select the ones they resonate with, and receive a personalized product suite recommendation with a "hell yes or not quite" validation at each layer.

## Why it matters

FindMyFlow users arrive burnt out and disconnected. The Career Clarity Quiz tells them "build your own thing" or "find the right job." For the "build" path, this flow answers the next question: "What kind of thing should I build, and how do other people like me actually make money doing it?"

Instead of abstract business planning, users see real people who built careers from experiences (workshops, retreats, cohorts, performances) and get a concrete product suite template based on who they resonate with.

## How it connects to the journey

```
Level 0: Curiosity Compass (skills) + Identify Topics (problems)
Level 3: Career Clarity Quiz ("should I change?")
       → "Build your own thing" path
       → Experience Creator Matching (this feature)
       → Product suite template feeds business stages 1-7
```

Also connects to:
- **Play Profile**: personality DNA for execution challenges (HOW you work)
- **Experience Creator Matching**: business model for offerings (WHAT you build)
- **People Matching** (`/people`): skill/problem overlap (WHO did this before you)
- **Zarlo AI**: selected archetype feeds Zarlo context for business advice

## The flow

### Step 1: Browse by category

Six business model archetypes displayed as category cards:

| Category | Description | Example creators |
|----------|-------------|-----------------|
| **Workshops & Training** | Build expertise, teach it live | Brené Brown, John Gottman, Wim Hof, Marva Collins |
| **Cohorts & Courses** | Structured group programmes with start/end dates | Marie Forleo, Ali Abdaal, Jay Shetty, Dave Ramsey |
| **Live Events & Performance** | Fill rooms with transformation or art | Tony Robbins, Lin-Manuel Miranda, Glennon Doyle, Nina Simone |
| **Books, Content & Media** | Build audience through content, monetize through authority | James Clear, Simon Sinek, Esther Perel, Elizabeth Gilbert |
| **Facilitation & Community** | Gather people and hold space | Priya Parker, Paulo Freire, Phil Jackson, Tarana Burke |
| **Retreats & Immersive** | Design deep, contained experiences | Gabor Mate, Tenzin Palmo, Yayoi Kusama, Walt Disney |

### Step 2: Select people

User taps a category to see all people in it as tiles. Each tile shows:
- Pixar-style portrait image (for modern creators) or emoji/initial (for historical)
- Name
- One-liner from their profile

User ticks anyone they resonate with. Minimum 1 selection. Can browse multiple categories.

### Step 3: Product suite reveal (per-layer validation)

Based on selections, show a product suite with one recommendation per layer. Each layer gets its own "hell yes or not quite" validation:

```
ATTRACTION: Free podcast that demonstrates your method
  🔥 Hell Yes     🤔 Show me other options
  → alternatives from other archetypes

CORE OFFER: Live workshop ($500-$5K)
  🔥 Hell Yes     🤔 Show me other options

SCALE: Certify others to teach your method
  🔥 Hell Yes     🤔 Show me other options

CONTINUITY: Books + digital products
  🔥 Hell Yes     🤔 Show me other options
```

"Show me other options" reveals alternative approaches to that layer from other archetypes, each with proof from specific creators.

### Step 4: Final result

Show the complete custom product suite (may be a Frankenstein of multiple archetypes) with:
- The model name (or "Custom blend")
- Each layer with the approach they confirmed
- 2-3 proof quotes from their selected people
- One first step per archetype involved

Save to Supabase.

## Data assets

All complete:

| File | Contents | Status |
|------|----------|--------|
| `public/data/experienceCreatorDNA.json` | 247 non-founder DNA profiles (59 with experienceType tag) | Complete |
| `public/data/experienceCreatorOfferMap.json` | Per-person revenue stream → offer slot mapping | In progress |
| `public/data/careerModels.json` | 318 career models with revenue streams, trajectories, lessons | Complete |
| `public/data/nonFounderProfiles.json` | 243 non-founder profiles with bios, one-liners, narratives | Complete |
| `public/data/nonFounderPlaySkills.json` | 243 skill tag profiles | Complete |
| `public/images/creators/` | Pixar-style portraits (3 done: wim-hof.png, tony-robbins.png, bren-brown.png) | 3/~15 done |

## DNA sliders (for matching)

All non-founders have 5 sliders (1-5 scale):

| Slider | Spectrum | Shared with founders? |
|--------|----------|----------------------|
| workRhythm | Marathon ↔ Sprinter | Yes |
| fuelType | Clean Fuel ↔ Dirty Fuel | Yes |
| knowledgeStyle | Analytical ↔ Intuitive | Yes |
| impactStyle | Direct ↔ Systemic | No (replaces orientation) |
| growthMode | Deep Expertise ↔ Broad Leadership | No (replaces scaleApproach) |

impactStyle and growthMode replace the founder-specific sliders (orientation, scaleApproach) for the employee path. Score impactStyle on HOW they work, not downstream consequence.

## Product suite logic

Each experience creator's revenue streams are tagged per-person with their offer slot (attraction/core/scale/continuity). The same stream can be different slots for different people:
- "Books" = continuity for Brené Brown (passive alongside certification), core for James Clear (the book IS the business)
- "Podcast" = attraction for Tara Brach (free), core for Esther Perel (monetised Spotify deal)

When user selects multiple people:
1. Group selected people by archetype category
2. Show the product suite from the dominant archetype
3. User validates each layer with "hell yes / not quite"
4. "Not quite" shows alternatives from other archetypes
5. Final result may blend layers from multiple archetypes

## Archetype first steps

| Archetype | First Step |
|-----------|-----------|
| Workshops & Training | Run one free workshop on your topic this month |
| Cohorts & Courses | Write 10 free posts on your topic, then invite 10 people to a paid pilot |
| Live Events & Performance | Book one small venue and sell 20 tickets to a 2-hour experience |
| Books, Content & Media | Publish weekly for 3 months before building any paid product |
| Facilitation & Community | Gather 8 people in a room and facilitate one conversation |
| Retreats & Immersive | Design a 1-day experience and run it for 6 people |

## UI patterns to reuse

- **Swipe cards**: `em-swipe-card`, `em-swipe-image`, `em-swipe-actions` from `EssenceMirrorFlow.jsx` / `EssenceMirrorFlow.css`
- **Purple gradient container**: `ccq-container` from `CareerClarityQuiz.css`
- **Gold CTA buttons**: `ccq-primary-btn` or `np-cta` from design guide
- **Progress dots**: `ccq-progress-dots` from `CareerClarityQuiz.css`
- **Glass morphism cards**: `ccq-info-card` pattern

## Database

Results save to Supabase. Suggested table (migration not yet created):

```sql
create table experience_creator_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  selected_creators text[] not null,
  dominant_archetype text,
  product_suite jsonb,  -- {attraction: "...", core: "...", scale: "...", continuity: "..."}
  layer_validations jsonb,  -- {attraction: "hell_yes", core: "not_quite", ...}
  created_at timestamptz default now()
);
```

## Relationship to other systems

| System | Relationship |
|--------|-------------|
| Career Clarity Quiz (`/career-clarity`) | Upstream. "Build your own thing" result leads here. |
| People Matching (`/people`) | Parallel. Skill/problem overlap matching. This feature is business model matching. |
| Play Profile | Parallel. Personality DNA for execution. This feature is for offering design. |
| Business stages 1-7 | Downstream. Product suite template pre-fills offer design flows. |
| Zarlo AI | Feeds context. "User resonates with certification empire builders." |
| Level 3: Direction | This feature answers the Level 3 question: "What do I build?" |

## Key decisions made

1. Career Clarity Quiz replaces Flow Finder Problems as Level 3 deep dive (problems already identified at Level 0)
2. impactStyle + growthMode replace orientation + scaleApproach for non-founder DNA (85% confidence vs 55-65%)
3. Zarlo career models always visible, not gated to Level 3+
4. People Matching completion = saving at least one favourite
5. Per-layer "hell yes" validation, not whole-model validation
6. Categories present ALL people (including historical), not just curated modern 10
7. All 59 experience creators have Pixar portraits (not just modern ones)
8. 3-layer model (attraction/core/continuity), not 4. Scale is optional for workshop/cohort only.
9. Public route as lead magnet (no AuthGate). Anonymous → "Sign Up to Save My Model" → /get-started
10. Career Clarity Quiz forks "build" path: "experiences" → /experience-creators, "product/company" → /get-started
11. Attraction vs continuity rule: big audience before product = continuity, product built audience = attraction

## Implementation

**All complete.** See `docs/2026-04-22-experience-creator-matching-handoff.md` for full file map, schema, and technical details.

Key files:
- `src/flows/ExperienceCreatorFlow.jsx` + `.css` — main flow component
- `src/AppRouter.jsx` — public route at `/experience-creators`
- `src/lib/zarlo/zarloEngine.js` — context wiring
- `supabase/migrations/20260422000000_experience_creator_selections.sql` — DB table (applied)
- `public/images/creators/` — 59 Pixar portraits
- `public/data/experienceCreatorDNA.json` — 247 DNA profiles
- `public/data/experienceCreatorOfferMap.json` — 59 per-person offer maps
