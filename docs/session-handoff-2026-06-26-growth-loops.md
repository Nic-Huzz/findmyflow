# Session Handoff: Growth Loops, AI Agent Loops & Headset Business Intelligence

**Date:** 2026-06-26
**Session focus:** Research growth loops + AI agent loops with highest cross-business utility, then apply to the headset rental business and Vibe Rise. Set up automated Reddit monitoring. Profile #1 competitor.

---

## Part 1: Growth Loops Research

Full research doc at `docs/growth-loops-research.md`. Ranked by cross-functional utility (how many business areas each loop compounds across).

### Top 3 (most relevant to us)

**1. Cohort Student-as-Marketer (Ship30for30 model)**
Students publish daily on social → content advertises the program → graduates promote via affiliate → new cohort fills. This maps directly to Shift Architecture: creators use the method → run workshops → participants share shifts → social proof attracts new creators.

**2. Sahil Bloom's Cost-Center Flip**
Identify services you pay for → build a business around them → your audience feeds leads. The silent disco headset rental IS this loop already. Equipment cost becomes revenue stream with creator portal users as the lead funnel.

**3. Interview/Collaboration Flywheel**
Interview experience creators → they promote to their audience → bigger creators come. We have 129 researched creators ready as a guest list.

### Relevance Map

| Loop | Headset Business | Creator Portal | Vibe Rise App |
|------|-----------------|----------------|---------------|
| Student-as-Marketer | — | PRIMARY flywheel | — |
| Cost-Center Flip | IS the business model | Feeds creators | — |
| Interview Flywheel | Content for SEO | Guest pipeline | — |
| Newsletter ↔ Social | Brand building | @_huzz content | — |
| SEO Content → Revenue | Direct lead gen | — | — |
| UGC Shareable Moments | — | — | Already built (cards) |

### Priority Order
1. Headset loops 1-4 (revenue-generating, clear buyer intent)
2. Systematize existing content (@_huzz Instagram, Graph Carousels)
3. Creator-as-Marketer (activates when first creators use Shift Architecture)
4. Interview Flywheel (129-creator database ready)
5. UGC Shareable (already built in app, needs distribution push)

---

## Part 2: AI Agent Loops (Loop Engineering)

Loop engineering exploded mid-2026. Core insight: **the real skill moved from prompting agents to designing the loops that prompt them.**

### Key Concepts
- Every loop needs a DOER + CHECKER (separate agents, never grade your own work)
- 4 loop types: Heartbeat (continuous), Cron (scheduled), Hook (event-triggered), Goal (runs until done)
- 5 essentials: Worktrees, Skills, Connectors, Sub-agents, State persistence
- Best setup: Claude Code for complex reasoning + n8n for scheduled triggers

### Most Relevant Agent Loops for Us

| Loop | What It Does | Revenue Impact |
|------|-------------|----------------|
| **Reddit Intent Monitor** | Daily keyword search → score leads → alert | Direct leads, $0 CAC |
| **SEO Content Engine** | Research queries → generate articles → publish | Organic traffic → rental enquiries |
| **IG Facilitator Outreach** | Find yoga/breathwork teachers on IG → personalized DM | $3-15K/mo per facilitator converted |
| **Post-Event UGC Flywheel** | Collect testimonial → case study → carousel → tag facilitator | Every event markets the next |
| **Facilitator Success Engine** | Weekly tips to active renters → rebook rate | Retention + referral |
| **Competitor Price Monitor** | Weekly scrape of competitor pricing | Pricing optimization |

