# AI Template System: Pre-Built Templates with Brain Auto-Fill

**Date:** 2026-06-15
**Status:** Scoped. Ready to build when current features are stable.
**Replaces:** ai-draft-checklist-plan.md (that approach parked in favour of this template-first approach)

---

## Concept

Instead of individual "AI Draft" buttons on checklist items, build **pre-built templates** that auto-fill from Creator Brain + experience data. Creators pick a template, the system populates it, they review and activate.

Templates live inside the pipeline nodes they serve, not in a separate page.

---

## Template Library

### 1. Event Bio / Description Template (Attract node)

**What it produces:** Compelling event listing copy (for Eventbrite, Humanitix, Instagram bio, website)
**Auto-fills from:**
- `experience.name`, `experience.experience_date`, `experience.ticket_price`, `experience.venue`
- `experience.one_line_promise`, `experience.value_stack`
- Brain: `identity.essence_archetype`, `identity.rule_break`, `offer.modality`
- Brain: `voice.*` (tone, style)

**Output:** 3 variants (short/medium/long) the creator picks from and edits.

**Where it lives:** Attract node → new "Event Copy" tool, or inline in experience creation flow.

### 2. Pre-Event Sales Email Sequence (Capture node)

**What it produces:** 5-email drip tied to event countdown
**Template structure:**

| Email | Timing | Angle | Auto-fill sources |
|-------|--------|-------|-------------------|
| 1. Announcement | Day -21 | "Something's coming" + early bird | experience.name, date, price, one_line_promise |
| 2. The Problem | Day -14 | Why this matters, the pain it solves | brain: identity.rule_break, identity.problems |
| 3. Social Proof | Day -7 | Testimonials, past results, who's coming | brain: offer.proof_stack, performance.three_percent_chain |
| 4. Urgency | Day -3 | Spots filling, price going up, last chance | experience.ticket_price, capacity, current signups |
| 5. Final Push | Day -1 | "Tomorrow" energy, what to expect | experience.venue, experience.value_stack |

**Auto-fills from:** Experience data + brain (identity, offer, voice, performance)
**Output:** Pre-populated `crm_email_sequence` + 5 `crm_email_steps` in draft status. Creator reviews each email, edits, activates.
**Where it lives:** Capture node → Email Sequence tool, or as a "Fill the Room" template option.

### 3. Post-Event Follow-Up Sequence (Grow node)

**What it produces:** 4-email post-event drip
**Template structure:**

| Email | Timing | Angle | Auto-fill sources |
|-------|--------|-------|-------------------|
| 1. Thank You | Day +1 | Gratitude, highlights, "what you experienced" | experience.name, brain: voice.* |
| 2. Feedback Request | Day +2 | Short survey or "reply with your biggest takeaway" | experience.type (shapes questions) |
| 3. Content Share | Day +5 | Photos, recap, shareable moment | experience.name, brain: voice.origin_story_hook |
| 4. Upsell Invite | Day +7 | Next event or continuity offer, soft sell | brain: offer.continuity_product, offer.core_product |

**Auto-fills from:** Experience data + brain (voice, offer, identity)
**Output:** Pre-populated sequence in draft status.
**Where it lives:** Grow node → follow-up checklist, or auto-prompted when experience marked "completed".

### 4. Affiliate / Referral Outreach Templates (Attract node)

**What it produces:** 3 message templates for asking people to promote the event
**Template variants:**

| Template | Target | Tone |
|----------|--------|------|
| Past Attendee Ask | People who've been to your events | Warm, personal, "you know what this is like" |
| Collaborator Ask | Other creators in adjacent space | Professional, mutual benefit, "let's cross-promote" |
| Super Fan Ask | Top fans (from brain audience.top_fans) | Intimate, "you're one of my people" |

**Auto-fills from:** Experience data + brain (voice, audience.top_fans, identity.north_stars)
**Output:** 3 copy blocks the creator can paste into DMs/emails.
**Where it lives:** Attract node → Warm Outreach tool, or as a new section in the checklist.

### 5. Attraction Offer Templates (Capture node)

