# CRM Implementation Plan: Attract/Nurture Restructure

> This document outlines the plan to restructure the existing CRM into the 2-tower Attract/Nurture model, using a **hybrid approach** that keeps existing auto-generation for content while adding prompt generators for new features.

---

## Hybrid Approach: Auto-Generation + Prompt Generators

After reviewing the existing CRM, we discovered a **sophisticated content generation system** already in place. Rather than replacing it, we'll use a hybrid approach:

### What We're Keeping (Auto-Generation)

The existing content generation system in `/crm/content-create` includes:

| Feature | Value |
|---------|-------|
| **14+ content types** | Transformation, Educational, Pain, Social Proof, Offer Teaser, etc. |
| **7 data sources** | FlowFinder, Validation, Offer, Voice Profile, Performance, Wins, Story |
| **Voice matching** | Extracts user's writing style, learns from feedback |
| **Smart triggers** | Sales events → content suggestions |
| **Platform optimization** | Instagram, LinkedIn, Twitter, Email, Facebook specific |
| **Refinement options** | Shorter, Longer, Professional, Casual, Urgency, Storytelling |

**Why keep it:** Voice learning loop is a competitive advantage, already integrates challenge data, users expect "generate" to produce content.

### What We're Adding (Prompt Generators)

For **new features** where we haven't built auto-generation:

| New Feature | Why Prompt Generator |
|-------------|---------------------|
| **Landing Page Copy** | Complex, users want control over messaging |
| **Sales Page Copy** | High stakes, users want to customize |
| **Email Sequences** | 5+ emails = expensive to auto-generate all |
| **Outreach Scripts** | Highly personal, needs customization |
| **Ad Copy** | Often needs many variations |

**Why prompt generators:** Lower API costs, user flexibility, works with any AI tool.

### The Hybrid Split

| CRM Section | Approach | Reason |
|-------------|----------|--------|
| **Attract > Content** | Auto-generate (existing) | Already built, voice learning |
| **Attract > Pages** | Prompt generator (new) | Not built, high customization need |
| **Attract > Cold Outreach** | Prompt generator (new) | Personal, needs customization |
| **Attract > Ads** | Prompt generator (new) | Many variations needed |
| **Nurture > Email** | Prompt generator (new) | 5+ emails = expensive to auto-generate |
| **Nurture > Warm Outreach** | Prompt generator (new) | Highly personal |

### Adding Transparency to Auto-Generation

We'll add a **"View Prompt"** option to the existing ContentGenerator so users can:
- See what's being sent to AI (educational)
- Copy the prompt to use elsewhere (flexibility)
- Build trust in the system (transparency)

---

## Current State Summary

The existing CRM is **production-ready** with substantial features:

### What Already Exists

| Category | Features |
|----------|----------|
| **Dashboard** | Command center, metrics, quick actions, recommendations |
| **Marketing** | Weekly task board, engagement tracking |
| **Sales** | Kanban pipeline, PTUF lead scoring, deal outcomes |
| **Content** | History, queue, AI generation, scheduling |
| **Analytics** | Weekly report cards, grading, comparisons |
| **Financial Tools** | PTUF Calculator, LTV Calculator, CAC Tracker |
| **Sales Tools** | 15 Hormozi scripts, objection patterns |
| **Retention** | Ascension engine, value ladder |
| **Gamification** | Points, levels, streaks |
| **Setup** | Autonomous data collection flows |

### Current Route Structure
```
/crm                    → Dashboard
/crm/marketing          → Weekly task board
/crm/sales              → Kanban pipeline
/crm/analytics          → Report cards
/crm/content-history    → Content library
/crm/content-queue      → Scheduling
/crm/content-create     → AI generation
/crm/performance        → Metrics dashboard
/crm/implementations    → Stage task tracking
/crm/assets             → Generated assets library
/crm/setup/*            → Autonomous setup flows
/crm/ptuf               → PTUF Calculator
/crm/ltv                → LTV Calculator
/crm/cac                → CAC Tracker
/crm/scripts            → Sales scripts
/crm/alerts             → Smart alerts
/crm/ascension          → Value ladder
/crm/objections         → Objection handling
```

