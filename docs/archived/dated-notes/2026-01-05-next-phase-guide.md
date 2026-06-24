# Flow Academy - Next Phase Build Guide

**Date:** January 5, 2026 (Updated: January 6, 2026)
**Purpose:** Guide for continuing Flow Academy V1 development
**Priority:** Complete Phase 1 before moving to Phase 2

---

## Current State: Foundation Complete + Phase 1 Progress

All core modules are built and functional:

| Module | Location | Status |
|--------|----------|--------|
| FindMyFlow (Persona) | `/src/flows/FindMyFlow/` | Complete |
| Validation Surveys | `/src/flows/ValidationFlow/` | Complete |
| $100M Offer Builder v2 | `/src/flows/OfferBuilder100M/` | Complete |
| CRM Dashboard | `/src/pages/crm/CRMDashboard.jsx` | Complete + Project Switcher |
| CRM Marketing | `/src/pages/crm/CRMMarketing.jsx` | Complete + Week Nav + AI Generator |
| CRM Sales | `/src/pages/crm/CRMSales.jsx` | Complete + Lead Scoring |
| CRM Analytics | `/src/pages/crm/CRMAnalytics.jsx` | Complete |
| PTUF Calculator | `/src/pages/crm/PTUFCalculator.jsx` | Complete |
| LTV Calculator | `/src/pages/crm/LTVCalculator.jsx` | Complete |
| CAC Tracker | `/src/pages/crm/CACTracker.jsx` | Complete |
| Sales Scripts | `/src/pages/crm/SalesScripts.jsx` | Complete + 15 scripts |
| Smart Alerts | `/src/pages/crm/SmartAlerts.jsx` | Complete |
| Lead Scoring | `/src/components/crm/LeadScoreSliders.jsx` | Complete |
| Scripts Modal | `/src/components/crm/ScriptsModal.jsx` | Complete + Smart Suggestions |
| Project Switcher | `/src/components/crm/ProjectSwitcher.jsx` | **NEW - Complete** |
| Content Generator | `/src/components/crm/ContentGenerator.jsx` | **NEW - Complete** |
| Content Context | `/src/lib/contentContext.js` | **NEW - Complete** |
| Bottom Toolbar (CRM) | `/src/components/BottomToolbar.jsx` | **Updated - CRM-aware** |

