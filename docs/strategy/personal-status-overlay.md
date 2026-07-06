# Agent Tree: Action Map (Huzz's Personal Status)

**Date:** 2026-06-15 (tools mapping + verification 2026-06-26)
**Purpose:** Huzz's personal status overlay on top of the universal Creator Capability Map (`docs/creator-capability-map.md`). Shows which tools are connected, what's working, and what's missing for THIS specific setup.

**For the universal capability map** (all possible tools, any creator): see `docs/capability-map/creator-capability-map.md`
**This doc** shows: what's GREEN/YELLOW/RED specifically for Huzz's connected stack.

**Traffic lights:**
- **GREEN** = Agent can do this now (brain data + existing edge function/service)
- **YELLOW** = Needs a Composio connection or small integration, then agent can do it
- **RED** = Needs new development (new edge function, new flow, or new Composio tool)

---

## Available Tools & Connections (as of 2026-06-26)

### Composio Apps (connected, ready to use)
`canva` · `cloudflare` · `fathom` · `gmail` · `instagram` · `miro` · `reddit` · `resend`

### Claude.ai MCP Connectors (available for remote triggers)
`Gmail` · `Google Drive` · `Notion` · `Meta Ads` · `Higgsfield`

### External Tools (accounts exist or free tier available)
| Tool | What It Does | Cost |
|------|-------------|------|
| **Higgsfield Supercomputer** | Agentic AI creative team: video, images, UGC, ads, product shots. Routes to best AI model automatically (Sora 2, Kling 3.0, Veo 3.1, Seedance 2.0). Soul ID for consistent characters. | MCP connected |
| **Orior AI** | AI UGC persona: photorealistic character, pose control, lip-sync video, auto-post to IG/TikTok/X/YT/Threads/Snap | Free (3 credits), €15/mo Creator |
| **Firecrawl** | Web scrape, search, crawl, interact. SEO audits, competitor intel, lead gen | CLI installed |
| **n8n** | Visual workflow builder. 7K+ community templates. Always-on scheduled automation | Free self-hosted |
| **Jina AI** | Web search, URL reading, PDF extraction, text classification | MCP connected |

### Claude Code Skills (local, invoke with /)
`/competitor-profiling` · `/reddit-headset-monitor` · `/content-strategy` · `/seo-audit` · `/copywriting` · `/cold-email` · `/emails` · `/prospecting` · `/lead-magnets` · `/ads` · `/ad-creative` · `/social` · `/carousel` · `/graph-carousel` · `/invoice` · `/image` · `/video` · `/hyperframes` · `/firecrawl-*` (12 variants) · `/llm-council` · `/mastermind`

### Scheduled Triggers (running autonomously)
| Trigger | Schedule | ID |
|---------|----------|----|
| Reddit Silent Disco Monitor | 12h | `trig_01QQTjnwtWdrvGAgVBrCsdKA` |
| Reddit Vibe Rise Monitor (findapath) | 12h | `trig_01Cz1fezF3qgeJ2Tas54r5pq` |
| CEO Morning Briefing | Daily | `trig_0145PAEygFmBBg9jYooLLbBa` |
| build-health | Daily | `trig_01H9iAhWHFhxZkdkQg8Ud5EU` |
| dead-code-finder | Weekly | `trig_01AUg5FTFxQmoouRoDeopv6T` |
| docs-sync | Weekly | `trig_01TZfFU1XrmiG1WJpSvVV2kG` |

---

## Make More Money

### Phase 1: Package Your Offer

| Node | Status | Tools | Agent action |
|------|--------|-------|--------------|
| Value Stack Builder | **GREEN** | Claude API, Supabase (brain `offer.*`) | Reads offer data, identifies gaps ("you have attraction but no continuity"), proposes next flow |
| Pricing & Guarantee | **GREEN** | Claude API, Supabase (brain `offer.*`, PTUF data) | Reads PTUF data, flags if pricing doesn't support income target |