### The 69-Loop Library (Forward Future)
Full index in `docs/growth-loops-research.md`. Most relevant for us:
- SEO/GEO Visibility Loop (#58) — fixes search + AI answer gaps
- Talk-to-Five-Buyers (#59) — uses objections to draft landing page copy
- One-Post-a-Week (#60) — tests formats until one wins
- Easy Onboarding (#39) — acts as first-time user, finds obstacles
- Loop Hiring Manager (#50) — the meta-loop that identifies what deserves its own loop

---

## Part 3: What We Set Up

### Reddit Monitoring Loops (LIVE)

**1. Silent Disco Headset Monitor**
- Trigger: `trig_01QQTjnwtWdrvGAgVBrCsdKA`
- Schedule: Every 12h (8am + 8pm WITA)
- Searches: 6 query variants across all of Reddit for buyer intent
- Scores: HOT / WARM / COOL with gaming noise filter
- Output: Commits leads to `scripts/reddit-headset-leads.md`
- Alerts: Emails nichuzz@gmail.com for HOT leads
- Manage: https://claude.ai/code/scheduled/trig_01QQTjnwtWdrvGAgVBrCsdKA

**2. Vibe Rise / r/findapath Monitor**
- Trigger: `trig_01Cz1fezF3qgeJ2Tas54r5pq`
- Schedule: Every 12h (8am + 8pm WITA)
- Searches: r/findapath, r/careerguidance, r/DecidingToBeBetter, r/selfimprovement
- Keywords: stuck, lost, burnout, quarter life crisis, hate my job, scared to leave
- Output: Drafts 2-3 comments in Huzz's voice to `scripts/reddit-drafts.md`
- Alerts: Emails drafts ready for review
- Manage: https://claude.ai/code/scheduled/trig_01Cz1fezF3qgeJ2Tas54r5pq

**Both are read-only. Never auto-post. Huzz reviews and approves.**

### Local Skills (manual deep dive)
- `.claude/skills/reddit-headset-monitor.md` — run `/reddit-headset-monitor` for deeper Composio-powered search with comment reading
- `scripts/reddit-monitor.md` — Vibe Rise spec (voice guide, rules, keywords)

### Files Created
- `docs/growth-loops-research.md` — Full research doc (growth loops + AI agent loops + relevance mapping + 69-loop library)
- `scripts/reddit-headset-monitor.md` — Headset monitor spec with usage guide
- `scripts/reddit-headset-leads.md` — Lead tracker with historical leads + seen post IDs
- `.claude/skills/reddit-headset-monitor.md` — Claude Code skill for manual runs
- `competitor-profiles/silent-sound-system.md` — Full competitor profile

---

## Part 4: Reddit Intelligence (What We Found)

### Silent Disco on Reddit (Last 7 Days)
- 21 posts mentioning silent disco across Reddit
- 1 with buyer intent (Manila corporate party, wrong market)
- ~15 festival attendees (validates demand, not leads)
- 0 wellness facilitators looking for equipment this week

### Historical Gold Posts (found during research)
| Post | Where | When | What |
|------|-------|------|------|
| Yoga teacher needs headsets for noisy class | r/yoga | Jul 2023 | PERFECT ICP. Only reply was silentsoundsystem.com |
| AV programmer building meditation headset system | r/DSP | May 2025 | Wife runs ~100 headset meditation classes. Dream customer |
| "$20 reasonable for silent disco ecstatic dance?" | r/ecstaticdance | Apr 2026 | $20/person validated globally. AliExpress at $600/20 pairs cited as alternative |
| Silent disco dance class spotted on hilltop | r/askportland | May 2026 | "Heartbeat silent disco" named as active Portland group |
| Corporate party Manila | r/MetroManila | TODAY | Supplier already DM'd within hours. Shows speed matters |

### Key Market Intel
- **$20/person** is the global price sweet spot
- **AliExpress:** 20 pairs + transmitters for ~$600 (quality gamble, your mid-tier competitor)
- **silentsoundsystem.com** has a "wellness package builder" but it's a skeleton page with zero context
- Facilitators' #1 pain is **tech complexity**. They want plug-and-play
- **Weekly class users want to BUY**, not rent. Consider lease-to-own tier
- **Pre-natal classes** are an underserved use case

### Target Subreddits Identified

**Facilitator side:** r/ecstaticdance (best fit, small but pure), r/yoga (3.3M, noisy), r/yogateachers (small, pure), r/breathwork (active), r/soundhealing (low activity)

**Buyer side:** r/EventPlanning, r/WeddingPlanning (500K), r/festivals, r/DJs, r/Fitness, r/CrossFit, r/running

**Insight:** Facilitators who need headphones aren't concentrated in one subreddit. They're scattered across city subs, hobby subs, and technical subs. The monitoring loop searches keywords across ALL of Reddit, not just specific subs.

---

## Part 5: Competitor Intelligence

### SEO Landscape for "buy silent disco headphones"

| Rank | Competitor | Angle |
|------|-----------|-------|
| #1 | silentsoundsystem.com | Premium, full-service, 10-channel, custom branding |
| #2 | quietevents.com | Since 2012, 30K+ headphones, events + equipment |
| #3 | partyheadphones.com | Fast shipping, buy-focused |
| #4 | Amazon | Marketplace, price comparison |
| #5 | retekess.com | Chinese manufacturer, cheapest, white-label |
| #6 | silentdiscotheque.com | Generic |
| #7 | silentdiscodirect.co.uk | UK market |

### Silent Sound System Profile (Full at `competitor-profiles/silent-sound-system.md`)

**Their strengths:** #1 SEO, 10-channel tech, BASSpak bass, custom branding, scale pricing ($38/unit at 400)

**Their weaknesses:**
- Zero social proof (no reviews anywhere)
- No content/SEO moat (no blog, no guides)
- Wellness page is a skeleton (product configurator with zero context)
- No emotional positioning (pure commodity specs)
- Rental requires quote request (loses impulse buyers)
- No community, no newsletter, no flywheel

**Our play:** Don't compete on "buy silent disco headphones" (they own it). Own the entire wellness vertical:
- "silent disco yoga" — zero competition
- "silent disco breathwork" — zero competition
- "silent disco meditation equipment" — zero competition
- "how to run a silent disco retreat" — zero competition

Their pricing: $45-81/unit to buy. Our rental model undercuts the buy decision for facilitators doing 1-3 events/month.

---

## Part 6: New Tools Identified

| Tool | What It Does | Cost | Relevance |
|------|-------------|------|-----------|
| **Orior AI** | Create AI UGC persona, generate product photos/videos with lip-sync, auto-post to 6 platforms | Free tier (3 credits), €15/mo Creator | Create a headset business persona for social content |
| **Higgsfield Supercomputer** | Agentic AI creative team. Describe what you want, it routes to best AI model. Marketing Studio, Soul ID, Cinema Studio | Already connected as MCP | Product videos, UGC, ad content for headset business |
| **Loop Engineering** | Design systems that prompt AI agents on schedules | Claude Code /loop + n8n | Already deployed (2 Reddit monitors) |
| **n8n** | Visual workflow builder, 7K+ community templates | Free self-hosted | Reddit lead finder template exists. Good for always-on automation |
| **Forward Future Loop Library** | 69 repeatable AI agent workflow patterns | Reference only | SEO/GEO visibility, content testing, onboarding QA |

---

## Decisions Needed

1. **Headset SEO content:** Start producing long-tail wellness articles for buySilentDiscoHeadphones.com? ("How to run a silent disco yoga class", etc.) The entire vertical is uncontested.

2. **Orior AI persona:** Create a headset business character for social content? €15/mo for consistent daily posts across platforms.

3. **Competitor profiling:** Profile quietevents.com (#2) and partyheadphones.com (#3) next?

4. **Reddit engagement:** The r/findapath drafts from Jun 22 (3 comments) are still in `scripts/reddit-drafts.md`. Were any posted? u/NicHuzz_ karma is still at 2. Need to start building karma for future engagement.

5. **Facilitator outreach loop (IG):** Ready to build Loop 3 (Instagram facilitator outreach)? Requires headset business IG account.

6. **Lease-to-own tier:** Weekly class users (like u/Thevesselyoga) want to buy, not rent. A lease-to-own option captures this segment that rental-only misses.

7. **n8n integration:** Move the Reddit monitors to n8n for always-on monitoring with lower cost? Or keep as Claude Code scheduled triggers?

---

## Full Trigger Fleet

| Trigger | Schedule | Purpose | Status |
|---------|----------|---------|--------|
| Reddit Silent Disco Monitor | 12h | Headset business leads | ACTIVE (new) |
| Reddit Vibe Rise Monitor | 12h | r/findapath comment drafts | ACTIVE (new) |
| CEO Morning Briefing | Daily | Dashboard status | ACTIVE |
| build-health | Daily | Build checks | ACTIVE |
| dead-code-finder | Weekly | Cleanup | ACTIVE |
| docs-sync | Weekly | CLAUDE.md drift | ACTIVE |
