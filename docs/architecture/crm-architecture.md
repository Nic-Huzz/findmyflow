# FindMyFlow CRM Architecture

> This document defines the CRM structure, tower organization, and how challenges connect to CRM features.

---

## Overview

The FindMyFlow CRM uses a **2-tower model** based on the customer journey:

| Tower | Purpose | Mental Model |
|-------|---------|--------------|
| **ATTRACT** | Get new people into your world | "How do I reach new people?" |
| **NURTURE** | Build trust and convert existing leads | "How do I build relationships?" |

---

## Tower Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                            HOME                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Key metrics: New leads │ Open rate │ Revenue                ││
│  │ Quick actions: [+ Content] [+ Email] [Launch Mode]          ││
│  └─────────────────────────────────────────────────────────────┘│
├────────────────────────────────┬────────────────────────────────┤
│            ATTRACT             │            NURTURE              │
│     "Get people into your      │    "Build trust & convert"     │
│           world"               │                                │
├────────────────────────────────┼────────────────────────────────┤
│                                │                                │
│  📄 PAGES                      │  👥 CONTACTS                   │
│  • Landing pages               │  • Lead list                   │
│  • Sales pages                 │  • Segments & tags             │
│  • [Generate Page Copy]        │  • Lead source tracking        │
│  • 📊 Visitors, Conversion     │  • 📊 List growth, sources     │
│                                │                                │
│  📝 CONTENT                    │  📧 EMAIL                      │
│  • Content calendar            │  • Nurture sequences           │
│  • Drafts & scheduling         │  • Launch sequences            │
│  • [Generate Content Ideas]    │  • Broadcasts                  │
│  • [Generate Post Copy]        │  • [Generate Email Copy]       │
│  • 📊 Published, Engagement    │  • 📊 Opens, Clicks, Unsubs    │
│                                │                                │
│  💬 OUTREACH (Cold)            │  💬 OUTREACH (Warm)            │
│  • Cold DM campaigns           │  • Follow-up reminders         │
│  • Cold email campaigns        │  • Warm lead nurturing         │
│  • [Generate Cold Scripts]     │  • [Generate Follow-up Scripts]│
│  • 📊 Sent, Reply rate         │  • 📊 Conversations, Converted │
│                                │                                │
│  📣 ADS (optional)             │  🎯 PIPELINE                   │
│  • Ad campaigns                │  • Deal stages                 │
│  • Creative variations         │  • Tasks & follow-ups          │
│  • [Generate Ad Copy]          │  • Revenue tracking            │
│  • 📊 Spend, CPC, ROAS         │  • 📊 Value, Win rate          │
│                                │                                │
└────────────────────────────────┴────────────────────────────────┘
```

---

## Launch Mode (Overlay)

When a user is actively launching, **Launch Mode** provides a unified view spanning both towers:

```
┌─────────────────────────────────────────────────────────────────┐
│                       🚀 LAUNCH MODE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAUNCH TIMELINE                                                │
│  Day -3 ────●──── Day -1 ────●──── Day 0 ────●──── Day +7      │
│            Teaser         Countdown       LAUNCH         Close  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ ATTRACT         │  │ NURTURE         │  │ RESULTS         │ │
│  │                 │  │                 │  │                 │ │
│  │ 3 posts         │  │ 7 emails        │  │ $0 revenue      │ │
│  │ scheduled       │  │ queued          │  │ 0 sales         │ │
│  │                 │  │                 │  │                 │ │
│  │ [View Content]  │  │ [View Emails]   │  │ [View Pipeline] │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  LIVE METRICS (during launch)                                   │
│  • Page views: 234                                             │
│  • Email opens: 67%                                            │
│  • Sales: 3 ($2,991)                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prompt Generators by Section

Each section includes contextual prompt generators that pull data from completed challenges:

### ATTRACT Tower

| Section | Prompt Generator | Data Sources |
|---------|------------------|--------------|
| **Pages** | Landing Page Copy | Persona, Problems, Offer, Bonuses, Guarantee, Proof |
| **Pages** | Sales Page Copy | All of above + Pricing, Scarcity, Objections |
| **Content** | Content Ideas | Persona, Problems, Skills, Core Four Strategy |
| **Content** | Post Copy | Persona, Problems, Lead Magnet |
| **Outreach (Cold)** | Cold DM Scripts | Persona, Problems, Offer, Credibility |
| **Outreach (Cold)** | Cold Email Scripts | Persona, Problems, Offer, Proof |
| **Ads** | Ad Copy | Persona, Pain Language, Lead Magnet, Proof |

### NURTURE Tower

| Section | Prompt Generator | Data Sources |
|---------|------------------|--------------|
| **Email** | Nurture Sequence | Persona, Problems, Story, Proof, Objections, Lead Magnet |
| **Email** | Launch Sequence | Offer, Pricing, Bonuses, Scarcity, Guarantee, Launch Approach |
| **Email** | Re-engagement | Persona, Problems, New Proof |
| **Outreach (Warm)** | Follow-up Scripts | Persona, Previous Interaction, Offer |
| **Outreach (Warm)** | Objection Handlers | Objections from Validation, Pricing, Guarantee |

