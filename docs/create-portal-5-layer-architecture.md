# /create Portal: 5-Layer Architecture

**Source:** AI Team Hub 5 Layers concept (`ai-team-hub/public/layers.html`)
**Date:** 2026-06-08
**Purpose:** Map the 5-layer AI franchise architecture to the /create portal for experience creators, showing what exists, what's missing, and what to build.

**Strategy:** Start with experience creators as the single vertical. Go deep. Expand to other verticals once the system is proven. The layers.html envisioned multi-vertical from day one (real estate, coaching, fitness) but /create should earn the right to expand by nailing one vertical first.

---

## The 5 Layers (adapted for /create)

```
L5  Platform / Ecosystem     — Experience playbook marketplace, data flywheel
L4  The Build Layer           — AI builds custom tools for creators (landing pages, booking, portals)
L3  Autonomous Operations     — AI creates assets + tracks execution via checklists
L2  Business Context Engine   — Unified creator profile (business + inner game)
L1  Franchise Playbook        — Experience creator workflows, frameworks, templates
```

Each layer builds on the one below. Together they create a new category: an AI-powered operating system for experience creators.

---

## L1: The Franchise Playbook

> "This is how they get in the door."

Industry-specific workflows, frameworks, and templates purpose-built for experience creators (workshops, retreats, cohorts, facilitation, performances, courses).

### What already exists

| Feature | File/Route | Status |
|---------|-----------|--------|
| Experience Creator Matching | `/experience-creators`, `ExperienceCreatorFlow.jsx` | 59 creators, 6 business model archetypes |
| Shift Architecture | `/create/experience/new`, `docs/subconscious-shift-method.md` | 4-step AI-guided container design |
| Hormozi Offer Stack | `MoneyModelFlowBase.jsx` + configs | Grand Slam, Attraction, Upsell, Downsell, Continuity flows |
| Sales Playbook | `/crm/sales-playbook` | 7 frameworks, 15 scripts, CLOSER method, objection patterns |
| Business Systems Flywheel | `/crm/tools/systems` | 4-phase checklist (Foundation, Attract, Nurture, Optimise) |
| Experience Library | `ExperienceLibrary.jsx` | Cloneable templates by experience type |
| Remarkable Flow | `/create/remarkable` | Rule break, unexpected combo, extreme action |
| Pay Rent Model | `/create/pay-rent` | 5 early revenue strategies for creators |
| Scale Income | `/create/scale-income` | Attraction / Core / Continuity product suite |
| Content Generator | `/crm/content-create` | AI-powered content with 8 content types |
| PTUF / LTV / CAC Calculators | `/crm/ptuf`, `/crm/ltv`, `/crm/cac` | Business metrics with auto-populate |
| CRM (full) | `/crm/*` | Contacts, pipeline, email sequences, warm outreach, analytics |

### What's missing from L1

| Gap | Description | Priority |
|-----|-------------|----------|
| Hook Scorer Flow | The 6 Hormozi hooks exist in Sales Playbook but there's no guided flow to score which hook fits the creator's offer, then auto-generate hook copy | High |
| Experience-specific playbooks | Pre-built marketing/fill-the-room plans per experience type (workshop vs retreat vs cohort have very different timelines and channels) | Medium |
| Pricing calculator per experience type | "For a 2-hour workshop with 15 people in Bali, here's what similar creators charge" | Medium |

### L1 verdict: 85% built. Strongest layer. The vertical playbook for experience creators is deep and differentiated.

---

## L2: The Business Context Engine

> "This is why they can't leave. Context compounds."

The AI doesn't just know the experience creator industry, it knows THIS creator's specific business, identity, inner world, audience, and numbers. Every interaction deepens the context. Leaving means starting over.

### What already exists (scattered)

**Business context:**