**Theme:** Light (purple #5e17eb, gold #ffdd27, warm-gray #f8f9fa)
**Build Status:** 334+ modules

---

## Completed Updates (January 6, 2026)

### Done: CRM Bottom Toolbar
- Updated `/src/components/BottomToolbar.jsx` to detect CRM routes
- When in `/crm/*`, shows: Sales | Marketing | Analytics | Portal
- Portal returns to `/7-day-challenge`
- Added CRM-specific styling in `/src/components/BottomToolbar.css`

### Done: Project Switcher
- Created `/src/components/crm/ProjectSwitcher.jsx`
- Created `/src/components/crm/ProjectSwitcher.css`
- Added to CRM Dashboard header
- Persists selection to localStorage
- Fetches projects from `user_projects` table

### Done: AI Content Generation
- Created `/src/lib/contentContext.js` - Gathers context from all user data
- Created `/supabase/functions/content-generator/index.ts` - Edge Function
- Created `/src/components/crm/ContentGenerator.jsx` - UI modal
- Created `/src/components/crm/ContentGenerator.css` - Styles
- Integrated into `/src/pages/crm/CRMMarketing.jsx`
- Supports 5 content types: Transformation Story, Educational, Pain Agitation, Social Proof, Offer Teaser
- Supports 5 platforms: Instagram, LinkedIn, Twitter/X, Email, Facebook
- Shows context completeness meter (persona, validation, offer, marketing, deals)

### Done: AI Content Generator Enhancements
- Added **Tone Selector** (6 tones: Authentic, Bold, Warm, Witty, Inspirational, Educational)
- Added **Character Counter** with platform limits (Twitter 280, Instagram 2200, LinkedIn 3000, etc.)
- Added **Refinement Options** (Make Shorter, Add Detail, More Professional, More Casual, Add Urgency, More Storytelling)
- Added **Editable Content Area** - users can edit generated content directly before copying
- Added **Quick Generate Button** on Marketing task cards (sparkle icon on uncompleted tasks)
- Added Quick Generate Modal in `/src/pages/crm/CRMMarketing.jsx`

### Already Existed (Verified)
- Week Navigation in Marketing (`weekOffset` state)
- Offer Builder → CRM Products (`fetchUserProducts()`)
- Smart Script Suggestions (`getSmartSuggestions()` in ScriptsModal)
- Persona → Offer Builder (`Step1A_BucketSelection` shows FindMyFlow context panel + AI bucket suggestion)
- Validation → Offer Builder (`Step1B_DreamOutcome` shows validation insights panel + AI dream example)
- Platform Analytics (`CRMAnalytics.jsx` has full platform breakdown with engagement/leads/revenue)

---

## Phase 1: Integration & Data Flow

**Priority:** HIGH
**Goal:** Make modules talk to each other - one unified system, not separate tools

### 1.1 Persona → Offer Builder Connection

**What:** When user completes FindMyFlow, their persona data should pre-fill Offer Builder suggestions.

**Data to Pass:**
```javascript
// From FindMyFlow completion (nikigai_clusters table)
{
  ideal_customer: "...",      // Who they serve
  core_problem: "...",        // What problem they solve
  unique_approach: "...",     // How they're different
  skills: [...],              // Their expertise areas
  values: [...]               // What drives them
}
```

**Implementation:**
1. In Offer Builder Step 1A (Bucket Selection), check if user has FindMyFlow data
2. If yes, show "Based on your FindMyFlow results, we recommend..." with pre-selected bucket
3. In Step 1B (Dream Outcome), pre-fill suggestions based on `ideal_customer` and `core_problem`

**Files to Modify:**
- `/src/flows/OfferBuilder100M/Step1A.jsx` - Add persona data fetch
- `/src/flows/OfferBuilder100M/Step1B.jsx` - Pre-fill dream outcome field
- `/src/lib/offerBuilder.js` - Add `fetchPersonaData(userId)` function

**Database Query:**
```sql
SELECT ideal_customer, core_problem, unique_approach, skills, values
FROM nikigai_clusters
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 1;
```

---

### 1.2 Validation → Offer Builder Connection

**What:** Survey responses from Validation should enhance proof and testimonials in Offer Builder.

**Data to Pass:**
```javascript
// From validation_responses table
{
  pain_points: [...],         // What customers struggle with
  desired_outcomes: [...],    // What they want to achieve
  objections: [...],          // What stops them from buying
  testimonial_quotes: [...]   // Direct quotes from surveys
}
```

**Implementation:**
1. In Offer Builder Step 3 (Build Your Proof), show validation survey quotes
2. In Step 4 (Speed Enhancements), suggest based on urgency from surveys
3. In Step 6 (Obstacles/Bonuses), pre-populate objections from survey data

**Files to Modify:**
- `/src/flows/OfferBuilder100M/Step3.jsx` - Show survey testimonials
- `/src/flows/OfferBuilder100M/Step6.jsx` - Pre-fill obstacles from objections
- `/src/lib/validation.js` - Add `fetchValidationInsights(userId)` function

---

### 1.3 Offer Builder → CRM Products Connection

**What:** Products created in Offer Builder Money Model should auto-populate CRM deal dropdown.

**Current State:** CRM has hardcoded products:
```javascript
// In /src/lib/crm/dealService.js
const PRODUCTS = [
  { name: 'Attraction Offer', price: 47 },
  { name: 'Core Offer', price: 497 },
  { name: 'Premium 1:1', price: 997 },
  { name: 'VIP Package', price: 1997 },
  { name: 'Continuity', price: 97 }
]
```

**Target State:** Fetch from user's offer_creations:
```javascript
// New function in /src/lib/crm/dealService.js
export async function fetchUserProducts(userId) {
  const { data } = await supabase
    .from('offer_creations')
    .select('id, offer_name, final_price, offer_type')
    .eq('user_id', userId)
    .eq('status', 'complete')
    .order('created_at', { ascending: false })

  return data.length > 0 ? data : PRODUCTS // Fallback to defaults
}
```

**Files to Modify:**
- `/src/lib/crm/dealService.js` - Add `fetchUserProducts()`, update `PRODUCTS` logic
- `/src/pages/crm/CRMSales.jsx` - Use dynamic products in Add Deal modal

---

### 1.4 Unified Gamification System

**What:** One points/XP system across all modules, not separate tracking.

**Current State:**
- CRM has `user_crm_stats` table (points, streaks)
- Challenges have `challenge_progress` table
- No connection between them

**Target State:** Single `user_stats` or unified tracking:

```sql
-- Option A: Extend user_crm_stats to be universal
ALTER TABLE user_crm_stats RENAME TO user_gamification;

ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS
  findmyflow_completed BOOLEAN DEFAULT false,
  validation_completed BOOLEAN DEFAULT false,
  offer_builder_completed BOOLEAN DEFAULT false,
  total_offers_created INTEGER DEFAULT 0,
  total_deals_won INTEGER DEFAULT 0,
  total_revenue_closed INTEGER DEFAULT 0;
```

**Points System:**
| Action | Points |
|--------|--------|
| Complete FindMyFlow | +100 |
| Complete Validation Survey | +50 |
| Complete Offer Builder | +200 |
| Complete Marketing Task | +10-25 |
| Move Deal to Discovery | +25 |
| Move Deal to Proposal | +25 |
| Close Deal (Won) | +100 |
| 7-Day Streak | +50 bonus |

**Files to Create:**
- `/src/lib/gamification.js` - Unified points service
- `/src/hooks/useGamification.js` - Hook for any component to award points

**Files to Modify:**
- `/src/lib/crm/statsService.js` - Import from unified gamification
- All flow completion handlers - Call `awardPoints()` on completion

---

### 1.5 Smart Script Suggestions

**What:** Based on deal's lead score, suggest which script to use.

**Implementation:**
```javascript
// In ScriptsModal.jsx, add suggestion logic
function getSuggestedScripts(deal) {
  const suggestions = []

  if (deal.pain_score < 5) {
    suggestions.push({ scriptId: 3, reason: "Low pain score - use 'Cost of Inaction'" })
  }
  if (deal.trust_score < 5) {
    suggestions.push({ scriptId: 5, reason: "Low trust - use 'Social Proof Stack'" })
  }
  if (deal.urgency_score < 5) {
    suggestions.push({ scriptId: 7, reason: "Low urgency - use 'Opportunity Cost Clock'" })
  }
  if (deal.status === 'proposal') {
    suggestions.push({ scriptId: 13, reason: "Proposal stage - use 'Assumptive Close'" })
  }

  return suggestions
}
```

**UI Update:**
- Add "Recommended for this deal" section at top of Scripts Modal
- Show reason why each script is suggested
- Track if suggested scripts have higher success rate

---

### 1.6 Missing Features from Original CRM

These features exist in MonetiseYourMission but weren't ported to FindMyFlow:

#### 1.6.1 Week Navigation in Marketing

**What:** Allow users to browse past/future weeks in the Marketing page.

**Current State:** CRMMarketing.jsx only shows current week.

**Implementation:**
```javascript
// Add to CRMMarketing.jsx
const [weekOffset, setWeekOffset] = useState(0)

// Navigation buttons
<div className="week-nav">
  <button onClick={() => setWeekOffset(w => w - 1)}>← Previous</button>
  <span>{getWeekLabel(weekOffset)}</span>
  <button onClick={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0}>
    Next →
  </button>
</div>
```

**Files to Modify:**
- `/src/pages/crm/CRMMarketing.jsx` - Add week navigation state and UI
- `/src/pages/crm/CRMMarketing.css` - Style navigation

---

#### 1.6.2 Platform Breakdown in Analytics

**What:** Show performance metrics broken down by platform (LinkedIn, Twitter, Instagram, Email).

**Implementation:**
```javascript
// Add to CRMAnalytics.jsx
const platformStats = await fetchPlatformBreakdown(userId, weekStart, weekEnd)

// Returns:
{
  linkedin: { posts: 5, likes: 120, comments: 34, shares: 12 },
  twitter: { posts: 3, likes: 45, comments: 8, shares: 22 },
  instagram: { posts: 2, likes: 89, comments: 15, shares: 5 },
  email: { sent: 50, opens: 35, clicks: 12, replies: 3 }
}
```

**UI Addition:**
```
┌─────────────────────────────────────────┐
│  PLATFORM BREAKDOWN                     │
├──────────┬───────┬─────────┬───────────┤
│ Platform │ Posts │ Engage  │ Best Post │
├──────────┼───────┼─────────┼───────────┤
│ LinkedIn │   5   │  166    │ "How I.." │
│ Twitter  │   3   │   75    │ "Thread.."│
│ Instagram│   2   │  109    │ "Carousel"│
└──────────┴───────┴─────────┴───────────┘
```

**Files to Modify:**
- `/src/pages/crm/CRMAnalytics.jsx` - Add platform breakdown section
- `/src/lib/crm/analyticsService.js` - Add `fetchPlatformBreakdown()` function

---

## Phase 2: Command Center Dashboard

**Priority:** MEDIUM
**Goal:** Single view showing everything that matters today

### 2.1 Project Switcher

**What:** Users can have multiple projects (businesses/offers). The Command Center needs a way to switch between them.

**Current State:** Project is likely selected elsewhere or defaulted. No visible switcher in CRM.

**Implementation:**

**UI Component:**
```jsx
// /src/components/crm/ProjectSwitcher.jsx
function ProjectSwitcher({ currentProject, onSwitch }) {
  const [projects, setProjects] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchUserProjects(userId).then(setProjects)
  }, [])

  return (
    <div className="project-switcher">
      <button className="current-project" onClick={() => setIsOpen(!isOpen)}>
        <span className="project-icon">📁</span>
        <span className="project-name">{currentProject?.name || 'Select Project'}</span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="project-dropdown">
          {projects.map(project => (
            <button
              key={project.id}
              className={project.id === currentProject?.id ? 'active' : ''}
              onClick={() => {
                onSwitch(project)
                setIsOpen(false)
              }}
            >
              {project.name}
              {project.id === currentProject?.id && ' ✓'}
            </button>
          ))}
          <hr />
          <button className="new-project" onClick={() => navigate('/projects/new')}>
            + Create New Project
          </button>
        </div>
      )}
    </div>
  )
}
```

**Placement:** Top-left of Command Center header

```
┌─────────────────────────────────────────────────────────────┐
│  📁 My Coaching Biz ▼          COMMAND CENTER    [Settings] │
├─────────────────────────────────────────────────────────────┤
```

**Data Flow:**
- Selected project stored in context/state
- All CRM queries filter by `project_id`
- Switching project reloads all dashboard data

**Files to Create:**
- `/src/components/crm/ProjectSwitcher.jsx`
- `/src/components/crm/ProjectSwitcher.css`

**Files to Modify:**
- `/src/pages/crm/CRMDashboard.jsx` - Add ProjectSwitcher to header
- `/src/context/ProjectContext.jsx` - Create or update project context

---

### 2.2 CRM Bottom Toolbar

**What:** When user enters the CRM section, the bottom navigation toolbar changes to CRM-specific actions.

**Main App Toolbar:**
```
┌─────────────────────────────────────────┐
│  🏠 Home  │  🎯 Challenge  │  📊 Progress  │  ⚙️ Settings  │
└─────────────────────────────────────────┘
```

**CRM Toolbar (when in /crm/* routes):**
```
┌─────────────────────────────────────────┐
│  💰 Sales  │  📣 Marketing  │  📊 Analytics  │  🔙 Portal  │
└─────────────────────────────────────────┘
```

**Implementation:**

```jsx
// /src/components/layout/BottomToolbar.jsx
function BottomToolbar() {
  const location = useLocation()
  const navigate = useNavigate()

  // Check if we're in CRM section
  const isCRMSection = location.pathname.startsWith('/crm')

  if (isCRMSection) {
    return (
      <nav className="bottom-toolbar crm-toolbar">
        <button
          className={location.pathname === '/crm/sales' ? 'active' : ''}
          onClick={() => navigate('/crm/sales')}
        >
          <span className="icon">💰</span>
          <span className="label">Sales</span>
        </button>

        <button
          className={location.pathname === '/crm/marketing' ? 'active' : ''}
          onClick={() => navigate('/crm/marketing')}
        >
          <span className="icon">📣</span>
          <span className="label">Marketing</span>
        </button>

        <button
          className={location.pathname === '/crm/analytics' ? 'active' : ''}
          onClick={() => navigate('/crm/analytics')}
        >
          <span className="icon">📊</span>
          <span className="label">Analytics</span>
        </button>

        <button
          className="portal-return"
          onClick={() => navigate('/challenge')}
        >
          <span className="icon">🔙</span>
          <span className="label">Portal</span>
        </button>
      </nav>
    )
  }

  // Default main app toolbar
  return (
    <nav className="bottom-toolbar main-toolbar">
      {/* ... existing main toolbar items ... */}
    </nav>
  )
}
```

**Styling:**
```css
/* /src/components/layout/BottomToolbar.css */
.bottom-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: var(--white);
  border-top: 1px solid var(--border-gray);
  padding-bottom: env(safe-area-inset-bottom); /* iOS safe area */
  z-index: 100;
}

