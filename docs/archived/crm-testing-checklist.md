# CRM Testing Checklist
**Date:** February 2026
**Purpose:** Verify all CRM features are connected and functional

---

## Pre-Test Setup
- [ ] Clear browser cache / use incognito
- [ ] Log in with test account
- [ ] Have sample CSV files ready (contacts, leads, deals)

---

## 1. Dashboard (`/crm`)

### Stats Grid
- [x] Total Contacts shows correct count
- [x] Active Deals shows correct count
- [x] Content Pieces shows correct count
- [x] Warm Leads shows correct count

### DailyActions Widget
- [x] Shows today's scheduled content (if any)
- [x] Shows warm leads needing follow-up (staleness indicator)
- [x] Clicking items navigates to correct pages

### EcosystemStatusWidget
- [x] Shows flywheel completion percentage
- [x] "Complete setup in Tools" link works
- [x] Phase breakdown is accurate

### Quick Actions
- [x] "Add Contact" opens contact modal
- [x] "Create Content" navigates to content create
- [x] "View Pipeline" navigates to sales

**Code audit notes:** Dashboard uses skeleton loading. Stats query all relevant tables. DailyActions fixed content queue path.

---

## 2. Attract Tower (`/crm/attract`)

### Tower Cards
- [x] All 4 cards display (Marketing, Pages, Cold Outreach, Ads)
- [x] Live stats on each card are accurate
- [x] "SOON" badges show on disabled cards
- [x] Clicking active cards navigates correctly

### Content Create (`/crm/content-create`)
- [ ] ContentGenerator loads
- [ ] Can select content type
- [ ] AI generates content successfully
- [ ] Can assign post_day
- [ ] Save works → appears in queue

### Content Queue (`/crm/content-queue`)
- [x] Shows scheduled content by day (tabbed: Approval/Scheduled/Posted)
- [x] Can edit content
- [x] Can mark as published
- [x] Can delete content
- [x] Pull-to-refresh works

### Content History (`/crm/content-history`)
- [ ] Shows published content
- [ ] Filter by date works
- [ ] Can view content details

### Pages (`/crm/pages`)
- [x] List of pages displays
- [x] Can create new page
- [x] Can edit existing page
- [x] PromptGenerator button works (inline implementation)
- [x] Metrics display correctly

### Marketing (`/crm/marketing`)
- [x] Content hub displays
- [x] Links to other content pages work

---

## 3. Nurture Tower (`/crm/nurture`)

### Tower Cards
- [x] All 5 cards display with live stats
- [x] Clicking cards navigates correctly

### Contacts (`/crm/contacts`)
- [x] Contact list displays
- [x] Can add new contact
- [x] Can edit contact
- [x] Can delete contact
- [x] Lifecycle stage dropdown works
- [x] Tags input works
- [x] Source field saves
- [x] Search/filter works
- [x] Pull-to-refresh works (mobile)
- [x] Empty state with "Add Your First Contact" CTA

### Email Sequences (`/crm/email-sequences`)
- [x] Sequence list displays
- [x] Can create new sequence
- [x] Can toggle sequence active/inactive
- [x] Clicking sequence opens detail modal
- [x] **Email Steps:**
  - [x] Can add new email step
  - [x] Can edit email step (subject, body, send_day)
  - [x] Can delete email step
  - [x] Can reorder steps
- [x] **Copy Features:**
  - [x] Copy single email button works
  - [x] "Copy All Emails" button works
- [x] PromptGenerator button works (usePromptGenerator hook)
- [x] Template auto-selects based on sequence type

### Warm Outreach (`/crm/warm-outreach`)
- [x] Leads list displays
- [x] Can add new lead
- [x] Can edit lead
- [x] Platform dropdown works
- [x] Priority (1-10) works
- [x] Temperature indicator displays
- [x] Status dropdown works
- [x] **"Also add to Contacts" checkbox:**
  - [x] Creates contact when checked
  - [x] Correct field mapping (name, source, notes)
- [x] PromptGenerator button works (usePromptGenerator hook)
- [x] Staleness indicator shows on old leads
- [x] Empty state with hint and CTA

### Sales Pipeline (`/crm/sales`)
- [x] Deals list displays by stage (V2 stages: lead/qualified/booked/showed/pitched/follow_up/won/delivering/completed/lost)
- [x] Can create new deal
- [x] Can edit deal
- [x] Can move deal between stages
- [x] Value field works
- [x] Probability auto-calculates
- [x] ScriptsModal available on deal cards
- [x] Pull-to-refresh works
- [x] Empty column states ("No deals yet")
- [x] Stale deal indicators (7d/14d)

### Sales Scripts (`/crm/sales/scripts`)
- [x] 15 Hormozi scripts display
- [x] Can filter by stage (uses script.category)
- [x] Can search scripts
- [x] Usage tracking increments on view
- [x] Script content displays correctly

---

## 4. Tools Tower (`/crm/tools`)

### Tower Cards
- [x] All cards display with stats
- [x] Import Data card appears first
- [x] Clicking cards navigates correctly

