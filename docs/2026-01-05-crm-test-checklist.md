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
SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN npx supabase functions deploy analyze-deal-screenshot
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

---

## Sprint 3: Content System Upgrades Test Checklist
**Date:** 2026-01-06

### Batch Generator Improvements (`/crm/content` → Batch Generator)

#### Topic/Theme Input (New Step 1)
- [ ] Topic input field appears as first step
- [ ] Suggestion chips appear (Productivity, Transformation, etc.)
- [ ] Clicking chip fills topic field
- [ ] Topic badge displays throughout the flow
- [ ] Generated content reflects the topic theme

#### Preview Mode
- [ ] Preview button (👁️) appears next to each content type
- [ ] Click preview → modal shows template example
- [ ] All 12 templates have preview content
- [ ] Modal closes on X or outside click

#### Partial Regenerate
- [ ] After batch generation, each post has "🔄" regenerate button
- [ ] Click regenerate on single post
- [ ] Only that post regenerates (others unchanged)
- [ ] Loading spinner shows on regenerating post only
- [ ] New content replaces old content

#### Draft Save/Restore
- [ ] "Save Draft" button appears in header during flow
- [ ] Click Save Draft → success message
- [ ] Close modal, return to Batch Generator
- [ ] Yellow "Restore Draft" banner appears
- [ ] Click Restore → previous selections restored
- [ ] Click Dismiss → clears draft

### Content Generator Improvements (`/crm/content` → Single Generator)

#### Quick Presets
- [ ] 4 preset buttons display: Best Performer, Viral Hook, Story-Driven, Quick Value
- [ ] Click preset → button shows selected state
- [ ] Click again → deselects
- [ ] Selected preset influences generated content style

#### Hook Variants Generator
- [ ] "Generate 3 Hook Ideas" button appears below instructions
- [ ] Click → loading state shows
- [ ] 3 different hooks appear in picker modal
- [ ] Each hook has number badge (1, 2, 3)
- [ ] Click hook → adds to instructions field
- [ ] "Skip" closes the picker

#### CTA Library
- [ ] "Add CTA" button appears in result actions
- [ ] Click → CTA Library modal opens
- [ ] CTAs organized by category: Engagement, Lead Gen, Growth
- [ ] Click CTA → appends to content
- [ ] Modal closes after selection

### Post Metrics Screenshot Upload (`/crm/content`)

#### Content Selection
- [ ] Modal shows list of user's content history
- [ ] Each item shows preview, platform, type, date
- [ ] Items with existing metrics show "Has Metrics" badge
- [ ] Click item → moves to upload step

#### Screenshot Upload & Analysis
- [ ] Upload zone accepts JPEG, PNG, GIF, WebP
- [ ] File size limit: 5MB
- [ ] Preview shows after selection
- [ ] "Analyze with AI" sends to Claude Vision
- [ ] Loading animation during analysis

#### Metrics Review
- [ ] Confidence badge shows (High/Medium/Low)
- [ ] Platform auto-detected (Instagram, LinkedIn, etc.)
- [ ] Metrics grid shows: Likes, Comments, Shares, Saves, Impressions, Reach, Profile Visits, Follows
- [ ] All fields editable
- [ ] Performance tier badge (Viral/Good/Average/Low)
- [ ] AI insights list displays

#### Save Metrics
- [ ] "Save Metrics" updates content_history record
- [ ] Success screen with "Track Another" option
- [ ] engagement_data JSON populated in database

### Voice DNA Extraction (`/crm/content` or Voice Settings)

#### Content Input
- [ ] 3 textarea fields appear initially
- [ ] "+ Add another sample" adds more (up to 10)
- [ ] Character counter shows per field
- [ ] Valid badge (✓) appears when 100+ chars
- [ ] Analyze button disabled until 2+ valid samples

#### Voice Analysis
- [ ] DNA helix animation during analysis
- [ ] Progress steps show (Reading → Extracting → Identifying → Building)
- [ ] Handles 2-10 samples correctly

#### Voice DNA Review
- [ ] Voice Essence summary displays
- [ ] Tone descriptors as tags
- [ ] Formality meter (1-10 scale)
- [ ] Energy meter (1-10 scale)
- [ ] Signature phrases in quote boxes
- [ ] Writing patterns grid (Sentence Style, Uses Questions, etc.)
- [ ] Do's list (green)
- [ ] Don'ts list (red)
- [ ] Confidence badge

