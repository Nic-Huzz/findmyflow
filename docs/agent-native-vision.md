# Agent-Native FindMyFlow — Vision Document

**Date**: 2026-02-18
**Status**: Phase 1 complete — llms-full.txt live with all 6 Money Model flows

---

## Mission

Help professionals (25-35) with deep domain knowledge gain the confidence and clarity to build their own business and products, achieving the financial security to leave their jobs.

This mission does not change. The delivery mechanism does.

---

## The Shift

SaaS as a model will be replaced by AI agents connecting with other AI agents and tools. Users will increasingly delegate complex decision-making to their agents: "figure out my offer strategy", "what should I build first?", "complete as much of this as possible."

FindMyFlow must survive this transition by making its value accessible to agents, not just humans clicking through a UI. This is a proactive preparation — building for the inevitable, not reacting to it.

---

## FindMyFlow's Two-Sided Value

### 1. Action Engine (the methodology)

Frameworks that identify the specific next action for a desired outcome:

- **Nikigai Framework** — Skills x Problems x Persona = unique flow
- **Hormozi Offer Scoring** — 10-question assessments that match business characteristics to optimal offer strategies (Attraction, Upsell, Downsell, Continuity, Leads, Lead Magnet)
- **10-Stage System** — Progressive project stages from discovery (Stage 0) through launch (Stage 7) to tracking (Stage 8)
- **Protective Voice Patterns** — The 5 patterns that keep people stuck (Perfectionist, Pleaser, Controller, Achiever, Avoider) and the 4 R's to work through them
- **Groan Matrix** — Courage challenges across visibility layers that build confidence through action

The methodology is the intellectual framework that tells any agent HOW to guide someone through career and business clarity. It answers: "Given where this person is, what is the ONE thing they should do next?"

### 2. Context Vault (the personalized data)

The richest source of truth about a user's business journey:

- Completed assessments with scored results and reasoning
- Skills, problems, and personas discovered through Flow Finder
- Archetype profiles (essence and protective)
- Stage progression across projects
- Groan zone data (comfort zone, essence zone, courage challenges)
- Nervous system edges and safety contracts
- Weekly planning patterns and energy tracking
- CRM data (contacts, deals, content history)

Gets smarter as the user progresses. An agent with access to this vault can give deeply personalized advice that a generic AI cannot.

---

## Business Model: Open Methodology, Paid Depth

### Free: The Methodology

The framework knowledge is open and public. Any agent can read it, learn it, use it to guide users. This is the marketing engine operating at agent-scale.

- `llms-full.txt` — comprehensive agent-readable guide to all frameworks, questions, scoring logic, and action recommendations
- Any AI can discover and use it — ChatGPT, Claude, custom agents, future platforms
- Zero friction. No auth needed to learn the methodology.

An agent tells a 28-year-old marketing manager: *"I found this career clarity methodology that could help you figure out your offer. Want me to walk you through it?"* That is organic growth at agent-scale.

### Paid: The Personalized Depth

The data vault and guided progression require a FindMyFlow account:

- Saving scored results to the user's profile
- Tracking stage progression across sessions
- Cross-flow recommendations ("based on your Attraction Offer result and your skills profile, your next best action is...")
- Accumulating context that makes every interaction smarter
- The web app experience for users who want the human UI

This mirrors proven playbooks:
- **Stripe**: Docs are free. Processing payments costs money.
- **Supabase**: Open source core. Hosted service is the product.
- **Anthropic**: Research is public. API access costs money.

---

## Three User Paths

### Path 1: Solopreneur with AI Assistant

Someone already using Claude/ChatGPT daily for their business. They mention wanting to figure out their offer strategy or next business move. Their agent has read FindMyFlow's methodology and can guide them through the frameworks conversationally. If the user has a FindMyFlow account, results are saved and build on each other over time.

### Path 2: Coach/Consultant Scaling Up

Actively building their business. Wants their AI agent to do the strategic analysis — evaluate their business model against Hormozi's offer frameworks, recommend offer structures, plan their funnel. The agent uses FindMyFlow as the methodology engine and returns actionable recommendations with reasoning.

### Path 3: FindMyFlow Web User with Agent

