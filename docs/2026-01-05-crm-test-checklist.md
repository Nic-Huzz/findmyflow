# CRM & CSS Fixes Test Checklist
**Date:** 2026-01-05

## CSS Fixes Test Checklist

### Profile Page (`/me`)
- [ ] **Mobile View (390px)**: Voice cards (Essence/Protective) stack vertically
- [ ] **Tablet View (768px)**: Voice cards stack vertically
- [ ] **Desktop View**: Voice cards display side by side
- [ ] Stats grid displays correctly at all breakpoints
- [ ] Archetype card expand/collapse works

### Challenge Page (`/7-day-challenge`)
- [ ] **LaunchReviewInput** (Post-Launch Review quest):
  - [ ] Text is readable (dark text on light background)
  - [ ] Progress dots visible
  - [ ] Slider works and value displays
  - [ ] Textarea input works
  - [ ] Navigation buttons (Back/Next/Complete) work
  - [ ] Review summary displays correctly

### CRM Pages
- [ ] **CRM Analytics** (`/crm/analytics`): Grid layouts work on mobile
- [ ] **CRM Sales** (`/crm/sales`): Pipeline grid responsive
- [ ] **Screenshot Upload**: Modal opens, file upload works

---

## New Features Test Checklist (from CRM build)

### Lead Scoring
- [ ] Deal cards show lead score badge (Hot/Warm/Cold)
- [ ] Click deal -> Lead Score Sliders appear (Pain/Trust/Urgency/Fit)
- [ ] Save scores updates the badge
- [ ] Unscored deals prompt appears for deals without scores

### Hormozi Scripts Modal
- [ ] Click "Scripts" button on deal detail modal
- [ ] Scripts load by stage (Discovery/Proposal/Objection/Close)
- [ ] Copy script to clipboard works
- [ ] Mark script as used tracks usage

### AI Screenshot Deal Capture
- [ ] Click "From Screenshot" button on Sales Pipeline
- [ ] Upload image (JPEG/PNG/GIF/WebP, max 5MB)
- [ ] "Analyze with AI" sends to Claude Vision
- [ ] Review extracted deal info (name, email, product, stage, temperature)
- [ ] Edit fields before creating
- [ ] "Create Deal" adds to pipeline
- [ ] Matching existing deals shown if applicable

---

## Week-Based Challenge System Test Checklist

### Leaderboard Changes (`/7-day-challenge` -> Leaderboard tab)
- [ ] **"This Week" View**: Shows points earned Mon-Sun of current week only
- [ ] **"All Time" View**: Shows total cumulative points
- [ ] Switching between views updates rankings correctly
- [ ] User rank updates based on selected view
- [ ] No "Day X/7" text shown on leaderboard entries
- [ ] Group code sharing works (if in a group)
- [ ] WhatsApp share message says "Find My Flow Challenge" (not "7-Day")

### Weekly Points Calculation
- [ ] Complete a quest -> points appear in "This Week" leaderboard
- [ ] "This Week" points reset to 0 on Monday (new week)
- [ ] "All Time" points continue accumulating across weeks

### Weekly Planning Flow
- [ ] New week (no plan for current Mon-Sun) triggers WeeklyPlanningFlow
- [ ] Edit Plan button appears after plan is created
- [ ] Week type badge (Push/Flow/Rest/Launch) displays in header

### Header Changes
- [ ] No "Start New 7-Day Challenge" button at Day 7
- [ ] Streak flame displays correctly
- [ ] Week label shows "Week of {date}"

### Files Changed (Week-Based System)
- `src/hooks/useChallengeData.js` - Leaderboard filtering & weekly point calculation
- `src/components/ChallengeLeaderboard.jsx` - Removed Day X/7, updated props
- `src/components/ChallengeHeader.jsx` - Removed restart button
- `src/Challenge.jsx` - Removed unused props

---

## Validation Flow v2.0 Test Checklist

### Create Flow with Context (`/validation-flows`)
- [ ] Click "+ Send Form" button
- [ ] **Step 1**: Select flow type (Validation or Testing)
- [ ] Click "Next: Add Context"
- [ ] **Step 2**: Fill in context fields:
  - [ ] "What problem are you solving?" field works
  - [ ] "What solution are you exploring?" field works
  - [ ] "Who is this for?" field works
- [ ] All 3 fields required before "Create Flow" enables
- [ ] Click "Create Flow" → success alert with share URL
- [ ] Flow appears in list with custom name