#### Save Voice Profile
- [ ] "Use This Voice" saves to voice_profiles table
- [ ] Success screen shows
- [ ] Content Generator now uses extracted voice

---

## Sprint 3: Edge Cases to Test

### Content Generation
- [ ] Generate with no voice profile → uses selected tone
- [ ] Generate with voice profile → uses voice settings
- [ ] Very long topic (500+ chars) → handles gracefully
- [ ] Special characters in topic → no errors

### Metrics Upload
- [ ] Upload non-image file → error message
- [ ] Upload >5MB file → error message
- [ ] Screenshot with no visible metrics → low confidence, mostly null values
- [ ] Content with existing metrics → can overwrite

### Voice DNA
- [ ] Only 1 sample → error about minimum
- [ ] Sample <100 chars → not counted as valid
- [ ] 10+ samples → capped at 10
- [ ] Very short content samples → lower confidence
- [ ] Mixed languages → should still extract patterns

### Offline/Network
- [ ] Network failure during batch generation → error handling
- [ ] Network failure during metrics analysis → retry option
- [ ] Network failure during voice extraction → retry option

---

## Sprint 3: Files Changed

### Batch Generator
- `src/components/crm/BatchContentGenerator.jsx` - Topic input, preview, partial regenerate, draft save
- `src/components/crm/BatchContentGenerator.css` - New styles for all features

### Content Generator
- `src/components/crm/ContentGenerator.jsx` - Quick presets, hook variants, CTA library
- `src/components/crm/ContentGenerator.css` - New styles (presets, hooks, CTA modal)

### Metrics Screenshot
- `src/components/crm/MetricsScreenshotUpload.jsx` - New component
- `src/components/crm/MetricsScreenshotUpload.css` - New styles
- `src/lib/screenshotAnalysis.js` - Added metrics analysis functions
- `supabase/functions/analyze-metrics-screenshot/index.ts` - New edge function

### Voice DNA
- `src/components/crm/VoiceDNAExtractor.jsx` - New component
- `src/components/crm/VoiceDNAExtractor.css` - New styles
- `src/lib/voiceProfile.js` - Added extractVoiceDNA, saveVoiceDNAProfile
- `supabase/functions/extract-voice-dna/index.ts` - New edge function

---

## Sprint 3: Edge Functions to Deploy

```bash
# Metrics Screenshot Analysis
SUPABASE_ACCESS_TOKEN=your_token npx supabase functions deploy analyze-metrics-screenshot

# Voice DNA Extraction
SUPABASE_ACCESS_TOKEN=your_token npx supabase functions deploy extract-voice-dna
```

---

## Sprint 3: Quick Smoke Tests

| Feature | Route | What to Check |
|---------|-------|---------------|
| Batch Generator | `/crm/content` | Topic input, preview icons, partial regenerate |
| Content Generator | `/crm/content` | Presets, hook generator, CTA library |
| Metrics Upload | `/crm/content` | Content selection, screenshot analysis |
| Voice DNA | Voice settings | Content paste, analysis, profile save |

---

## Sprint 4: Unified Approval Queue Test Checklist
**Date:** 2026-01-06

### Database Setup (COMPLETED)
- [x] `content_history` table created with all base columns
- [x] Queue columns added: `source`, `review_status`, `reviewer_notes`, `regeneration_count`
- [x] RLS policies in place
- [x] Indexes created for queue queries

### Content Queue Page (`/crm/content-queue`)

#### Navigation & Access
- [ ] Queue button (📬) visible in CRMMarketing header
- [ ] Click Queue button → navigates to `/crm/content-queue`
- [ ] Back button returns to `/crm/marketing`
- [ ] "View History" button navigates to `/crm/content-history`
- [ ] "Create Content" button navigates to `/crm/marketing`

#### Queue Stats (Filter Tabs)
- [ ] Shows total pending count
- [ ] Shows "Batch" count (source='batch')
- [ ] Shows "Autopilot" count (source='autopilot')
- [ ] Click tab filters the list
- [ ] Active tab is highlighted

#### Queue Toolbar
- [ ] "Select All" checkbox works
- [ ] Bulk "Approve Selected" button appears when items selected
- [ ] Sort dropdown: by Date, Platform, Type