.bottom-toolbar button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: none;
  border: none;
  color: var(--text-gray);
  cursor: pointer;
  transition: color 0.2s;
}

.bottom-toolbar button.active {
  color: var(--purple);
}

.bottom-toolbar button .icon {
  font-size: 20px;
}

.bottom-toolbar button .label {
  font-size: 11px;
  font-weight: 500;
}

/* CRM-specific styling */
.crm-toolbar {
  background: linear-gradient(180deg, var(--white) 0%, #f8f5ff 100%);
}

.crm-toolbar .portal-return {
  color: var(--purple);
  opacity: 0.8;
}

.crm-toolbar .portal-return:hover {
  opacity: 1;
}
```

**Quick Access to CRM Tools:**

Optionally, add a "more" menu or swipe-up drawer for quick access to:
- PTUF Calculator
- LTV Calculator
- CAC Tracker
- Sales Scripts
- Smart Alerts

```jsx
// Long-press or swipe-up on any toolbar item to show tools drawer
<ToolsDrawer>
  <ToolLink to="/crm/ptuf" icon="🧮" label="PTUF Calculator" />
  <ToolLink to="/crm/ltv" icon="💎" label="LTV Calculator" />
  <ToolLink to="/crm/cac" icon="📈" label="CAC Tracker" />
  <ToolLink to="/crm/scripts" icon="📝" label="Sales Scripts" />
  <ToolLink to="/crm/alerts" icon="🔔" label="Smart Alerts" />
</ToolsDrawer>
```

**Files to Create/Modify:**
- `/src/components/layout/BottomToolbar.jsx` - Update with CRM detection
- `/src/components/layout/BottomToolbar.css` - Add CRM toolbar styles
- `/src/components/layout/ToolsDrawer.jsx` - Optional quick-access drawer

**Route Detection Logic:**
```javascript
const CRM_ROUTES = [
  '/crm',
  '/crm/sales',
  '/crm/marketing',
  '/crm/analytics',
  '/crm/ptuf',
  '/crm/ltv',
  '/crm/cac',
  '/crm/scripts',
  '/crm/alerts'
]

const isCRMSection = CRM_ROUTES.some(route =>
  location.pathname === route || location.pathname.startsWith(route + '/')
)
```

---

### 2.3 Unified Dashboard Design

**Location:** Could replace or enhance `/src/pages/crm/CRMDashboard.jsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  FLOW ACADEMY COMMAND CENTER                    [Settings]  │
├───────────────┬───────────────┬─────────────────────────────┤
│  TODAY        │  PIPELINE     │  OFFER HEALTH               │
│  ┌─────────┐  │  ┌─────────┐  │  ┌─────────────────────┐    │
│  │ 3 tasks │  │  │ $12,400 │  │  │ Grand Slam: 87/100  │    │
│  │ pending │  │  │ warm    │  │  │ ↑ Add 2 testimonials│    │
│  └─────────┘  │  └─────────┘  │  └─────────────────────┘    │
│  2 DMs to     │  2 hot leads  │  Core Offer: Complete       │
│  send today   │  need action  │  Attraction: Draft          │
├───────────────┴───────────────┴─────────────────────────────┤
│  SMART ALERTS                                               │
│  🔥 Deal "Sarah M." stale 5 days - try Script #7            │
│  📊 You're 80% to revenue goal - 2 closes needed            │
│  🎯 Hot lead "Mike T." - schedule discovery call            │
├─────────────────────────────────────────────────────────────┤
│  QUICK ACTIONS                                              │
│  [+ Add Deal]  [📝 New Task]  [📊 View Analytics]  [🎯 Offers] │
└─────────────────────────────────────────────────────────────┘
```

**Data Sources:**
- TODAY: `marketing_tasks` where `date = today` and `completed = false`
- PIPELINE: `sales_deals` aggregated by temperature
- OFFER HEALTH: `offer_creations` with grand_slam_score
- SMART ALERTS: Generated from `/src/pages/crm/SmartAlerts.jsx` logic

---

### 2.2 Cross-Module Navigation

**What:** Seamless movement between related items.

**Examples:**
- Click hot lead → Opens deal detail with suggested scripts
- Click offer score → Opens Offer Builder at improvement step
- Click task → Opens Marketing with that task highlighted
- Smart alert action → Goes directly to relevant page

**Implementation:**
- Use React Router's `useNavigate` with state passing
- Add `returnTo` parameter for back navigation
- Breadcrumb component showing path

---

## Phase 3: AI Enhancements

**Priority:** MEDIUM-HIGH (major differentiator)
**Goal:** Make AI assistance contextual by connecting ALL user data

### 3.1 AI Content Generation for Tasks (Connected to All Flows)

**What:** When user clicks "Generate" on a marketing task, AI creates personalized content using everything learned about their business through FindMyFlow, Validation, and Offer Builder.

**Why This Is Powerful:** Instead of generic "write a LinkedIn post about coaching", the AI knows:
- WHO they serve (from FindMyFlow)
- WHAT problems their audience has (from Validation surveys)
- HOW they solve it uniquely (from Offer Builder)
- WHAT has worked before (from past marketing engagement)

---

#### Data Sources to Connect

**1. FindMyFlow Persona Data** (`nikigai_clusters` table)
```javascript
{
  ideal_customer: "Burnt-out corporate executives wanting to start coaching businesses",
  core_problem: "They don't know how to package their expertise into offers",
  unique_approach: "Combining corporate strategy skills with heart-centered coaching",
  skills: ["Executive coaching", "Strategic planning", "Team leadership"],
  values: ["Authenticity", "Impact", "Freedom"],
  personality_traits: ["Analytical yet empathetic", "Results-driven"]
}
```

**2. Validation Survey Insights** (`validation_responses` table)
```javascript
{
  pain_points: [
    "I don't know how to price my services",
    "I feel like an imposter charging premium rates",
    "I can't explain what makes me different"
  ],
  desired_outcomes: [
    "Confidently charge $5k+ for coaching packages",
    "Have a waitlist of ideal clients",
    "Feel aligned with my pricing"
  ],
  objections: [
    "I've tried courses before and they didn't work",
    "I don't have time to build a business"
  ],
  direct_quotes: [
    "I just want someone to tell me exactly what to do",
    "I'm tired of feeling undervalued"
  ]
}
```

**3. Offer Builder Details** (`offer_creations` table)
```javascript
{
  offer_name: "Executive to Empire",
  dream_outcome: "Build a $20k/month coaching business in 90 days",
  target_audience: "Corporate leaders transitioning to coaching",
  core_offer_price: 4997,
  key_benefits: [
    "Done-for-you offer creation",
    "Weekly group coaching calls",
    "Private Slack community"
  ],
  bonuses: [
    "LinkedIn content templates",
    "Sales call scripts"
  ],
  proof_points: [
    "Sarah went from $0 to $15k/month in 60 days",
    "Mark closed his first $5k client in week 2"
  ],
  grand_slam_score: 87
}
```

**4. Past Marketing Performance** (`marketing_tasks` table)
```javascript
{
  top_performing_posts: [
    {
      content_type: "transformation_story",
      platform: "LinkedIn",
      engagement: { likes: 234, comments: 45, shares: 12 },
      topic: "Client success story"
    },
    {
      content_type: "educational",
      platform: "LinkedIn",
      engagement: { likes: 189, comments: 32, shares: 8 },
      topic: "Pricing framework"
    }
  ],
  best_posting_time: "Tuesday 9am",
  best_content_types: ["transformation_story", "behind_the_scenes"],
  audience_engagement_patterns: "High response to vulnerability + tactical advice"
}
```

**5. Recent Deal Context** (`sales_deals` table)
```javascript
{
  recent_wins: [
    { contact_name: "Sarah M.", product: "Core Offer", value: 4997 },
    { contact_name: "Mike T.", product: "VIP Package", value: 9997 }
  ],
  common_objections_heard: [
    "I need to think about it",
    "It's too expensive"
  ],
  hot_leads: 3,
  pipeline_value: 24500
}
```

---

#### Content Generation by Task Type

**Task: Transformation Story (LinkedIn)**
```javascript
// Context sent to AI
{
  task_type: "transformation_story",
  platform: "LinkedIn",
  context: {
    persona: { /* FindMyFlow data */ },
    proof: { /* Recent wins + testimonials */ },
    offer: { /* Offer Builder details */ },
    past_performance: { /* What's worked before */ }
  },
  instructions: "Write a transformation story post. Use a recent client win. Match the user's voice (analytical yet empathetic). Include a soft CTA."
}

// AI Output
"6 months ago, Sarah was billing $150/hour and burning out.

Yesterday, she texted me: 'Just closed my 3rd $5k client this month.'

Here's what changed (it's not what you think):

