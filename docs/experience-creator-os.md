# FindMyFlow: The Experience Creator OS

## Vision

FindMyFlow becomes the operating system for experience creators who want to create transformational experiences that produce lasting shifts, not just nice moments.

The platform combines three layers that no competitor offers together:

1. **Shift Architecture** (the methodology): A framework for designing experiences that intentionally create the 3 neurological conditions for memory reconsolidation. Experience creators learn HOW to design reconsolidation containers, not just hold space.

2. **The App** (the execution layer): Removes the admin, generates the marketing, tracks the growth, and turns passive to-do lists into courage challenges with deadlines. The app does 80% of the work so the facilitator only faces the "will I?" not the "how do I?"

3. **The Group** (the accountability layer): Weekly video calls where experienced facilitators set intentions, commit to specific tasks, and are witnessed by peers. The app tracks what they committed to. The group holds them to it.

**The target user**: Not beginners. Experienced facilitators who are confident in their craft but resist the business side. They can facilitate beautifully but hate marketing, forget follow-up, and run each event like it's the first time instead of compounding on the last one.

**Core promise**: "Design experiences that create lasting shifts. Fill the room. Learn from every one. Compound."

---

## What's Already Built

80% of the experience creator OS exists in the current FindMyFlow codebase. It was built for a different audience (business stages 1-7) but the infrastructure directly serves experience creators.

### Ready to Use

| Need | What Exists | Key Files | Status |
|------|------------|-----------|--------|
| **Attendee/Lead CRM** | Full contacts with lifecycle stages (Lead → Opportunity → Customer → Evangelist), outreach status tracking, engagement by source, tags, notes | `src/pages/crm/Contacts.jsx`, `src/lib/crm/dealService.js` | Ready |
| **Email Sequences** | Sequence builder with 5 types (Welcome, Nurture, Launch, Re-engagement, Post-Purchase), step editor, copy-to-clipboard, contact assignment | `src/pages/crm/EmailSequences.jsx`, `src/lib/crm/` | Ready |
| **AI Content Generator** | Trigger-driven content generation with 20+ templates, platform selector, approval workflow, save to library | `src/components/crm/ContentGenerator.jsx`, `src/lib/crm/promptTemplates.js`, `src/lib/crm/contentTriggers.js` | Ready |
| **Analytics Dashboard** | Weekly/monthly performance dashboard, conversion tracking, A-F grading, historical trends, platform breakdown | `src/pages/crm/Analytics.jsx`, `src/pages/crm/Reports.jsx`, `src/lib/crm/analyticsService.js` | Ready |
| **Event Checklists** | Pre-event (marketing 9 items + organisation 12 items) + Post-event (follow-up 6 items + reflection 4 items), customizable, toggleable | `src/lib/experienceChecklistTemplate.js`, `src/hooks/useExperienceData.js` | Ready |
| **Smart Alerts** | Activity-based action recommendations, milestone alerts, performance alerts | `src/pages/crm/SmartAlerts.jsx`, `src/lib/crm/recommendationService.js` | Needs new triggers |
| **Sales/Registration Pipeline** | 10-stage deal tracking with revenue, probability, follow-up scheduling, stale detection, win/loss analytics | `src/pages/crm/Sales.jsx`, `src/lib/crm/dealService.js` | Ready (rename) |
| **Play-List (Courage Engine)** | Groan Matrix with skills x visibility layers, scary/wahoo scoring, 4-step completion flow (reflection, voice check-in, compass, share), 3% improvement | `src/components/PlayListTab.jsx`, `src/components/GroanMatrix.jsx`, `src/components/GroanCompletionModal.jsx` | Ready |
| **Play Profile (DNA Diagnostic)** | 5-slider founder DNA matching, stuck point diagnosis, AI diagnostic conversation, personalized challenge generation with type badges (DO_IT, THINK_IT, MAKE_IT, CUT_IT) | `src/components/PlayProfile/`, `src/lib/founderDnaAI.js`, `src/lib/dnaMatching.js` | Needs adapted stuck points |
| **Experience Blueprint** | 4-step Shift Architecture blueprint: Your Experience, The Encoding, Your Arc (AI pre-fills 6 phases), Save + Create Experience with type dropdown | `src/components/ExperienceBlueprint/ExperienceBlueprint.jsx` | NEW - Just built |
| **Experience Management** | Create, list, detail views for experiences with checklist system, 3% improvement notes carrying forward between experiences | `src/pages/ExperienceCatalog.jsx`, `src/pages/ExperienceCreate.jsx`, `src/pages/ExperienceDetail.jsx` | Ready |
| **Create Tab** | New tab in Challenge portal (renamed from Business), always unlocked, renders ExperienceBlueprint | `src/Challenge.jsx`, `src/hooks/useChallengeData.js` | NEW - Just built |
| **AI Edge Function** | 3 actions for blueprint: suggest_experiences, suggest_encoding, generate_arc. Shift Architecture methodology embedded in prompts. | `supabase/functions/experience-blueprint-ai/index.ts` | NEW - Deployed |