#### Queue Items Display
- [ ] Each item shows: platform icon, platform name, content type, scheduled date
- [ ] Source badge: "batch" (blue) or "autopilot" (purple)
- [ ] Content preview (truncated to 200 chars)
- [ ] Click content to expand/collapse full text
- [ ] Checkbox for selecting individual items

#### Quick Actions (Per Item)
- [ ] ✓ Approve → sets status='scheduled', review_status='approved', removes from queue
- [ ] ✏️ Edit → opens inline textarea, Save/Cancel buttons
- [ ] 🔄 Regen → calls content-generator edge function, replaces content
- [ ] 📋 Copy → copies content to clipboard, shows toast
- [ ] ✗ Reject → sets status='archived', review_status='rejected', removes from queue
- [ ] 🗑️ Delete → prompts confirmation, permanently deletes

#### Bulk Actions
- [ ] Select multiple items with checkboxes
- [ ] Bulk approve updates all selected items
- [ ] Items disappear from list after bulk approve
- [ ] Toast shows count of approved items

#### Empty State
- [ ] When no pending items: shows "All caught up!" message
- [ ] When filter has no items: shows empty state for that filter

#### Toast Notifications
- [ ] Success toast (green) for approve, copy actions
- [ ] Error toast (red) for failures
- [ ] Toast auto-dismisses after 2.5 seconds

### Integration with Generators

