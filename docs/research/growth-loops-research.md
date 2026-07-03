---
title: Growth Loops & AI Agent Loops Research
created: 2026-06-26
type: research
tags: [growth, flywheel, loops, strategy, ai-agents, automation, loop-engineering]
---

# Growth Loops Research

Ranked by **cross-functional utility** (how many business areas each loop compounds across simultaneously).

## Tier 1: Highest Utility (5+ business areas)

### 1. The Cohort Student-as-Marketer Loop (Ship30for30)
**Areas:** Content, community, social proof, sales, affiliate, audience growth

Students publish daily on social → content advertises the program → graduates promote via affiliate → new cohort fills → repeat. Hundreds of customers become unpaid daily marketers.

**Why #1:** Experience creators running cohorts/workshops get acquisition, content, community, AND revenue from one mechanism. This is what Shift Architecture could become as a loop.

### 2. Sahil Bloom's Cost-Center Flip
**Areas:** Audience, services, equity, revenue, lead gen, cash flow

Identify services you already pay for → build an agency around them → your audience feeds leads → agency generates cash → reinvest into platform. He turned video editing, design, and newsletter ops into 10-12 agencies at 7-fig run rates with 50%+ margins.

Key quote: "If I'm spending 5 grand a month on video editing services...I should actually own a video editing business."

### 3. HubSpot's 6-Loop Ecosystem
**Areas:** Content, SEO, sales, integrations, email, sharing

6 interlocking loops (inbound marketing, SEO, sales hiring, integrations, content sharing, email) produced a 14x return since IPO. Most companies run 1 loop. HubSpot stacked 6 into a single flywheel.

## Tier 2: High Utility (3-4 business areas)

### 4. Newsletter <> Social Cross-Pollination (Josh Spector model)
**Areas:** Audience growth, engagement, cross-platform, email list

Newsletter links to specific tweets → drives traffic to social → algorithm boosts visibility → new followers subscribe to newsletter. Bidirectional, not one-way.

### 5. SEO Content → Affiliate Revenue Loop (eBizFacts)
**Areas:** Organic traffic, affiliate revenue, email list, content authority

Course reviews rank in search → 250k monthly visitors → $20k/mo affiliate revenue → 30k email subs → weekly promos. Compounding organic visibility with clear purchase intent.

### 6. Interview/Collaboration Flywheel
**Areas:** Content, audience, partnerships, multi-platform distribution

Interview creators → they promote to their audience → bigger platform attracts bigger guests → compound. The bigger you get, the easier it gets.

## Tier 3: Solid but Narrower (1-2 areas)

### 7. Viral/Referral Loop (Dropbox model)
User gets value → shares for reward → new user joins. Strong but primarily acquisition-only.

### 8. Data/Personalization Loop (Netflix model)
Usage → data → better recommendations → more usage. Powerful but requires massive scale.

### 9. UGC Loop (Reddit/TikTok model)
Users create content → indexed/discovered → new users create more. Platform-dependent.

### 10. Paid Marketing Loop
Revenue → reinvest in ads → acquire users. Linear, doesn't compound without the others.

## The Meta-Insight

The loops with the most utility across business areas share one trait: **the user's natural behaviour IS the marketing**. Ship30 students writing tweets, Sahil's audience buying from his agencies, HubSpot's content getting shared. The loop doesn't require extra effort from the user beyond what they'd do anyway.

For Vibe Rise: experience creators using the tools → running workshops → participants share their shifts → social proof attracts new creators → they use the tools. 5 areas from one loop.

---

# Part 2: AI Agent Loops

The AI agent loop scene exploded in mid-2026 after Addy Osmani (Google), Boris Cherny (Anthropic), and Peter Steinberger all pointed to the same shift: **the real skill moved from prompting agents to designing the loops that prompt them**. "Loop engineering" crossed 6.5M views as a concept.

## What is Loop Engineering?

Replacing yourself as the person who prompts the agent. You design the system that does it instead. Instead of manual back-and-forth, you build autonomous systems that iterate toward goals.

