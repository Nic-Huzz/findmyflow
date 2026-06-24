# Flow Academy V1 Implementation Plan

**Created:** 2026-01-05
**Based on:** next-phase-guide.md
**Goal:** Transform separate modules into one unified system

---

## Implementation Order

### Sprint 1: Quick Wins (Foundation)

#### Task 1.1: Offer Builder → CRM Products Connection
**Priority:** HIGH | **Complexity:** LOW

**What:** Products created in Offer Builder auto-populate CRM deal dropdown instead of hardcoded values.

**Files to Modify:**
- `/src/lib/crm/dealService.js` - Add `fetchUserProducts()` function
- `/src/pages/crm/CRMSales.jsx` - Use dynamic products in Add Deal modal

**Implementation:**
```javascript
// In dealService.js
export async function fetchUserProducts(userId) {
  const { data } = await supabase
    .from('offer_creations')
    .select('id, offer_name, final_price, offer_type')
    .eq('user_id', userId)
    .eq('status', 'complete')
    .order('created_at', { ascending: false })

  // Fallback to defaults if no offers yet
  return data.length > 0 ? data : DEFAULT_PRODUCTS
}
```

**Acceptance Criteria:**
- [ ] Add Deal modal shows user's Offer Builder products
- [ ] Falls back to default products if none created
- [ ] Price auto-fills from offer data

---

#### Task 1.2: Week Navigation in Marketing
**Priority:** HIGH | **Complexity:** LOW

**What:** Allow users to browse past/future weeks in CRMMarketing.

**Files to Modify:**
- `/src/pages/crm/CRMMarketing.jsx` - Add weekOffset state, navigation buttons
- `/src/pages/crm/CRMMarketing.css` - Style week navigation

**Implementation:**
```javascript
const [weekOffset, setWeekOffset] = useState(0)

// In render:
<div className="week-nav">
  <button onClick={() => setWeekOffset(w => w - 1)}>← Previous</button>
  <span>{getWeekLabel(weekOffset)}</span>
  <button onClick={() => setWeekOffset(w => w + 1)} disabled={weekOffset >= 0}>
    Next →
  </button>
</div>
```

**Acceptance Criteria:**
- [ ] Previous/Next buttons navigate weeks
- [ ] "Next" disabled when on current week
- [ ] Week label shows date range
- [ ] Tasks filter by selected week

---

#### Task 1.3: Smart Script Suggestions
**Priority:** MEDIUM | **Complexity:** LOW

**What:** Based on deal's lead score, suggest which script to use.

**Files to Modify:**
- `/src/components/crm/ScriptsModal.jsx` - Add suggestion logic
- `/src/components/crm/ScriptsModal.css` - Style suggestions section

**Implementation:**
```javascript
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

**Acceptance Criteria:**
- [ ] "Recommended for this deal" section at top of Scripts Modal
- [ ] Shows reason for each suggestion
- [ ] Only shows if deal has lead scores

---

### Sprint 2: Core Integrations

#### Task 2.1: Persona → Offer Builder Connection
**Priority:** HIGH | **Complexity:** MEDIUM

**What:** FindMyFlow data pre-fills Offer Builder suggestions.

**Files to Create:**
- `/src/lib/offerBuilder.js` - Add `fetchPersonaData()` function

**Files to Modify:**
- `/src/flows/OfferBuilder100M/Step1A.jsx` - Check for persona data, show recommendations
- `/src/flows/OfferBuilder100M/Step1B.jsx` - Pre-fill dream outcome field

**Database Query:**
```sql
SELECT ideal_customer, core_problem, unique_approach, skills, values
FROM nikigai_clusters
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 1;
```

**Acceptance Criteria:**
- [ ] Offer Builder Step 1A shows "Based on your FindMyFlow results..."
- [ ] Pre-selects recommended bucket
- [ ] Step 1B pre-fills dream outcome suggestions
- [ ] Works gracefully if no FindMyFlow data exists

---

#### Task 2.2: Validation → Offer Builder Connection
**Priority:** HIGH | **Complexity:** MEDIUM

**What:** Survey responses enhance proof and testimonials in Offer Builder.

**Files to Create:**
- `/src/lib/validation.js` - Add `fetchValidationInsights()` function

**Files to Modify:**
- `/src/flows/OfferBuilder100M/Step3.jsx` - Show validation survey quotes
- `/src/flows/OfferBuilder100M/Step6.jsx` - Pre-populate objections from survey data

**Data Passed:**
```javascript
{
  pain_points: [...],         // What customers struggle with
  desired_outcomes: [...],    // What they want to achieve
  objections: [...],          // What stops them from buying
  testimonial_quotes: [...]   // Direct quotes from surveys
}
```

**Acceptance Criteria:**
- [ ] Step 3 shows survey testimonials as proof options
- [ ] Step 6 pre-fills obstacles from objections
- [ ] Works gracefully if no validation data exists

---

#### Task 2.3: AI Content Generation (Major Feature)
**Priority:** HIGH | **Complexity:** HIGH

**What:** AI creates personalized marketing content using all user data.

**Files to Create:**
- `/src/lib/contentContext.js` - Gather all context for AI
- `/src/components/crm/ContentGenerator.jsx` - Generate button + output UI
- `/src/components/crm/ContentGenerator.css` - Styling
- `/supabase/functions/content-generator/index.ts` - Edge function

**Files to Modify:**
- `/src/pages/crm/CRMMarketing.jsx` - Add ContentGenerator to task cards

**Data Sources Connected:**
1. FindMyFlow Persona (`nikigai_clusters`)
2. Validation Survey Insights (`validation_responses`)
3. Offer Builder Details (`offer_creations`)
4. Past Marketing Performance (`marketing_tasks`)
5. Recent Deal Context (`sales_deals`)

**UI Features:**
- Context completeness indicator (percentage)
- Shows which flows are connected
- Prompts to complete flows for better content
- Editable generated content
- Copy to clipboard

**Acceptance Criteria:**
- [ ] "Generate Content" button on task cards
- [ ] Context indicator shows completeness %
- [ ] AI uses all available context
- [ ] Content is platform-specific (LinkedIn vs Twitter vs Email)
- [ ] User can edit before copying

---

### Sprint 3: System Improvements

#### Task 3.1: Platform Analytics Breakdown
**Priority:** MEDIUM | **Complexity:** MEDIUM

**What:** Show performance metrics by platform (LinkedIn, Twitter, Instagram, Email).

**Files to Create:**
- `/src/lib/crm/analyticsService.js` - Add `fetchPlatformBreakdown()` function (if not exists)

**Files to Modify:**
- `/src/pages/crm/CRMAnalytics.jsx` - Add platform breakdown section
- `/src/pages/crm/CRMAnalytics.css` - Style breakdown table

**UI Design:**
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

**Acceptance Criteria:**
- [ ] Platform breakdown table in Analytics
- [ ] Shows engagement totals per platform
- [ ] Shows best performing post per platform
- [ ] Responsive on mobile (2 columns)

---

#### Task 3.2: Unified Gamification System
**Priority:** MEDIUM | **Complexity:** HIGH

**What:** One points/XP system across all modules.

**Database Migration:**
```sql
ALTER TABLE user_crm_stats RENAME TO user_gamification;

ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS
  findmyflow_completed BOOLEAN DEFAULT false,
  validation_completed BOOLEAN DEFAULT false,
  offer_builder_completed BOOLEAN DEFAULT false,
  total_offers_created INTEGER DEFAULT 0,
  total_deals_won INTEGER DEFAULT 0,
  total_revenue_closed INTEGER DEFAULT 0;
