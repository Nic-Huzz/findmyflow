# Experience Ambitions — Roadmap

## V1: Anchor Point (Current Build)

Experiences as grouping layer within life paths. Simple creation: text + NS predicted state. Tasks and courage challenges bucketed under experiences. Completion states visible on courage challenges. Experience state badge tappable to re-rate.

**Data model:** `quest_experiences` table (quest_id, label, capacity_state). `quest_tasks.experience_id` FK.

**No dimensions, no auto-calibration, no business recommendations.** Just the anchor point with data visible.

---

## V2: Dimension Tagging + Stepping Stones

Each experience gets tagged with quantifiable dimensions showing WHERE the user currently is and WHERE the experience requires them to be. This creates visible stepping stone ladders.

### Dimensions identified

| Dimension | Stepping stones | Example |
|-----------|----------------|---------|
| **People** (audience/group size) | 1 → 5 → 20 → 50 → 200+ | "I've taught 5, this needs 50" |
| **Money** (price point) | Free → donation → $50 → $200 → $500+ | "I've charged $50, this needs $200" |
| **Location** (venue/setting) | Home/private → cowork/cafe → rented venue → destination → international | "I've done home sessions, this needs a venue" |
| **Duration** (session length) | 1hr → half day → full day → multi-day → retreat/residency | "I've done 1hr, this is a full day" |
| **Frequency** (cadence) | One-off → monthly → weekly → ongoing program | "I've done one-offs, this is weekly" |
| **Medium** (delivery) | In-person → hybrid → online → async/digital product | "I've only done in-person, this needs online" |
| **Independence** (role) | Co-led/assisted → solo → training others to lead | "I've co-led, this needs solo" |

### How it works

- On experience creation (or edit), user optionally tags 1-3 primary dimensions
- For each tagged dimension, user marks current level and target level
- The GAP between current and target drives courage challenge calibration
- Edge function `groan-challenge-generator` receives dimension context: "generate a stepping stone from [current] to [next level] on [dimension]"
- Visual: each experience shows dimension progress bars (current → target)

### Key insight

Dimensions cross-pollinate. "Run a 20-person retreat in Bali at $200/head" spans People(20) + Location(destination) + Duration(multi-day) + Money($200). Don't decompose into separate tracks — show all dimensions on the experience, but let the user pick which edge to push next.

### Data model additions (V2)

```sql
create table experience_dimensions (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid references quest_experiences on delete cascade,
  dimension text not null,        -- people / money / location / duration / frequency / medium / independence
  current_level text,             -- free-text or enum per dimension
  target_level text,
  created_at timestamptz default now()
);
```

---

## V3: Hormozi Business Recommendations

Once the user has experiences with dimension data, the system can make business-level recommendations to close each gap. This wires experiences to the existing Hormozi/business features in the app.

### Dimension → Business recommendation mapping

| Dimension gap | Recommendation area | Existing app feature |
|--------------|--------------------|--------------------|
| **Money** (pricing gap) | Business model design, offer packaging, pricing strategy | Offer Builder (`/offer-builder`), Money Model flows (`/attraction-offer`, `/upsell-offer`, etc.) |
| **People** (audience gap) | Customer acquisition, marketing, community building | CRM Attract tower, Content Generator, Funnel Calculator |
| **Location** (venue gap) | Venue partnerships, retreat logistics, travel planning | New: venue sourcing / logistics module |
| **Duration** (format gap) | Experience design, agenda building, energy management | Shift Architecture (`/create/experience/new`), Experience Create flow |
| **Frequency** (cadence gap) | Retention, membership design, recurring revenue | Continuity Offer (`/continuity-offer`), CRM Nurture tower |
| **Medium** (delivery gap) | Tech setup, hybrid event design, digital product creation | New: digital delivery module |
| **Independence** (role gap) | Team building, facilitator training, SOPs | Scale Diagnostic (`/create/scale-diagnostic`), Scale Score |

### How it works

- When a user views an experience with dimension gaps, the system surfaces contextual recommendations
- "You want to charge $200 but you've only done free — want help designing your offer?" → links to Offer Builder
- "You want 50 people but you've reached 5 — want to plan your funnel?" → links to Funnel Calculator
- Recommendations are contextual cards on the experience detail, not a separate flow
- AI can generate personalized recommendations based on the specific gap + the user's existing data (clusters, skills, quests)

### Key principle

The experience is the bridge between self-knowledge (V1: courage/capacity) and business action (V3: Hormozi recommendations). V1 builds the anchor. V2 quantifies the gap. V3 fills the gap with business tools.

### Grand Slam Offer connection

Each experience ambition is essentially a micro-offer the user is building toward. The Hormozi Grand Slam framework applies at the experience level:
- **Dream outcome**: The experience itself ("Lead a 50-person retreat")
- **Perceived likelihood of achievement**: The NS capacity state (Pressure = low, Vibe Rise = high)
- **Time delay**: The stepping stone ladder (how many steps to get there)
- **Effort & sacrifice**: The dimension gaps (how many dimensions need growth)

V3 optimizes all four variables for each experience.