Every loop has a **DOER** (the AI that makes stuff) and a **CHECKER** (the part that decides if it's good). "If you can't say what 'done' looks like, you don't have a loop. You have a wish."

## The 4 Loop Types

| Type | Trigger | Best For | Example |
|------|---------|----------|---------|
| **Heartbeat** | Continuous interval | Monitoring, health checks | Production error sweep every 15 min |
| **Cron** | Scheduled time | Daily/weekly routines | PR reviewer at 10:15am daily |
| **Hook** | External event | CI failures, PR pushes | Auto-fix on test failure |
| **Goal** | Runs until done | Feature completion, cleanup | "Organize downloads by file type" |

## 5 Essentials Every Loop Needs

1. **Worktrees** - Isolated work areas so parallel agents don't collide
2. **Skills** - Saved instructions (SKILL.md files) so you don't re-explain context every run
3. **Connectors** - MCP/API integrations to real tools (GitHub, Slack, CRM, email)
4. **Sub-agents** - One AI does the work, a DIFFERENT one checks it. Never grade your own work
5. **State persistence** - Markdown files or boards that survive between runs. Without it, loops restart from zero daily

## Tier 1: Highest Cross-Business Utility

### 1. Autonomous Content Engine
**Areas:** Content, social, SEO, audience growth, brand
**Revenue:** Compound growth through daily consistency

Trend scanner monitors Reddit/X/newsletters → content writer generates posts → visual generator creates images → publishing agent schedules across platforms. Runs daily without intervention.

**Why powerful:** Consistency is the #1 growth factor on every platform. This loop solves it completely. Multiple accounts can run simultaneously.

### 2. Reddit Intelligence → Lead Mining Loop
**Areas:** Sales, lead gen, content, community, cold email
**Revenue:** $2K-$10K/mo pipeline value, 30% close rate on hot leads

Monitor 15-20 subreddits for buyer intent signals → classify intent (High/Med/Low) → draft helpful non-promotional replies → identify poster profiles → add to cold email sequences with Reddit context.

**Key insight:** "When someone posts 'I'm frustrated with [competitor], does anyone know an alternative?' that's a hot lead. We close 30%."

### 3. AI Ghostwriting Agency Loop
**Areas:** Personal branding, content, client services, revenue
**Revenue:** $5K-$20K/mo

Scrape client's past posts/interviews/transcripts → build voice profile → generate 30 days of drafts → client reviews 15 min/week → agent learns from approvals → refinement compounds.

**Real example:** "I'm running 12 clients at $1,500/month each. The agent does 90% of the work."

### 4. Research-to-Artifact Loop
**Areas:** Content strategy, newsletters, thought leadership, decision-making
**Revenue:** Monetized through paid newsletters, reports, briefings

News monitoring → source collection → trend analysis → report generation → publish. Continuous intelligence gathering that compounds institutional knowledge.

## Tier 2: High Utility (Domain-Specific)

### 5. SEO Affiliate Content Loop
**Areas:** Organic traffic, affiliate revenue, content authority
**Revenue:** Passive affiliate commissions from dozens of articles/week

Product discovery agent monitors launches → SEO research analyzes keywords → article writer creates reviews → comparison tables generated → auto-publish to blog. Scales content production 10x.

### 6. Instagram Lead Gen + DM Loop
**Areas:** Lead generation, outreach, sales
**Revenue:** $3K-$15K/mo

Scrape hashtag/competitor followers → read each profile's bio + recent posts → generate personalized opening DM with specific references → send 200+ daily → track reply rates → refine messaging. Replaces 4 hours/day of manual work.

### 7. Daily Aging PR / Stale Work Reviewer
**Areas:** Engineering velocity, team ops, code quality

Cron loop at 10:15am → query PRs older than 7 days → evaluate readiness → spawn subagents to analyze review gaps → generate actionable alerts → track previously flagged items. Eliminates manual babysitting.

### 8. Production Health Check Loop
**Areas:** DevOps, reliability, engineering

Heartbeat every 15 min → read production health checks + test results → if pass, log and stop → if fail, launch coding agent in fresh worktree with failing tests as the goal → auto-fix → verify → PR.

## Tier 3: Useful Narrow Loops

### 9. Faceless YouTube Automation
**Revenue:** $2K-$30K/mo (AdSense + affiliate)

Monitor niche trends → select top 3 ideas by search volume → generate 1,500-3,000 word scripts → create voiceover + thumbnail briefs → publish 3-4x more than manual channels.

### 10. TikTok Affiliate Product Research
**Revenue:** $1K-$8K/mo

Monitor TikTok Shop trending products → track sales velocity + commissions → analyze winning video patterns → generate scripts → identify emerging products before peak. Products trend/fade in 2-3 weeks; agents spot winners before humans can.

### 11. Customer Support Ticket Cleanup
Daily automation processes open tickets through saved skill → closes routine ones → separate checker agent reviews closed tickets → reopens those requiring human escalation.

### 12. Email Triage Loop
Daily read-only loop reads unread emails → posts the 3 most important to Slack → explicit instruction: "Do NOT reply to anything." Start read-only before automating actions.

## The 69-Loop Library (Forward Future)

The most comprehensive collection: 69 repeatable AI agent workflows across engineering, evaluation, operations, and content. Standout loops by business area:

**Engineering:** Docs Sweep (keeps docs aligned with code), 100% Test Coverage, Sub-50ms Page Load optimization, Dependency-CVE Burndown (security patches)

**Operations:** Production Data Cleanup, Stale-Safe Batch Release, Post-Release Baseline benchmarking

**Content/Marketing:** SEO/GEO Visibility (fixes search + AI answer gaps), One-Post-a-Week (tests formats until one wins), Pre-Publish Source Check (verifies every claim)

**Meta-loop:** Loop Hiring Manager - identifies recurring work that deserves its own loop. The loop that builds loops.

## Tools Landscape (2026)

| Tool | Best For | Key Strength |
|------|----------|-------------|
| **Claude Code** | Complex reasoning, code, multi-step | /goal and /loop commands, subagents, highest ceiling |
| **n8n** | 24/7 scheduled deterministic workflows | Visual builder, 7,073 community workflows, same-input-same-output |
| **Make.com** | No-code agentic loops | Perceive-reason-act-observe cycle, accessible |
| **OpenClaw** | Developer-focused agent framework | Cheapest/most flexible for terminal users |

**Recommendation from the community:** Learn Claude Code first. Higher ceiling, skills transfer to other agents.

**Claude Code vs n8n:** A research agent that took an n8n expert 2+ hours was rebuilt in Claude Code in 20-40 minutes. But n8n is better for always-on scheduled automation. Best setup: Claude Code for complex reasoning + n8n for scheduled triggers.

## The Meta-Insight (AI Loops)

The highest-utility AI loops share the same trait as growth loops: **the loop's natural output IS the next input**. The content engine's posts generate engagement data that improves the next batch. The Reddit lead miner's responses build reputation that surfaces more intent signals. The ghostwriting loop's client approvals train the voice model.

The loops that fail are the ones where the output doesn't feed back in. They're just automations, not loops.

## Key Warning

"Loops amplify mistakes at scale. Human review is non-negotiable." Every successful builder emphasizes: start read-only, add a checker agent, set token ceilings (a goal loop with no max_iterations can burn $500/hour), and never delegate judgment entirely.

---

# Part 3: Relevance Mapping

## Reddit: Wellness Facilitator Subreddits for Headphone Sales

**You can't see Reddit users' emails.** The lead mining loop works by: identify intent on Reddit → engage helpfully → bridge to contact via their profile links (website, LinkedIn, IG in bio), or if they mention their business → find the business website → contact page. Enrichment tools (Apollo, FullEnrich) can fill in email/phone from a name + company. n8n has a ready-made template: monitor subreddits → GPT scores relevance → dedupes via Supabase → Gmail alerts.

### Target Subreddits (Facilitator/Practitioner side)

| Subreddit | Members | Why Target | Intent Signals |
|-----------|---------|-----------|----------------|
| r/yoga | 3.3M | Massive. Yoga teachers asking about class formats, events, retreats | "unique class experience", "how to differentiate", "outdoor yoga" |
| r/yogateachers | ~15K | Pure practitioners discussing business, class design, workshops | "workshop ideas", "retreat planning", "new format" |
| r/breathwork | ~30K | Breathwork facilitators, many run group sessions | "group sessions", "workshop setup", "equipment" |
| r/soundhealing | ~15K | Sound bath facilitators who already run immersive experiences | "sound bath event", "equipment recommendations" |
| r/meditation | ~1.2M | Teachers running group meditation, retreats | "guided meditation group", "retreat planning" |
| r/ecstaticdance | ~5K | Small but PERFECT. These people already run headphone events or want to | "silent disco", "headphones", "DJ setup" |
| r/Psychonaut | ~800K | Ceremony/retreat facilitators, breathwork crossover | "ceremony", "retreat", "group experience" |
| r/retreats | Small | Direct: people planning retreats | Any post about logistics, equipment |

### Target Subreddits (Event Planner/Buyer side)

| Subreddit | Members | Why Target | Intent Signals |
|-----------|---------|-----------|----------------|
| r/EventPlanning | ~20K | Wedding/corporate event planners | "silent disco", "unique entertainment", "headphone" |
| r/WeddingPlanning | ~500K | Brides/grooms looking for unique reception ideas | "entertainment ideas", "unique wedding", "silent disco wedding" |
| r/festivals | ~100K | Festival organizers and attendees | "silent disco stage", "headphone party" |
| r/DJs | ~200K | DJs who want to run silent disco sets | "silent disco", "wireless", "headphone DJ" |
| r/Fitness | ~11M | Fitness instructors running group classes | "outdoor class", "group workout music", "park workout" |
| r/CrossFit | ~300K | Box owners running group sessions | "music for classes", "workout audio" |
| r/pilates | ~50K | Studio owners, reformer classes | "class experience", "music" |
| r/running | ~2M | Running club organizers | "group run music", "silent disco run" |

### Highest-Value Keywords to Monitor

**Direct intent (hot):** "silent disco", "wireless headphones event", "rent headphones", "headphone party"

**Indirect intent (warm):** "unique workshop idea", "how to make my class different", "outdoor class audio", "retreat entertainment", "group experience equipment", "immersive experience", "multi-channel audio"

---

## Headset Business: AI Agent Loop Plan

### Loop 1: Reddit Intent Monitor (Cron, daily)
**Tool:** n8n + Claude
**What:** Monitor 15-20 subreddits above for buyer intent keywords daily → AI scores relevance (hot/warm/cold) → hot leads get flagged immediately → warm leads stored in Supabase for nurture → draft helpful reply (not sales pitch)
**Output feeds back:** Reply engagement data improves keyword targeting. Profile data feeds Loop 3.
**Revenue impact:** Direct leads, $0 acquisition cost

### Loop 2: SEO Content Engine (Cron, 3x/week)
**Tool:** Claude Code + WordPress/blog
**What:** Research trending search queries around silent disco → generate SEO articles ("How to run a silent disco yoga class", "Silent disco wedding ideas AU", "Best silent disco headphones for events") → publish to buySilentDiscoHeadphones.com → internal linking to rental/buy pages
**Output feeds back:** Traffic data shows which topics convert → next articles target those clusters. Each article is a permanent lead magnet.
**Revenue impact:** Organic traffic → rental enquiries. Compounds monthly.

### Loop 3: Instagram Facilitator Outreach (Cron, daily)
**Tool:** n8n or Make
**What:** Identify yoga teachers / breathwork facilitators / ecstatic dance leaders on Instagram (hashtag monitoring: #ecstaticdance, #soundbath, #breathworkfacilitator, #yogaretreat, #silentdisco) → read their recent posts/bio → generate personalized DM referencing their specific work → track replies
**Output feeds back:** Reply rate data improves messaging. Converted facilitators become Loop 5 content.
**Revenue impact:** $3-15K/mo. Each facilitator is a repeat renter.

### Loop 4: Event Content UGC Flywheel (Hook, post-event)
**Tool:** Claude Code
**What:** After each rental event, collect: facilitator testimonial, attendee photos/videos, event metrics (attendance, satisfaction) → generate case study article → create Instagram carousel → create short-form video script → publish across platforms → tag the facilitator (they reshare)
**Output feeds back:** Case studies ARE the sales material for Loop 3 outreach. Facilitator reshares = free reach. Each event generates content that sells the next event.
**Revenue impact:** Social proof compounds. Every event markets the next one.

### Loop 5: Facilitator Success Engine (Cron, weekly)
**Tool:** Claude Code
**What:** For active renters: monitor their event pages/social → generate event promotion tips → send weekly "here's how to fill your next event" email with their specific context → track which facilitators rebook
**Output feeds back:** Facilitator success = more events = more rentals = more case studies (Loop 4). Facilitators who succeed refer other facilitators.
**Revenue impact:** Retention + referral. The loop that turns one-time renters into repeat customers.

### Loop 6: Competitor Price Monitor (Cron, weekly)
**Tool:** n8n + web scrape
**What:** Monitor competitor silent disco rental sites in AU/UK/CA/NL/DE → track pricing changes → alert on new entrants → compare feature sets
**Output feeds back:** Pricing intelligence informs your own pricing. Competitive gaps become content topics (Loop 2).
**Revenue impact:** Pricing optimization, competitive positioning.

### The Headset Flywheel (How They Connect)

```
Reddit Intent (Loop 1) ──→ Leads
                              ↓
SEO Content (Loop 2) ────→ Leads ──→ RENTAL BOOKING
                              ↑           ↓
IG Outreach (Loop 3) ────→ Leads    Event Happens
                                        ↓
                                  UGC Content (Loop 4)
                                    ↓           ↓
                              Case Studies    Social Proof
                                ↓                 ↓
                          Feeds Loop 3      Feeds Loop 2
                          (better outreach) (better SEO content)
                                        ↓
                              Facilitator Success (Loop 5)
                                        ↓
                              Rebooks + Refers Others
                                        ↓
                              Back to top ↑
```

---

## Vibe Rise + Creator Portal: Growth Loop Map

### Primary Flywheel: The Shift Architecture Loop (Ship30 model adapted)

```
Creator discovers Shift Architecture (via content/outreach/creator portal)
            ↓
Uses Creator Portal to design their experience
            ↓
Rents headsets + runs workshop/retreat using the method
            ↓
Participants have genuine shifts → screenshot/share moments
            ↓
Social proof + case studies attract new creators
            ↓
New creators discover Shift Architecture → back to top
```

**This is the primary loop.** Every other loop serves it.

### Supporting Loop A: Content → Audience → Creator Portal (Content Flywheel)
**Relevant growth loop:** Newsletter ↔ Social Cross-Pollination (#4) + SEO Content (#5)

@_huzz Instagram (100-day series, Graph Carousels) → newsletter captures email list → newsletter drives back to IG → SEO articles on experience creation rank → organic discovery → Creator Portal signups

**What compounds:** Each piece of content is permanent. The 129-creator research database is unique content no competitor has.

### Supporting Loop B: Creator-as-Marketer (Ship30 adapted)
**Relevant growth loop:** Cohort Student-as-Marketer (#1)

Creators using Shift Architecture naturally promote it by running events. Their marketing IS your marketing. Participant testimonials, event photos, workshop announcements all reference the method.

**What compounds:** Every new creator becomes a distribution channel. Their audience sees the method, some become creators themselves.

### Supporting Loop C: Interview/Collab Flywheel (#6)
**Relevant growth loop:** Interview/Collaboration (#6)

Interview experience creators (you already have 129 researched) → they share the interview → their audience discovers you → bigger creators agree to interviews → compound.

**What compounds:** Guest promotion, content library, relationship capital. The 129-creator database is a ready-made guest list.

### Supporting Loop D: Cost-Center Flip (#2) = Headset Rental
**Relevant growth loop:** Sahil Bloom's Cost-Center Flip (#2)

You own headsets for your own events → rent them to other creators → rental revenue funds more headsets → more creators can rent → more events happen → more content (Loop A) → more creator signups (primary flywheel).

**What compounds:** Equipment inventory grows from revenue, not capital. Each headset is an asset that generates recurring rental income.

### Supporting Loop E: UGC Shareable Moments (App)
**Relevant growth loop:** UGC Loop (#9)

Users complete Essence Mirror / Play Profile / Weekly Review → shareable cards generated → share on social → new users discover Vibe Rise → complete their own flows → share. Already built, needs distribution.

**What compounds:** Every user creates free marketing material as a natural byproduct of using the app.

### What's NOT Relevant Yet
- HubSpot 6-loop ecosystem (#3) → need scale first
- Viral/Referral Dropbox (#7) → need critical mass
- Data/Personalization Netflix (#8) → too early, building toward it
- Paid loop (#10) → premature before organic loops spin

### Priority Order for Activation

| Priority | Loop | Why First |
|----------|------|----------|
| 1 | Headset Loops 1-4 | Revenue-generating, clear buyer intent, immediate ROI |
| 2 | Content Flywheel (A) | Already producing content, just needs systematizing |
| 3 | Creator-as-Marketer (B) | Activates when first creators use Shift Architecture |
| 4 | Interview Flywheel (C) | 129-creator database ready, low effort per interview |
| 5 | UGC Shareable (E) | Already built in app, needs distribution push |
| 6 | Cost-Center Flip (D) | Already happening, formalize it |

### The Full Ecosystem Flywheel

```
               CONTENT (Loop A)
              ↗                ↘
    INTERVIEWS (C)          SEO/SOCIAL
              ↑                ↓
    129 CREATORS         CREATOR PORTAL SIGNUPS
              ↑                ↓
    CASE STUDIES        SHIFT ARCHITECTURE DESIGN
              ↑                ↓
    UGC (E) ← ← ← ←   RUN EVENT (with headsets, Loop D)
              ↑                ↓
    SHAREABLE CARDS      PARTICIPANT SHIFTS
              ↑                ↓
    VIBE RISE APP   ← ←  WORD OF MOUTH
```

---

## The 69-Loop Library (Forward Future) - Full Index

Complete list of all 69 repeatable AI agent workflows:

### Engineering (28 loops)
1. Docs Sweep - keeps docs aligned with codebase, opens PR
2. Architecture Satisfaction - refactors in tested checkpoints with autoreview
3. Sub-50ms Page Load - optimizes until all pages load under 50ms
4. Production Error Sweep - finds/fixes actionable errors in production logs
5. 100% Test Coverage - adds meaningful tests until complete coverage
6. Logging Coverage - adds tested logs to every important system path
7. Nightly Changelog - updates changelog nightly with meaningful changes
8. Test-Suite Speed - optimizes test execution without reducing coverage
9. Repository Cleanup - recovers valuable work, removes stale state
10. Ticket-to-PR-Ready - converts tickets into verified pull requests
11. Clodex Adversarial Review - uses Codex to review PRs until issues resolve
12. Loop Harness Verification - ships scheduled work only after independent verification
13. Fresh-Clone - repeats clean onboarding until no hidden assumptions remain
14. Autonomy-Loop Builder-Reviewer - passes code between builder/reviewer until tests pass
15. Codex Completion-Contract - requires evidence for every reported result
16. Five-Minute Repository Maintainer - wakes every 5 min to triage repo work
17. Recent-Feedback Sweep - audits project for user-reported issues
18. Propagation Compliance - finds stale values after config changes
19. Housekeeper - cleans code one proven change at a time
20. Cold-Load Trimmer - reduces pre-render data downloads
21. Test Stabilizer - fixes flaky tests by addressing root causes
22. Groundtruth - audits project directly without framework assumptions
23. Error-Message Rewrite - finds and rewrites weak error messages
24. Stable Frame Rate - optimizes until frame rate stabilizes
25. Dependency Triage - processes Dependabot PRs with isolated testing
26. Dependency-CVE Burndown - fixes reachable vulnerabilities in risk order
27. React Doctor Repair - fixes React findings while maintaining regression-free state
28. Architecture-Preserving Refactor - refactors toward goals while preserving public contracts

### Evaluation (13 loops)
29. Quality Streak - tests/fixes until achieving defined success streak
30. Full Product Evaluation - tests every product surface against criteria
31. Self-Improving Champion - promotes changes only when winning on holdout cases
32. Devil's Advocate - challenges designs until objections resolved
33. Multi-LLM Convergence - two LLM families review until both approve
34. Revolve Versioned Experiment - improves through comparable checkpointed experiments
35. Promise-to-Proof - checks marketing claims against current product behaviour
36. Artifact-to-Skill - extracts method from artifact, tests on fresh case
37. Strip Miner - mines history for reusable workflows
38. Next-Action Confidence Check - separates task completion proof from permission to continue
39. Cross-Run Playbook - promotes lessons only after independent success
40. Loop Auditor - assigns evidence-backed status to loops
41. Epistemic Frontier - tests competing hypotheses against highest-value evidence

### Operations (10 loops)
42. Stale-Safe Batch Release - batches valid changes, releases complete artifacts
43. Production Data Cleanup - removes disallowed data, improves classification
44. Post-Release Baseline - benchmarks releases, records reproducible baselines
45. Customer AI Deployment - validates and rolls out one customer AI workflow
46. Living Story - maintains daily narrative of projects and priorities
47. Recovery Proof - proves backups restore required scenarios
48. Refund Follow-up - pursues refund until money arrives
49. Restartable Handoff - leaves verified context for session resumption
50. Loop Hiring Manager - identifies recurring work deserving automation (meta-loop)
51. Prepare-a-New-Project - strengthens project documents until independent agreement

### Design (6 loops)
52. Boeing 747 Benchmark - iteratively improves 3D model against scoring rubric
53. War Loops: Frontend Reconstruction - reconstructs interface, repairs visual mismatches
54. Infinite Clickbait Thumbnail - iterates thumbnails until clearing quality bar
55. UI/UX Score Loop - walks through user flows, improves weak screens
56. Pixel-Safe CSS Trim - shrinks CSS while maintaining visual identity
57. Accessibility Repair - fixes barriers for keyboard/screen reader/low-vision users

### Content (6 loops)
58. SEO/GEO Visibility - fixes highest-impact search + AI answer visibility gaps
59. Product Update Podcast - turns product updates into sourced podcast episodes
60. Research-to-Artifact - turns research into decision-ready documents
61. Talk-to-Five-Buyers - uses buyer objections to draft landing page copy
62. One-Post-a-Week - tests post formats until one wins on engagement
63. Pre-Publish Source Check - verifies every claim against primary sources
64. LaTeX Document Creation - builds source-traceable scientific preprints

### Meta (2 loops)
65. Goal Forge - converts rough ideas into measurable planning files
66. Axelrod Subagent Arena - tests whether agents learn cooperation patterns

### Evaluation/Engineering Crossover (3 loops)
67. Easy Onboarding - acts as first-time user, fixes obstacles
68. Evidence-First Feature - implements one feature slice with inspection/verification
69. React Doctor 100/100 - brings all production apps to perfect React health score

---

## Sources (Growth Loops)

- [Ultimate Guide: Growth Loops - Aakash Gupta](https://www.news.aakashg.com/p/ultimate-guide-growth-loops)
- [Growth Flywheel Atlas: 6 Loops - FourWeekMBA](https://fourweekmba.com/growth-flywheel-atlas/)
- [Growth Loops: 4 Types - GrowthMethod](https://growthmethod.com/growth-loops/)
- [Creator Flywheels: 5 Examples - John Bardos](https://johnbardos.medium.com/creator-flywheels-5-examples-from-top-creators-91c90c1e33d0)
- [Sahil Bloom Flywheels - Nathan Barry](https://nathanbarry.com/078-sahil-bloom-using-flywheels-to-build-longevity-in-the-creator-economy/)
- [Growth Loops Framework - Umbrex](https://umbrex.com/resources/frameworks/marketing-frameworks/growth-loops-framework-acquisition-engagement-referral-loops/)
- [Content Flywheel Guide - Omnius](https://www.omnius.so/blog/content-flywheel)
- [Community Flywheels - Azarian Growth Agency](https://azariangrowthagency.com/growth-loops-community-flywheels/)
- [Andrew Chen: Retention drives viral growth](https://andrewchen.com/more-retention-more-viral-growth/)

## Sources (AI Agent Loops)

- [Loop Engineering - Addy Osmani (Google)](https://addyosmani.com/blog/loop-engineering/)
- [How to Design AI Agent Loops - Lenny's Newsletter / Boris Cherny](https://www.lennysnewsletter.com/p/how-to-design-ai-agent-loops-schedules)
- [Loop Engineering: Claude Code /goal + Routines - Sabrina.dev](https://www.sabrina.dev/p/loop-engineering-claude-code-goal-routines)
- [Loop Library: 69 Repeatable Workflows - Forward Future](https://signals.forwardfuture.com/loop-library/)
- [5 AI Agent Workflows Making Money - Indie Hackers](https://www.indiehackers.com/post/5-ai-agent-workflows-actually-making-money-in-2026-with-real-numbers-ea266790ba)
- [5 Profitable AI Agent Automations - Christie C. / Medium](https://medium.com/@inchristiely/5-profitable-ai-agent-automations-creators-are-building-in-2026-88ac9844defb)
- [AI Agent Loop Architecture - Oracle Developers](https://blogs.oracle.com/developers/what-is-the-ai-agent-loop-the-core-architecture-behind-autonomous-ai-systems)
- [Claude Code vs n8n Comparison - MindStudio](https://www.mindstudio.ai/blog/claude-code-vs-n8n-agentic-workflows-comparison)
- [Loop Engineering Guide 2026 - AI Builder Club](https://www.aibuilderclub.com/blog/loop-engineering-guide-2026)
- [What Is Loop Engineering - MindStudio](https://www.mindstudio.ai/blog/what-is-loop-engineering-ai-coding-agents)