Signs up to FindMyFlow through the web app, sees the flows and challenges, and tells their agent: "complete as much of this as possible." The agent navigates the business flows as a proxy — answering questions based on what it knows, asking the user only when genuinely stuck, and saving results that appear in the web UI.

---

## Implementation Phases

### Phase 1: The Guide's Brain (`llms-full.txt`)

Create a comprehensive, structured text file containing everything an agent needs to guide a user through the business methodology:

- All 6 Money Model flow questions with options
- Scoring logic explained in plain English (what each answer means, how it affects recommendations)
- Agent context per question ("why this matters", "what good answers look like", "scoring implications")
- Action recommendations per result ("if Win Your Money Back is recommended, here's what to do next...")
- The 10-stage system with progression logic
- Framework explanations (Nikigai, Hormozi, Protective Voices)

**Why first**: Works immediately with any AI. No infrastructure needed. Forces the hard thinking about how to explain the methodology to agents. Becomes the foundation everything else builds on.

### Phase 2: Save Results Back (one Edge Function)

A single Supabase Edge Function (`agent-submit`) that:

- Accepts a user's API key + flow answers + agent reasoning
- Validates auth
- Runs the scoring engine (extracted from client-side React)
- Stores results in existing Supabase tables
- Returns scored results with recommendations

Users generate an API key in their FindMyFlow profile. Results appear in the web app immediately — same tables, same UI, as if they'd completed the flow themselves.

### Phase 3: MCP Wrapper (when ecosystem matures)

Thin MCP layer over Phase 2's endpoint:

- Hosted MCP server via Supabase Edge Functions (Streamable HTTP transport)
- Rich tool descriptions with methodology context
- Preflight checking ("what do I need to know to complete this flow?")
- Profile and results retrieval tools
- Works with Claude Code, Claude Desktop, and any MCP-compatible agent

Build this when there is user demand and the remote MCP ecosystem has stabilized.

---

## MVP Scope (Phase 1)

Six Money Model flows — these are the perfect starting point because:

1. **Already JSON-driven** — questions, scoring weights, and offer definitions all live in config files
2. **Structured multiple-choice answers** — an agent can reliably select from predefined options
3. **Transparent scoring** — explicit weights per answer in `offers.json`
4. **Immediately actionable** — results tell users exactly what offer to build and how

Flows:
- Attraction Offer Assessment
- Upsell Offer Assessment
- Downsell Offer Assessment
- Continuity Offer Assessment
- Leads Strategy Assessment
- Lead Magnet Assessment

### Future Extension

- **Flow Finder** (Skills, Problems, Persona) — requires handling free-text + AI clustering
- **Offer Builder** — structured but more complex multi-step flow
- **Funnel Calculator** — metrics tracking and projection
- **Stages 1-7 progression** — sequential stage flows
- **Healing/Nervous System** — longest horizon, deeply subjective + somatic

---

## What's Been Built (Phase 1)

### Commits

| Commit | Description |
|--------|-------------|
| `8282e64` | Generator script (`scripts/generate-llms-full.js`) + `npm run generate:llms` command |
| `c476844` | Hand-authored agent context for all 6 Money Model flows |
| `b48f756` | Bug fixes, attribution instructions, discoverability, regenerated output |

### Deliverables

**`public/llms-full.txt`** (174KB, 2,252 lines)
Auto-generated comprehensive agent guide containing:
- Framework overview with attribution instructions
- All 6 Money Model flows with:
  - 10 questions each with options, agent context, and if-unknown hints
  - Full scoring matrix (auto-generated table from offers.json)
  - Hard disqualifiers per outcome
  - Possible outcomes with best_for, tell_the_user, and implementation actions
- Comprehensive agent guidance footer (assessment order, cross-flow intelligence, red flags)

**`scripts/generate-llms-full.js`** (Node.js ES module)
Reads the same JSON files the web app uses (questions, offers, checklists) and merges them with hand-authored agent context to produce llms-full.txt. Keeps the generated output permanently in sync with the app's actual scoring data.

**`public/agent-context/`** directory structure:
```
public/agent-context/
├── framework-overview.md      # Header bookend (attribution, scoring algorithm, Money Model table)
├── guidance.md                # Footer bookend (assessment order, cross-flow intel, red flags)
└── flows/
    ├── attraction-offer.json  # 10 questions with agent_context + if_unknown, 6 outcomes
    ├── upsell.json
    ├── downsell.json
    ├── continuity.json
    ├── leads-strategy.json
    └── lead-magnet.json
```