She didn't get more certifications.
She didn't 'work on her mindset.'
She didn't post more on LinkedIn.

She built ONE offer. The right offer.

An offer so clear that her ideal clients say 'yes' before she even mentions price.

That's what happens when you stop selling hours and start selling transformations.

Thinking about making this shift?
Drop a 🔥 and I'll share how Sarah structured her offer."
```

**Task: Educational Framework Post**
```javascript
// Uses validation pain points + offer methodology
{
  task_type: "educational",
  platform: "LinkedIn",
  context: {
    pain_points: ["I don't know how to price my services"],
    methodology: { /* From Offer Builder steps */ },
    proof: { /* Results from using this method */ }
  }
}

// AI Output
"The $150/hour trap (and how to escape it):

Most coaches price by the hour because that's what they know from corporate.

But hourly pricing has 3 fatal flaws:
1. You're selling your TIME, not your TRANSFORMATION
2. Clients focus on hours instead of outcomes
3. You cap your income at your available hours

Here's the shift I teach:

Instead of 'I charge $200/hour for coaching'...

Try: 'I help burnt-out executives build $20k/month coaching businesses in 90 days. Investment: $4,997.'

Same skills. Same YOU. 10x the perceived value.

Which pricing approach are you using right now?"
```

---

#### Implementation

**1. Create Edge Function**

`/supabase/functions/content-generator/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk'