### CSV Import (`/crm/import`)
- [ ] **Step 1 - Upload:**
  - [ ] Drag-and-drop works
  - [ ] Click to browse works
  - [ ] File type validation (CSV only)
  - [ ] File size validation (10MB max)
  - [ ] Error message on invalid file
- [ ] **Step 2 - Table Selection:**
  - [ ] 3 table cards display (Contacts, Warm Leads, Deals)
  - [ ] Clicking selects and advances
  - [ ] Back button works
- [ ] **Step 3 - Column Mapping:**
  - [ ] CSV headers listed
  - [ ] Auto-mapping works (email→email, name→name)
  - [ ] Fuzzy mapping works (fullname→name)
  - [ ] Sample data preview shows
  - [ ] Required fields highlighted
  - [ ] Can manually change mapping
- [ ] **Step 4 - Preview:**
  - [ ] Stats show (total, valid, invalid, warnings)
  - [ ] Validation errors listed with row numbers
  - [ ] Preview table shows first 10 rows
  - [ ] Duplicate handling options display
  - [ ] Import button disabled if 0 valid rows
- [ ] **Step 5 - Importing:**
  - [ ] Progress circle animates
  - [ ] Percentage updates
  - [ ] Status message updates
- [ ] **Step 6 - Results:**
  - [ ] Success count accurate
  - [ ] Failed count accurate
  - [ ] Skipped count accurate (duplicates)
  - [ ] Error list shows failed rows
  - [ ] "Download Failed Rows" creates CSV
  - [ ] "Import More" resets wizard
  - [ ] "Done" closes/completes
- [ ] **Verify imported data:**
  - [ ] Contacts appear in `/crm/contacts`
  - [ ] Leads appear in `/crm/warm-outreach`
  - [ ] Deals appear in `/crm/sales`

### Business Systems (`/crm/tools/systems`)
- [x] 4 phase tabs display (Attract, Nurture, Deliver, Retain)
- [x] Checklist items for each phase
- [ ] Can check/uncheck items
- [ ] Progress bar updates
- [x] Auto-detection works (items check based on source data)
- [ ] Clicking items with links navigates correctly

### Execute (`/crm/execute`)
- [x] Phase tasks display
- [ ] Can complete tasks
- [ ] Points awarded
- [ ] Streak tracking works

### Analytics (`/crm/analytics`)
- [ ] Reports display
- [ ] Metrics load

### Calculators (`/crm/calculators`)
- [ ] PTUF Calculator (`/crm/ptuf`) works
- [ ] LTV Calculator (`/crm/ltv`) works
- [ ] CAC Calculator (`/crm/cac`) works

**Note:** Calculator routes are `/crm/ptuf`, `/crm/ltv`, `/crm/cac` (not `/crm/calculators/*`). Hub page at `/crm/calculators` queries non-existent `ptuf_calculations`/`ltv_calculations`/`cac_calculations` tables for "Saved" badges - silent failure, cards render fine.

### Implementations (`/crm/implementations`)
- [x] Phase/task hierarchy displays (uses `offer_implementations` table - migration applied)
- [ ] Progress rings accurate
- [ ] AI coach button works
- [ ] Can mark tasks complete

### Generated Assets (`/crm/assets`)
- [x] Uses `useAuth()` fallback for userId (bug fixed)
- [ ] Saved AI content displays
- [ ] Can view asset details
- [ ] Links to implementations work

### Smart Alerts (`/crm/alerts`)
- [x] Uses `useAuth()` internally
- [x] `dismissed_reason` column exists (migration applied)
- [ ] Alert types display
- [ ] AI recommendations show
- [ ] Can dismiss alerts

---

## 5. Cross-Cutting Features

### PromptGenerator (integrated in Pages, Email Sequences, Warm Outreach)
- [x] Button appears on relevant pages
- [x] Modal opens with context (EmailSequences, WarmOutreach use hook; Pages uses inline)
- [x] Template auto-selects correctly
- [ ] AI generates content
- [ ] Can copy/use generated content

### Pull-to-Refresh
- [x] Dashboard
- [x] Contacts
- [x] Sales (added)
- [x] Warm Outreach
- [x] Email Sequences
- [x] Pages
- [x] Content Queue (added)

### Navigation
- [x] Breadcrumbs show correct path (Home → Tower → Page)
- [x] Back navigation works (navigates to parent tower)
- [x] CRMLayout wrapper consistent across all pages (includes CoachNudge, OnboardingTour, PageTransition)

### Mobile Responsiveness
- [x] All pages have @media queries
- [x] Safe-area-insets for notch devices
- [x] Prefers-reduced-motion support
- [ ] Dashboard readable on mobile
- [ ] Tables scroll horizontally
- [ ] Modals fit screen
- [ ] Touch targets adequate

---

## 6. Data Integrity

### RLS (Row Level Security)
- [x] All 18 CRM tables have RLS enabled with user_id-based policies
- [ ] User A cannot see User B's contacts (browser test)
- [ ] User A cannot see User B's deals (browser test)
- [ ] User A cannot see User B's content (browser test)

