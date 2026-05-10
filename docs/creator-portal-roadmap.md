# Creator Portal Roadmap

> FindMyFlow as the operating system for experience creators.
> The `/create` portal helps people who've built Vibe Rise capacity turn that into a business serving others.

**Required reading:** `docs/vibe-rise-ecosystem-architecture.md`

---

## The Natural Flywheel

```
/7-day-challenge (build capacity)
    → Levels 1-8 (self-knowledge + action)
        → "I want to share this" (natural graduation)
            → /create portal (build your experience business)
                → Run events (using Shift Architecture)
                    → Attendees discover FMF
                        → /7-day-challenge (cycle repeats)
```

This is the movement growth engine. Every experience creator trained through `/create` produces attendees who enter `/7-day-challenge`. No paid acquisition needed. The product IS the distribution.

---

## Phase 1: Guided Creator Journey (Wire Existing CRM)

### The Problem With Showing Everything

The CRM has 15+ features already built. Dumping them all into `/create` would overwhelm creators who just want to fill their next event. The solution is **progressive unlocking tied to the experience lifecycle**.

A creator's life revolves around one repeating cycle:

```
DESIGN → FILL → RUN → REFLECT → REPEAT
```

Each phase has exactly 1-3 tools. Nothing appears until the creator reaches that phase. The portal feels simple because it only shows what's relevant RIGHT NOW.

### The Experience Lifecycle Map

#### 1. DESIGN (Before you have an experience)

**When:** Creator has just arrived at `/create`, completed their creator type selection, maybe done Pay Rent / Remarkable / Scale Income flows.

**What they need:** Design their first experience with confidence.

| Tool | Location | What it does | Status |
|------|----------|-------------|--------|
| **Experience Creator** | `/create/experience/new` | Create the experience: name, date, price, type, description | **DONE** |
| **Experience Checklist** | ExperienceDetail Pre/Post tabs | Step-by-step prep checklist seeded from 7 experience types | **DONE** |
| **Scale Income Card** | Details tab, `ScaleIncomeCard.jsx` | Shows business model from `creator_assessments` (attraction/core/continuity). Auto-detects which layer this experience is. Toggle: "Will you pitch your next offer at this event?" | **DONE** |
| **Upsell Designer** | Details tab, `UpsellDesigner.jsx` | 2 questions → recommends Classic/Menu/Anchor/Rollover strategy with concrete examples using experience type + ticket price. Saves to `experiences.upsell_strategy` | **DONE** |
| **Downsell Designer** | Details tab, `DownsellDesigner.jsx` | 2 questions → recommends Payment Plan/Trial With Penalty/Feature Downsell strategy with concrete examples. Saves to `experiences.downsell_strategy` | **DONE** |
| **Shift Scorecard** | `/shift-scorecard` (public) | Self-audit for experience design quality. Deferred to REFLECT phase (v2) | v2 |

**Unlock trigger:** Completing creator type selection (scope map + experience creator matching)

**Gate conditions:** Upsell/Downsell flows only visible if `ticket_price > 0`. Scale Income card only visible if `creator_assessments` has data.

**What stays hidden:** Everything else. No contacts, no email, no analytics. They don't have an experience yet.

**Upsell recommendation logic (2 questions, 3 rules):**
1. Q2=Ascension → **Rollover** (unless Q1=VIP tier, then **Anchor**)
2. Q1=VIP tier + Q2=Revenue → **Menu**
3. Everything else → **Classic**

**Downsell recommendation logic (2 questions, 4 rules):**
1. Q1=Logistics → always **Feature Downsell**
2. Q2=Taster, or Q1=Trust + Q2=Payment → **Trial With Penalty**
3. Q2=Payment plan → **Payment Plan**
4. Everything else → **Feature Downsell**

---

#### 2. FILL (You have an experience designed, now get people there)

**When:** Experience is created with a date set. Now they need attendees.

**What they need:** Find and invite the right people, reach out to them personally.

| Tool | Location | What it does | Status |
|------|----------|-------------|--------|
| **Guestlist** | Pre tab, `GuestlistPicker.jsx` | Select contacts to invite, quick-add new people. Count: "4 people invited" | **DONE** |
| **DM Tracker** | Pre tab, `DMTracker.jsx` | Tick off who you've reached out to. Progress ring: "7/10 contacted". Auto-refreshes when guestlist changes | **DONE** |
| **Content Generator** | ContentGenerator (exists in CRM) | AI social posts promoting the experience | v2 |
| **Warm Outreach** | WarmOutreach (exists in CRM) | Filtered contact view with prompt generator | v2 |

