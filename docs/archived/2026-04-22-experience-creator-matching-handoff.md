# Experience Creator Matching — Full Build Handoff

Date: 2026-04-22
Status: Complete (all 3 phases shipped)
Route: `/experience-creators` (public, no auth required)

## What was built

A complete flow where users browse 59 experience creators (workshop leaders, retreat hosts, cohort builders, performers, facilitators) organized by 6 business model archetypes, select who they resonate with, and receive a personalized 3-layer product suite recommendation with per-layer "hell yes or not quite" validation.

Designed as a public lead magnet. Anonymous users see "Sign Up to Save My Model" which routes to `/get-started`. Logged-in users save to Supabase and navigate to `/create`.

## How it connects

```
Career Clarity Quiz (/career-clarity)
  → "Build your own thing"
    → "Create experiences people come to" → /experience-creators (THIS)
    → "Build a product or company" → /get-started
  → "Find the right job" → /get-started
```

The Career Clarity Quiz now has a follow-up question for the "build" path, forking between experience creators and product/company builders.

Results feed into:
- **Zarlo AI context** — archetype, product suite, and selected creators injected into `getUserContext()`
- **Supabase** — `experience_creator_selections` table stores selections, archetype, product suite, and layer validations
- **Level 3: Direction** — this feature answers "What do I build?"

## The flow (3 screens)

### Screen 1: Browse

Dark background (`#0f0a1e`), purple gradient hero, horizontal scroll card rows per category (Netflix-style). Each card shows a Pixar-style portrait, name, one-liner, and business model tag.

6 categories:
- Workshops & Training (16 people)
- Live Events & Performance (10 people)
- Cohorts & Courses (6 people)
- Books, Content & Media (4 people)
- Facilitation & Community (12 people)
- Retreats & Immersive (11 people)

Tap a card to select (gold border + checkmark). Sticky selection bar slides up from bottom showing avatar stack, count, and "See My Model" button.

### Screen 2: Result

Purple gradient background. Shows:
1. Archetype name and description (based on dominant category from selections)
2. Selected people as chips with avatars
3. Three offer layer cards (attraction, core, continuity) with:
   - Layer-specific content per archetype
   - Proof quotes from selected creators' career models
   - "Hell Yes" confirms (green checkmark) or "Other options" expands alternatives
4. Optional Scale layer (shown for workshop and cohort archetypes only)
5. First step card with archetype-specific action
6. Save button

### Screen 3: Alternatives (inline)

When user taps "Other options" on any layer, it expands below the card showing alternative approaches from other archetypes. Each alternative shows an emoji, the offer name, and source archetype. Tapping one swaps the layer content, shows "from [archetype]" label, and confirms.

This lets users build a Frankenstein model: Workshop attraction + Cohort core + Retreat continuity.

## Data assets

| File | Contents | Count |
|------|----------|-------|
| `public/data/experienceCreatorDNA.json` | All non-founder DNA profiles (5 sliders each) | 247 profiles (59 with experienceType) |
| `public/data/experienceCreatorOfferMap.json` | Per-person revenue stream to offer slot mapping | 59 creators |
| `public/data/careerModels.json` | Career models with revenue streams, trajectories, lessons | 318 total (75 founders + 243 non-founders) |
| `public/data/nonFounderProfiles.json` | Non-founder profiles with bios, one-liners, narratives | 243 profiles |
| `public/data/nonFounderPlaySkills.json` | Skill tags per non-founder | 243 profiles |
| `public/images/creators/*.png` | Pixar-style portraits (Gemini 3.1 Flash) | 59 images |

### DNA sliders (5 per person)

| Slider | Spectrum | Shared with founders? |
|--------|----------|----------------------|
| workRhythm | 1=Marathon ↔ 5=Sprinter | Yes |
| fuelType | 1=Clean Fuel ↔ 5=Dirty Fuel | Yes |
| knowledgeStyle | 1=Analytical ↔ 5=Intuitive | Yes |
| impactStyle | 1=Direct ↔ 5=Systemic | No (replaces orientation for non-founders) |
| growthMode | 1=Deep Expertise ↔ 5=Broad Leadership | No (replaces scaleApproach for non-founders) |