| Data Point | Source Table | What it captures |
|-----------|-------------|-----------------|
| Positioning | `scope_map_results` | Stream / Lake / Waterfall / River |
| Creator archetype | `experience_creator_selections` | Dominant archetype + product suite + north stars |
| Work style | `founder_dna_results` | DNA code, matched creator, sliders (rhythm, fuel, orientation, knowledge, scale) |
| Offer stack | `creator_assessments` | Attraction / core / continuity details + status |
| Pay rent model | `user_stage_progress` | How they currently make money |
| Remarkable angle | `remarkable_angles` | Rule break, unexpected combo, extreme action, AI statements |
| Revenue targets | `funnel_metrics` | PTUF, LTV, CAC data |
| Contacts | `crm_contacts` | Audience, leads, lifecycle stage, engagement |
| Deals | `sales_deals` | Pipeline, close rates, revenue |
| Content history | `content_history` | What they've posted, performance data |
| Experiences | `user_experiences` | Past events, attendee counts, 3% improvements |

**Inner game context (Vibe Rise's differentiator):**

| Data Point | Source Table | What it captures |
|-----------|-------------|-----------------|
| Essence archetype | `lead_flow_profiles` | Core identity (12 archetypes), avatar, hero name |
| Nervous system limits | `nervous_system_responses` | Visibility ceiling, income ceiling, NS archetype |
| Wound map | `quest_completions` (wound_map) | Origin story, the wound behind the work |
| Limiting beliefs | `healing_compass_responses` | Beliefs blocking next level |
| Play profile | `founder_dna_results` | How they're wired (marathon/sprint, fire/purpose) |
| Capacity score | `nervous_system_checkins` | Daily state, practices, drains, wahoos |
| Journey level | `user_stage_progress` | Current level (0-8), zone diagnosis |

**Why inner game in L2 matters:** A regular CRM knows a creator has 50 contacts and $2K monthly revenue. Vibe Rise's context engine knows their nervous system caps visibility at 500 people, their wound is around being seen, their limiting belief is "I can't charge that", and they work in sprints not marathons. This means the AI can say "I know you need to post 3 times this week, but your capacity score is low and your drain is activated. Let's do 1 high-impact post instead." No other platform can do this.

### What's missing from L2

| Gap | Description | Priority |
|-----|-------------|----------|
| Unified Creator Profile object | All the data above lives in 15+ separate tables with no single aggregated "business ring" that feeds every AI interaction. `contentContext.js` does partial aggregation for content generation, but there's no `getCreatorContext()` that returns the full picture. | **Critical** |
| Progressive learning | The context is captured at snapshot moments (flow completion) but doesn't compound from daily usage. No pattern like "every time you complete an experience, the system learns what worked." | High |
| Context-aware AI across all features | Zarlo and Content Generator use some context, but the CRM dashboard, analytics, smart alerts, and checklists don't adapt based on inner game data or creator archetype. | High |
| Voice profile integration | Voice data exists in Supabase (`voice_profiles`) but isn't wired into content generation per-creator. | Medium |

### The Creator Brain (ported from claude-portal)

The claude-portal project built a "Business Brain" with a sophisticated architecture for capturing, merging, and serving business context. We're bringing the **architecture** across and adapting the **schema** for experience creators.

**What we're keeping from claude-portal:**
- BrainField type (confidence / state / source / evidence, orthogonal)
- Sidecar + markdown pattern (JSON is truth, markdown is derived view for AI prompts)
- Merge rules (user decisions sticky, confidence > recency > source priority)
- Conflict detection (flag, don't overwrite)

**What we're changing:**
- Schema redesigned for experience creators (6 domains instead of 5)
- Auto-populated from flow completions (not external extraction only)
- Inner game is a first-class domain (no other platform has this)
- Consumers are web app AI features, not CLI

#### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    creator_brain table                    │
│  user_id (PK) | facts (JSONB sidecar) | 6x _md columns  │
└──────────────────────────┬──────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   Auto-populate      getCreatorBrain()   Brain Review UI
   (flow hooks)       (service function)   (/create/brain)
          │                │                │
  Fires after flow    Consumed by:        Creator confirms,
  completion:         - Zarlo             edits, or skips
  - Scope Map         - Content Generator proposed fields
  - Essence Mirror    - Smart Alerts
  - Play Profile      - L3 Autonomous Ops
  - Remarkable Flow   - L4 Build Layer
  - Offer flows
  - CRM activity
  - Experience completions
```

#### BrainField type

```javascript
// Every field in the brain carries metadata
{
  value: any,                    // the actual data
  confidence: 'confirmed' | 'high' | 'medium' | 'low' | null,
  state: 'empty' | 'proposed' | 'confirmed' | 'skipped',
  has_conflict: false,
  source: 'flow' | 'user' | 'document' | 'website' | 'ai_inferred' | null,
  source_identifier: 'scope_map_flow',  // which flow or source
  evidence: 'Selected "Stream" in Scope Map diagnostic',  // max 200 chars
  updated_at: '2026-06-08T...',
  conflicts: []                  // when has_conflict=true
}

// Orthogonality matters:
// - confidence:high + state:proposed = AI extracted, user hasn't reviewed
// - confidence:medium + state:confirmed = AI inferred, user clicked "looks right"
// - state:confirmed from any source = sticky, survives re-extraction
```

#### Merge rules

| Scenario | Rule |
|----------|------|
| No existing field | Add as `state: "proposed"` |
| Existing is `confirmed` or `skipped` | User choice is sticky. New value recorded as conflict but doesn't overwrite. |
| Both `proposed` | Higher confidence wins. Tie: more recent wins. Tie: source priority (user > flow > ai_inferred > document > website) |
| Conflict detected | `has_conflict: true`, append to `conflicts[]` with timestamp + evidence |

#### 6 Domains (adapted for experience creators)

**1. identity.md** (~15 fields)
- Essence archetype, hero name, hero avatar
- Creator archetype (workshop/retreat/cohort/facilitation/performance/books_media)
- Scope Map position (stream/lake/waterfall/river)
- Skills (from Life Map)
- Problems they're passionate about (from Life Map)
- North star creators (from Experience Creator Matching)
- Remarkable angle (rule break, unexpected combo, extreme action)

*Auto-populated from:* `lead_flow_profiles`, `experience_creator_selections`, `scope_map_results`, `nikigai_clusters`, `remarkable_angles`

**2. offer.md** (~20 fields)
- Pay rent model
- Attraction / Core / Continuity product suite + status
- Pricing (from PTUF calculator)
- Dream outcome, niche
- Experience types they run
- Proof stack (testimonials, case studies, credentials)
- Risk reversal / guarantee

*Auto-populated from:* `user_stage_progress`, `creator_assessments`, `funnel_metrics`, experience data

**3. audience.md** (~15 fields)
- Total contacts, lifecycle breakdown
- Top fans (repeat attendees)
- Repeat rate
- Average attendees per event
- Contact sources
- ICP segments (if defined)
- Engagement patterns

*Auto-populated from:* `crm_contacts`, `contact_experiences`, `sales_deals`, experience attendee data

**4. voice.md** (~15 fields)
- Tone (formality, humor, vulnerability, energy)
- Style (sentence rhythm, emoji usage, words to avoid)
- Signature elements (catchphrases, concepts, origin story)
- Brand colors
- Content performance patterns (what types get best engagement)

*Auto-populated from:* `voice_profiles` (Supabase), `content_history` (performance patterns)

**5. inner_game.md** (~15 fields) -- THE DIFFERENTIATOR
- Nervous system archetype
- Visibility ceiling
- Income ceiling
- Wound map summary (origin story theme)
- Active limiting beliefs
- Play Profile (DNA code, matched creator, work rhythm, fuel type)
- Current capacity score
- Current journey level
- Zone diagnosis (current zone per level)
- Daily state pattern (trend from recent check-ins)

*Auto-populated from:* `nervous_system_responses`, `quest_completions`, `healing_compass_responses`, `founder_dna_results`, `nervous_system_checkins`, `user_level_progress`

**6. performance.md** (~10 fields)
- Experiences run (count)
- Average fill rate
- Revenue (if tracked)
- 3% improvement chain (last 3-5 improvements)
- Content volume + top performing
- Pipeline metrics (if using funnel calculator)
- Week-over-week trends

*Auto-populated from:* `user_experiences`, `content_history`, `funnel_metrics`, CRM analytics

**Total: ~90 canonical fields** across 6 domains (same scale as claude-portal, adapted for experience creators).

#### Database table

```sql
create table creator_brain (
  user_id       uuid primary key references auth.users(id),
  identity_md   text default '',
  offer_md      text default '',
  audience_md   text default '',
  voice_md      text default '',
  inner_game_md text default '',
  performance_md text default '',
  facts         jsonb default '{}',   -- sidecar: { "domain.field" → BrainField }
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- RLS: users see only own brain
alter table creator_brain enable row level security;
create policy "Users read own brain" on creator_brain for select using (auth.uid() = user_id);
create policy "Users update own brain" on creator_brain for all using (auth.uid() = user_id);
```

#### How it auto-populates

The brain builds itself silently. When a creator completes a flow, a hook writes the extracted data to the brain sidecar as `state: "proposed"`:

```javascript
// Example: after Scope Map completion
async function onScopeMapComplete(userId, result) {
  // Save to scope_map_results as normal
  await supabase.from('scope_map_results').insert({ user_id: userId, stage: result.stage })

  // Also write to brain
  await updateBrainField(userId, 'identity.scope_position', {
    value: result.stage,
    confidence: 'high',
    state: 'proposed',
    source: 'flow',
    source_identifier: 'scope_map_flow',
    evidence: `Selected "${result.stage}" in Scope Map diagnostic`,
  })
}
```

The brain also auto-updates from CRM activity:
- New contact added -> audience fields recalculate
- Experience completed -> performance fields update
- Content posted -> voice patterns refine
- Daily check-in -> inner game capacity trends update

#### How AI features consume it

```javascript
// Service function: single call, full context
async function getCreatorBrain(userId) {
  const { data } = await supabase
    .from('creator_brain')
    .select('*')
    .eq('user_id', userId)
    .single()

  return {
    facts: data.facts,           // programmatic access (for logic, scoring)
    markdown: {                   // AI prompt injection (for Zarlo, Content Gen, L3)
      identity: data.identity_md,
      offer: data.offer_md,
      audience: data.audience_md,
      voice: data.voice_md,
      inner_game: data.inner_game_md,
      performance: data.performance_md,
    }
  }
}

// Consumed by Zarlo:
const brain = await getCreatorBrain(userId)
const systemPrompt = `You are Zarlo, AI co-founder for this creator.\n\n${brain.markdown.identity}\n${brain.markdown.offer}\n${brain.markdown.inner_game}`

// Consumed by Content Generator:
const brain = await getCreatorBrain(userId)
const contentPrompt = `Write in this creator's voice:\n${brain.markdown.voice}\n\nTheir offer:\n${brain.markdown.offer}\n\nTheir audience:\n${brain.markdown.audience}`

// Consumed by L3 Event Countdown:
const brain = await getCreatorBrain(userId)
const capacity = brain.facts['inner_game.capacity_score']?.value
const ceiling = brain.facts['inner_game.visibility_ceiling']?.value
// Adjust campaign intensity based on inner game state
```

#### Brain Review UI (optional, not required for v1)

At `/create/brain`, creators can see what the platform knows about them. Each field shows state badges (`proposed` / `confirmed` / `skipped`). They can confirm, edit, or skip. This builds trust and improves accuracy, but the brain works without it because auto-populated data is good enough for AI consumption.

#### External extraction (future, not v1)

Keep the claude-portal extraction pipeline concept for later: creators who have an existing website or content can "import" their business into the brain via URL scrape or document upload. Rebuild as a Supabase edge function when needed. For v1, auto-population from flow completions is sufficient.

### L2 verdict: 60% of the raw data exists, but the brain architecture is 0% built. The brain is the critical unlock. It turns scattered data into a unified context that compounds and feeds every AI feature.

---

## L3: Autonomous Operations

> "The upgrade from AI tool to AI employee."

The AI doesn't wait for the creator to open the app and click buttons. It proactively creates marketing assets, tracks execution against checklists, and surfaces what needs attention. The creator approves, not initiates.

### What already exists

| Feature | What it does | How autonomous? |
|---------|-------------|----------------|
| Smart Alerts | AI-generated recommendations | Pull-based (user opens page to see them) |
| Content Recommendations | Suggests what content to create | Pull-based |
| Zarlo AI Co-Founder | Answers questions, gives advice | Reactive (responds when asked) |
| Experience Pipeline checklist | Marketing + organisation tasks per event | Manual tracking (user checks items off) |
| Content Queue | Approval workflow for content | Manual (user creates, then schedules) |
| Email Sequences | Multi-step nurture campaigns | Defined but not auto-triggered |

### What L3 looks like for experience creators

The system already knows the strategy and marketing plan for each experience (from L1 + L2). L3 is about the AI either creating the assets itself or making sure the creator follows through.

**Heartbeat examples:**

```
"Your breathwork circle is in 12 days. Based on similar workshops, 
you need to start promoting now. I've drafted:
  - 3 Instagram posts (hook, social proof, countdown)
  - 1 email to your 23 past attendees
  - 1 WhatsApp message for your top 5 fans
Approve all / Review each / Skip"
```

```
"Sarah has attended 3 of your events and hasn't heard from you in 
6 weeks. Based on her engagement, she's likely to come again. 
I've drafted a personal invite for your June retreat. Send?"
```

```
"Your last 3 workshops averaged 8 people. Your PTUF says you need 
12 to hit your income target. Here's a 2-week fill-the-room 
campaign with daily tasks. Start it?"
```

```
"Your workshop is tomorrow. Organisation checklist is 70% done. 
You still need to: confirm venue, send reminder email, prep 
playlist. The reminder email is drafted. Approve + send?"
```

### What needs to be built for L3

| Component | Description | Depends on |
|-----------|-------------|-----------|
| **Event Countdown Engine** | When an experience has a date, auto-generate a reverse-timeline of marketing + org tasks. Trigger nudges at key milestones (21 days, 14 days, 7 days, 3 days, 1 day, day-of, day-after). | L1 (templates), L2 (context) |
| **Asset Auto-Generation** | When a milestone fires, use L2 context to auto-draft the assets (social posts, emails, DMs) rather than just reminding the creator to do it. | L2 (creator context), Content Generator |
| **Approval Queue** | Centralized inbox: "Here's what I've prepared. Approve / edit / skip." The Content Queue already has this pattern, extend it to emails and DMs. | Content Queue (exists) |
| **Progressive Trust** | Start with "approve everything." Over time, if creator approves 10 posts in a row without edits, ask "want me to auto-post next time?" | New |
| **Post-Event Auto-Sequence** | When experience is marked "completed," auto-trigger: thank-you email, feedback request, 3% reflection prompt, invite to next event. | Email Sequences (exists), Experience Pipeline (exists) |
| **Re-engagement Detection** | Monitor contacts who attended multiple events but haven't been contacted recently. Auto-draft re-engagement outreach. | CRM Contacts (exists) |
| **Weekly Digest** | "This week: 1 experience in 5 days (8/12 spots filled), 3 contacts need follow-up, your content queue has 2 posts ready. Here's your focus." | L2 (context), all CRM data |

### L3 verdict: 15% built. The data and templates exist, but nothing acts proactively. This is the biggest unlock. Even a basic Event Countdown Engine with auto-generated assets would be a "holy shit" moment.

---

## L4: The Build Layer

> "The product adapts to you."

When a creator needs something custom, the AI builds it. Landing pages, booking systems, client portals, feedback forms. The creator says what they need in plain language. Claude Code runs under the hood. They never see code.

### What already exists

| Feature | Status |
|---------|--------|
| CRM Pages (landing/sales pages) | Page *management* exists (`/crm/pages`), but pages are links to external tools, not built in-platform |
| Electron AI Portal | Claude Code integration, but for Huzz only, not end users |
| Experience Create form | Template-based experience creation, but not AI-built custom output |

### What L4 looks like for experience creators

```
Creator: "I need a landing page for my March breathwork retreat in Ubud"

System: Uses L2 context (their brand, offer stack, remarkable angle, 
past event photos, testimonials from top fans) to generate a complete 
landing page. Creator reviews, edits, publishes.
```

```
Creator: "I need a feedback form that asks about the emotional shift"

System: Generates a form using Shift Architecture principles 
(before/after state, protective voice tracking). Auto-connected 
to their CRM contacts.
```

```
Creator: "I want a page where people can see my upcoming events and book"

System: Generates a public creator profile page with their essence 
avatar, upcoming experiences, testimonials, and booking links.
```

### What needs to be built for L4

| Component | Description | Complexity |
|-----------|-------------|-----------|
| **Landing Page Generator** | AI generates HTML landing pages from L2 context. Creator reviews and publishes to a subdomain or custom domain. | Medium |
| **Public Creator Profile** | Auto-generated `/v/:creatorSlug` page showing identity card, upcoming events, testimonials, booking. Basically a hosted version of the Identity tab. | Medium |
| **Feedback Form Builder** | Post-event feedback forms that feed data back into L2 context and CRM contacts. | Low |
| **Booking Integration** | Connect experience creation to Cal.com / Calendly so "Create Experience" also creates a bookable event. | Medium |
| **AI Build Requests** | Natural language request system: creator describes what they need, system builds it. This is the full L4 vision but can start simple (templated builds with AI customization). | High |

### L4 verdict: 5% built. This is the furthest-out layer for now. Start with Landing Page Generator and Public Creator Profile since they use data that already exists. Full "AI builds anything" is phase 2-3.

---

## L5: Platform / Ecosystem

> "Horizontal platform, vertical intelligence."

Experienced creators build and sell experience playbooks to newer creators. Aggregate data across all creators creates intelligence no one can replicate. Eventually: expand to other verticals using the same 5-layer system.

### What already exists (seeds)

| Feature | Ecosystem potential |
|---------|-------------------|
| Experience Library | Templates that could become a marketplace (creator publishes their proven event template for others to clone) |
| Experience Creator Matching | Network graph of 59 creators. Newer creators discover and learn from experienced ones. |
| Fantasy League | Social/competitive layer that drives engagement across creators |
| 3% Improvement Chain | Shared learning pattern. Aggregate 3% notes across all creators = "what improvements actually work" |
| North Stars (Identity tab) | Creators already select role models. The marketplace version: role model sells their playbook to fans. |
| Shift Architecture | A licensable method. Creators who learn it can become "certified Shift Architects." |

### What L5 looks like for experience creators

**Playbook Marketplace:**
- Experienced creator packages their proven workshop (template, marketing campaign, checklist, email sequences, shift architecture) as a "playbook"
- Newer creator buys it, clones it into their /create portal, customizes with their own L2 context
- Revenue share: creator gets 70%, platform gets 30%

**Data Flywheel:**
- "Breathwork workshops that start promoting 3 weeks out fill 40% more seats than those starting 2 weeks out"
- "Retreats with a post-event email sequence have 2.3x higher repeat attendance"
- "Creators who run the Remarkable Flow before their first event charge 35% more on average"
- This intelligence gets better with every event run on the platform. Competitors can't replicate it.

**Vertical Expansion (future):**
- The 5-layer system is vertical-agnostic. Once proven for experience creators:
  - Clone L1 for coaches (different playbook, same L2-L5 infrastructure)
  - Clone L1 for fitness instructors
  - Clone L1 for therapists/practitioners
  - Each vertical gets its own playbook but shares the context engine, autonomous ops, build layer, and marketplace

**Certification / Licensing:**
- "Certified Shift Architect" program for experienced creators
- Shift Architecture audit scorecard already exists conceptually
- Franchise model: licensed practitioners use the platform, pay monthly + revenue share

### What needs to be built for L5

| Component | Description | When |
|-----------|-------------|------|
| Playbook publishing flow | Creator packages experience + assets as a sellable template | After L3 is working |
| Marketplace browse/purchase | Newer creators discover and buy playbooks | After publishing exists |
| Aggregate insights engine | Cross-creator analytics that surface patterns | After 50+ creators with data |
| Vertical cloning system | Fork L1 playbook for a new vertical while keeping L2-L5 | After experience creator vertical is proven |

### L5 verdict: 10% built (seeds exist). Don't build this until L2 and L3 are solid. The marketplace is a natural evolution of the Experience Library once enough creators are running events on the platform.

---

## Summary: Where /create is today

| Layer | Name | Built | Key gap |
|-------|------|-------|---------|
| L1 | Franchise Playbook | **85%** | Hook scorer flow, experience-type-specific playbooks |
| L2 | Context Engine | **60%** | Unified `CreatorContext` service, progressive learning |
| L3 | Autonomous Ops | **15%** | Event countdown engine, asset auto-generation, approval queue |
| L4 | Build Layer | **5%** | Landing page generator, public creator profile |
| L5 | Platform / Ecosystem | **10%** | Playbook marketplace, aggregate intelligence |

## Recommended build order

1. **L2: Creator Brain** — The prerequisite for everything. Port the claude-portal brain architecture (BrainField type, sidecar+markdown, merge rules), adapt the schema to 6 domains for experience creators, build auto-population hooks from existing flow completions. This is the foundation that every other layer reads from.
2. **L2: Wire Brain into existing AI features** — Replace `contentContext.js` with `getCreatorBrain()`. Feed brain into Zarlo, Content Generator, Smart Alerts. Immediate improvement in AI quality across all existing features.
3. **L3: Event Countdown Engine** — The first "holy shit" moment. When a creator adds an experience date, the system auto-generates a reverse-timeline of tasks and starts drafting assets (using brain context). The leap from "tool I use" to "employee that helps me."
4. **L3: Approval Queue + Auto-Assets** — Extend Content Queue to handle auto-drafted emails, DMs, and social posts. Progressive trust over time.
5. **L4: Landing Page Generator** — Use brain context to generate event landing pages. First taste of "the product builds itself to fit."
6. **L4: Public Creator Profile** — Hosted page at `/v/:slug` showing identity card, upcoming events, booking. Turns /create from internal tool into public-facing presence.
7. **L5: Playbook Marketplace** — When enough creators have proven templates, let them sell to newcomers.

The inner game data (nervous system, wound map, limiting beliefs, play profile, capacity score) is not a separate layer. It's the secret weapon inside L2 that makes Vibe Rise's context engine categorically different from any business CRM or AI tool on the market.

---

## Appendix: Source material

- **5 Layers concept:** `zArchive/ai-team-hub/public/layers.html`
- **Traffic Light Capability Map:** `zArchive/ai-team-hub/public/tree.html`
- **claude-portal Brain architecture:** `zArchive/claude-portal/site/src/lib/brain/` (types, canonicalFields, extractBrain, mergeExtraction, regenerateMarkdown)
- **claude-portal Brain spec:** `zArchive/claude-portal/docs/business-brain-extraction-spec.md`
- **claude-portal Brain migration:** `zArchive/claude-portal/site/supabase/migrations/004_create_business_brain.sql`
- **Automation analysis:** `docs/create-portal-automation-analysis.md`