#### Single Content Generator
- [ ] Generated content saves to content_history with `source='single'`
- [ ] Default `review_status='approved'` (doesn't need approval)

#### Batch Content Generator
- [ ] Generated content saves with `source='batch'`
- [ ] Content saves with `review_status='pending'`
- [ ] After batch complete → redirect to content queue
- [ ] All batch items appear in queue

#### Autopilot (When Built)
- [ ] Generated content saves with `source='autopilot'`
- [ ] Content saves with `review_status='pending'`

---

## Sprint 4: Edge Cases to Test

### Queue Loading
- [ ] Large queue (50+ items) → pagination or scroll performance
- [ ] Empty queue on load → shows empty state immediately
- [ ] Network failure → error message displayed

### Editing
- [ ] Edit long content (2000+ chars) → textarea scrollable
- [ ] Cancel edit → original content restored
- [ ] Save empty content → should prevent or warn

### Regeneration
- [ ] Regenerate without voice profile → uses default
- [ ] Regenerate with voice profile → uses voice settings
- [ ] Regenerate fails → shows error, keeps original content
- [ ] Multiple regenerates tracked in `regeneration_count`

### Bulk Actions
- [ ] Select all then filter → selection clears appropriately
- [ ] Bulk approve 20+ items → all succeed
- [ ] Network failure during bulk → partial success handling

---

## Sprint 4: Files Changed

### New Files
- `src/pages/crm/ContentQueue.jsx` - Queue page wrapper
- `src/pages/crm/ContentQueue.css` - Queue page styles
- `src/components/crm/ApprovalQueue.jsx` - Core queue component
- `src/components/crm/ApprovalQueue.css` - Queue component styles

### Modified Files
- `src/pages/crm/index.js` - Added ContentQueue export
- `src/pages/crm/CRMMarketing.jsx` - Added Queue button
- `src/pages/crm/CRMMarketing.css` - Added button styles
- `src/AppRouter.jsx` - Added `/crm/content-queue` route
- `src/components/crm/index.js` - Added ApprovalQueue export
- `src/components/crm/ContentGenerator.jsx` - Fixed JSX structure (fragment wrapper)
- `src/components/crm/ContentGenerator.css` - Namespaced @keyframes (cg-prefix)

### Database Migrations
- `20260106010000_content_history.sql` - Base table creation
- `20260106020000_content_history_queue_columns.sql` - Queue columns

---

## Sprint 4: Edge Functions to Deploy

```bash
# Content Generator (used by queue regeneration)
SUPABASE_ACCESS_TOKEN=your_token npx supabase functions deploy content-generator
```

---

## Sprint 4: Quick Smoke Tests

| Feature | Route | What to Check |
|---------|-------|---------------|
| Content Queue | `/crm/content-queue` | Items load, approve/reject work |
| Queue Access | `/crm/marketing` | 📬 Queue button visible, navigates correctly |
| Batch → Queue | `/crm/marketing` | Batch generate → items appear in queue |
| Toast Notifications | `/crm/content-queue` | Approve shows "Content approved!" toast |

---

## Deployment Checklist (Combined)

### Edge Functions
```bash
# From project root
SUPABASE_ACCESS_TOKEN=sbp_7944efd6f507cccb90784510905d04d3845fd6ef npx supabase functions deploy content-generator
SUPABASE_ACCESS_TOKEN=sbp_7944efd6f507cccb90784510905d04d3845fd6ef npx supabase functions deploy analyze-metrics-screenshot
SUPABASE_ACCESS_TOKEN=sbp_7944efd6f507cccb90784510905d04d3845fd6ef npx supabase functions deploy extract-voice-dna
```

### Migrations (Run in Supabase SQL Editor)
- [x] `20260106010000_content_history.sql` - Base content_history table
- [x] `20260106020000_content_history_queue_columns.sql` - Queue columns

---

## Tier 4: Autonomous System Foundation Test Checklist
**Date:** 2026-01-08

### CRM Dashboard Banner (`/crm`)

#### Not Started State (Default)
- [ ] Purple gradient banner shows "Setup Your Autonomous AI"
- [ ] Shows "~8 min" time estimate
- [ ] Pulsing robot emoji icon
- [ ] Click navigates to `/crm/setup`

#### In Progress State (1-2 flows complete)
- [ ] Banner shows "AI Setup X/3 Complete"
- [ ] Shows "XX% ready - Y flows remaining"
- [ ] Progress bar shows completion percentage
- [ ] Click navigates to `/crm/setup`

#### Complete State (All 3 flows done)
- [ ] Green gradient banner shows "AI System Ready - XX%"
- [ ] Shows "Your autonomous AI has the data it needs"
- [ ] Checkmark icon (no pulsing)
- [ ] Click navigates to `/crm/setup`

### Autonomous Setup Page (`/crm/setup`)

#### Page Layout
- [ ] Back button returns to `/crm`
- [ ] "Setup Your Autonomous AI" header
- [ ] Progress circle shows percentage (70-88%)
- [ ] 3 flow cards displayed

#### Business Baseline Card
- [ ] Shows "Business Baseline" title
- [ ] "~3 min" estimate
- [ ] Click navigates to `/crm/setup/business-baseline`
- [ ] Checkmark shows after completion

#### Customer Segments Card
- [ ] Shows "Customer Segments" title
- [ ] "~3 min" estimate
- [ ] Click navigates to `/crm/setup/customer-segments`
- [ ] Checkmark shows after completion

#### Competitor Snapshot Card
- [ ] Shows "Competitor Snapshot" title
- [ ] "~3 min" estimate
- [ ] Click navigates to `/crm/setup/competitor-snapshot`
- [ ] Checkmark shows after completion

### Business Baseline Flow (`/crm/setup/business-baseline`)
- [ ] 4 steps: Revenue → Margins → Capacity → Team
- [ ] Progress bar updates each step
- [ ] Revenue fields: Current Monthly, Target Monthly, Revenue Model
- [ ] Margins fields: Gross Margin %, Delivery Cost, Marketing Budget
- [ ] Capacity fields: Hours/Week, Max Clients, Current Clients
- [ ] Team fields: Team Size
- [ ] Back button returns to previous step
- [ ] Complete saves to `business_profiles` table
- [ ] Complete updates `autonomous_setup_progress`
- [ ] Redirects to `/crm/setup` on completion

### Customer Segments Flow (`/crm/setup/customer-segments`)
- [ ] 4 steps: Best Customer → Economics → Worst Customer → Objections
- [ ] Best Customer: Description, Buying Trigger
- [ ] Economics: Revenue %, Ease Rating (1-10)
- [ ] Worst Customer: Description
- [ ] Objections: Add up to 5 common objections
- [ ] Saves to `customer_segments` table (best and worst)
- [ ] Updates `autonomous_setup_progress`

### Competitor Snapshot Flow (`/crm/setup/competitor-snapshot`)
- [ ] Step 1: Add 1-3 competitor names
- [ ] Dynamic steps based on competitors added
- [ ] Per competitor: Positioning, Pricing (Low/Mid/High), Strengths, Weaknesses
- [ ] Final step: Your Advantage
- [ ] Saves to `competitor_analysis` table
- [ ] Updates `autonomous_setup_progress`

### Win/Loss Modal (`/crm/sales`)

#### Trigger
- [ ] Click a deal → click "Won" or "Lost" stage button
- [ ] Modal appears before stage change

#### Won State
- [ ] Green header "Deal Won!"
- [ ] Deal name and value shown
- [ ] 6 win reasons to choose from (timing, value, trust, offer, urgency, referral)
- [ ] Primary reason required
- [ ] Secondary reasons (chips) optional
- [ ] "In their words, what sold them?" textarea
- [ ] Final value field (can adjust)
- [ ] Notes field
- [ ] "Skip" closes and moves deal without data
- [ ] "Save & Celebrate" saves outcome and moves deal

#### Lost State
- [ ] Purple header "Capture the Learning"
- [ ] 6 loss reasons (price, timing, competitor, no_decision, fit, trust)
- [ ] Competitor field appears if "competitor" selected
- [ ] Notes field
- [ ] "Skip" closes and moves deal without data
- [ ] "Save & Learn" saves outcome and moves deal

#### Data Verification
- [ ] Check `deal_outcomes` table after save
- [ ] `outcome` field is 'won' or 'lost'
- [ ] `primary_reason` matches selection
- [ ] `secondary_reasons` array populated
- [ ] `competitor_mentioned` populated if applicable
- [ ] Factor flags (`price_factor`, `timing_factor`, `fit_factor`) set correctly

### Funnel Actuals Auto-Calculation

#### Trigger
- [ ] Move a deal to any stage
- [ ] Check `funnel_actuals` table

#### Data Verification
- [ ] `period_start` and `period_end` are current month
- [ ] `leads` count matches deals created this month
- [ ] `qualified_leads` matches deals that reached discovery+
- [ ] `proposals` matches deals that reached proposal+
- [ ] `sales` matches won deals this month
- [ ] `total_revenue` matches sum of won deal values
- [ ] `avg_sale_value` calculated correctly

### AI Coach Context Integration

#### Setup Required
- [ ] Complete all 3 setup flows
- [ ] Have some CRM deals with movements

#### Test AI Generation
- [ ] Go to `/crm/implementations`
- [ ] Start any implementation task (e.g., "Create Attraction Headline")
- [ ] Complete clarifying questions
- [ ] Generated content should reference:
  - [ ] Business context (revenue, goals)
  - [ ] Customer profile (best customer description)
  - [ ] Objections (from worst customer)
  - [ ] Competitive landscape
  - [ ] Funnel performance (if data exists)

---

## Tier 4: Files Changed

### New Components
- `src/components/crm/DealOutcomeModal.jsx` - Win/loss capture modal
- `src/components/crm/DealOutcomeModal.css` - Modal styles

### New Services
- `src/lib/crm/funnelActualsService.js` - Funnel calculation from CRM

### Modified Files
- `src/pages/crm/CRMDashboard.jsx` - Dynamic banner states
- `src/pages/crm/CRMDashboard.css` - Banner state styles
- `src/pages/crm/CRMSales.jsx` - Win/loss modal integration, funnel auto-update
- `src/lib/crm/dealService.js` - `saveDealOutcome`, `fetchDealOutcomes`, `getDealOutcomeStats`
- `src/lib/crm/index.js` - New exports
- `src/lib/crm/implementationTemplates.js` - `buildAutonomousContext` with funnel data
- `src/lib/businessProfile.js` - Funnel context in `getAutonomousContext`
- `src/components/crm/index.js` - DealOutcomeModal export

### Migrations (Already pushed)
- `20260110200000_autonomous_system_data.sql` - All Tier 4 tables

---

## Tier 4: Quick Smoke Tests

| Feature | Route | What to Check |
|---------|-------|---------------|
| Setup Banner | `/crm` | Banner shows correct state |
| Setup Flows | `/crm/setup` | All 3 flows accessible |
| Business Baseline | `/crm/setup/business-baseline` | 4 steps complete |
| Customer Segments | `/crm/setup/customer-segments` | 4 steps complete |
| Competitor Snapshot | `/crm/setup/competitor-snapshot` | Dynamic steps work |
| Win/Loss Modal | `/crm/sales` | Modal shows on won/lost |
| Funnel Actuals | DB check | Table populated after deal moves |