---

## Target State: Attract/Nurture Model

### New Navigation Structure

```
/crm                    → Home Dashboard (restructured)
│
├── /crm/attract        → Attract Tower Landing
│   ├── /crm/attract/pages      → Landing & Sales Pages (NEW)
│   ├── /crm/attract/content    → Content (existing content-* merged)
│   ├── /crm/attract/outreach   → Cold Outreach (NEW)
│   └── /crm/attract/ads        → Ads (future)
│
├── /crm/nurture        → Nurture Tower Landing
│   ├── /crm/nurture/contacts   → Contact Management (NEW)
│   ├── /crm/nurture/email      → Email Sequences (NEW)
│   ├── /crm/nurture/outreach   → Warm Outreach (from existing sales)
│   └── /crm/nurture/pipeline   → Pipeline (existing sales restructured)
│
├── /crm/launch         → Launch Mode (NEW overlay)
│
└── /crm/tools          → Tools & Calculators (existing grouped)
    ├── /crm/tools/ptuf
    ├── /crm/tools/ltv
    ├── /crm/tools/cac
    ├── /crm/tools/scripts
    └── /crm/tools/analytics
```

---

## Gap Analysis

### Features to ADD

| Feature | Priority | Effort | Dependencies |
|---------|----------|--------|--------------|
| **Prompt Generators** | P0 | Medium | Challenge data access |
| **Pages Section** | P0 | Medium | Page builder or link generator |
| **Contacts Section** | P0 | Low | New table or extend sales_deals |
| **Email Sequences** | P1 | High | Email provider integration |
| **Launch Mode** | P1 | Medium | Overlay component |
| **Challenge → CRM Links** | P1 | Low | Success screen updates |
| **Cold Outreach Tracker** | P2 | Medium | New table |
| **Tower Landing Pages** | P2 | Low | Navigation restructure |

### Features to RESTRUCTURE

| Existing | New Location | Changes Needed |
|----------|--------------|----------------|
| `/crm/content-*` | `/crm/attract/content` | Route change, add prompt generator |
| `/crm/sales` | `/crm/nurture/pipeline` | Route change, split outreach |
| `/crm/marketing` | `/crm/attract/content` | Merge with content or deprecate |
| `/crm/analytics` | `/crm/tools/analytics` | Route change |
| `/crm/ptuf`, `/ltv`, `/cac` | `/crm/tools/*` | Route grouping |
| `/crm/scripts` | `/crm/tools/scripts` | Route change |

### Features to KEEP AS-IS

| Feature | Reason |
|---------|--------|
| Dashboard | Core entry point, will be updated |
| PTUF Lead Scoring | Valuable, keep in pipeline |
| Ascension Engine | Valuable retention tool |
| Gamification | User engagement |
| Smart Alerts | Keep, integrate with new sections |

---

## Implementation Phases

### Phase 1: Hybrid Foundation (Week 1)
**Goal:** Add transparency to existing content generation + build prompt generator for new features

#### 1.1 Add "View Prompt" to Existing ContentGenerator
```
src/components/crm/ContentGenerator.jsx (UPDATE)
src/components/crm/PromptViewer.jsx (NEW)
```

**Changes to ContentGenerator:**
- Store the prompt that was sent to Claude
- Add "View Prompt" button after generation
- Show PromptViewer modal with:
  - The full prompt used
  - Data sources highlighted
  - Copy-to-clipboard button
  - "Use this prompt elsewhere" explanation

```jsx
// After generation
<button onClick={() => setShowPrompt(true)}>
  👁 View Prompt
</button>

{showPrompt && (
  <PromptViewer
    prompt={usedPrompt}
    dataSources={contextUsed}
    onCopy={() => copyToClipboard(usedPrompt)}
  />
)}
```