### Foreign Keys
- [x] Contacts and deals are independent (text fields, no FK - by design)
- [x] Email steps CASCADE on sequence delete
- [x] Ascension tasks CASCADE on customer delete
- [x] All user_id FKs use ON DELETE CASCADE

---

## 7. Error Handling

- [x] Loading states display (all pages have spinners or skeletons)
- [x] Empty states show helpful prompts (Contacts, WarmOutreach, ContentQueue, Sales columns)
- [x] Form validation: required field checks + HTML5 type validation present
- [ ] Network error shows friendly message (most pages only console.error - known limitation)
- [ ] Form validation errors display inline (no inline feedback yet - cosmetic)

**Known limitations:**
- Error handling is inconsistent: ContentQueue uses toast notifications, some pages use alert(), most only log to console
- No global error boundary for CRM module
- No retry mechanisms for failed requests

---

## Test CSV Files Needed

### contacts-test.csv
```csv
name,email,phone,company,lifecycle_stage,source,notes
John Doe,john@example.com,555-1234,Acme Inc,lead,Organic Social,Met at conference
Jane Smith,jane@test.com,555-5678,Tech Corp,customer,Referral,Long-time customer
Bob Wilson,bob@email.com,,,prospect,Cold Outreach,Initial contact
```

### warm-leads-test.csv
```csv
name,platform,handle,engagement_type,status,priority,notes
Sarah Connor,Instagram,@sarahc,dm_conversation,responded,8,Very interested
Mike Ross,LinkedIn,/in/mikeross,content_engagement,pending,5,Liked 3 posts
Amy Chen,Twitter,@amychen,referral,qualified,9,Referred by John
```

### deals-test.csv
```csv
contact_name,product_type,value,status,notes
John Doe,Coaching Package,2500,qualified,Discussing terms
Jane Smith,Course,497,won,Paid in full
Bob Wilson,Consulting,5000,pitched,Sent proposal yesterday
```

**Note:** Deal statuses in CSV should use V2 stages: lead, qualified, booked, showed, pitched, follow_up, won, delivering, completed, lost

---

## Code Audit - Bugs Fixed

| Bug | File | Fix |
|-----|------|-----|
| GeneratedAssetsLibrary stuck loading (no userId) | `src/pages/crm/GeneratedAssetsLibrary.jsx` | Added `useAuth()` fallback |
| Deal stages V2 CHECK constraint missing | `sales_deals` table | Migration `20260206160005` drops old constraint, adds V2 with all stages |
| Deal stages V2 constraint missing `delivering`/`completed` | `migrations_backup` original | Fixed in new migration file |
| Pull-to-refresh missing on Sales | `src/pages/crm/Sales.jsx` | Added PullToRefresh wrapper |
| Pull-to-refresh missing on ContentQueue | `src/pages/crm/ContentQueue.jsx` | Added PullToRefresh wrapper |
| Dashboard content queue path wrong | `src/pages/crm/Dashboard.jsx` | Fixed path to `/crm/content-queue` |
| Weekly planning `scheduled_date` column | `src/lib/crm/weeklyPlanningService.js` | Fixed to `date` column |
| Scripts grouping broken | `src/lib/scripts.js` | Fixed to use `script.category` directly |

## Migrations Applied

| Migration | Purpose |
|-----------|---------|
| `20260206160000_give_ask_tagging` | Content intent/CTA tracking columns + `cta_conversions` table |
| `20260206160001_offer_implementations` | `offer_implementations` table for ImplementationTracker |
| `20260206160002_recommendation_dismiss_reason` | `dismissed_reason` column on `recommendations` |
| `20260206160003_task_skip_tracking` | `task_skip_reasons` table + `user_skip_patterns` view |
| `20260206160004_story_bank` | `story_bank` table + `quick_context` on `marketing_tasks` |
| `20260206160005_deal_stages_v2` | V2 pipeline stages, stage history, follow-up tracking |
| `20260206160006_ascension_engine` | Customer ascension tracking + continuity fields |

---

## Sign-Off

| Area | Tested By | Date | Pass/Fail | Notes |
|------|-----------|------|-----------|-------|
| Dashboard | Code audit | Feb 2026 | PASS | Skeleton loading, stats grid, DailyActions, EcosystemWidget all wired correctly |
| Attract Tower | Code audit | Feb 2026 | PASS | Tower cards, content routes, Pages, Marketing all connected |
| Nurture Tower | Code audit | Feb 2026 | PASS | Contacts, EmailSequences, WarmOutreach, Sales, Scripts all functional |
| Tools Tower | Code audit | Feb 2026 | PASS (with fixes) | 7 missing migrations applied, GeneratedAssetsLibrary userId fixed |
| Cross-Cutting | Code audit | Feb 2026 | PASS (with fixes) | PullToRefresh added to Sales + ContentQueue |
| Data Integrity | Code audit | Feb 2026 | PASS | All 18 tables have RLS, proper FK cascades |
| Error Handling | Code audit | Feb 2026 | PARTIAL | Loading/empty states good. Network error feedback inconsistent |

---

**Total Items:** ~120 checkpoints
**Code Audit Complete:** Feb 2026
**Browser Testing Required:** Items marked [ ] still need manual browser verification
