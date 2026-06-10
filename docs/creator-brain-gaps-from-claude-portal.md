# Creator Brain: Gaps from claude-portal

**Date:** 2026-06-08
**Purpose:** Fields that claude-portal's business brain captured that the creator brain doesn't yet. Reference for future additions.

---

## Fields added (ready, need capture point)

These are in `canonicalFields.js` but have no auto-populate source yet.

| Field | Domain | Why it matters | Capture point needed |
|-------|--------|---------------|---------------------|
| `identity.business_name` | identity | Basic context for every AI prompt | Edit Identity or onboarding |
| `identity.website` | identity | External extraction source, landing page context | Edit Identity or onboarding |
| `identity.social_links` | identity | Content channel context, voice analysis source | Edit Identity or onboarding |

---

## Fields to consider adding later

### Offer depth (Hormozi $100M framework)

| claude-portal field | What it captures | Relevance to experience creators |
|---|---|---|
| `offer.upsell_product` | Upsell tier | **High** - Money Model flows already capture this, just not in brain |
| `offer.downsell_product` | Downsell tier | **High** - Same as above |
| `offer.niche_hook` | Specific hook/angle (Hormozi Layer 4) | **Medium** - Scope Map + Remarkable Angle get close |
| `offer.time_to_result` | How fast the transformation happens | **High** - Critical for offer copy, landing pages |
| `offer.value_stack_bonuses` | What bonuses are included | **Medium** - More relevant for courses than live events |
| `offer.scarcity_mechanism` | How urgency is created | **Medium** - "Limited spots" is natural for events |
| `offer.urgency_mechanism` | Time-based pressure | **Low** - Less relevant for experience creators |
| `offer.price_to_value_ratio` | Perceived value vs price | **Low** - Hard to quantify for experiences |

### Customer understanding

| claude-portal field | What it captures | Relevance |
|---|---|---|
| `industry.persona.emotional_state` | How ideal customer feels | **High** - Key for content and sales copy |
| `industry.persona.core_problem` | The one problem they solve | **High** - Already partially captured in Life Map problems |
| `industry.persona.job_to_be_done` | What customer is hiring them for | **High** - Shifts content from features to outcomes |
| `industry.top_objections` | Why people say no | **High** - CRM has `objection_logs` table, brain should read it |
| `industry.buying_triggers` | What makes people say yes | **High** - Useful for content + sales |
| `industry.customer_segments.best` | Best customer description | **Medium** - `customer_segments` table exists (0 rows) |
| `industry.customer_segments.worst` | Worst customer description | **Medium** - Useful for qualifying, less urgent |

### Competitors (entire domain missing)

| claude-portal field | What it captures | Relevance |
|---|---|---|
| `competitors.differentiator` | What makes them different | **Medium** - Remarkable Angle captures the "rule break" version of this |
| `competitors.category_of_one` | Their unique category | **Medium** - Marketing positioning tool |
| `competitors.list` | Who they compete with | **Low** - Most experience creators don't think competitively |
| `competitors.positioned_against` | Who they position against | **Low** - Same |

### Operational reality

| claude-portal field | What it captures | Relevance |
|---|---|---|
| `business.hours_per_week` | Capacity constraint | **Medium** - PTUF needs this for accuracy |
| `business.marketing_budget` | What they spend | **Low** - Most creators spend $0 on ads |
| `business.acquisition_strategy` | How they get customers | **Medium** - Useful for L3 campaign recommendations |
| `business.gross_margin` | Profit margin | **Low** - Solo creators with no COGS |
| `business.team_size` | Team | **Low** - Almost all solo |
| `business.years_in_business` | Experience level | **Low** - Journey level captures this better |
| `business.current_clients` | Client count | **Medium** - Audience domain captures contacts/attendees instead |

---

## Priority order if adding more fields

1. `offer.upsell_product` + `offer.downsell_product` - Data already exists from Money Model flows
2. `offer.time_to_result` - Needs capture in offer flows
3. `audience.top_objections` + `audience.buying_triggers` - Can aggregate from CRM objection_logs
4. `audience.emotional_state` + `audience.core_problem` - Enrich from Life Map data
5. Competitors domain - Build when creators are ready for positioning work

---

## Existing tables with uncaptured data

These Supabase tables have data that could feed the brain but aren't wired:

| Table | Rows | Could feed |
|-------|------|-----------|
| `business_profiles` | 0 | Was meant for operational reality (hours, margin, etc.) - never populated |
| `customer_segments` | 0 | Best/average/worst customer descriptions |
| `competitor_analysis` | 0 | Competitor intelligence |
| `objection_logs` | 0 | Top objections and buying triggers |
| `deal_outcomes` | 0 | Win/loss analysis for understanding what works |
| `voice_profiles` | 1 | Already has tone/style data, needs brain hook |
| `content_history` | 25 | Could derive voice.top_content_types and voice.best_platform |