### Database Tables (Already Exist)

| Table | Purpose | Experience Creator Use |
|-------|---------|----------------------|
| `crm_contacts` | Contact management with lifecycle + outreach | Attendee tracking |
| `crm_email_sequences` + `crm_email_steps` | Email automation | Pre/post event sequences |
| `sales_deals` | Pipeline tracking | Registration pipeline |
| `content_history` | Generated content library | Marketing assets |
| `crm_weekly_stats` | Performance metrics | Event-over-event growth |
| `experiences` | Event management | Core experience tracking |
| `experience_checklist_items` | Pre/post event tasks | Checklist system |
| `experience_blueprints` | Shift Architecture design | Blueprint storage (NEW) |
| `nikigai_clusters` | Play-skills (placemakes) | What the creator is good at |
| `groan_challenges` | Courage challenges | Marketing/selling tasks as groans |
| `priority_weekly_picks` | Weekly active challenges | Deadline-tracked commitments |
| `founder_dna_results` | Play Profile DNA | Personalized challenge style |
| `quest_completions` | Progress tracking | Facilitator growth metrics |

---

## The Gaps

### Gap 1: Checklist → Play-List Bridge (Highest Priority)

**Problem**: Checklist items are passive checkboxes. The facilitator checks them off or (more likely) ignores them. There's no urgency, no accountability, no courage involved.

**Solution**: Auto-convert checklist items into Play-List challenges with deadlines, scary/wahoo scores, and Play Profile personalization.

**How it works**:
```
Experience checklist item: "DM 10 warm leads personally with a direct invite"
                    ↓
Auto-generates as Play-List challenge:
  - Title: "Invite 10 people to your [Experience Name]"
  - Deadline: Thursday (set on group call or by user)
  - Scary score: 7 (it's a groan, they resist this)
  - Wahoo score: 8 (it directly fills the room)
  - Completion criteria: "10 DMs sent"
                    ↓
Play Profile personalizes HOW:
  - Firestarter: "Send all 10 today. Speed round."
  - Sage: "Write your perfect invite. Then send 3 per day."
  - Dealmaker: "Call 5, DM 5. Mix the channels."
```

**What needs building**:
- Function to convert a checklist item into a `groan_challenges` row with experience context
- UI button on each checklist item: "Make this a challenge" or auto-convert on experience creation
- Deadline picker (date, or "by next group call")
- Play Profile DNA lookup to personalize the challenge framing
- Link back from challenge completion to checklist item (auto-tick when challenge completed)

**Key files to modify**:
- `src/hooks/useExperienceData.js` (add challenge conversion)
- `src/lib/experienceChecklistTemplate.js` (add scary/wahoo defaults per item)
- `src/components/ExperienceBlueprint/ExperienceBlueprint.jsx` (auto-generate on save)
- `supabase/functions/groan-challenge-generator/index.ts` (accept checklist context)

### Gap 2: Experience-Specific Content Triggers

**Problem**: Content triggers are designed for business stages (low funnel rates, pricing objections). Experience creators need different triggers.

**Solution**: Add experience-specific triggers to `contentTriggers.js`:

| Trigger | When | Content Suggestion |
|---------|------|-------------------|
| "Event 2 weeks out" | Experience date approaching | "3 teaser posts about [experience name]" |
| "Event 48h away" | Day before deadline | "Last chance reminder post/DM" |
| "Low RSVP" | < 5 registrations 1 week before | "DM outreach blitz + urgency post" |
| "Post-event day 1" | 24h after experience | "Thank-you email + feedback request" |
| "Post-event day 3" | 72h after experience | "Testimonial request + highlight reel" |
| "Post-event day 7" | 1 week after | "Next experience announcement" |
| "No testimonials" | 2 weeks after, 0 testimonials | "Personal testimonial request DMs" |

**Key files to modify**:
- `src/lib/crm/contentTriggers.js` (add experience triggers)
- `src/lib/crm/contentRecommendations.js` (add experience-based recommendations)

### Gap 3: Play Profile Adaptation for Experience Creators

**Problem**: Current stuck points are business stages (Validation, Product Creation, Money Models). Experience creators have different blockers.

**Solution**: Add experience creator stuck points to `founderDnaStuckPoints.js`:

| Stuck Point | Blocker | Follow-up Questions |
|-------------|---------|-------------------|
| Experience Design | "I don't know what experience to create" | What lights you up? What have you attended that shifted you? What do people come to you for? |
| Room Filling | "I don't know if anyone would come" | Have you told anyone about it? What's your audience size? What's stopped you from promoting? |
| Pricing | "I don't know what to charge" | What have you charged before? What do similar experiences cost? What feels scary about naming a price? |
| The Date | "I keep postponing" | What's the real fear? What would change if you committed to a date today? What's your perfectionist protecting? |
| Facilitation Depth | "I can facilitate but not at the level I want" | Where do you feel you lose the room? What phase of the arc feels weakest? What feedback have you received? |
| Post-Event | "I never follow up" | What happens after your experiences? Do you collect feedback? Do you have an attendee list? |

**Key files to modify**:
- `src/data/founderDnaStuckPoints.js` (add experience creator stuck points)
- `src/lib/founderDnaAI.js` (adapt diagnostic prompts)

### Gap 4: Facilitator Growth Dashboard

**Problem**: No single view showing the facilitator's growth over time. They can see individual experience checklists but not the compound trajectory.

**Solution**: A dashboard showing:

| Metric | Source | What it Shows |
|--------|--------|--------------|
| Total experiences delivered | `experiences` table (status = completed) | Volume |
| Total attendees | `crm_contacts` tagged by experience | Reach |
| Repeat attendee rate | Contacts appearing in 2+ experiences | Quality signal |
| Average feedback score | Post-event reflection data | Improvement trend |
| 3% improvement chain | `experiences.three_percent_note` linked list | Compounding learning |
| Marketing conversion | Contacts (leads) → Attendees per experience | Business health |
| Play-List challenges completed | `quest_completions` filtered to experience challenges | Accountability score |
| Revenue per experience | `sales_deals` linked to experience | Financial growth |

**Key files to create**:
- `src/components/FacilitatorDashboard.jsx` (new component)
- Could live in the Create tab as a summary above the blueprint

### Gap 5: Group Call Integration

**Problem**: No connection between the weekly group call and the app. Intentions set on calls aren't tracked. Accountability is verbal, not systemic.

**Solution**: A "Set Intentions" flow triggered weekly (or before each group call):

1. "What experience are you working on?" (select from their experiences)
2. "What 2-3 tasks do you commit to this week?" (select from uncompleted checklist items, or write custom)
3. Each commitment auto-creates a Play-List challenge with "next group call" as deadline
4. Next call opens with: app shows green/red on each commitment. No hiding.

**Key files to create**:
- `src/components/WeeklyIntentions.jsx` (intention setting flow)
- Integration with `priority_weekly_picks` table (already used for weekly groan picks)

### Gap 6: Pre-Built Email Templates for Experience Creators

**Problem**: Email sequence builder exists but has no experience-creator-specific templates. The facilitator has to write from scratch.

**Solution**: Pre-built sequence templates:

| Sequence | Emails | Timing |
|----------|--------|--------|
| **Pre-Event Warmup** | 1. "Here's what to expect" (7 days before), 2. "What to bring + how to prepare" (2 days before), 3. "See you tomorrow" (day before) | Auto-triggered from experience date |
| **Post-Event Follow-up** | 1. "Thank you + what happened" (24h after), 2. "Feedback request" (48h), 3. "Testimonial request" (5 days), 4. "Next experience invite" (7 days) | Auto-triggered from experience completion |
| **No-Show Recovery** | 1. "We missed you" (24h after), 2. "Here's what you missed + next date" (3 days) | Manual trigger |
| **Testimonial Request** | 1. "Your words matter" (personal ask), 2. "Quick 3-question form" (3 days later) | Manual trigger |

**Key files to modify**:
- `src/lib/crm/promptTemplates.js` (add experience sequence templates)
- `src/pages/crm/EmailSequences.jsx` (add template picker for experience creators)

---

## Build Sequence

### Phase 1: Checklist → Play-List Bridge (Highest Impact)
This is the single feature that makes everything else work. Without it, the checklist is passive and the group call has no teeth.

### Phase 2: Experience-Specific Content Triggers
Low effort, high value. Add 7 triggers to an existing system. Immediately useful.

### Phase 3: Pre-Built Email Templates
Template content, not new infrastructure. The email system already works.

### Phase 4: Play Profile Adaptation
New stuck points + adapted diagnostic prompts. Moderate effort.

### Phase 5: Facilitator Growth Dashboard
New component, but reads from existing data. Shows compound growth.

### Phase 6: Group Call Integration (Weekly Intentions)
New flow, but uses existing `priority_weekly_picks` infrastructure.

---

## The Flywheel

```
Group call: Set intention + commit to tasks
                    ↓
App: Tasks become Play-List challenges with deadlines
     (personalized by Play Profile DNA)
                    ↓
Week: Facilitator completes challenges (app tracks, group sees)
                    ↓
Experience: Runs the event
            App prompts post-event checklist within 24h
                    ↓
App: 3% note captured
     Attendees added to CRM
     Follow-up email sequence auto-triggered
     Testimonial requests sent
                    ↓
Group call: Debrief. "What worked? What's your 3%?"
            App shows facilitator growth dashboard
                    ↓
App: Next experience auto-inherits 3% note
     Attendee data carries forward
     Marketing improves (testimonials, social proof)
                    ↓
Repeat (each cycle compounds)
```

---

## The Group Product

**"Shift Architecture Collective"** (working name)

- Cohort-based (8-12 experienced facilitators per cohort)
- Weekly 60-90 min video call (intention setting + accountability + debrief)
- FindMyFlow app access with Create tab + CRM
- Shift Architecture methodology (upgrades what they already do)
- Each member compounds their facilitation business over the cohort
- App tracks everything. Group witnesses everything.

**Value the app creates for group members**:
- Blueprint designs their experience using Shift Architecture
- Checklist items become courage challenges with deadlines
- Play Profile personalizes HOW they execute (Firestarter vs Sage)
- CRM tracks attendees, follow-ups, testimonials
- Content generator creates marketing from their blueprint
- Analytics show growth over time
- 3% improvement compounds between experiences
- Email sequences automate the follow-up they always skip

**Value the group creates that the app can't**:
- Accountability to do the unsexy work (group witnesses, app tracks)
- Cross-promotion between members
- Warm referrals (attendees recommended to other members)
- Real answers to "what worked for your marketing?"
- Witnessing each other's growth (itself a mismatch experience)

**What only Huzz provides**:
- Live facilitation coaching (watch, give feedback)
- Script review (read their run-sheet, spot weak points)
- The "what to do when it goes wrong" playbook (dissociation, protector, flooding)
- Venue introductions + Healing But Fun festival platform

---

*This document is the strategic roadmap for FindMyFlow's pivot to experience creator OS.*
*Method reference: `docs/subconscious-shift-method.md`*
*Application template: `docs/experience-application-template.md`*
*Blueprint component: `src/components/ExperienceBlueprint/ExperienceBlueprint.jsx`*
*AI edge function: `supabase/functions/experience-blueprint-ai/index.ts`*