### Public Validation Flow (`/v/:shareToken`)
- [ ] **Screen 0.0**: Welcome message displays
- [ ] **Screen 0.1**: Problem area and solution concept display with custom text
- [ ] **Screen 0.2**: Audience description displays, fit check options work
- [ ] Selecting "Not really my situation" → shows exit screen
- [ ] Selecting "Yes" or "Somewhat" → continues to questions
- [ ] **Questions**: Placeholders (`{{problemArea}}`, etc.) replaced with custom text
- [ ] All 13 questions flow correctly
- [ ] Email capture works
- [ ] Thank you screen shows custom problem area

### Files Changed (Validation Flow v2.0)
- `public/validation-flow-vibe-riser.json` - New onboarding steps, placeholders
- `src/lib/validationFlows.js` - Added placeholders param to createValidationFlow
- `src/pages/ValidationFlowsManager.jsx` - 2-step modal with context form
- `src/pages/ValidationFlowsManager.css` - Context form styles
- `src/pages/PublicValidationFlow.jsx` - Placeholder replacement logic

### Migration to Run
- `20260105200000_validation_flow_placeholders.sql` - Adds placeholders JSONB column

---

## Quick Smoke Tests

| Route | What to Check |
|-------|---------------|
| `/me` | Profile loads, voices stack on mobile |
| `/7-day-challenge` | Quests display, LaunchReview readable |
| `/7-day-challenge?tab=leaderboard` | Weekly/All-time toggle, no Day X/7 |
| `/validation-flows` | Create flow modal, 2-step context form |
| `/crm` | Dashboard loads |
| `/crm/sales` | Pipeline displays, screenshot button works |
| `/crm/analytics` | Charts/grids responsive |

---

## Deployment Checklist

### Edge Functions to Deploy
```bash
SUPABASE_ACCESS_TOKEN=sbp_7944efd6f507cccb90784510905d04d3845fd6ef npx supabase functions deploy analyze-deal-screenshot
```

### Migrations to Run
- `20260105140000_lead_scoring.sql` - Lead scoring computed columns
- `20260105150000_hormozi_scripts.sql` - Sales scripts table
- `20260105160000_fix_hormozi_scripts.sql` - Fix is_active column
- `20260105170000_deal_screenshots_storage.sql` - Screenshot storage bucket

---

## Files Changed

### CSS Files (Light Theme / Scoping Fixes)
- `src/components/LaunchReviewInput.css` - Dark to light theme
- `src/Profile.css` - Mobile stacking for stats-grid
- `src/pages/crm/CRMAnalytics.css` - Scoped unscoped selectors
- `src/pages/crm/CRMSales.css` - Scoped selectors
- `src/components/crm/ScriptsModal.css` - Light theme
- `src/components/crm/LeadScoreSliders.css` - Light theme
- `src/components/crm/LeadScoreBadge.css` - Light theme
- `src/components/crm/ScreenshotUpload.css` - New file

### New Components
- `src/components/crm/ScreenshotUpload.jsx`
- `src/lib/screenshotAnalysis.js`

### Edge Functions
- `supabase/functions/analyze-deal-screenshot/index.ts`

---

## Sprint 1: Quick Wins Test Checklist

### Task 1.1: Dynamic Products Dropdown (`/crm/sales`)
- [ ] Click "+ Add Deal" button
- [ ] **Without Offer Builder data**: Shows default products (Attraction Offer, Core Offer, etc.)
- [ ] **With Offer Builder data**: Shows user's custom offers from Offer Builder
- [ ] Purple "From Offer Builder" badge appears when using custom products
- [ ] Product price auto-fills when selecting a product
- [ ] Deal value can still be manually edited
- [ ] Created deal shows correct product name

### Task 1.2: Week Navigation (`/crm/marketing`)
- [ ] Week navigation arrows (← →) visible below "Marketing Quests" title
- [ ] "This Week" badge shows on current week
- [ ] Click ← to go to previous week (up to 4 weeks back)
- [ ] Click → to return to current week
- [ ] → button disabled when on current week
- [ ] ← button disabled when 4 weeks back
- [ ] Week label updates (e.g., "Jan 1 - Jan 5")
- [ ] Tasks load correctly for each week
- [ ] Day tabs still work (Mon-Fri)
- [ ] Completion status persists per week

### Task 1.3: Smart Script Suggestions (`/crm/sales` → Deal → Scripts)
- [ ] Open a deal that has lead scores
- [ ] Click "Scripts" button
- [ ] **Smart Suggestions section** appears at top (green gradient background)
- [ ] Suggestions show based on lead scores:
  - [ ] Low pain score (<5) → Suggests "Cost of Inaction" type script
  - [ ] Low trust score (<5) → Suggests "Social Proof" type script
  - [ ] Low urgency score (<5) → Suggests "Opportunity Cost" type script
