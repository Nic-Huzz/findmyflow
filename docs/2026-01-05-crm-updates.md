# CRM Updates - January 5, 2026

## Overview

This update adds Lead Scoring, Hormozi Sales Scripts, and updates the CRM theme to match the FindMyFlow light theme.

---

## 1. Lead Scoring (PTUF System)

### What It Does
Adds Pain/Trust/Urgency/Fit scoring to sales deals with:
- **4 scoring dimensions** (1-10 scale each)
- **Auto-calculated total score** (4-40 range)
- **Color-coded temperature badges**
- **Notes field per dimension**

### Temperature Thresholds
| Score Range | Temperature | Color |
|-------------|-------------|-------|
| 32-40 | Hot | Red |
| 24-31 | Warm | Yellow |
| 0-23 | Cold | Blue |

### Files Changed
- `supabase/migrations/20260105140000_lead_scoring.sql` - Database columns + trigger
- `src/components/crm/LeadScoreSliders.jsx` - Interactive sliders component
- `src/components/crm/LeadScoreBadge.jsx` - Temperature badge component
- `src/components/crm/index.js` - Barrel exports
- `src/pages/crm/CRMSales.jsx` - Integrated scoring into deal modals

### Database Columns Added to `sales_deals`
```sql
pain_score INTEGER (1-10)
pain_notes TEXT
trust_score INTEGER (1-10)
trust_notes TEXT
urgency_score INTEGER (1-10)
urgency_notes TEXT
fit_score INTEGER (1-10)
fit_notes TEXT
lead_total_score INTEGER (auto-calculated)
lead_temperature VARCHAR (auto-calculated: 'hot'/'warm'/'cold')
```

---

## 2. Hormozi Sales Scripts Database

### What It Does
Adds 15 Hormozi-style sales scripts with:
- **8 sales stages**: Opener, Discovery, Trust, Urgency, Offer, Objection, Close, Follow-up
- **Usage tracking** with outcome logging
- **Stage-specific filtering**

### The 15 Scripts
| # | Name | Stage |
|---|------|-------|
| 1 | The Dream Outcome Opener | Opener |
| 2 | The Problem Agitation Opener | Opener |
| 3 | The Cost of Inaction | Discovery |
| 4 | The Dream vs Reality Gap | Discovery |
| 5 | The Social Proof Stack | Trust |
| 6 | The Transparent Expert | Trust |
| 7 | The Opportunity Cost Clock | Urgency |
| 8 | The Limited Capacity | Urgency |
| 9 | The Value Stack Reveal | Offer |
| 10 | The Risk Reversal | Offer |
| 11 | The "I Need to Think About It" Handler | Objection |
| 12 | The Price Objection Reframe | Objection |
| 13 | The Assumptive Close | Close |
| 14 | The Future Pace Close | Close |
| 15 | The Value-First Follow-Up | Follow-up |

### Files Changed
- `supabase/migrations/20260105150000_hormozi_scripts.sql` - Tables + 15 scripts
- `supabase/migrations/20260105160000_fix_hormozi_scripts.sql` - Fix for is_active column
- `src/lib/scripts.js` - Database operations (NEW)
- `src/pages/crm/SalesScripts.jsx` - Updated to use database
- `src/pages/crm/SalesScripts.css` - Updated styles

### Database Tables Added
```sql
-- sales_scripts: Stores the 15 Hormozi scripts
id, name, category, stage, script_text, when_to_use, tips, example_response, sort_order, is_active

-- script_usage_log: Tracks when scripts are used
id, user_id, script_id, deal_id, outcome, notes, used_at
```

---

## 3. Scripts Modal on Deal Cards

### What It Does
Adds a "Scripts" button to deal detail modals that:
- Shows recommended scripts for the deal's current stage
- Allows filtering by all 8 stages
- Tracks script usage when copied/used

### Files Changed
- `src/components/crm/ScriptsModal.jsx` - Modal component (NEW)
- `src/components/crm/ScriptsModal.css` - Modal styles (NEW)
- `src/components/crm/index.js` - Added export
- `src/pages/crm/CRMSales.jsx` - Added scripts button + modal

### Usage
1. Click on any deal card to open details
2. Click "Scripts" button in modal
3. View recommended scripts for deal stage
4. Filter by stage or view all
5. Copy script text with one click

---

## 4. Light Theme Update

### What Changed
All CRM pages updated from dark theme to FindMyFlow's light warm-gray theme:

| Element | Before (Dark) | After (Light) |
|---------|---------------|---------------|
| Background | `#1a1a2e` | `#f8f9fa` |
| Text | `#e0e0e0` | `#495057` |
| Cards | `#2a2a4e` | `#ffffff` |
| Borders | `rgba(255,255,255,0.1)` | `#dee2e6` |
| Accent | Purple `#5e17eb` | Purple `#5e17eb` (unchanged) |

### Files Changed
- `src/pages/crm/CRMDashboard.css`
- `src/pages/crm/CRMSales.css`
- `src/pages/crm/SalesScripts.css`

---

## 5. Migration Instructions

Run these migrations in order via Supabase Dashboard:

1. **Lead Scoring** (already run successfully)
   ```
   20260105140000_lead_scoring.sql
   ```

2. **Hormozi Scripts** (run in order)
   ```
   20260105150000_hormozi_scripts.sql
   20260105160000_fix_hormozi_scripts.sql
   ```

### Alternative: Direct SQL for fix
If the second migration failed, run this SQL directly:
```sql
-- Add is_active column if missing
ALTER TABLE sales_scripts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Drop and recreate policy
DROP POLICY IF EXISTS "Scripts are viewable by all authenticated users" ON sales_scripts;
CREATE POLICY "Scripts are viewable by all authenticated users"
  ON sales_scripts FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Set all scripts as active
UPDATE sales_scripts SET is_active = true WHERE is_active IS NULL;
```

---

## Component Exports

All new CRM components are available from `src/components/crm`:

```javascript
import {
  LeadScoreSliders,
  LeadScoreBadge,
  ScriptsModal
} from '../components/crm'
```

---

## Summary

| Feature | Status | Migration |
|---------|--------|-----------|
| Lead Scoring (PTUF) | Complete | 20260105140000 |
| 15 Hormozi Scripts | Complete | 20260105150000 + 20260105160000 |
| Scripts Modal | Complete | No migration needed |
| Light Theme | Complete | No migration needed |
| /offer-builder-v2 route | Already existed | None |

Build verified successful: 334 modules, no errors.