**What it produces:** Copy for the attraction strategy they chose in the Attraction Stack flow
**Template variants based on chosen strategy:**

| Strategy (from Attraction Stack) | Template produces |
|----------------------------------|-------------------|
| Early Bird | "Book before [date] for [discount]. Only [N] spots at this price." |
| Bring a Friend | "Bring someone. They get [discount], you get [bonus]." |
| Free Taster Event | Event listing for a free intro session |
| VIP Add-On | Description of the premium upgrade |
| Group Booking | Group pricing copy + booking instructions |

**Auto-fills from:** Experience data + Attraction Stack selections + brain (voice, offer)
**Output:** Copy block per selected strategy, ready to paste into booking page or social.
**Where it lives:** Capture node → Attraction Stack tool (extends existing flow output).

### 6. Social Content Pack (Attract node)

**What it produces:** 5 social posts for the event, each with a different angle
**Template structure:**

| Post | Angle | Content type |
|------|-------|-------------|
| 1. Announcement | "It's happening" + key details | educational |
| 2. Problem/Pain | Why this matters, what's broken | pain_agitation |
| 3. Transformation | What attendees will experience/become | transformation_story |
| 4. Social Proof | Past results, testimonials, who's coming | social_proof |
| 5. Urgency/CTA | Last spots, deadline, direct CTA | offer_teaser |

**Auto-fills from:** Experience data + brain (voice, identity, offer) + contentContext (validation, deals)
**Output:** 5 posts saved to `content_drafts` table, visible in Content Queue for review/scheduling.
**Where it lives:** Attract node → Content Generator tool, as a "Event Content Pack" option.

---

## How auto-fill works

```
Creator taps "Use Template" on Pre-Event Sales Sequence
  │
  ├── getCreatorBrain(userId)           → identity, offer, voice, performance
  ├── getExperience(experienceId)       → name, date, price, venue, type, capacity
  └── fetchVoiceProfile(userId)         → voice profile for tone
  │
  ▼
For each email step in template:
  → Replace tokens: {{experience_name}}, {{date}}, {{price}}, {{venue}}
  → Inject brain context: rule_break, problems, proof_stack, continuity_product
  → Apply voice profile for tone/style
  → Call content-generator edge function per email (or batch)
  │
  ▼
Create crm_email_sequence (status: 'draft')
  + 5 crm_email_steps (each with generated subject + body)
  │
  ▼
Creator lands on Email Sequence editor with all 5 emails pre-filled
  → Reviews, edits each one
  → Activates sequence
```

---

## What already exists (reuse, don't rebuild)

| Component | File | Reuse for |
|-----------|------|-----------|
| Email sequence CRUD | `pages/crm/EmailSequences.jsx` | Template output goes here |
| Email step editing | Same file, modal UI | Creator edits generated emails here |
| Content Generator edge function | `supabase/functions/content-generator/` | Generate email copy per step |
| Prompt templates | `lib/crm/promptTemplates.js` | `nurtureSequence` and `launchSequence` already exist |
| Email sending | `supabase/functions/process-scheduled-emails/` | Sends activated sequences |
| Voice profile | `lib/voiceProfile.js` | Tone/style for generated copy |
| Creator Brain | `lib/brain/brainService.js` | Identity, offer, inner game context |
| Content context | `lib/contentContext.js` | Live data (validation, deals, marketing) |
| Experience data | `hooks/useExperienceData.js` | Name, date, price, type, venue |
| Attraction Stack | `flows/ExperienceAttractionStack.jsx` | Which strategies they chose |
| Content drafts table | `content_drafts` | Social content pack output |

## What needs to be built

| New file | Purpose | Lines (est) |
|----------|---------|-------------|
| `src/lib/experienceTemplates.js` | Template definitions: token structure, email steps, auto-fill mapping per template | ~200 |
| `src/hooks/useTemplateGenerator.js` | Hook: takes template + experience + brain → calls content-generator per step → creates sequence in draft | ~100 |
| `src/components/pipeline/TemplateSelector.jsx` | UI: template cards in pipeline node detail, "Use Template" button, loading state, redirect to sequence editor | ~120 |