### Offer slot mapping

Per-person contextual mapping of revenue streams to attraction/core/scale/continuity. Same stream can be different slots for different people:
- "Books" = attraction for Brene Brown, continuity for James Clear
- Rule: if audience was big before the product, it's continuity. If the product built the audience, it's attraction.

### 15 modern experience creators added

Brene Brown, Tony Robbins, Marie Forleo, Wim Hof, Adriene Mishler, James Clear, Esther Perel, Priya Parker, Jay Shetty, Elizabeth Gilbert, Simon Sinek, Ali Abdaal, Tara Brach, Glennon Doyle, Gabby Bernstein. Each has full profile, career model, skill tags, DNA sliders, and Pixar portrait.

## Source files

### Created
- `src/flows/ExperienceCreatorFlow.jsx` — main flow component (~470 lines)
- `src/flows/ExperienceCreatorFlow.css` — all styles, `ecf-` prefix scoped (~530 lines)
- `supabase/migrations/20260422000000_experience_creator_selections.sql` — DB table with RLS
- `public/data/experienceCreatorDNA.json` — 247 DNA profiles
- `public/data/experienceCreatorOfferMap.json` — 59 per-person offer slot maps
- `public/images/creators/` — 59 Pixar portraits
- `docs/feature-brief-experience-creator-matching.md` — full feature brief
- `docs/2026-04-15-level3-direction-integration.md` — Level 3 integration plan

### Modified
- `src/AppRouter.jsx` — added route + lazy import, hid Zarlo on this route
- `src/components/BottomToolbar.jsx` — added to HIDDEN_ROUTES
- `src/flows/CareerClarityQuiz.jsx` — restyled to FindMyFlow design (ccq- CSS), added "experiences vs product" fork, localStorage persistence
- `src/flows/CareerClarityQuiz.css` — full restyle from Tailwind dark to purple gradient
- `src/lib/zarlo/zarloEngine.js` — fetches experience_creator_selections, returns archetype + suite in context
- `src/components/Zarlo/ZarloChat.jsx` — added experienceCreatorArchetype to getNextBestAction destructure
- `src/components/level/LevelConfig.js` — Level 3 deep dive changed to Career Clarity Quiz, People Matching added as extra quest
- `public/data/careerModels.json` — expanded from 303 to 318 profiles
- `public/data/nonFounderProfiles.json` — expanded from 228 to 243 profiles
- `public/data/nonFounderPlaySkills.json` — expanded from 228 to 243 profiles
- `CLAUDE.md` — updated with all new routes, features, and data

## Supabase table schema

```sql
create table experience_creator_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  selected_creators text[] not null default '{}',
  dominant_archetype text,
  product_suite jsonb,       -- {attraction: "...", core: "...", continuity: "..."}
  layer_validations jsonb,   -- {attraction: "confirmed", core: "confirmed", scale: "skipped"}
  created_at timestamptz default now()
);
```

Migration NOT yet applied. Run `supabase db push` to apply.

## Archetype definitions

| ID | Name | Description | First Step |
|----|------|-------------|-----------|
| `workshop` | Workshops & Training | Build expertise, codify into method, teach live | Run one free workshop this month |
| `performance` | Live Events & Performance | Fill rooms with transformation, art, or catharsis | Book a small venue, sell 20 tickets |
| `cohort` | Cohorts & Courses | Structured group programmes, start and end dates | Write 10 free posts, then invite 10 people to a pilot |
| `books_media` | Books, Content & Media | Build authority through content, monetize through speaking | Publish weekly for 3 months before any paid product |
| `facilitation` | Facilitation & Community | Gather people and hold space | Gather 8 people and facilitate one conversation |
| `retreats` | Retreats & Immersive | Deep, contained experiences that transform | Design a 1-day experience for 6 people |

## Offer layer templates per archetype

Each archetype has 3 layers (attraction, core, continuity) plus optional scale for workshop and cohort:

### Workshop
- Attraction: Free content that demonstrates your method
- Core: Live workshop or training ($500-$5K)
- Continuity: Online courses + digital products
- Scale (optional): Certify others to teach your method

### Cohort
- Attraction: Free content that builds trust weekly
- Core: Cohort-based programme ($1K-$5K)
- Continuity: Digital products + brand partnerships
- Scale (optional): Certify others to teach your method

### Performance
- Attraction: Free performances or content
- Core: Live performance or event ($50-$5K)
- Continuity: Recordings, merch, or licensing

### Books & Media
- Attraction: Newsletter or podcast (free, consistent)
- Core: Book, keynote, or consulting
- Continuity: Royalties, products, or online classes

### Facilitation
- Attraction: Published framework or free gatherings
- Core: Facilitated experience ($500-$10K)
- Continuity: Retainer clients or ongoing community

### Retreats
- Attraction: Free talks, app, or content
- Core: Retreat or immersive experience ($500-$5K)
- Continuity: Online courses, app, or membership

## Career Clarity Quiz changes

- Restyled from Tailwind dark theme to FindMyFlow purple gradient (`ccq-` scoped CSS)
- Gold selection buttons, glass morphism cards, progress dots
- localStorage persistence across ALL stages including results
- "Build your own thing" result now shows two CTA cards:
  - "Create experiences people come to" → `/experience-creators`
  - "Build a product or company" → `/get-started`
- "Find the right job" path unchanged (single CTA to `/get-started`)
- Both CTA paths go to `/get-started` for the job path

## Level 3: Direction changes

- Deep dive changed from Flow Finder Problems (`/nikigai/problems`) to Career Clarity Quiz (`/career-clarity`)
- People Matching (`/people`) added as extra quest
- Completion checks wired in LevelTab.jsx:
  - Career Clarity: checks `quiz_results` table for user
  - People Matching: checks `findmyflow_saved_people` localStorage for saved favourites

## Pixar image generation

59 portraits generated via Gemini 3.1 Flash (`gemini-3.1-flash-image-preview`). Text-to-image, no photo input.

Prompt pattern that works best:
- Focus on EMOTION and SETTING, not physical appearance
- Describe the person doing their signature thing in their specific environment
- Include environmental details that tell their story (frozen lake, cluttered desk, packed arena)
- End with: "The style should match modern Pixar films: warm, expressive, emotionally rich. Square format."
- Each background is unique to avoid repetition across 59 images

All images stored in `public/images/creators/[slug].png` where slug is lowercase name with non-alphanumeric replaced by hyphens.

## Key design decisions

1. **3 layers, not 4**: Attraction → Core → Continuity. Scale is optional, shown only for workshop and cohort archetypes. Based on data: only 10% of experience creators have true upsells, most run on 2-3 layers.

2. **Per-layer validation, not whole-model**: Users confirm each layer individually with "Hell Yes" or swap via "Other options". This prevents the volume problem where 3 lukewarm picks from one category override 1 strong pick from another.

3. **Dominant archetype by count**: The archetype shown is whichever category the user selected the most people from. Tie-breaks go to first selected.

4. **Public route as lead magnet**: No AuthGate. Anonymous users complete the full flow and see "Sign Up to Save My Model" which routes to `/get-started`.

5. **Two employee-specific DNA sliders**: impactStyle (Direct ↔ Systemic) and growthMode (Deep Expertise ↔ Broad Leadership) replace the founder-specific orientation and scaleApproach sliders. 85% confidence vs 55-65% for the old sliders applied to non-founders.

6. **Attraction vs continuity rule**: If the creator had a big audience before the product, it's continuity. If the product built the audience, it's attraction. Applied per-person, not globally.

## What's NOT built yet

- Employee Play Profile quiz (5 slider questions with impactStyle + growthMode replacing orientation + scaleApproach)
- Upsell/downsell tiers within core offer (designed but deferred — framework is tiering one experience at 3 price points)
- growthMode-aware model complexity (simple model for deep specialists, full ladder for broad leaders)
- `/create` portal (where "Save My Model" navigates logged-in users to)
