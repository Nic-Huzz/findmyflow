# Experience Creator World Tour

Date: 2026-05-31
Status: Strategy doc, not yet built
Branch: `claude/world-tour-doc-XgUns`

A strategy doc for a content + product line built on top of the existing Experience Creator Matching feature. Captures the thinking, decisions, and open questions from the initial scoping conversation.

## The vision

A Founders-Podcast-style deep-dive series on experience creators (Brené Brown, Tony Robbins, Marie Forleo, Priya Parker, etc.), where each post or episode deconstructs how one person built their brand and business model. Every piece of content ends with a CTA to the matcher at `/experience-creators`, which tells the reader which creators they're most like and unlocks a personalised template pack to help them execute in that lane.

Three things this is NOT:
- Not generic business advice
- Not a Founders Podcast clone (we have a personalisation tool, Senra does not)
- Not a single content format (the research powers newsletter, podcast, video, and the in-app templates)

## Positioning

**Tagline:** "The architecture of success for blowing up brand + business model."

**Wedge sentence:** "Stop taking generic advice from people you're nothing like."

**The differentiator vs the Founders Podcast model:** Senra can only say "be more like Buffett." We can say "based on your DNA, you're 80% Brené and 60% Priya. Here's your custom suite, and here's the template pack to build it." The research is the trust-builder. The matcher + template pack is the product.

## The full funnel

```
Newsletter / blog post (free)
   ↓ shows the architecture, builds trust
Matcher at /experience-creators (free)
   ↓ "you're 80% Brené, 60% Priya"
Template Pack (paid)
   ↓ "here are the assets Brené-types need to build"
AI Coach (paid, future)
   ↓ "and here's Brené reviewing your draft"
Shift Architecture Collective (premium, future)
   ↓ "and here's a group of Brené-types holding you accountable"
```

The newsletter feeds the matcher. The matcher feeds the templates. The templates feed the group. Each layer compounds the last.

## The newsletter format

Each post follows an identical 5-section template so the structure compounds in the reader's head. Templated = repeatable = scalable.

| Section | The question it answers |
|---------|-------------------------|
| **1. The Wedge** | What did they notice that nobody else did? How did they get their first 100 fans? |
| **2. The Brand Engine** | How did they become known? (content cadence, signature format, the unfair advantage) |
| **3. The Money Engine** | How do they actually make money? (Attraction → Core → Continuity, with real $ where possible) |
| **4. The Compounding Move** | The one decision that turned a workshop into an empire. |
| **5. If This Is You** | DNA signature + who resonates + first step in their lane → CTA to matcher |

**Universal closer (identical every post):**
> Curious if you're a [Creator Name]? Take the 2-min match → findmyflow.com/experience-creators

**Design rule:** Every post must be useful even if you don't match the featured creator. The pattern in each post teaches something universal; the matcher punchline is the bonus. Otherwise only 1-in-59 readers get value and the rest bounce.

## Launch sequence

First 5 posts, deliberately spread across 5 different archetypes so the framework reveals itself by post 5:

1. **Brené Brown** — Workshops & Training (academic → empire)
2. **Marie Forleo** — Cohorts & Courses (lifestyle business archetype)
3. **Priya Parker** — Facilitation & Community (book → consulting empire)
4. **James Clear** — Books & Media (blog → habit infrastructure)
5. **Tony Robbins** — Live Events & Performance (the apex predator, shows the ceiling)

By post 5 the reader has seen 5 different architectures and is primed to ask "which one am I?" That's when the matcher does its job.

## Template pack architecture

**Templates are per OFFER TYPE, not per creator.** A "Launch a Podcast" pack works whether you matched Brené, Marie, or Tara. The creator match personalises the *flavour* (tone, hooks, positioning), not the *structure*.

**The offer universe is finite.** Scanning the 33 creators currently mapped in `public/data/experienceCreatorOfferMap.json`, there are roughly **25-30 unique offer types** across the 4 layers (attraction / core / scale / continuity). So we're building 25-30 template packs, not 300.

**Each pack ≈ 5-8 assets.** Example for "Launch a Podcast Pack":
- Positioning brief
- First 10 episode outlines
- Guest pitch template
- Cover art prompt (Gemini)
- Launch sequence emails
- 90-day rollout calendar

### Three template layers (increasing in sharpness)