#### 1.2 Create Prompt Templates for NEW Features
```
src/lib/crm/promptTemplates.js
```

**Templates to create (for features WITHOUT auto-generation):**
- `generateLandingPagePrompt(userData)` - For Pages section
- `generateSalesPagePrompt(userData)` - For Pages section
- `generateNurtureSequencePrompt(userData)` - For Email section
- `generateLaunchSequencePrompt(userData)` - For Email section
- `generateColdOutreachPrompt(userData)` - For Outreach section
- `generateWarmFollowUpPrompt(userData, contact)` - For Outreach section
- `generateAdCopyPrompt(userData)` - For Ads section

**NOT creating (already have auto-generation):**
- ~~generateContentIdeasPrompt~~ - Existing ContentGenerator handles this
- ~~generatePostCopyPrompt~~ - Existing ContentGenerator handles this

#### 1.3 Extend Existing Data Aggregation
```
src/lib/contentContext.js (UPDATE)
```

The existing `contentContext.js` already fetches:
- Persona data (FlowFinder)
- Validation insights
- Offer details (V1 + V2)
- Voice profile
- Performance data
- Recent wins

**Add to existing service:**
- `getProofData(userId)` - From launch_readiness_assessments
- `getLaunchData(userId)` - Launch approach, pricing, audience size
- Export functions for use in prompt templates

#### 1.4 Create Prompt Generator Component (for new features)
```
src/components/crm/PromptGenerator.jsx (NEW)
src/components/crm/PromptGenerator.css (NEW)
```

**Features:**
- Modal interface for Pages, Email, Outreach sections
- Shows data being used (with source labels)
- Highlights missing data with links to challenges
- Copy-to-clipboard (primary action)
- Optional: Save prompt to history

**UI Flow:**
```
┌─────────────────────────────────────────────────────┐
│  Generate Landing Page Copy                     ✕   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  DATA WE'LL USE:                                    │
│  ✅ Persona: Sarah, burnt-out corporate (FlowFinder)│
│  ✅ Problems: Lack of clarity, fear (FlowFinder)    │
│  ✅ Offer: 12-Week Clarity Program (Offer Builder)  │
│  ✅ Price: $997 (Launch Readiness)                  │
│  ✅ Proof: 3 testimonials (Launch Readiness)        │
│  ⚠️ Missing: Guarantee details (Offer Stack)       │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Additional context (optional):              │   │
│  │ Focus on the "Sunday scaries" pain point    │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│         [Generate Prompt]  [Copy to Clipboard]     │
│                                                     │
│  ────────────────────────────────────────────────  │
│                                                     │
│  YOUR PROMPT:                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ Create a high-converting landing page...    │   │
│  │ TARGET AUDIENCE: Sarah, burnt-out...        │   │
│  │ ...                                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Copy this prompt into ChatGPT, Claude, or your    │
│  preferred AI tool.                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Deliverables:**
- [ ] `PromptViewer.jsx` - View prompt modal for existing ContentGenerator
- [ ] Update `ContentGenerator.jsx` - Add "View Prompt" button
- [ ] `promptTemplates.js` - 7 templates for new features
- [ ] Update `contentContext.js` - Add proof/launch data exports
- [ ] `PromptGenerator.jsx` - Prompt generator for new sections

---

### Phase 2: Navigation Restructure (Week 2)
**Goal:** Reorganize into Attract/Nurture towers

#### 2.1 Create Tower Landing Pages
```
src/pages/crm/AttractTower.jsx
src/pages/crm/NurtureTower.jsx
```

**Features:**
- Overview of tower sections
- Key metrics for that tower
- Quick actions
- Progress indicators

#### 2.2 Update Routes
```
src/AppRouter.jsx
```

**Changes:**
- Add new tower routes
- Create redirects from old routes (maintain backwards compatibility)
- Update imports

#### 2.3 Update Navigation Component
```
src/components/crm/CRMNav.jsx (or update existing)
```

**New nav structure:**
```
[Home] [Attract ▼] [Nurture ▼] [Tools ▼] [Launch]
         │           │            │
         ├ Pages     ├ Contacts   ├ Calculators
         ├ Content   ├ Email      ├ Scripts
         ├ Outreach  ├ Outreach   └ Analytics
         └ Ads       └ Pipeline
