# Session Handoff: June 8-15, 2026

## What was built this session

### 1. Creator Brain (L2 Context Engine)

Unified context engine that captures everything about a creator across 6 domains (93 fields). Ported architecture from claude-portal's Business Brain, adapted for experience creators.

**Files:**
- `src/lib/brain/canonicalFields.js` — 93 field definitions across 6 domains (identity, offer, audience, voice, inner_game, performance)
- `src/lib/brain/mergeBrain.js` — Confidence-based merge logic (sticky confirmed, confidence > recency > source priority, conflict tracking)
- `src/lib/brain/regenerateMarkdown.js` — JSONB sidecar → markdown for AI prompt injection
- `src/lib/brain/brainService.js` — `getCreatorBrain(userId)`, `updateBrainFields(userId, fields)`, `confirmBrainField`, `skipBrainField`, `getBrainStats`
- `src/lib/brain/autoPopulate.js` — 12 flow completion hooks (7 wired, 5 defined but unwired)
- `src/lib/brain/index.js` — Clean re-exports
- `supabase/migrations/20260608000000_creator_brain.sql` — Table + RLS + auto-timestamp trigger
- `scripts/backfill-creator-brain.js` — One-time backfill script

**Status:** Migration applied. 46 brains backfilled (yours has 27 fields). Auto-populate hooks wired into 7 flows: ScopeMap, EssenceMirror, ExperienceCreatorMatching, PlayProfile, RemarkableFlow, NervousSystem, PayRent.

**Verified via console:**
```javascript
const { getCreatorBrain, getBrainStats } = await import('/src/lib/brain/index.js')
const brain = await getCreatorBrain('ebe69854-2ebd-4236-a437-3a362f5e1af4')
// Fields: 27, Context: renders readable markdown, Stats: 27 proposed, 0 confirmed, 66 empty
```

### 2. Attraction Stack UI fixes

- Added intro screen (icon, title, 3-step explainer, "Let's go" CTA)
- Removed top-left back button, added bottom-centered back on every screen
- Added price question (Q2 of 3) that pre-fills from experience data and saves back to `experiences.ticket_price`
- Moved from Capture node to Attract node in pipeline
- Hidden bottom toolbar during flow

**Files modified:**
- `src/flows/ExperienceAttractionStack.jsx`
- `src/flows/ExperienceAttractionStack.css`
- `src/components/pipeline/PipelineNodeDetail.jsx` (moved attraction_offer from capture to attract modules)

### 3. Template System (Event Page Copy)

AI-powered template generation inside pipeline nodes. First template: Event Page Copy (short/medium/long variants). Infrastructure built for all future templates.

**Files:**
- `src/lib/experienceTemplates.js` — Event Page template (3 items) + 5 stub entries for future templates
- `src/hooks/useTemplateGenerator.js` — Parallel brain + experience + voice fetch, parallel content generation
- `src/components/pipeline/TemplateSelector.jsx` — Template cards, generation progress, copy blocks with copy button + voice rating
- `src/components/pipeline/PipelineNodeDetail.jsx` — TemplateSelector wired in between Tools and Checklist
- `src/components/pipeline/pipeline.css` — Template card, copy block, voice rating, progress styles

---

## Test checklist

### Creator Brain
- [ ] Run a flow (Scope Map is fastest) and verify brain updates: open console on dev server, run `const { getCreatorBrain } = await import('/src/lib/brain/index.js'); const b = await getCreatorBrain('YOUR_USER_ID'); console.log(Object.keys(b.facts).length)` — field count should increase
- [ ] Verify new field has `source_identifier` matching the flow name (not "backfill")
- [ ] Retake a flow with different answer — verify merge logic (proposed replaces proposed with higher confidence)

### Attraction Stack
- [ ] Navigate to an experience pipeline → Attract node → tap "Attraction Stack" module
- [ ] Intro screen appears with 3-step explainer and "Let's go" CTA
- [ ] Bottom toolbar is hidden
- [ ] Q1: Capacity (4 options) — back button goes to intro
- [ ] Q2: Price — pre-fills if experience already has a price. Shows "Continue with $X" or "Continue as free event"
- [ ] Q3: Community leaders (3 options)
- [ ] Results: strategies recommended based on answers + price. Price-dependent strategies (Early Bird, Group Booking, Giveaway) only recommended if price > 0
- [ ] Toggle strategies on/off → Save → checklist items created → redirects back
- [ ] Price saved to `experiences.ticket_price` (check in Supabase)