### Phase 2: Choose Your Hook

| Node | Status | Tools | What's needed |
|------|--------|-------|---------------|
| Win Your Money Back | **RED** | Claude API + brain `offer.*` + `/offers` skill (Value Equation only, not 6 hooks) | `/offers` has Hormozi Value Equation but NOT the 6 specific hooks. Needs: custom prompt with hook definitions + scoring rubric, or a dedicated skill. Achievable but not built. |
| Decoy Offer | **RED** | Same | Same |
| Pay Less Now | **RED** | Same | Same |
| Buy X Get Y Free | **RED** | Same | Same |
| Giveaway | **RED** | Same | Same |
| Free With Consumption | **RED** | Same | Same |

**Verified (Jun 26):** These remain RED. The `/offers` skill has the Value Equation framework but does NOT contain the 6 Hormozi hooks. An agent could score hooks via a custom prompt (give it the 6 hook definitions + brain offer data + scoring rubric), but no skill or flow does this today. Effort to build: ~2h for a custom skill.

**Note:** Higgsfield has a **Virality Prediction** tool that scores **video/ad hooks** (scroll-stopping, retention, neural engagement). This is useful for the Content Creation and Ads branches but is a different thing from offer structure hooks. Higgsfield Marketing Studio also has proven hook templates for video openings.

### Phase 3: Pick Your Channels — Content Creation

| Node | Status | Tools | Agent action |
|------|--------|-------|--------------|
| Instagram Posts | **GREEN** | **Draft:** Content Generator edge function + brain `voice.*` | Drafts post from brain context |
| | | **Visuals:** Higgsfield Marketing Studio (product video/image), Orior AI (AI persona photos, €15/mo), Canva (Composio connected, templates) | Generates accompanying visual |
| | | **Publish:** Composio Instagram (connected), Orior auto-post (6 platforms) | Auto-publishes approved posts |
| LinkedIn Posts | **GREEN → YELLOW** | **Draft:** Content Generator + brain, `/social` skill | Drafts from brain context |
| | | **Publish:** Composio LinkedIn (not connected yet) | Needs OAuth connect |
| Blog / SEO | **GREEN** | **Draft:** Content Generator + brain, `/copywriting` skill, `/seo-audit` skill | Drafts long-form SEO content |
| | | **Research:** Firecrawl (`/firecrawl-search`, `/firecrawl-seo-audit`), `/content-strategy` skill | Keyword research, competitor content gaps |
| | | **Publish:** Cloudflare (Composio connected), Vercel | Deploy to site |
| Newsletter | **GREEN** (85%) | **Draft:** Content Generator + brain, `/emails` skill | Drafts newsletter |
| | | **Send:** Resend (Composio connected, API key confirmed in Supabase) | Send via Resend API. Edge function `process-scheduled-newsletters` verified working with Resend. |
| | | **Manage:** beehiiv (if used), Gmail (Composio connected) | List management |

### Phase 3: Pick Your Channels — Outreach