**Modified files:**

| File | Change |
|------|--------|
| `PipelineNodeDetail.jsx` | Add TemplateSelector to Attract (capture, grow) node tools section |
| `EmailSequences.jsx` | Handle `?fromTemplate=true` query param to highlight the just-created draft sequence |

**Total: ~420 lines new + ~30 lines modified across 5 files.**

---

## Build order

1. **`experienceTemplates.js`** — Define all 6 templates (token structure, email steps, auto-fill mappings)
2. **`useTemplateGenerator.js`** — Hook that generates and creates draft sequences
3. **`TemplateSelector.jsx`** — UI component for picking templates
4. **Wire into pipeline nodes** — Add TemplateSelector to Attract/Capture/Grow node tools
5. **Test with one template** — Pre-event sales sequence (highest value, most structured)
6. **Add remaining templates** — Post-event, affiliate, social pack, event bio, attraction offers

---

## Priority order (what to build first)

1. **Pre-Event Sales Sequence** — Highest value. 5-email drip tied to countdown. Every creator needs this for every event.
2. **Post-Event Follow-Up Sequence** — Second highest. Auto-prompted when event completes. Captures the window.
3. **Social Content Pack** — 5 posts generated in one click. Uses existing Content Generator.
4. **Event Bio Template** — Quick win. 3 variants of event listing copy.
5. **Affiliate Templates** — 3 message variants for referral asks.
6. **Attraction Offer Templates** — Extends Attraction Stack output with copy per strategy.

---

## Email sending: Gmail via Composio (not Resend)

Emails must come from the creator's own email address, not from a platform address. This rules out Resend (platform-sends). The path is Composio Gmail OAuth per creator.

**How it works:**
1. Creator taps "Connect Gmail" once (Settings or first email template use)
2. Composio Connect Link handles OAuth (white-labeled, creator sees Google's permission screen)
3. Token stored in Composio, linked to their Vibe Rise user ID
4. When a sequence step is due, `process-scheduled-emails` calls Composio Gmail send action instead of Resend
5. Email arrives from `creator@gmail.com`, not `noreply@viberise.com`

**Cost:** $0 for Gmail sending (their own account). Composio tool calls only:
- Free tier: 20K calls/month
- A 5-email sequence to 50 contacts = 250 calls
- Free tier covers ~80 events/month across all creators

**V1 (before Gmail is wired):** Templates output as copy-paste blocks. Creator copies into their own email tool (Mailchimp, Flodesk, Gmail manually). Still valuable because the AI generates the content.

**V2 (after Composio Gmail):** Templates create draft sequences that auto-send from their Gmail on schedule. Full automation.

**Edge function change needed:** `process-scheduled-emails` currently uses Resend. Needs a per-user branching: if user has Composio Gmail connected, use that. Otherwise, fall back to copy-paste output.

---

## Relationship to other plans

- **ai-draft-checklist-plan.md** — Parked. The template approach supersedes individual checklist buttons. Templates are more valuable because they produce complete systems (5-email sequence) not isolated drafts.
- **agent-action-layer-spec.md** — Templates are a stepping stone to agents. The Fill-the-Room agent (future) would auto-select and auto-generate templates based on event countdown. For now, user-triggered.
- **agent-tree-action-map.md** — Templates turn several YELLOW/RED tree nodes GREEN (email sequences, content creation, warm outreach).
- **create-portal-5-layer-architecture.md** — This is L1 (franchise playbook) meeting L2 (brain context). Templates are the playbook. Brain is the context. Together they produce personalised output.

---

## Reference files

- `docs/ai-draft-checklist-plan.md` — Original checklist button plan (parked)
- `docs/agent-action-layer-spec.md` — Agent architecture (future)
- `docs/agent-tree-action-map.md` — Capability map with traffic lights
- `docs/create-portal-5-layer-architecture.md` — 5-layer spec
- `src/lib/emailTemplates.js` — Existing 2 email templates (money model, nervous system)
- `src/lib/crm/promptTemplates.js` — Existing 7 prompt templates