```

#### 2.4 Update Dashboard
- Add Attract/Nurture metric cards
- Update quick actions to link to new routes
- Add "Launch Mode" entry point

**Deliverables:**
- [ ] `AttractTower.jsx` landing page
- [ ] `NurtureTower.jsx` landing page
- [ ] Updated `AppRouter.jsx`
- [ ] New navigation component
- [ ] Updated Dashboard

---

### Phase 3: New Core Features (Weeks 3-4)
**Goal:** Build missing Attract/Nurture features using **Prompt Generator pattern** (not auto-generation)

#### 3.1 Pages Section (Attract > Pages)
```
src/pages/crm/attract/Pages.jsx
src/pages/crm/attract/Pages.css
```

**Features:**
- List of landing pages (name, URL, status, conversion)
- **[Generate Page Copy]** → Opens PromptGenerator with `landingPage` or `salesPage` template
- User copies prompt → pastes in their AI → pastes result back (optional)
- Link to external page builder OR simple page info storage
- Conversion tracking (manual or via UTM)

**Why Prompt Generator (not auto-generation):**
- Landing pages are high-stakes, users want control
- Each page is unique, needs customization
- Saves API costs (user's AI tool, not ours)

**Database:**
```sql
CREATE TABLE crm_pages (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  project_id UUID REFERENCES user_projects,
  name TEXT NOT NULL,
  page_type TEXT, -- 'landing', 'sales', 'thank_you', 'checkout'
  url TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'live', 'archived'
  visitors INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2 Contacts Section (Nurture > Contacts)
```
src/pages/crm/nurture/Contacts.jsx
src/pages/crm/nurture/Contacts.css
```

**Features:**
- Contact list with search/filter
- Import from CSV
- Manual add
- Tags and segments
- Source tracking
- Link to deals in pipeline

**Database:**
```sql
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  project_id UUID REFERENCES user_projects,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT, -- 'landing_page', 'outreach', 'referral', 'manual'
  source_detail TEXT, -- specific page or campaign
  tags TEXT[],
  segment TEXT,
  status TEXT DEFAULT 'lead', -- 'lead', 'engaged', 'customer', 'churned'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.3 Email Sequences (Nurture > Email)
```
src/pages/crm/nurture/EmailSequences.jsx
src/pages/crm/nurture/EmailSequences.css
```

**MVP Features (no sending):**
- Sequence builder (name, emails, timing)
- **[Generate Sequence]** → Opens PromptGenerator with `nurtureSequence` or `launchSequence` template
- User copies prompt → generates all 5-7 emails in their AI → pastes back
- Email storage with subject, body, delay
- Copy individual emails to clipboard for use in ConvertKit, Mailchimp, etc.

**Why Prompt Generator (not auto-generation):**
- 5-7 emails per sequence = expensive to auto-generate
- Users want consistent voice across all emails
- Single generation in user's AI = one cohesive sequence

**Database:**
```sql
CREATE TABLE crm_sequences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  project_id UUID REFERENCES user_projects,
  name TEXT NOT NULL,
  sequence_type TEXT, -- 'nurture', 'launch', 'reengagement'
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crm_sequence_emails (
  id UUID PRIMARY KEY,
  sequence_id UUID REFERENCES crm_sequences,
  position INTEGER,
  subject TEXT,
  body TEXT,
  delay_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.4 Cold Outreach (Attract > Outreach)
```
src/pages/crm/attract/ColdOutreach.jsx
src/pages/crm/attract/ColdOutreach.css
```

**Features:**
- Prospect list (separate from contacts until they respond)
- **[Generate Scripts]** → Opens PromptGenerator with `coldOutreach` template
- User copies prompt → generates DM/email scripts in their AI → saves scripts
- Script library with copy-to-clipboard
- Status tracking: Not contacted → Sent → Replied → Converted
- Daily goals tracker

**Why Prompt Generator (not auto-generation):**
- Outreach is highly personal
- Users need to customize for each platform (LinkedIn vs Instagram vs Email)
- Scripts should sound like them, not generic

**Database:**
```sql
CREATE TABLE crm_outreach (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  project_id UUID REFERENCES user_projects,
  prospect_name TEXT NOT NULL,
  platform TEXT, -- 'linkedin', 'instagram', 'twitter', 'email'
  profile_url TEXT,
  outreach_type TEXT, -- 'cold', 'warm'
  status TEXT DEFAULT 'not_contacted',
  message_sent TEXT,
  sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Deliverables:**
- [ ] Pages section with prompt generator
- [ ] Contacts section with import
- [ ] Email sequences with prompt generator
- [ ] Cold outreach tracker with prompt generator
- [ ] Database migrations for all tables

---

### Phase 4: Launch Mode (Week 5)
**Goal:** Create unified launch experience

#### 4.1 Launch Mode Overlay
```
src/pages/crm/LaunchMode.jsx
src/pages/crm/LaunchMode.css
```

**Features:**
- Timeline view (Day -3 to Day +7)
- Pulls from Launch Readiness challenge data
- Content scheduled (from Attract > Content)
- Emails scheduled (from Nurture > Email)
- Live metrics during launch
- Real-time sales counter
- Post-launch summary

#### 4.2 Launch Mode Entry Points
- Dashboard: "Enter Launch Mode" button
- Launch Readiness challenge completion → CTA
- Smart Alert when launch date approaches

**Deliverables:**
- [ ] Launch Mode page
- [ ] Timeline component
- [ ] Real-time metrics integration
- [ ] Entry point CTAs

---

### Phase 5: Challenge Integration (Week 6)
**Goal:** Connect challenges to CRM seamlessly

#### 5.1 Update Challenge Success Screens
Add "Continue in CRM →" buttons to relevant flow completions:

| Challenge | CTA | Destination |
|-----------|-----|-------------|
| Product Builder | "Create Landing Page" | `/crm/attract/pages` |
| Offer Stack Builder | "Build Your Funnel" | `/crm/attract/pages` |
| Core Four Strategy | "Plan Your Content" | `/crm/attract/content` |
| Launch Readiness | "Enter Launch Mode" | `/crm/launch` |
| Nurture Sequence (dropdown) | "Build in CRM" | `/crm/nurture/email` |
| Content Plan (dropdown) | "Plan in CRM" | `/crm/attract/content` |

#### 5.2 Update Dropdown Challenge Behavior
When user selects "FindMyFlow CRM":
1. Mark challenge complete
2. Show modal: "Continue to CRM?"
3. Deep link to relevant section with context

#### 5.3 Data Completeness Indicators
In CRM prompt generators, show:
- ✅ Data available (from which challenge)
- ⚠️ Data missing (link to challenge)
- Progress percentage

**Deliverables:**
- [ ] Success screen CTAs on all relevant flows
- [ ] Dropdown → CRM flow for 4 challenges
- [ ] Data completeness UI in prompt generators

---

## Migration Strategy

### Route Redirects (Backwards Compatibility)
```javascript
// Old route → New route
'/crm/content-history' → '/crm/attract/content'
'/crm/content-queue' → '/crm/attract/content'
'/crm/content-create' → '/crm/attract/content/create'
'/crm/sales' → '/crm/nurture/pipeline'
'/crm/marketing' → '/crm/attract/content' // or deprecate
'/crm/analytics' → '/crm/tools/analytics'
'/crm/ptuf' → '/crm/tools/ptuf'
'/crm/ltv' → '/crm/tools/ltv'
'/crm/cac' → '/crm/tools/cac'
'/crm/scripts' → '/crm/tools/scripts'
```

### Data Migration
- No data migration needed for existing tables
- New tables are additive
- Existing `sales_deals` remains for pipeline
- New `crm_contacts` for contact management (can import from sales_deals)

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Content generation** | Keep auto-generation | Already built, voice learning is valuable |
| **Pages/Email/Outreach** | Prompt generators | Not built yet, lower cost, user flexibility |
| **Transparency** | Add "View Prompt" to auto-gen | Educational, builds trust, optional export |
| Email sending | External (Loops, Resend, ConvertKit) | Complex to build, users have preferences |
| Page builder | External links + prompt generator | Complex to build well, many good options |
| Contact sync | Manual + CSV import | Start simple, add integrations later |

---

## Cost Comparison: Hybrid vs Full Auto-Generation

| Scenario | Auto-Generate Everything | Hybrid Approach | Savings |
|----------|-------------------------|-----------------|---------|
| Content posts (100/mo) | ~$5/mo | ~$5/mo (keep) | $0 |
| Landing pages (10/mo) | ~$2/mo | $0 (prompt) | $2/mo |
| Email sequences (5/mo × 5 emails) | ~$3/mo | $0 (prompt) | $3/mo |
| Outreach scripts (20/mo) | ~$2/mo | $0 (prompt) | $2/mo |
| **Total per user** | **~$12/mo** | **~$5/mo** | **~$7/mo** |

**At 1,000 users:** $7,000/mo savings
**At 10,000 users:** $70,000/mo savings

The hybrid approach maintains the premium content generation experience while dramatically reducing costs for new features.

---

## File Structure (New + Updated Files)

```
src/
├── lib/crm/
│   ├── promptTemplates.js          (NEW - 7 templates for new features)
│   ├── contentContext.js           (UPDATE - add proof/launch data exports)
│   └── ... (existing services)
│
├── lib/
│   └── contentContext.js           (UPDATE - export functions for prompt templates)
│
├── components/crm/
│   ├── ContentGenerator.jsx        (UPDATE - add "View Prompt" button)
│   ├── PromptViewer.jsx            (NEW - modal to view/copy auto-gen prompts)
│   ├── PromptViewer.css            (NEW)
│   ├── PromptGenerator.jsx         (NEW - for Pages/Email/Outreach sections)
│   ├── PromptGenerator.css         (NEW)
│   ├── DataCompleteness.jsx        (NEW - shows what data is available/missing)
│   ├── TowerNav.jsx                (NEW)
│   └── ... (existing components)
│
├── pages/crm/
│   ├── AttractTower.jsx            (NEW)
│   ├── AttractTower.css            (NEW)
│   ├── NurtureTower.jsx            (NEW)
│   ├── NurtureTower.css            (NEW)
│   ├── LaunchMode.jsx              (NEW)
│   ├── LaunchMode.css              (NEW)
│   │
│   ├── attract/
│   │   ├── Pages.jsx               (NEW)
│   │   ├── Pages.css               (NEW)
│   │   ├── Content.jsx             (MERGE from content-*)
│   │   ├── Content.css             (MERGE)
│   │   ├── ColdOutreach.jsx        (NEW)
│   │   └── ColdOutreach.css        (NEW)
│   │
│   ├── nurture/
│   │   ├── Contacts.jsx            (NEW)
│   │   ├── Contacts.css            (NEW)
│   │   ├── EmailSequences.jsx      (NEW)
│   │   ├── EmailSequences.css      (NEW)
│   │   ├── WarmOutreach.jsx        (NEW or extract from Sales)
│   │   └── Pipeline.jsx            (RENAME from Sales)
│   │
│   └── tools/
│       └── ... (existing, reorganized)
│
supabase/migrations/
├── 20260122000000_crm_pages.sql           (NEW)
├── 20260122000001_crm_contacts.sql        (NEW)
├── 20260122000002_crm_sequences.sql       (NEW)
├── 20260122000003_crm_outreach.sql        (NEW)
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Prompt generator usage | 50% of CRM users | Track generate clicks |
| Challenge → CRM flow | 30% continue to CRM | Track CTA clicks |
| Launch Mode usage | 20% of Stage 6+ users | Track launches |
| Content created via prompts | 100+ pieces/month | Track saves |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Route changes break bookmarks | Medium | Keep redirects for 6 months |
| Users confused by restructure | Medium | In-app announcement, guided tour |
| Prompt quality varies | Low | Iterate on templates based on feedback |
| Email integration complexity | High | Start with copy-paste, add integrations later |

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1** | Week 1 | Hybrid foundation: "View Prompt" + PromptGenerator component |
| **Phase 2** | Week 2 | Navigation restructure (Attract/Nurture towers) |
| **Phase 3** | Weeks 3-4 | New features: Pages, Contacts, Email, Outreach (with prompt generators) |
| **Phase 4** | Week 5 | Launch Mode |
| **Phase 5** | Week 6 | Challenge → CRM integration |

**Total: 6 weeks to full implementation**

---

## Summary: The Hybrid Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                     FINDMYFLOW CRM                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ATTRACT TOWER                    NURTURE TOWER                 │
│  ┌─────────────────────┐         ┌─────────────────────┐       │
│  │ Content             │         │ Contacts            │       │
│  │ ✨ AUTO-GENERATE    │         │ (no generation)     │       │
│  │ (existing system)   │         │                     │       │
│  │ + View Prompt       │         │                     │       │
│  └─────────────────────┘         └─────────────────────┘       │
│                                                                 │
│  ┌─────────────────────┐         ┌─────────────────────┐       │
│  │ Pages               │         │ Email Sequences     │       │
│  │ 📋 PROMPT GENERATOR │         │ 📋 PROMPT GENERATOR │       │
│  │ (new)               │         │ (new)               │       │
│  └─────────────────────┘         └─────────────────────┘       │
│                                                                 │
│  ┌─────────────────────┐         ┌─────────────────────┐       │
│  │ Cold Outreach       │         │ Warm Outreach       │       │
│  │ 📋 PROMPT GENERATOR │         │ 📋 PROMPT GENERATOR │       │
│  │ (new)               │         │ (new)               │       │
│  └─────────────────────┘         └─────────────────────┘       │
│                                                                 │
│  ┌─────────────────────┐         ┌─────────────────────┐       │
│  │ Ads                 │         │ Pipeline            │       │
│  │ 📋 PROMPT GENERATOR │         │ (existing sales)    │       │
│  │ (future)            │         │                     │       │
│  └─────────────────────┘         └─────────────────────┘       │
│                                                                 │
│  ✨ AUTO-GENERATE = We call Claude API, instant result         │
│  📋 PROMPT GENERATOR = User copies prompt to their AI tool     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
1. **Preserve existing investment** - Content generation system stays (voice learning, 7 data sources)
2. **Add transparency** - "View Prompt" lets users learn/export
3. **Lower costs for new features** - User's AI tool, not our API
4. **User flexibility** - Works with ChatGPT, Claude, Gemini, etc.
5. **Faster development** - Prompt generators simpler than full auto-generation

---

## Open Questions

1. **Email provider preference?** - Loops, Resend, ConvertKit, or build custom?
2. **Page builder integration?** - Carrd, Typedream, or just link storage?
3. **Mobile priority?** - Full mobile CRM or desktop-first?
4. **Pricing tier?** - Is CRM free or gated to paid users?

---

## Next Steps

1. [ ] Review and approve this plan
2. [ ] Answer open questions
3. [ ] Begin Phase 1: Add "View Prompt" to ContentGenerator + build PromptGenerator component
4. [ ] Create database migrations for new tables

---

*Created: January 2025*
*Last Updated: January 2025*