| Node | Status | Tools | Agent action |
|------|--------|-------|--------------|
| Email (Warm Outreach) | **GREEN** | **Draft:** Claude API + brain `audience.top_fans`, `/cold-email` skill | Drafts personal follow-up emails |
| | | **Send:** Gmail (Composio connected), Resend (Composio connected) | Sends approved emails |
| Reddit Monitoring | **GREEN** | **Scan:** Reddit (Composio connected), scheduled triggers (2 running) | Monitors r/findapath + silent disco keywords every 12h |
| | | **Draft:** Claude API + `scripts/reddit-monitor.md` voice guide | Drafts comments in Huzz's voice |
| | | **Alert:** Gmail MCP (HOT leads emailed to nichuzz@gmail.com) | Auto-alerts on buyer intent |
| Cold Email | **YELLOW** | **Prospect:** `/prospecting` skill, Firecrawl (`/firecrawl-lead-gen`, `/firecrawl-lead-research`) | Builds prospect lists from directories |
| | | **Enrich:** Apollo/FullEnrich (not connected, needed for email lookup) | Enriches Reddit/IG leads with email |
| | | **Draft:** `/cold-email` skill + brain `offer.*` | Generates cold sequence |
| | | **Send:** Resend (Composio connected) or Gmail | Executes sequence |
| LinkedIn DMs | **RED** | Composio LinkedIn (not connected, ToS issues with DM automation) | Park. ToS risk too high. |
| Meta Ads | **YELLOW** | **Create:** Meta Ads MCP (connected!), `/ads` skill, `/ad-creative` skill | Campaign creation + creative generation |
| | | **Creative:** Higgsfield Marketing Studio (URL→ad), Orior AI (UGC ads) | AI-generated ad creative |
| | | **Track:** Meta Ads MCP (connected), Fathom (Composio connected) | Performance monitoring |
| Google Ads | **RED** | No integration. `/ads` skill can draft copy but no execution path. | Park for now. |
| Instagram Outreach (DMs) | **YELLOW** | **Find:** Composio Instagram (connected), hashtag monitoring | Find facilitators via #ecstaticdance #breathworkfacilitator etc |
| | | **Draft:** Claude API + personalization from profile scrape | Personalized DMs |
| | | **Send:** Manual (IG DM automation risky) | Human sends, agent drafts |

**Update (Jun 26):** Meta Ads upgraded from RED → YELLOW. The Meta Ads MCP is already connected. Combined with `/ads` + `/ad-creative` skills + Higgsfield for creative, we can create and manage Meta campaigns. Reddit Monitoring is a new GREEN node (two triggers live). Instagram Outreach added as YELLOW (agent finds + drafts, human sends).

### Phase 4: Create & Send

| Node | Status | Tools | Agent action |
|------|--------|-------|--------------|
| Campaign Plan | **GREEN** | Claude API + all 6 brain domains, `/marketing-plan` skill, `/content-strategy` skill | Generates reverse-timeline campaign from experience date + fill rate |
| Draft & Review | **GREEN** | **Text:** Content Generator edge function, `/copywriting` skill, `/stop-slop` skill | Drafts all content types |
| | | **Visual:** Higgsfield (video/image/UGC), Orior (AI persona), Canva (Composio), `/carousel` + `/graph-carousel` skills | Generates visual assets |
| | | **Video:** Higgsfield Cinema Studio, `/video` skill, `/hyperframes` skill | Short-form video content |
| | | **Review:** `/llm-council` skill (5 AI advisors review), `/copy-editing` skill, Higgsfield Virality Prediction (scores hook strength + retention + viral potential before publish) | Quality check before publish |
| Send & Track | **GREEN** | **Send:** Composio Instagram (connected), Composio Gmail (connected), Resend (connected), Orior auto-post (6 platforms) | Publishes approved content |
| | | **Track:** Fathom (Composio connected), Meta Ads MCP, Composio Instagram (metrics) | Pulls performance data back to brain |

**Update (Jun 26):** Send & Track upgraded from YELLOW → GREEN. Instagram, Gmail, and Resend are all connected via Composio. Fathom provides analytics. Orior adds 6-platform auto-posting for €15/mo.

### Earn More Revenue

| Node | Status | Tools | Agent action |
|------|--------|-------|--------------|
| Upsell (4 types) | **GREEN** | Claude API + brain `offer.*`, `/offers` skill, `/pricing` skill | Reads offer stack, identifies gaps, suggests next steps |
| Downsell (3 types) | **GREEN** | Same | Same pattern |
| Continuity (6 types) | **GREEN** | Same | Same pattern |
| Competitor Intel | **GREEN** | `/competitor-profiling` skill, Firecrawl, `/firecrawl-competitive-intel` skill | Profile competitors, monitor pricing changes |
| | | Competitor profile at `competitor-profiles/silent-sound-system.md` | Already profiled #1 competitor |