---

## Challenge → CRM Linking

When users complete challenges, they should be directed to the relevant CRM section. This creates a natural flow from planning (challenges) to execution (CRM).

### Stage 2: Product Creation

| Challenge | CRM Destination | Purpose |
|-----------|-----------------|---------|
| Product Builder | Attract > Pages | Create landing page for lead magnet |
| Product Designer | Attract > Pages | Build sales page using value equation |
| Lead Magnet Selector | Attract > Pages | Set up lead magnet delivery |

### Stage 4: Money Models

| Challenge | CRM Destination | Purpose |
|-----------|-----------------|---------|
| Attraction Offer Assessment | Attract > Pages | Create attraction offer page |
| Decide on Attraction Offer | Attract > Pages | Build chosen offer |
| Create Attraction Offer | Attract > Pages | Finalize and publish |
| Upsell/Downsell/Continuity | Nurture > Pipeline | Configure offer stack in sales flow |

### Stage 5: Offer Creation

| Challenge | CRM Destination | Purpose |
|-----------|-----------------|---------|
| Grand Slam Evaluation | Attract > Pages | Add proof stack to sales page |
| Offer Stack Builder | Attract > Pages + Nurture > Email | Configure full offer, create sequences |
| Implement Bonuses | Attract > Pages | Add bonus descriptions to sales page |
| Implement Guarantee | Attract > Pages | Add guarantee to sales page |
| Implement Scarcity | Attract > Pages + Nurture > Email | Add urgency to page and launch emails |

### Stage 6: Campaign

| Challenge | CRM Destination | Purpose |
|-----------|-----------------|---------|
| Core Four Strategy | Determines primary sections | If Content → Attract > Content, If Outreach → Attract > Outreach |
| Funnel Builder | Attract > Pages + Nurture > Email | Build full funnel flow |
| Launch Readiness Check | Launch Mode | Verify readiness, set launch date |
| Content Creation Plan | Attract > Content | Schedule content calendar |
| Lead Capture Setup | Attract > Pages | Publish landing page, connect forms |
| Nurture Sequence | Nurture > Email | Create and activate nurture sequence |
| CRM & Tracking Setup | Nurture > Contacts + Pipeline | Import leads, set up pipeline stages |
| Launch Sequence | Nurture > Email | Create and schedule launch emails |

### Stage 7: Launch

| Challenge | CRM Destination | Purpose |
|-----------|-----------------|---------|
| Attraction Offer Launch | Launch Mode | Execute launch |
| First 10 Signups | Nurture > Pipeline | Track and celebrate conversions |
| Post-Launch Review | Launch Mode | Review results, capture learnings |
| Daily Implementation | Launch Mode | Track daily launch actions |
| Sales Page Copy | Attract > Pages | Finalize sales copy |

### Stage 8: Tracking

| Challenge | CRM Destination | Purpose |
|-----------|-----------------|---------|
| Funnel Calculator | Home Dashboard | Track full funnel metrics |
| Establish Funnel Baseline | Home Dashboard | Set initial benchmarks |
| Weekly Funnel Update | Home Dashboard | Review and update metrics |

---

## CRM Section Deep Dives

### Attract > Pages

**Purpose:** Create and manage landing pages and sales pages.

**Features:**
- Page builder (templates or custom)
- [Generate Page Copy] prompt generator
- Form embedding
- Analytics (visitors, conversion rate)

**Data displayed:**
- List of pages with status (draft/live)
- Conversion rate per page
- Total leads captured

**User flow:**
1. Click "New Page" or "Generate Copy"
2. Select page type (opt-in, sales, thank you)
3. Generate copy using challenge data
4. Edit/customize
5. Publish and get shareable link
6. Track conversions

---

### Attract > Content

**Purpose:** Plan and create content for social media and other channels.

**Features:**
- Content calendar (week/month view)
- [Generate Content Ideas] prompt generator
- [Generate Post Copy] prompt generator
- Draft management
- Scheduling (future: direct posting)

**Data displayed:**
- Scheduled posts this week
- Posts published
- Engagement metrics (if connected)

**User flow:**
1. Click "Generate Ideas" to get 7 content ideas
2. Select ideas to develop
3. Generate full post copy
4. Edit and schedule
5. Track engagement

---

### Attract > Outreach (Cold)

**Purpose:** Reach new people who aren't in your world yet.

**Features:**
- Prospect list management
- [Generate Cold Scripts] prompt generator
- Campaign tracking (DMs, emails)
- Response tracking

**Data displayed:**
- Outreach sent today/this week
- Reply rate
- Conversations started

**User flow:**
1. Add prospects (manual or import)
2. Generate cold scripts
3. Copy script, send message
4. Mark as sent
5. Log replies
6. Move interested → Nurture > Contacts

---

### Nurture > Contacts

**Purpose:** Manage all leads in your world.

**Features:**
- Contact list with search/filter
- Tags and segments
- Lead source tracking
- Activity timeline per contact
- Import/export

**Data displayed:**
- Total contacts
- Growth this week/month
- Contacts by source
- Contacts by segment