const anthropic = new Anthropic()

serve(async (req) => {
  const { task_type, platform, user_id, project_id } = await req.json()

  // Fetch all context
  const [persona, validation, offer, marketing, deals] = await Promise.all([
    fetchPersonaData(user_id),
    fetchValidationInsights(user_id),
    fetchOfferDetails(user_id, project_id),
    fetchMarketingPerformance(user_id),
    fetchRecentDeals(user_id)
  ])

  const prompt = buildPrompt(task_type, platform, {
    persona,
    validation,
    offer,
    marketing,
    deals
  })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })

  return new Response(JSON.stringify({
    content: response.content[0].text,
    context_used: { persona: !!persona, validation: !!validation, offer: !!offer }
  }))
})
```

**2. Create Context Service**

`/src/lib/contentContext.js`

```javascript
import { supabase } from './supabaseClient'

export async function gatherContentContext(userId, projectId) {
  const [persona, validation, offer, marketing, deals] = await Promise.all([
    fetchPersonaData(userId),
    fetchValidationInsights(userId, projectId),
    fetchOfferDetails(userId, projectId),
    fetchTopPerformingContent(userId, 5),
    fetchRecentWins(userId, 3)
  ])

  return {
    persona,
    validation,
    offer,
    marketing,
    deals,
    hasFullContext: !!(persona && validation && offer)
  }
}