---

## Save More Time

### Drowning in Admin

| Node | Status | Tools | Agent action |
|------|--------|-------|--------------|
| Xero / QuickBooks | **YELLOW** | Composio has Xero + QuickBooks tools (not connected) | Syncs expenses, generates P&L. Needs OAuth connect. |
| Calendly | **YELLOW** | Composio has Calendly tools (not connected) | Auto-creates booking link on experience creation, syncs RSVPs as contacts |
| Custom Tools | **RED** | L4 Build Layer. Higgsfield Supercomputer could scaffold. | Future |

### Losing Track of Leads

| Node | Status | Tools | Agent action |
|------|--------|-------|--------------|
| CRM | **GREEN** | Supabase (brain `audience.*`), native CRM built | Agent reads contact data for follow-up decisions |
| Gmail Follow-ups | **GREEN** | Gmail (Composio connected), Claude API + brain, `/cold-email` skill | Drafts follow-up emails for warm contacts, sends via Gmail |
| Email Sequences | **YELLOW** (65%) | Resend (Composio connected, API key confirmed), `/emails` skill, sequence builder UI exists | Sequence builder works. Resend sends. BUT auto-trigger `enroll-email-sequence` does NOT exist as an edge function. Manual trigger only. Needs: small edge function or webhook to auto-enroll contacts post-event. |
| Reddit Lead Capture | **GREEN** | Reddit (Composio connected), scheduled triggers (2 live) | Monitors Reddit for buyer intent, drafts replies, emails HOT leads |

**Update (Jun 26):** Gmail Follow-ups upgraded from YELLOW → GREEN (Gmail Composio now connected). Reddit Lead Capture added as new GREEN node.

### Don't Know What's Working

| Node | Status | Tools | Agent action |
|------|--------|-------|--------------|
| Stripe Analytics | **YELLOW** | Composio has Stripe tools (not connected) | Pulls revenue data, writes to brain performance domain |
| Website Analytics | **GREEN** | Fathom (Composio connected) | Privacy-first analytics, already tracking. Agent can pull metrics. |
| Instagram Analytics | **GREEN** | Composio Instagram (connected) | Pull engagement metrics, follower growth, post performance |
| Dashboard | **GREEN** | Supabase (all brain domains), CEO Morning Briefing trigger (daily) | Weekly digest from brain data. CEO trigger already running. |

**Update (Jun 26):** Google Analytics replaced with Fathom (already connected, privacy-first). Upgraded to GREEN. Instagram Analytics added as GREEN (Composio connected).

### Quoting / Invoicing

| Node | Status | Tools | Agent action |
|------|--------|-------|--------------|
| Invoice Generator | **GREEN** | `/invoice` skill (already installed!), `pdfGenerator.js` | Generates branded HTML invoice from offer data + contact. Skill invocation: `/invoice Craig, 2x Workshop @ 2M IDR, bank OCBC 167810077310` |
| Square / Invoice Ninja | **RED** | No integration | Low priority. Stripe (when connected) covers payments. |

**Update (Jun 26):** Invoice Generator upgraded from RED → GREEN. The `/invoice` skill exists and generates branded HTML invoices.

---

## Summary by traffic light (verified 2026-06-26)

| Status | Original (Jun 15) | Updated (Jun 26) | Change |
|--------|-------------------|-------------------|--------|
| **GREEN** | 14 | 20 | +6 (tools + connections verified) |
| **YELLOW** | 9 | 8 | -1 (Gmail now connected, +1 email sequences downgraded) |
| **RED** | 11 | 9 | -2 (invoice→skill, Meta Ads→YELLOW, hooks stay RED) |