```

**Files to Create:**
- `/src/lib/gamification.js` - Unified points service
- `/src/hooks/useGamification.js` - Hook for awarding points

**Files to Modify:**
- `/src/lib/crm/statsService.js` - Import from unified gamification
- All flow completion handlers - Call `awardPoints()` on completion

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

**Acceptance Criteria:**
- [ ] Single points total across all modules
- [ ] Points awarded on flow completions
- [ ] Points awarded on CRM actions
- [ ] Streak tracking unified

---

#### Task 3.3: Command Center Dashboard
**Priority:** LOW | **Complexity:** HIGH

**What:** Single view showing everything that matters today.

**Location:** Enhance `/src/pages/crm/CRMDashboard.jsx`

**Layout Sections:**
1. TODAY - Pending tasks count, DMs to send
2. PIPELINE - Warm pipeline value, hot leads needing action
3. OFFER HEALTH - Grand Slam score with improvement suggestions
4. SMART ALERTS - Top 3-5 actionable alerts
5. QUICK ACTIONS - Add Deal, New Task, View Analytics, Offers

**Data Sources:**
- TODAY: `marketing_tasks` where `date = today` and `completed = false`
- PIPELINE: `sales_deals` aggregated by temperature
- OFFER HEALTH: `offer_creations` with grand_slam_score
- SMART ALERTS: From SmartAlerts.jsx logic

**Acceptance Criteria:**
- [ ] Single view shows daily priorities
- [ ] Click-through to relevant pages
- [ ] Mobile responsive
- [ ] Updates in real-time

---

## Questions to Answer Before Building

1. **Command Center:** Should it replace CRM Dashboard or be a new `/command-center` route?
   - **Recommendation:** Enhance CRMDashboard - avoids adding complexity

2. **Unified Gamification:** Extend `user_crm_stats` or create new table?
   - **Recommendation:** Rename and extend `user_crm_stats` - simpler migration

3. **Sprint Priority:** Focus on integrations first, or Command Center design first?
   - **Recommendation:** Integrations first (Sprint 1-2) - builds foundation for Command Center

---

## Deployment Checklist Per Sprint

### Sprint 1 Deployment
```bash
# No migrations needed
# No new edge functions

npm run build
# Deploy to Vercel
```

### Sprint 2 Deployment
```bash
# Deploy content-generator edge function
SUPABASE_ACCESS_TOKEN=sbp_xxx npx supabase functions deploy content-generator

npm run build
# Deploy to Vercel
```

### Sprint 3 Deployment
```bash
# Run gamification migration
PGPASSWORD="xxx" psql "connection_string" -f /path/to/migration.sql

npm run build
# Deploy to Vercel
```

---

## Testing Focus Per Sprint

### Sprint 1
- [ ] CRM Sales: Add Deal modal shows user's products
- [ ] CRM Marketing: Week navigation works
- [ ] CRM Sales: Scripts modal shows suggestions

### Sprint 2
- [ ] Offer Builder: Pre-fills from FindMyFlow data
- [ ] Offer Builder: Shows validation testimonials
- [ ] CRM Marketing: Generate content button works
- [ ] AI output quality check

### Sprint 3
- [ ] CRM Analytics: Platform breakdown displays
- [ ] Points awarded on all flow completions
- [ ] Command Center shows unified data

---

*Ready to begin Sprint 1 when testing is complete.*
