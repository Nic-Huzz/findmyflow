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
- [ ] Total Contacts shows correct count
- [ ] Active Deals shows correct count
- [ ] Content Pieces shows correct count
- [ ] Warm Leads shows correct count

### DailyActions Widget
- [ ] Shows today's scheduled content (if any)
- [ ] Shows warm leads needing follow-up (staleness indicator)
- [ ] Clicking items navigates to correct pages

### EcosystemStatusWidget
- [ ] Shows flywheel completion percentage
- [ ] "Complete setup in Tools →" link works
- [ ] Phase breakdown is accurate

### Quick Actions
- [ ] "Add Contact" opens contact modal
- [ ] "Create Content" navigates to content create
- [ ] "View Pipeline" navigates to sales

---

## 2. Attract Tower (`/crm/attract`)

### Tower Cards
- [ ] All 4 cards display (Marketing, Pages, Cold Outreach, Ads)
- [ ] Live stats on each card are accurate
- [ ] "SOON" badges show on disabled cards
- [ ] Clicking active cards navigates correctly

### Content Create (`/crm/content/create`)
- [ ] ContentGenerator loads
- [ ] Can select content type
- [ ] AI generates content successfully
- [ ] Can assign post_day
- [ ] Save works → appears in queue

### Content Queue (`/crm/content/queue`)
- [ ] Shows scheduled content by day
- [ ] Can edit content
- [ ] Can mark as published
- [ ] Can delete content

### Content History (`/crm/content/history`)
- [ ] Shows published content
- [ ] Filter by date works
- [ ] Can view content details

### Pages (`/crm/pages`)
- [ ] List of pages displays
- [ ] Can create new page
- [ ] Can edit existing page
- [ ] PromptGenerator button works
- [ ] Metrics display correctly

### Marketing (`/crm/marketing`)
- [ ] Content hub displays
- [ ] Links to other content pages work

---

## 3. Nurture Tower (`/crm/nurture`)

### Tower Cards
- [ ] All 5 cards display with live stats
- [ ] Clicking cards navigates correctly

### Contacts (`/crm/contacts`)
- [ ] Contact list displays
- [ ] Can add new contact
- [ ] Can edit contact
- [ ] Can delete contact
- [ ] Lifecycle stage dropdown works
- [ ] Tags input works
- [ ] Source field saves
- [ ] Search/filter works
- [ ] Pull-to-refresh works (mobile)

### Email Sequences (`/crm/email-sequences`)
- [ ] Sequence list displays
- [ ] Can create new sequence
- [ ] Can toggle sequence active/inactive
- [ ] Clicking sequence opens detail modal
- [ ] **Email Steps:**
  - [ ] Can add new email step
  - [ ] Can edit email step (subject, body, send_day)
  - [ ] Can delete email step
  - [ ] Can reorder steps
- [ ] **Copy Features:**
  - [ ] Copy single email button works
  - [ ] "Copy All Emails" button works
- [ ] PromptGenerator button works
- [ ] Template auto-selects based on sequence type

### Warm Outreach (`/crm/warm-outreach`)
- [ ] Leads list displays
- [ ] Can add new lead
- [ ] Can edit lead
- [ ] Platform dropdown works
- [ ] Priority (1-10) works
- [ ] Temperature indicator displays
- [ ] Status dropdown works
- [ ] **"Also add to Contacts" checkbox:**
  - [ ] Creates contact when checked
  - [ ] Correct field mapping (name, source, notes)
- [ ] PromptGenerator button works
- [ ] Staleness indicator shows on old leads

### Sales Pipeline (`/crm/sales`)
- [ ] Deals list displays by stage
- [ ] Can create new deal
- [ ] Can edit deal
- [ ] Can move deal between stages
- [ ] Value field works
- [ ] Probability auto-calculates
- [ ] ScriptsModal available on deal cards

### Sales Scripts (`/crm/sales/scripts`)
- [ ] 15 Hormozi scripts display
- [ ] Can filter by stage
- [ ] Can search scripts
- [ ] Usage tracking increments on view
- [ ] Script content displays correctly

---

## 4. Tools Tower (`/crm/tools`)

### Tower Cards
- [ ] All cards display with stats
- [ ] Import Data card appears first
- [ ] Clicking cards navigates correctly

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
- [ ] 4 phase tabs display (Attract, Nurture, Deliver, Retain)
- [ ] Checklist items for each phase
- [ ] Can check/uncheck items
- [ ] Progress bar updates
- [ ] Auto-detection works (items check based on source data)
- [ ] Clicking items with links navigates correctly

### Execute (`/crm/execute`)
- [ ] Phase tasks display
- [ ] Can complete tasks
- [ ] Points awarded
- [ ] Streak tracking works

### Analytics (`/crm/analytics`)
- [ ] Reports display
- [ ] Metrics load

### Calculators
- [ ] PTUF Calculator (`/crm/calculators/ptuf`) works
- [ ] LTV Calculator (`/crm/calculators/ltv`) works
- [ ] CAC Calculator (`/crm/calculators/cac`) works

### Implementations (`/crm/implementations`)
- [ ] Phase/task hierarchy displays
- [ ] Progress rings accurate
- [ ] AI coach button works
- [ ] Can mark tasks complete

### Generated Assets (`/crm/assets`)
- [ ] Saved AI content displays
- [ ] Can view asset details
- [ ] Links to implementations work

### Smart Alerts (`/crm/alerts`)
- [ ] Alert types display
- [ ] AI recommendations show
- [ ] Can dismiss alerts

---

## 5. Cross-Cutting Features

### PromptGenerator (integrated in Pages, Email Sequences, Warm Outreach)
- [ ] Button appears on relevant pages
- [ ] Modal opens with context
- [ ] Template auto-selects correctly
- [ ] AI generates content
- [ ] Can copy/use generated content

### Pull-to-Refresh
- [ ] Works on: Dashboard, Contacts, Sales, Warm Outreach, Email Sequences, Pages, Content Queue

### Navigation
- [ ] Breadcrumbs show correct path (Home → Tower → Page)
- [ ] Back navigation works
- [ ] CRMLayout wrapper consistent across all pages

### Mobile Responsiveness
- [ ] Dashboard readable on mobile
- [ ] Tables scroll horizontally
- [ ] Modals fit screen
- [ ] Touch targets adequate

---

## 6. Data Integrity

### RLS (Row Level Security)
- [ ] User A cannot see User B's contacts
- [ ] User A cannot see User B's deals
- [ ] User A cannot see User B's content

### Foreign Keys
- [ ] Deleting contact doesn't orphan deals (or prevents deletion)
- [ ] Email steps belong to correct sequence

---

## 7. Error Handling

- [ ] Network error shows friendly message
- [ ] Empty states show helpful prompts
- [ ] Loading states display (skeletons/spinners)
- [ ] Form validation errors display inline

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
John Doe,Coaching Package,2500,negotiation,Discussing terms
Jane Smith,Course,497,won,Paid in full
Bob Wilson,Consulting,5000,proposal,Sent proposal yesterday
```

---

## Sign-Off

| Area | Tested By | Date | Pass/Fail | Notes |
|------|-----------|------|-----------|-------|
| Dashboard | | | | |
| Attract Tower | | | | |
| Nurture Tower | | | | |
| Tools Tower | | | | |
| CSV Import | | | | |
| Cross-Cutting | | | | |
| Mobile | | | | |

---

**Total Items:** ~120 checkpoints
**Estimated Time:** 45-60 minutes for full run-through