| Layer | What | Example |
|-------|------|---------|
| **1. Per-archetype templates** (6 sets, broad) | Repeatable assets for any creator in that archetype | "Workshop outline builder", "Cohort syllabus", "Retreat itinerary", "Keynote deck" |
| **2. Per-offer-type templates** (25-30 packs, sharp) | Concrete asset packs the user picks after matching | "Launch a Podcast Pack", "Run a Live Workshop Pack", "Build a Certification Pack" |
| **3. Creator-as-Coach AI** (per marquee name, opinionated) | AI agent that reviews user's work through that person's lens | "Brené coach" asks 'does this name something previously unnamed?' "Priya coach" challenges your gathering's purpose. |

Layer 2 is the MVP. Layers 1 and 3 are extensions.

### Matcher → pack flow

```
Match: "You're 80% Brené, 60% Priya"
   ↓
For each layer, show only the options your matched creators actually use:

ATTRACTION
  ☐ Launch a podcast       (Brené, Tara, Esther use this)
  ☐ Write a book           (Brené, Priya, Gabor use this)
  ☐ Free workshops         (Brené, Wim use this)
       → Pick one → unlock template pack

CORE
  ☐ Corporate keynotes     (Brené, Simon use this)
  ☐ Live workshops         (Wim, Brené use this)
  ☐ Facilitated gathering  (Priya uses this)
       → Pick one → unlock template pack

[etc. for scale + continuity]
```

### Top 6 packs to build first

These cover roughly 80% of paths users will pick, based on offer-map frequency.

| Pack | Layer | Why it's first |
|------|-------|----------------|
| **Podcast Launch Pack** | Attraction | Most common attraction asset, high reader demand |
| **Book/Newsletter Pack** | Attraction or Continuity | Used by majority of creators, dual-layer flexibility |
| **Live Workshop Pack** | Core | The core asset for the largest archetype |
| **Keynote/Speaking Pack** | Core | Used by Brené, Simon, Gabor, Priya, etc. |
| **Online Course Pack** | Continuity | Most common continuity layer |
| **Certification Pack** | Scale | The scale path for Workshop + Cohort archetypes |

## What's already built (assets we can use)

| Asset | Path | What it contains |
|-------|------|------------------|
| Offer map | `public/data/experienceCreatorOfferMap.json` | 33 creators with full attraction/core/scale/continuity revenue stream mapping |
| DNA profiles | `public/data/experienceCreatorDNA.json` | 247 profiles with 5 sliders each |
| Career models | `public/data/careerModels.json` | 318 career models with revenue streams, trajectories, lessons |
| Non-founder profiles | `public/data/nonFounderProfiles.json` | 243 bios, one-liners, narratives |
| Pixar portraits | `public/images/creators/` | 59 portraits (Gemini 3.1 Flash) |
| Matcher flow | `src/flows/ExperienceCreatorFlow.jsx` | Public route at `/experience-creators`, already saves to `experience_creator_selections` |

## What's already built (infrastructure to reuse)

| System | Path | How we use it |
|--------|------|---------------|
| Content Generator | `src/components/crm/ContentGenerator.jsx` | UI scaffold for template pack rendering |
| Prompt templates | `src/lib/crm/promptTemplates.js` | Add new templates per pack |
| Experience Blueprint AI | `supabase/functions/experience-blueprint-ai/` | Edge function pattern for AI-generated assets |
| Zarlo context | `src/lib/zarlo/zarloEngine.js` | Already pulls matcher result; can extend to inject template context |

## Open decisions

These need to be resolved before building.

1. **Where does the newsletter live?**
   - Substack: built-in distribution + easier subscriptions, but locked into their platform
   - Beehiiv: better growth tools, slightly less default distribution
   - Own site at `findmyflow.com/architecture`: SEO compounds + drives matcher signups directly, but zero default distribution
   - *Recommendation: own site for SEO + matcher integration, syndicate to Substack/LinkedIn for reach*

2. **Cadence?**
   - Weekly: sustainable, audience knows when to expect
   - Twice-weekly: faster archive build but burns the author out by post 12
   - *Recommendation: weekly for the first 12, evaluate from there*

3. **Pack format?**
   - In-app (live AI-editable docs): keeps users in FindMyFlow, lets you iterate, drives engagement
   - Exportable Notion/PDF templates: feels more "I bought a product," easier to share
   - Both: best of both, more work to build
   - *Recommendation: in-app first, add export later if users ask*

4. **First build order?**
   - (a) Audit the full offer map to confirm top-N offer types empirically, then build
   - (b) Just ship the Podcast Launch Pack as proof-of-concept and prove the matcher → pack flow end-to-end
   - *Recommendation: (b). Faster signal on what users actually want.*

## Recommended next steps

In order:

1. **Write the first newsletter post: Brené Brown.** Validates the 5-section template on a name everyone knows. Aim for one screenshot-worthy insight in the Compounding Move section.
2. **Pick where the newsletter lives.** See decision #1 above. Don't build a custom platform yet, but pick the home.
3. **Build the Podcast Launch Pack** as the first template pack. End-to-end: matcher result → pick "Podcast" attraction → unlock pack → AI-generate the 6 assets, personalised by matched creator's voice.
4. **Wire the matcher result page to show the offer options** per layer (currently shows a generic suite, needs to show pickable options drawn from `experienceCreatorOfferMap.json`).
5. **Write posts 2-5** (Marie, Priya, James, Tony) over weeks 2-5 to establish the archive.
6. **Audit the offer map** to confirm the top-6 packs by frequency, then build packs 2-6.

## Beyond blog posts: other ways the research has utility

The same 33-creator dataset can live in many vessels, each serving a different consumption mode and moment in the user journey.

### The full menu

| Format | What it is | Why it works |
|--------|------------|--------------|
| **Interactive 2D map** | All 33 creators plotted on filterable axes (workRhythm × impactStyle, etc.) | Shareable standalone page. Visitors play, then convert to matcher. |
| **Trading card deck** | Each creator = a card with stats, DNA, signature move (Pokemon-style, digital or print) | Collectible, gift-able, screenshot-able. "Gotta catch 'em all" loop. |
| **"State of Experience Creators" annual report** | PDF wrapping patterns across all 33: who's growing, what's working, archetype trends | Authority play. Free, gated by email. Press-worthy. |
| **Workbook** | Printable PDF that mirrors the matcher but is offline | For people who don't want an app. High-margin product ($20-50). |
| **Live monthly teardown** | 90-min session: one creator deep-dive + Q&A | Recurring revenue ($20-50/mo). Builds the group. |
| **Short-form video** | TikTok/Reels: one insight per creator, repurpose newsletter content | Top-of-funnel reach. Each newsletter post = 5 clips. |
| **Searchable database** | "Find all creators who started after 40" / "who scaled via certification" | Power user tool. Lives at `/creators/explore`. Pulls existing JSON. |
| **In-app daily prompts** | Push notification: "Brené spent year 1 naming the unnamed feeling. What's your version this week?" | Turns data into ambient nudges. Pulls users back daily. |
| **Trajectory comparison** | "You're at month 3. Brené at month 3 had X listeners. Marie at month 3 had Y." | Makes the data living. Benchmarks user against their match over time. |
| **Embeddable matcher widget** | Iframe other creators/coaches drop on their site to give their audience a match | Distribution multiplier. They get a free tool, we get signups. |

### The three to build first

1. **Interactive 2D map.** Reuses every bit of data we already have. Single page, viral on its own, drives matcher traffic. 1-2 days of work.

2. **In-app daily prompts** tied to the user's matched creator. The matcher currently fires once and goes cold. Daily prompts keep the match alive. This is the difference between "I took a quiz once" and "I'm being mentored by Brené every day."

3. **"State of Experience Creators" annual report.** A 30-page PDF gating an email. Press-worthy. Generates inbound. Written once, works for 12 months.

### The strategic pattern (the moat)

Most research is one-and-done. The matcher is one-and-done today. The unfair version is when the data *follows the user* through their journey:

| Moment | Format | What it does |
|--------|--------|--------------|
| Discovery | Newsletter, short-form video, 2D map | Teaches the architecture, builds trust |
| Diagnosis | Matcher | Tells user who they're like |
| Design | Template packs | Equips user with the assets to build |
| Execution | AI coaches, daily prompts | Mentors user through the work |
| Maintenance | Trajectory comparison, daily prompts | Benchmarks user against their match over time |
| Authority | Annual report, live teardowns | Keeps the brand growing the audience |

Same 33 creators, six moments of utility. That's the moat. Senra can't do this, because he doesn't know who *you* are.

## Related docs

- `docs/feature-brief-experience-creator-matching.md` — original product spec for the matcher
- `docs/2026-04-22-experience-creator-matching-handoff.md` — full implementation handoff for the matcher
- `docs/experience-creator-os.md` — broader strategic pivot (FindMyFlow as the OS for experience creators)
- `docs/experience-creator-stages.md` — 6-stage journey map

## For the next agent

If you're picking this up cold:

1. Read this doc top to bottom.
2. Read `docs/feature-brief-experience-creator-matching.md` and the handoff doc for context on the matcher that exists today.
3. The fastest way to validate this whole strategy is recommended next step #3 (build the Podcast Launch Pack end-to-end). Everything else is downstream of proving that flow works.
4. Before writing any user-facing copy: no em dashes (see `CLAUDE.md` writing style section).
5. Before generating any AI images: follow the Pixar 3D prompt pattern in `CLAUDE.md`.