- [ ] Each suggestion shows reason (e.g., "Low pain score (3/10) - amplify the problem")
- [ ] Copy button works on suggested scripts
- [ ] Deal without lead scores → Smart Suggestions section hidden
- [ ] Stage-based recommendations still appear below smart suggestions

---

## Sprint 1: Files Changed

### Dynamic Products
- `src/lib/crm/dealService.js` - Added `fetchUserProducts()` function
- `src/lib/crm/index.js` - Exported new function
- `src/pages/crm/CRMSales.jsx` - Loads and uses dynamic products
- `src/pages/crm/CRMSales.css` - Added `.custom-products-badge` styling

### Week Navigation
- `src/lib/crm/taskService.js` - Updated `getWeekInfo()` to accept offset, added `getWeekStartDate()`
- `src/lib/crm/index.js` - Exported `getWeekStartDate`
- `src/pages/crm/CRMMarketing.jsx` - Added `weekOffset` state, navigation handlers, UI
- `src/pages/crm/CRMMarketing.css` - Added `.week-nav`, `.week-nav-btn`, `.current-week-badge`

### Smart Script Suggestions
- `src/components/crm/ScriptsModal.jsx` - Added `getSmartSuggestions()` function, new JSX section
- `src/components/crm/ScriptsModal.css` - Added `.smart-suggestions-section` and related styles

---

## Sprint 2: Core Integrations Test Checklist

### Task 2.1: Persona → Offer Builder Connection (`/offer-builder-100m`)
- [ ] Start Offer Builder flow with FindMyFlow data completed
- [ ] **Step 1A (Bucket Selection)**: Purple context panel appears showing:
  - [ ] "FROM YOUR FINDMYFLOW" header with compass icon
  - [ ] Your skills as blue tags
  - [ ] Problems you solve as amber tags
  - [ ] Ideal customer persona name
  - [ ] "Use these insights..." tip text
- [ ] Panel only shows if user has FindMyFlow data (skills or problems)
- [ ] Without FindMyFlow data → no panel appears

### Task 2.2: Validation → Offer Builder Connection
- [ ] **Step 3 (Proof Stack)**: Green validation panel appears if user has validation data:
  - [ ] "FROM YOUR VALIDATION SURVEYS" header
  - [ ] Customer quotes displayed in styled quote boxes
  - [ ] Results they reported with checkmarks
  - [ ] "Use these real quotes..." tip text
- [ ] **Step 6 (Obstacles)**: Red objections panel appears if user has validation objections:
  - [ ] "OBJECTIONS FROM YOUR VALIDATION SURVEYS" header
  - [ ] Objection chips - click to add to obstacle list
  - [ ] Already-added objections show with checkmark
  - [ ] "Click to add these real objections..." tip text
- [ ] Without validation data → panels don't appear

### Task 2.3: Platform Analytics Breakdown (`/crm/analytics`)
- [ ] "Platform Breakdown" section appears after Sales Performance
- [ ] Each platform card shows:
  - [ ] Platform emoji and name
  - [ ] Engagement stat
  - [ ] Leads generated
  - [ ] Revenue from platform
  - [ ] Engagement bar with platform color
  - [ ] Likes/Comments/Shares/DMs breakdown
- [ ] Platform totals row shows:
  - [ ] Total Engagement
  - [ ] Total Leads
  - [ ] Total Revenue (highlighted green)
- [ ] Platforms sorted by engagement (highest first)
- [ ] Empty state: section hidden if no platform data

---

## Sprint 2: Files Changed

### Persona → Offer Builder
- `src/flows/OfferBuilder100M/components/Step1A_BucketSelection.jsx` - Added FindMyFlow context panel
- `src/flows/OfferBuilder100M/OfferBuilder100M.css` - Added context panel styles (`.findmyflow-context`, `.context-tag`, etc.)

### Validation → Offer Builder
- `src/flows/OfferBuilder100M/components/Step3_ProofStack.jsx` - Added validation testimonials panel
- `src/flows/OfferBuilder100M/components/Step6_Obstacles.jsx` - Added validation objections panel, accepts contextData prop
- `src/flows/OfferBuilder100M/index.jsx` - Passes contextData to Step6_Obstacles
- `src/flows/OfferBuilder100M/OfferBuilder100M.css` - Added `.validation-proof-panel`, `.validation-objections-panel` styles

### Platform Analytics Breakdown
- `src/lib/crm/analyticsService.js` - Added `fetchPlatformBreakdown()` function with PLATFORM_INFO
- `src/lib/crm/index.js` - Exported `fetchPlatformBreakdown`
- `src/pages/crm/CRMAnalytics.jsx` - Added platform breakdown state, fetch, and JSX section
- `src/pages/crm/CRMAnalytics.css` - Added `.platform-breakdown-grid`, `.platform-card`, `.platform-totals` styles