// Show user what context is available
export function getContextCompleteness(context) {
  const items = [
    { key: 'persona', label: 'FindMyFlow Persona', complete: !!context.persona },
    { key: 'validation', label: 'Validation Insights', complete: !!context.validation },
    { key: 'offer', label: 'Offer Details', complete: !!context.offer },
    { key: 'marketing', label: 'Past Performance', complete: context.marketing?.length > 0 },
    { key: 'deals', label: 'Recent Wins', complete: context.deals?.length > 0 }
  ]

  return {
    items,
    percentage: Math.round((items.filter(i => i.complete).length / items.length) * 100)
  }
}
```

**3. UI Component**

`/src/components/crm/ContentGenerator.jsx`

```jsx
function ContentGenerator({ task, onGenerate }) {
  const [context, setContext] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [content, setContent] = useState('')

  useEffect(() => {
    gatherContentContext(userId, projectId).then(setContext)
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    const { data } = await supabase.functions.invoke('content-generator', {
      body: {
        task_type: task.content_type,
        platform: task.platform,
        user_id: userId,
        project_id: projectId
      }
    })
    setContent(data.content)
    setGenerating(false)
  }

  const completeness = getContextCompleteness(context)

  return (
    <div className="content-generator">
      {/* Show context completeness */}
      <div className="context-status">
        <h4>AI Context: {completeness.percentage}%</h4>
        <div className="context-items">
          {completeness.items.map(item => (
            <span key={item.key} className={item.complete ? 'complete' : 'missing'}>
              {item.complete ? '✓' : '○'} {item.label}
            </span>
          ))}
        </div>
        {completeness.percentage < 60 && (
          <p className="hint">
            Complete more flows for better AI suggestions!
          </p>
        )}
      </div>

      {/* Generate button */}
      <button onClick={handleGenerate} disabled={generating}>
        {generating ? 'Generating...' : '✨ Generate Content'}
      </button>

      {/* Output */}
      {content && (
        <div className="generated-content">
          <textarea value={content} onChange={e => setContent(e.target.value)} />
          <button onClick={() => navigator.clipboard.writeText(content)}>
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  )
}
```

---

#### Files to Create

```
src/
├── lib/
│   └── contentContext.js          # Gather all context for AI
├── components/crm/
│   ├── ContentGenerator.jsx       # Generate button + output UI
│   └── ContentGenerator.css
supabase/
└── functions/
    └── content-generator/
        └── index.ts               # Edge function for AI generation
```

#### Files to Modify

- `/src/pages/crm/CRMMarketing.jsx` - Add ContentGenerator to task cards
- `/src/pages/crm/CRMMarketing.css` - Style generator UI

---

### 3.2 AI Script Personalization

**What:** Adapt script templates to specific deal context.

**Example:**
```
Original: "What would it mean for your [BUSINESS TYPE] if you could [DREAM OUTCOME]?"

Personalized: "What would it mean for your coaching practice if you could
consistently close $5k clients without feeling salesy?"
```

**Context Used:**
- Deal contact name
- Deal product type
- Lead score insights
- Previous conversation notes

---

### 3.3 AI Offer Improvement Suggestions

**What:** After Grand Slam scoring, AI suggests specific improvements.

**Example Output:**
```
Your offer scored 72/100. Here's how to reach 90+:

1. PROOF (Current: 6/10)
   - Add 2 more case studies with specific numbers
   - Include before/after screenshots

2. SPEED (Current: 7/10)
   - Your "results in 90 days" could be "first win in 7 days"
   - Add quick-start bonus for immediate momentum

3. EASE (Current: 8/10)
   - Strong! Consider adding done-for-you templates
```

---

## Phase 4: Future Enhancements

These are aspirational - not for V1 launch:

### 4.1 User Customization
- Users connect their own Supabase
- Custom marketing task templates
- White-label for coaches

### 4.2 Mobile Optimization
- PWA improvements
- Voice-to-text for notes
- Quick actions from lock screen

### 4.3 Community Features
- Anonymous leaderboards
- Offer template marketplace
- Success story sharing

### 4.4 Advanced Analytics
- Conversion funnel visualization
- Script effectiveness tracking
- Revenue forecasting

---

## Technical Patterns to Follow

### CSS (Custom, NOT Tailwind)
```css
/* Use CSS variables */
.component {
  background: var(--warm-gray);
  color: var(--text-gray);
  border: 1px solid var(--border-gray);
}

/* Accent colors */
.primary-button {
  background: var(--purple);
  color: var(--white);
}
```

### AI Calls (Edge Functions)
```javascript
// CORRECT
const { data } = await supabase.functions.invoke('function-name', {
  body: { action: 'do_something', context }
})

// WRONG - No direct API calls
fetch('https://api.anthropic.com/...')
```

### Auto-Save Pattern
```javascript
import { useAutoSave } from '../hooks/useAutoSave'
const { saveData, isSaving } = useAutoSave('table_name', recordId)
```

### Project-Centric Queries
```javascript
// Always scope by project_id
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)
  .eq('project_id', projectId) // Don't forget this
```

---

## File Structure Reference

```
src/
├── flows/
│   ├── FindMyFlow/           # Persona discovery
│   ├── ValidationFlow/       # Surveys
│   └── OfferBuilder100M/     # $100M Offer Builder v2
├── pages/crm/
│   ├── CRMDashboard.jsx      # Command center
│   ├── CRMMarketing.jsx      # Quest board
│   ├── CRMSales.jsx          # Pipeline + Lead Scoring
│   ├── CRMAnalytics.jsx      # Report cards
│   ├── PTUFCalculator.jsx    # Pricing calculator
│   ├── LTVCalculator.jsx     # Lifetime value
│   ├── CACTracker.jsx        # Acquisition cost
│   ├── SalesScripts.jsx      # Script library
│   └── SmartAlerts.jsx       # Notifications
├── components/crm/
│   ├── LeadScoreSliders.jsx  # PTUF sliders
│   ├── LeadScoreBadge.jsx    # Temperature badge
│   └── ScriptsModal.jsx      # Scripts in deal modal
├── lib/
│   ├── crm/
│   │   ├── taskService.js    # Marketing tasks
│   │   ├── dealService.js    # Sales pipeline
│   │   ├── analyticsService.js
│   │   └── statsService.js   # Gamification
│   ├── supabaseClient.js     # DB connection
│   └── scripts.js            # Script operations
└── hooks/
    └── useAutoSave.js        # Auto-save hook
```

---

## Priority Order for Implementation

### Quick Wins (1-2 days each)
1. ~~**2.2 CRM Bottom Toolbar** - Context-aware nav (Sales/Marketing/Analytics/Portal)~~ **DONE**
2. ~~**1.3 Offer Builder → CRM Products** - Dynamic product dropdown from user's offers~~ **DONE (existed)**
3. ~~**1.6.1 Week Navigation** - Browse past/future weeks in Marketing~~ **DONE (existed)**
4. ~~**1.5 Smart Script Suggestions** - Recommend scripts based on lead score~~ **DONE (existed)**

### Core Integrations (2-3 days each)
5. ~~**2.1 Project Switcher** - Switch between projects in Command Center~~ **DONE**
6. ~~**1.1 Persona → Offer Builder** - FindMyFlow data pre-fills Offer Builder~~ **DONE (existed)**
7. ~~**1.2 Validation → Offer Builder** - Survey insights enhance proof/objections~~ **DONE (existed)**
8. ~~**3.1 AI Content Generation** - Connected to all user data (major differentiator)~~ **DONE + Enhanced**

### System Improvements (3-5 days each)
9. ~~**1.6.2 Platform Analytics** - Breakdown by LinkedIn/Twitter/Instagram~~ **DONE (existed)**
10. **1.4 Unified Gamification** - Single points system across all modules (HOLD - needs formal plan)
11. **2.3 Command Center Dashboard** - Unified view of everything

---

## Questions to Confirm Before Building

1. Should Command Center replace CRM Dashboard or be a new `/command-center` route?
2. For unified gamification, extend `user_crm_stats` or create new table?
3. Priority: Focus on integrations first, or Command Center design first?

---

*End of next phase guide*