**What stays hidden:** Sales pipeline, email sequences, analytics, ascension engine.

---

#### 3. RUN (The experience is happening or just happened)

**When:** Experience date is today or just passed.

**What they need:** Capture who came, log revenue, reflect.

| Tool | Location | What it does | Status |
|------|----------|-------------|--------|
| **Attendance Marker** | Post tab, `AttendanceMarker.jsx` | Toggle attended/no-show from guestlist. Walk-in quick-add. Shows attendance rate % + "vs last" comparison badge. | **DONE** |
| **Revenue Logger** | Post tab, `RevenueLogger.jsx` | Manual input with "vs last" comparison badge. Saves to `experiences.total_revenue`. Screenshot extraction deferred to v2. | **DONE** |
| **3% Chain** | Post tab reflection checklist (exists) | "What's the one thing you'd do 3% better next time?" | **DONE** |
| **Attendee Upload** | Post tab, AttendeeUpload (exists) | Screenshot AI extraction for bulk contact import (legacy, kept as option) | **DONE** |

**DB changes:** `experiences.total_revenue`, `experiences.revenue_notes`, `experience_attendees.attended` columns added via migration `20260510000000_revenue_and_attendance.sql`

**What stays hidden:** Analytics dashboard (need 2+ events). Ascension engine.

---

#### 4. REFLECT (After the experience, before the next one)

**When:** Experience is complete, attendees captured, revenue logged.

**What they need:** Understand what worked, nurture relationships, plan the next one.

| Tool | Location | What it does | Status |
|------|----------|-------------|--------|
| **"vs last" badges** | AttendanceMarker + RevenueLogger headers | "+3 vs last" / "+15% vs last" comparison from `previous_experience_id` | **DONE** |
| **Reflection checklist** | Post tab (exists) | Wahoo moments, drains, 3% improvement, archive | **DONE** |
| **Follow-up checklist** | Post tab (exists) | Thank you email, feedback request, upsell invite, testimonials, photos | **DONE** |
| **"How'd It Go?" summary** | Deferred | Full summary card with repeat attendees, revenue per person. Data already surfaced in component headers. | v2 |
| **Post-Event Email** | Email Sequences (exists in CRM) | Pre-built "thank you + what's next" sequence | v2 |
| **Content Generator** | ContentGenerator (exists in CRM) | AI social posts from event highlights | v2 |

**Decision:** Full "How'd It Go?" summary card deferred. The "vs last" badges on AttendanceMarker and RevenueLogger headers surface the same data inline. Repeat attendee identification and analytics dashboard are v2.

---

#### 5. SCALE (After 3+ experiences completed)

**When:** Creator has run multiple experiences and is ready to grow.

**What they need:** Systematic growth tools, value ladder, pricing optimization.

| Tool | Location | What it does | Status |
|------|----------|-------------|--------|
| **Sales Pipeline** | Growth tab (rewire from CRM) | Deal tracking for high-ticket offers. Product types pulled from `creator_assessments` (attraction/core/continuity) instead of generic defaults | v1 priority |
| **Ascension tagging** | Post tab or Growth tab | Tag attendees as interested in each Scale Income layer (attraction/core/continuity). Feeds into Sales Pipeline. | v1 priority |
| **Ascension Engine** | Growth tab (rewire from CRM) | Visualize attendee journey through value ladder | v2 |
| **PTUF Calculator** | Growth tab (rewire from CRM) | "What should I charge to hit my income goal?" | v2 |
| **LTV Calculator** | Growth tab (rewire from CRM) | "What's each attendee worth across my full offer stack?" | v2 |
| **Business Systems** | Growth tab (rewire from CRM) | Setup checklist: DNS, email, landing pages, payment processing | v2 |

**Unlock trigger:** 3+ experiences completed

**Key integration:** Sales Pipeline product types = Scale Income choices from `creator_assessments`. When a creator creates a deal, the product dropdown shows THEIR offers ("Free Breathwork Circle" / "Full Day Retreat" / "Monthly Membership") not generic CRM defaults.

**Copy framing:**
- NOT: "Ascension Engine" → YES: "Your Growth Path"
- NOT: "Sales Pipeline" → YES: "High-Ticket Deals"
- NOT: "Business Systems Checklist" → YES: "Get Set Up Properly"

---

### What This Looks Like In The UI

The CreatorHomeV2 currently has 3 tabs: **Identity, Experiences, Growth**.

Proposed restructure to match the lifecycle:

| Tab | Shows | Unlocks when |
|-----|-------|-------------|
| **Identity** | Creator Card, archetype, DNA match (unchanged) | Always |
| **My Experience** | Current/next experience + relevant phase tools | Experience created |
| **My People** | Contacts, outreach, email (progressively revealed) | Experience created |
| **Growth** | Analytics, ascension, calculators, systems | 3+ experiences completed |

The key insight: **"My Experience" tab changes its tools based on which lifecycle phase the creator is in.** Designing? Show checklist + scorecard. Filling? Show content generator + outreach. Running? Show attendee capture. Reflecting? Show analytics + follow-up.

### Navigation Copy Map

| CRM Internal Name | Creator-Facing Name | Icon |
|---|---|---|
| Contacts | Your People | 👥 |
| Warm Outreach | Fill Your Room | 🎯 |
| Content Generator | Spread the Word | ✨ |
| Email Sequences | Stay Connected | 💌 |
| Sales Pipeline | High-Ticket Deals | 💰 |
| Reports/Analytics | How'd It Go? | 📊 |
| Ascension Engine | Your Growth Path | 🚀 |
| PTUF Calculator | Price It Right | 🧮 |
| Business Systems | Get Set Up | ⚙️ |
| Shift Scorecard | Rate Your Design | 🎯 |

---

## Phase 2: Experience-Specific Features (Build New)

| Feature | What it does | Priority | Effort |
|---|---|---|---|
| **Post-Event Feedback** | Attendee survey: NS state before/after, testimonial capture, NPS | High | Medium |
| **Revenue Tracking** | Log actual income per experience (currently $0 placeholder) | High | Small |
| **Attendee NS Tracking** | Aggregate: "Your events produce X% Vibe Rise shifts" | Medium | Medium |
| **Shift Scorecard (private)** | Rate your own experience against Shift Architecture | Medium | Small |
| **Repeat Attendee Insights** | Who keeps coming back, optimal upsell timing | Medium | Medium |

---

## Phase 3: Plug In External Tools (Don't Build)

| Need | Plug in | Why not build | Integration effort |
|---|---|---|---|
| **Booking/scheduling** | Cal.com (open source, embeddable) | Solved problem, free tier | Embed iframe |
| **Event ticketing** | Eventbrite API or Luma | Payments, refunds, waitlists | API or link out |
| **Email sending** | Resend (already integrated) | Wire existing sequences to send | Small |
| **Landing pages** | Carrd / Typedream / creator's site | Visual builders are a rabbit hole | Link out |
| **Payments** | Stripe (already integrated) | Extend beyond app subscription | Medium |
| **Community** | Circle, Discord, WhatsApp | Don't build social infrastructure | Link out |
| **Video hosting** | YouTube unlisted / Vimeo | Storage + streaming is expensive | Link out |

---

## Phase 4: Moat Features (Post-Traction)

| Feature | What it does | Why it's a moat |
|---|---|---|
| **Facilitator Certification** | Train others in Vibe Rise Method | Network effect, revenue multiplication |
| **White-label Shift Scorecard** | Creators embed YOUR audit on THEIR site | Distribution + brand awareness |
| **Silent Disco Rental Integration** | Book headsets through the portal | Physical product lock-in |
| **Attendee App** | Participants get FMF as daily practice tool | Every event creates new /7-day-challenge users |
| **Creator Marketplace** | Browse certified facilitators by location | Network effect |
| **Aggregate NS Data** | "Creator X produces 34% more Vibe Rise shifts than average" | Proof engine no competitor can replicate |

---

## What GHL Does That We Don't Need

| GHL Feature | Why we skip it |
|---|---|
| Website builder | Creators already have sites or use Carrd/Typedream |
| AI chatbot for lead qual | Zarlo is coaching, not lead qual. Different purpose |
| SMS/WhatsApp automation | Plug in later if needed, not core |
| Reputation management | Post-event feedback covers this better for experience creators |
| White-label SaaS mode | Phase 4 via facilitator certification, not software reselling |
| Workflow automation (if X then Y) | Premature. Manual is fine until 3+ experiences |

---

## What Makes This Not-GHL

GHL is plumbing. It moves leads through funnels.

FindMyFlow is methodology. It moves humans through nervous system states.

The `/create` portal doesn't compete with GHL on marketing automation. It competes on something GHL will never have:

1. **Identity-level creator matching** — "You create like Esther Perel"
2. **Shift Architecture** — a methodology for designing experiences that produce lasting change
3. **NS state tracking** — proof that your events actually shift people
4. **The flywheel** — your attendees become practitioners become creators
5. **Vibe Rise capacity data** — aggregate proof no marketing tool can generate

The CRM features are table stakes wired into a transformational journey. The journey is the product.

---

*Living document. Update as phases ship.*