**User flow:**
1. Contacts auto-added from pages/forms
2. Manually add from outreach
3. Tag and segment
4. View individual contact history
5. Trigger sequences or manual follow-up

---

### Nurture > Email

**Purpose:** Send automated sequences and broadcasts.

**Features:**
- Sequence builder (nurture, launch, re-engagement)
- [Generate Email Copy] prompt generator
- Broadcast sending
- A/B testing (future)
- Analytics per email

**Data displayed:**
- Active sequences
- Emails sent this week
- Open rate, click rate
- Unsubscribe rate

**User flow:**
1. Create new sequence (see 5-email template)
2. Generate copy for each email
3. Set timing (Day 0, Day 2, etc.)
4. Activate sequence
5. Monitor performance
6. Optimize weak emails

---

### Nurture > Outreach (Warm)

**Purpose:** Follow up with leads who've shown interest.

**Features:**
- Follow-up reminders
- [Generate Follow-up Scripts] prompt generator
- Conversation tracking
- Integration with Contacts

**Data displayed:**
- Follow-ups due today
- Conversations active
- Conversion rate (outreach → pipeline)

**User flow:**
1. See follow-up reminders
2. Generate personalized follow-up
3. Send message
4. Log response
5. Move warm leads to Pipeline

---

### Nurture > Pipeline

**Purpose:** Track deals and revenue.

**Features:**
- Kanban-style deal stages
- Deal value tracking
- Task management
- Revenue dashboard

**Default stages:**
1. Lead (new contact)
2. Engaged (replied/interested)
3. Qualified (good fit confirmed)
4. Proposal (offer presented)
5. Won / Lost

**Data displayed:**
- Pipeline value
- Deals by stage
- Win rate
- Revenue this month

**User flow:**
1. Leads flow in from Contacts/Outreach
2. Move through stages as relationship progresses
3. Add tasks/follow-ups
4. Mark as Won (add revenue) or Lost (add reason)
5. Celebrate wins

---

## Data Flow: Challenges → CRM

```
CHALLENGES (Planning)                    CRM (Execution)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────┐
│ Flow Finder         │──────┐
│ Skills, Problems,   │      │
│ Personas            │      │
└─────────────────────┘      │
                             │
┌─────────────────────┐      │
│ Validation          │──────┤
│ Pain language,      │      │
│ Objections          │      │
└─────────────────────┘      │
                             │     ┌─────────────────────────────┐
┌─────────────────────┐      ├────▶│ ALL PROMPT GENERATORS       │
│ Product Builder     │──────┤     │                             │
│ Core offer, Lead    │      │     │ Landing Page Copy           │
│ magnet, Bonuses     │      │     │ Sales Page Copy             │
└─────────────────────┘      │     │ Content Ideas               │
                             │     │ Email Sequences             │
┌─────────────────────┐      │     │ Outreach Scripts            │
│ Offer Stack Builder │──────┤     │ Ad Copy                     │
│ Guarantee, Scarcity,│      │     │                             │
│ Naming              │      │     └─────────────────────────────┘
└─────────────────────┘      │
                             │
┌─────────────────────┐      │
│ Grand Slam Eval     │──────┤
│ Proof stack, Speed, │      │
│ Ease factor         │      │
└─────────────────────┘      │
                             │
┌─────────────────────┐      │
│ Launch Readiness    │──────┘
│ Pricing, Audience,  │
│ Proof inventory     │
└─────────────────────┘


                             │
                             ▼
                    ┌─────────────────┐
                    │   CRM Actions   │
                    │                 │
                    │ • Create pages  │
                    │ • Schedule posts│
                    │ • Send emails   │
                    │ • Track deals   │
                    │ • Launch!       │
                    └─────────────────┘
```

---

## Implementation Priority

### Phase 1: Core Structure
1. Home dashboard with key metrics
2. Attract > Pages (with Generate Copy)
3. Nurture > Contacts (lead list)
4. Nurture > Email (sequences with Generate Copy)

### Phase 2: Content & Outreach
5. Attract > Content (calendar + Generate Ideas)
6. Attract > Outreach Cold (scripts + tracking)
7. Nurture > Outreach Warm (follow-ups)

### Phase 3: Pipeline & Launch
8. Nurture > Pipeline (deal tracking)
9. Launch Mode (overlay)

### Phase 4: Advanced
10. Attract > Ads (if demand exists)
11. Integrations (email providers, social scheduling)
12. Advanced analytics

---

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Generate first** | Primary action is always "Generate", not blank page |
| **Pull their data** | Prompts auto-populate from challenge data |
| **Show the system** | Templates and structure, never blank |
| **Celebrate wins** | Notifications for signups, sales, milestones |
| **Actionable insights** | Metrics come with suggestions |
| **Contextual help** | Link back to relevant challenges if data missing |

---

## Navigation

```
Bottom Nav:
[Home] [Attract] [Nurture] [Challenges]

Or if space allows:
[Home] [Attract] [Nurture] [Launch] [Challenges]
```

When user selects "FindMyFlow CRM" in challenge dropdowns, they're directed to the relevant CRM section with context of what they just completed.

---

*Last updated: January 2025*