**Discoverability**
- `public/robots.txt` — AI crawler directives (ChatGPT-User, ClaudeBot, GPTBot, Anthropic-AI)
- `public/sitemap.xml` — llms.txt and llms-full.txt entries
- `public/llms.txt` — concise platform overview (the "table of contents")

### Bugs Found and Fixed

| Bug | Impact | Fix |
|-----|--------|-----|
| Stale key `price_sensitive` in Attraction offers.json | Flagship Giveaway silently dropped +1 point for Q6 "Leads are price sensitive" | Changed to `leads_are_price_sensitive` to match question option values |
| Generator crashed on object-format agent context | Leads Strategy and Lead Magnet context was silently skipped | Added Array.isArray check with Object.entries fallback for `context.questions` |
| `when_to_use` iterated character-by-character | String fields rendered as individual characters ("W", "h", "e", "n"...) | Added string vs array type check |
| Outcome context not merged into output | `best_for` and `tell_the_user` from agent context never appeared | Added context parameter to `generateOutcomes()` with outcome lookup |
| All implementation actions numbered "1." | Every action showed as `1.` instead of sequential | Used `entries()` for `${i + 1}.` numbering |

### Verified Safe

- **Zero runtime impact**: None of the agent-native files are imported by any React component, hook, or lib file
- **Generator is build-time only**: `scripts/generate-llms-full.js` runs via `npm run generate:llms`, not included in Vite bundle
- **Scoring key fix improves the app**: The `price_sensitive` → `leads_are_price_sensitive` change fixes a latent bug in the live Attraction Offer scoring — all 5 other offers already used the correct key
- **robots.txt only adds Allow directives**: Existing crawlers unaffected
- **sitemap.xml is valid XML**: Just adds 2 new entries

### How to Regenerate

```bash
npm run generate:llms
# Output: public/llms-full.txt (174KB)
```

Run this whenever question files, offer configs, or agent context files change.

---

## What's Next (Phase 2)

Phase 2 enables agents to **save results back** to a user's FindMyFlow account programmatically. Results appear in the web app as if the user completed the flow themselves.

| Task | Description | Status |
|------|-------------|--------|
| 5 | Extract scoring engine from MoneyModelFlowBase.jsx to `src/lib/scoring.js` | Not started |
| 6 | DB migration: `agent_api_keys` table + `agent_reasoning`/`submitted_via` columns | Not started |
| 7 | `agent-submit` Edge Function (validates API key, runs scoring, stores results) | Not started |
| 8 | Profile page UI for API key generation (create, list, revoke) | Not started |

Full implementation plan: `docs/plans/2026-02-18-agent-native-implementation.md`

### Phase 3: MCP Wrapper (Future)

Thin MCP layer over Phase 2's endpoint for native agent integration:
- Hosted MCP server via Supabase Edge Functions (Streamable HTTP transport)
- Rich tool descriptions with methodology context
- Profile and results retrieval tools
- Works with Claude Code, Claude Desktop, and any MCP-compatible agent

Build when user demand exists and the remote MCP ecosystem has stabilized.

---

## Success Criteria

### 6-Month Markers

1. **Agents completing flows** — measurable number of assessments completed via agent (not web UI). Proof that agents are navigating the methodology and delivering results.

2. **External agents connecting** — other AI tools/platforms discovering and integrating with FindMyFlow. The methodology spreading beyond our own UI.

3. **User outcomes improving** — users with agent access reach clarity faster, complete more stages, and take more action than UI-only users. The agent path is genuinely better.

4. **Mission impact** — more 25-35 year old professionals taking the leap from employment to building their own business with confidence.

---

## Key Principles

- **Knowledge before infrastructure** — the methodology content is the product. Build the guide's brain before the fancy door.
- **Open attracts, depth retains** — free methodology for discovery, paid personalization for value.
- **Agent-first, not agent-only** — the web app remains the premium human experience. Agent access is an additional path, not a replacement.
- **Progressive intelligence** — the more a user engages (via any path), the smarter their context vault becomes, the better the recommendations get.
- **Transparency** — when an agent completes a flow, it stores its reasoning. The user can always see WHY their agent chose each answer.