### What changed
- Meta Ads: RED → YELLOW. Meta Ads MCP already connected
- Invoice Generator: RED → GREEN (75%). `/invoice` skill exists (untested, needs verification run)
- Gmail Follow-ups: YELLOW → GREEN. Gmail Composio connected
- Google Analytics: RED → GREEN. Replaced with Fathom (Composio connected)
- Newsletter: confirmed GREEN (85%). RESEND_API_KEY verified set in Supabase. Edge function works.
- Send & Track: YELLOW → GREEN (75%). Can send (IG + Gmail + Resend). Track loop (metrics → brain) not built.
- Email Sequences: GREEN → YELLOW (65%). Auto-trigger `enroll-email-sequence` doesn't exist. Manual works.
- Hook scorer (6 nodes): stays RED. `/offers` has Value Equation, NOT the 6 hooks. ~2h to build custom skill.
- New GREEN nodes added: Reddit Monitoring, Instagram Analytics, Reddit Lead Capture, Competitor Intel

### Confidence ratings (verified)

| Tier | Nodes | Confidence | Below 80% |
|------|-------|-----------|-----------|
| GREEN | 20 | **85%** avg | Send & Track (75%), Invoice (75%) |
| YELLOW | 8 | **67%** avg | Meta Ads (65%), Email Sequences (65%), IG DM Outreach (55%), Cold Email (60%) |
| RED | 9 | **30%** avg | Hook Scorer achievable with ~2h custom skill. Rest intentionally parked. |

### Nodes below 80% confidence (full list)

| Node | Status | Confidence | Gap |
|------|--------|-----------|-----|
| Hook Scorer (6 nodes) | RED | 45% | `/offers` doesn't have 6 hooks. Needs custom skill (~2h). |
| Instagram DM Outreach | YELLOW | 55% | No safe automation. Agent drafts, human sends. Clunky. |
| Cold Email (enrichment) | YELLOW | 60% | FullEnrich/Clay identified but not connected. Enrichment step is the gap. |
| Meta Ads | YELLOW | 65% | MCP connected but untested. Can it create campaigns or just read? |
| Email Sequences | YELLOW | 65% | Auto-trigger doesn't exist. Sequence builder + Resend work manually. |
| Send & Track | GREEN | 75% | Send works. Track (metrics → brain auto-update) not built. |
| Invoice Generator | GREEN | 75% | `/invoice` skill exists, untested. Needs verification run. |
| Calendly / Cal.com | YELLOW | 70% | Cal.com recommended but not connected or tested. |
| LinkedIn Posts | YELLOW | 75% | Composio not connected. Will work once connected (official API). |
| Stripe Analytics | YELLOW | 75% | Composio has Stripe MCP. Not connected. 5 min OAuth. |
| Xero / QuickBooks | YELLOW | 50% | Low priority. Most creators use spreadsheets. |

### Higgsfield additions (verified via skills page + marketing studio)

Higgsfield's MCP is available but needs authentication. Once connected, it adds:

| Higgsfield Feature | Tree Node It Powers | What It Does |
|-------------------|---------------------|-------------|
| **Marketing Studio** | Content Creation (IG, ads) | 9 video modes: UGC, TV Spot, Tutorial, Product Review, Unboxing, Virtual Try-On. URL-to-ad. 40+ avatars. Hook templates. |
| **Virality Prediction** | Draft & Review | Scores hook strength, retention risk, viral potential BEFORE publish. Peak hook timing + neural engagement metrics. |
| **Soul ID** | All content nodes | Train a character from reference photo. Consistent identity across all generated content. |
| **Video Analyzer** | Competitor Intel | Breaks down reference videos scene-by-scene for recreation. |
| **Product Photoshoot** | Content Creation | Product URL → polished marketing video. |
| **Viral Clip Generator** | Content Creation | Long-form → short vertical clips with subtitles for TikTok/Reels. |

**Note:** Higgsfield scores VIDEO hooks (will this stop the scroll?), not OFFER hooks (which pricing psychology to use). Different thing. The 6 Hormozi offer hooks remain RED.

### Instant upgrades (zero dev, just connect)