### Template System
- [ ] Open experience pipeline → Attract node → see "Templates" section below Tools
- [ ] "Event Page Copy" card visible with Generate button
- [ ] Tap Generate → spinner with "Loading context..." then "Generating 0 of 3..."
- [ ] 3 copy blocks appear: Short (one-liner), Medium (event listing), Long (sales page)
- [ ] Copy references experience name and date
- [ ] Copy button works (clipboard)
- [ ] Voice rating: "Sounds like me" / "Doesn't sound like me" — tapping highlights and disables both
- [ ] Regenerate button produces fresh copy
- [ ] "← Templates" returns to card view
- [ ] Capture, Convert, Deliver, Grow nodes show NO templates section (stubs filtered out)
- [ ] If content-generator edge function is down, shows "Failed to generate" per block gracefully

---

## Strategic vision (docs written this session)

### docs/create-portal-5-layer-architecture.md
Full 5-layer spec for the /create portal:
- L1 Franchise Playbook (85% built) — experience creator workflows, frameworks, templates
- L2 Context Engine (60% built, brain now exists) — unified creator profile with inner game
- L3 Autonomous Ops (15% built) — agents that create assets + track execution
- L4 Build Layer (5%) — AI builds custom tools (landing pages, booking, portals)
- L5 Platform/Ecosystem (10%) — playbook marketplace, data flywheel

The Creator Brain is the L2 foundation. Everything above it reads from it.

### docs/create-portal-next-evolution.md
Two pillars for the next phase:
1. **Customer acquisition as a game** — Fill Score (0-100%), daily "plays", RP for marketing actions, event countdown milestones
2. **Agents that do the work** — Content Agent, Follow-up Agent, Metrics Agent, Fill-the-Room Agent, Post-Event Agent, Re-engagement Agent

### docs/agent-action-layer-spec.md
Architecture for agent actions:
- Triggers (event countdown, daily cron, CRM state changes, user-initiated)
- Agent Actions API (draft_social_post, draft_email, pull_instagram_metrics, etc.)
- Approval Queue table design (`approval_queue` with status lifecycle)
- Progressive Trust model (per-agent, per-creator: Level 1 approve all → Level 3 autonomous)

### docs/agent-tree-action-map.md
Every capability from the tree.html mapped to a specific agent action with traffic light:
- 14 GREEN (agent can act now with brain + existing edge functions)
- 9 YELLOW (needs one Composio OAuth connection)
- 11 RED (needs new development)

Key decision: agents live inside pipeline nodes, not a separate portal. No agent framework needed. JS decision logic → Claude content generation → approval queue → Composio execution.

### docs/ai-template-system-plan.md
Template system plan (what we started building):
- 6 template types: Event Page, Pre-Event Sales, Post-Event Follow-Up, Social Content Pack, Affiliate Outreach, Attraction Offer Copy
- Auto-fill from Creator Brain + experience data
- Email templates send via Composio Gmail (creator's own email, not platform)
- V1 output: copy-paste blocks. V2: draft email sequences with auto-send.

### docs/creator-brain-gaps-from-claude-portal.md
What claude-portal captured that creator brain doesn't yet. Priority fields for future: upsell/downsell products, time_to_result, top_objections, buying_triggers, competitors domain.

### docs/create-portal-automation-analysis.md
Tree.html "Make More Money" + "Save More Time" mapped against /create. 21 of 42 capabilities already built, 13 more automatable.

---

## Key architectural decisions made

1. **Brain augments contentContext.js, doesn't replace it.** contentContext has live data (recent deals, engagement scoring, objection extraction) the brain can't snapshot. Brain adds inner game + identity that contentContext doesn't have. Both feed the Content Generator.

2. **Templates before agents.** Templates deliver value immediately (user-triggered, copy-paste). Agents come later to auto-select and auto-generate templates based on event countdown.

3. **Gmail via Composio, not Resend.** Emails must come from the creator's own address. Composio Gmail OAuth per creator. Free tier covers ~80 events/month. V1: copy-paste. V2: auto-send.

4. **Agents in pipeline nodes, not separate portal.** LLM Council validated this. Agents surface as badges/actions inside existing pipeline UX. No new mental model.

5. **Start with 1 template, prove the system.** Event Page Copy is the first. Others are stubs. Adding a new template is just adding an entry to `experienceTemplates.js`.

---

## What's next (not built yet)

1. **Test everything above** — Brain hooks on flow completion, Attraction Stack price flow, Template generation
2. **Real template examples** — Huzz will share real email/post examples to replace generic copy
3. **More templates** — Pre-Event Sales Sequence and Social Content Pack are next highest value
4. **Wire brain into Zarlo** — Inject brain context into Zarlo's system prompt for smarter AI co-founder
5. **Wire brain into Content Generator** — Add brain inner game context alongside existing contentContext
6. **5 unwired brain hooks** — onCreatorAssessmentComplete, onLifeMapComplete, onWoundMapComplete, onBeliefRewireComplete, onJourneyLevelChange