| Connect This | Unlocks | Effort | Confidence it works |
|-------------|---------|--------|-------------------|
| **Stripe** (Composio) | Revenue tracking, brain performance auto-update | 5 min OAuth | 90% (well-documented MCP) |
| **LinkedIn** (Composio) | Post publishing via official API | 5 min OAuth | 85% (standard OAuth) |
| **Higgsfield** (MCP auth) | Video ads, UGC, virality scoring, product shots | 2 min auth | 90% (MCP already installed) |
| **Cal.com** | Free booking for experiences, API-first | 15 min setup | 70% (untested integration) |

### The GREEN path (20 nodes, no new integrations needed)

These can be agent-powered with the brain + existing edge functions + connected tools:

1. Value Stack gap analysis
2. Pricing sanity check
3. Instagram post drafting + publishing (Composio connected)
4. Blog/SEO content drafting
5. Newsletter drafting + sending (Resend confirmed)
6. Campaign plan generation
7. Draft & review (all content types + Higgsfield virality scoring)
8. Send & track (IG + Gmail + Resend connected)
9. Upsell gap analysis
10. Downsell gap analysis
11. Continuity gap analysis
12. Competitor intel (Firecrawl + profiling skill)
13. CRM contact analysis
14. Gmail follow-ups (Composio connected)
15. Reddit lead capture (2 triggers live)
16. Website analytics (Fathom connected)
17. Instagram analytics (Composio connected)
18. Dashboard digest (CEO trigger running)
19. Invoice generation (`/invoice` skill)
20. Fill-rate analysis

### The YELLOW path (unlocked per connection)

| Connection | Unlocks | Effort |
|-----------|---------|--------|
| **Stripe** (Composio) | Revenue tracking, brain performance auto-update, payment processing | 5 min OAuth |
| **LinkedIn** (Composio) | Post publishing via official API (safe, ToS-compliant) | 5 min OAuth |
| **Cal.com** (replace Calendly) | Free, API-first, embeddable booking for experiences, group scheduling | 15 min setup |
| **Lead enrichment** (FullEnrich or Clay) | Turn Reddit/IG usernames into email addresses for cold outreach | Account setup |
| **Instagram** (Composio) | Already connected. Auto-publish, pull metrics | Done |
| **Gmail** (Composio) | Already connected. Send follow-ups, warm outreach | Done |

### The RED path (parked with reasoning)

| Node | Why Parked | If Revisiting |
|------|-----------|---------------|
| LinkedIn DMs | ToS risk too high. Accounts get banned. | Expandi ($99/mo per seat, cloud, dedicated IP, 15-20/day) is the "safest" but still risky |
| Google Ads | No integration path. Meta Ads is better for wellness | Would need custom API work |
| Square / Invoice Ninja | Already solved by `/invoice` skill | Only if creators specifically request |
| Custom Tools (L4) | Genuine new dev required | Higgsfield Supercomputer could scaffold basic tools |

---

## Agent delivery: Pipeline nodes, not a separate portal

Agents don't need their own portal. They surface inside the **Experience Pipeline nodes** (Attract → Capture → Convert → Deliver → Grow) and existing task/queue surfaces.

Each pipeline node already has:
- A status indicator (good/warn/empty)
- A readiness percentage
- Checklist items (via `experience_checklist_items`)
- Manual metric input (via `MetricInputSheet`)

Agent actions slot into this:
- **Attract node** → Content Agent drafts + warm outreach list
- **Capture node** → Landing page performance monitoring
- **Convert node** → Email/DM nudges for unconverted signups
- **Deliver node** → Checklist reminders (existing)
- **Grow node** → Post-event sequence + re-engagement

When an agent has proposals ready, the node shows a badge (e.g., "3 drafts ready"). Tapping the node shows the proposals inline. No separate queue page needed for v1.

Sol (the OpenClaw edge function) is parked. The simpler model is: JS decision logic per node + Claude for content generation + Composio for execution. Sol can be revisited if multi-step agent reasoning is needed later.

---

## V1 scope: 4 low-hanging fruit actions

### Action 1: Content drafts (Attract node)

**Trigger:** Experience exists with date in future
**Agent logic:** Read brain (voice, offer, identity) → call Content Generator edge function → write draft to approval queue
**User sees:** Attract node badge "2 posts drafted" → tap → review/approve/edit
**Execution:** Approved post → Content Queue (manual posting for v1, Composio auto-post later)

### Action 2: Warm outreach list (Attract node)

**Trigger:** Experience exists + CRM contacts with 2+ past attendances
**Agent logic:** Read brain (audience.top_fans) + query contact_experiences → generate prioritised list with suggested message snippet per contact
**User sees:** Attract node "5 warm leads to contact" → tap → see list with draft messages
**Execution:** User sends manually (or approve → Composio Gmail later)

### Action 3: Email newsletter draft (Attract node)

**Trigger:** Experience in <21 days + email template exists
**Agent logic:** Read brain (voice, offer, audience) → draft newsletter announcing event → write to approval queue
**User sees:** Attract node "Newsletter draft ready" → tap → review/edit/send
**Execution:** Approved → email edge function sends (Resend API key confirmed set in Supabase)

### Action 4: Landing page + checkout performance monitor (Capture node)

**Trigger:** Experience has a landing page URL (from `crm_pages` or experience record)
**Agent logic:** Pull page metrics (if Composio analytics connected) OR read manual metric input → compare conversion rates against benchmarks → if below threshold, generate specific recommendations
**User sees:** Capture node shows "Conversion low (2%). 3 recommendations" → tap → see edits like "Add testimonial above fold", "Reduce form fields", "Strengthen headline with your rule break: [brain.identity.rule_break]"
**Execution:** Recommendations only (user makes changes). Future: L4 Build Layer auto-edits the page.

---

## Recommended first agent case: Content Agent for upcoming experience

**Why this one:**
- All GREEN (brain + Content Generator exist)
- Highest perceived value ("it wrote my Instagram post for me")
- Simplest decision logic (experience has date → draft post)
- Tests the full pipeline: trigger → brain read → draft → approval queue → execute
- No Composio needed for v1 (approved post goes to Content Queue for manual posting)

**The case:**
1. Creator has experience "June Breathwork Circle" in 14 days
2. On page load, Content Agent checks: upcoming experience + milestone hit + no existing proposal
3. Agent reads brain: voice (casual, vulnerable), offer (breathwork, $30, 12 spots), identity (Playful Creator)
4. Agent calls Content Generator edge function with brain context + "Instagram post for upcoming workshop"
5. Agent writes to approval_queue: title, preview, full payload
6. Creator opens queue, sees: "📸 Instagram Post: June Breathwork Circle"
7. Creator taps Approve → post moves to Content Queue
8. (Future: with Composio Instagram connected, Approve → auto-publish)

---

## Reference docs

- `docs/capability-map/creator-capability-map.md` — Universal capability map (lead magnet, tool directory)
- `docs/agent-action-layer-spec.md` — Architecture (triggers, approval queue, progressive trust)
- `docs/create-portal-5-layer-architecture.md` — L1-L5 spec + brain
- `docs/create-portal-next-evolution.md` — Strategic direction
- `docs/create-portal-automation-analysis.md` — Original tree mapping
- `docs/growth-loops-research.md` — Growth loops + AI agent loops research (Jun 26)
- `docs/session-handoff-2026-06-26-growth-loops.md` — Session handoff with all decisions
- `competitor-profiles/silent-sound-system.md` — Competitor #1 profile
- `src/lib/brain/` — Creator Brain implementation
- `supabase/functions/content-generator/` — Content Generator edge function
- `supabase/functions/agent-chat/` — Agent streaming
- `supabase/functions/mcp-server/` — MCP server (6 tools)
