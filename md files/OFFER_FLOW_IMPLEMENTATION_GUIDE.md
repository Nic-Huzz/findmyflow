# Offer Flow Implementation Guide

**Version:** 1.0.0
**Last Updated:** 2025-12-04
**Template Based On:** Attraction Offer Flow (completed)

---

## Overview

This guide provides step-by-step instructions for implementing the remaining three offer flows:
1. **Upsell Offers Flow** - Recommendations for upsell strategies
2. **Downsell Offers Flow** - Recommendations for downsell/retention offers
3. **Continuity Offers Flow** - Recommendations for recurring revenue models

Each flow follows the same architecture as the Attraction Offer Flow, with 10 multi-choice questions that score different offer types using weighted scoring.

---

## 🚨 Lessons Learned & Critical Fixes

**Important updates based on implementing the Upsell flow:**

### 1. **File Path Case Sensitivity** ⚠️
The folder name is `/public/Money Model/` (capital M), not `/public/money model/`

**❌ WRONG:**
```javascript
fetch('/money model/Upsell/offers.json')
```

**✅ CORRECT:**
```javascript
fetch('/Money Model/Upsell/offers.json')
```

**Impact:** Using lowercase causes the flow to show only a purple screen (stuck in loading state) because JSON files fail to load.

### 2. **Authentication Redirect Issue** ⚠️
These flows are part of the **Money Model Challenge** for authenticated Movement Makers, NOT public lead magnets.

**❌ WRONG:**
```javascript
// If user is already authenticated, redirect to dashboard
useEffect(() => {
  if (user) {
    navigate('/me')
  }
}, [user, navigate])
```

**✅ CORRECT:**
```javascript
// Money-Model challenge - accessible to authenticated Movement Makers
// No redirect needed
```

**Impact:** Without removing this redirect, authenticated users can't access the flows.

### 3. **Hard Disqualifiers Field Matching**
Ensure the hard_disqualifiers logic correctly matches question IDs:

```javascript
// Convert field name to match question ID format
const questionId = rule.field.toLowerCase()  // q6_customer_tracking
const fieldAnswer = userAnswers[questionId]
```

The question IDs in userAnswers are lowercase (e.g., `q6_customer_tracking`) but may be uppercase in offers.json (e.g., `Q6_customer_tracking`).

### 4. **Database Migration Trigger**
Always include `DROP TRIGGER IF EXISTS` before creating triggers to avoid errors on re-runs:

```sql
DROP TRIGGER IF EXISTS trigger_upsell_assessments_updated_at ON upsell_assessments;
CREATE TRIGGER trigger_upsell_assessments_updated_at
  BEFORE UPDATE ON upsell_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_upsell_assessments_updated_at();
```

---

## Architecture Pattern

Each offer flow consists of:
- **Questions JSON** - 10 questions with multi-choice options
- **Offers JSON** - Offer definitions with scoring weights
- **React Component** - Multi-stage flow component
- **CSS Stylesheet** - Visual styling matching purple gradient theme
- **Database Migration** - Table to store assessment results
- **Route** - Public route for lead generation

---

## File Structure

For each offer type, you'll create 5 core files:

```
/public/
  └── Money Model/                # ⚠️ CAPITAL M - case sensitive!
      └── [OfferType]/           # "Upsell", "Downsell", or "Continuity"
          ├── config.json         ✅ Already exists (reuse from Attraction)
          ├── offers.json         📝 CREATE THIS (specific to offer type)
          ├── phase_2_followups.json  📝 CREATE THIS
          ├── question_flows.json     📝 CREATE THIS (10 questions)
          └── results_templates.json  ✅ Already exists (reuse from Attraction)

/public/
  └── [offer-type]-questions.json  📝 CREATE THIS (formatted for React component)

/src/
  ├── [OfferType]Flow.jsx         📝 CREATE THIS
  └── [OfferType]Flow.css         📝 CREATE THIS

/supabase/migrations/
  └── 20251204_0[X]_[offer_type]_assessments.sql  📝 CREATE THIS
```

**File Naming Convention:**
- Upsell: `UpsellFlow.jsx`, `upsell-questions.json`, `upsell_assessments`
- Downsell: `DownsellFlow.jsx`, `downsell-questions.json`, `downsell_assessments`
- Continuity: `ContinuityFlow.jsx`, `continuity-questions.json`, `continuity_assessments`

---

## ⚠️ CRITICAL: Before You Start

**DO NOT skip this step!** The quality of your implementation depends on understanding the source material.

---

## Step-by-Step Implementation

### STEP 0: Read the Source PDF (REQUIRED)

**🚨 THIS IS THE MOST IMPORTANT STEP 🚨**

Before writing ANY code, you MUST read the corresponding PDF to understand the specific methodology, offer types, and strategies for that offer category.

**File Locations:**
- **Upsell Offers PDF**: `/public/money model/Upsell/[PDF filename].pdf`
- **Downsell Offers PDF**: `/public/money model/Downsell/[PDF filename].pdf`
- **Continuity Offers PDF**: `/public/money model/Continuity/[PDF filename].pdf`

**What to Extract from the PDF:**

1. **All Offer Types Covered**
   - Exact names (e.g., "Order Bump", "One-Click Upsell", "Downsell to Payment Plan")
   - Detailed descriptions of each offer type
   - When each offer works best

2. **Key Success Factors**
   - Required capabilities (tracking, delivery, customer service, etc.)
   - Margin requirements
   - Customer relationship requirements
   - Technical requirements

3. **Business Model Fit**
   - Which business types each offer works for
   - Which business types should avoid certain offers
   - Examples from the PDF (e.g., "Boot Factory", "Gym", specific case studies)

4. **Critical Metrics**
   - What to measure for each offer type
   - Success benchmarks (e.g., "70% should take upsell", "20-30% downsell conversion")
   - Warning signs and red flags

5. **Hard Disqualifiers**
   - What makes a business ineligible for each offer
   - Prerequisites that must be in place first

6. **Question Topics**
   - What factors determine offer success (these become your 10 questions)
   - How different answers affect scoring

**Example from Attraction Offer PDF:**
When I implemented the Attraction Offer flow, I read the PDF and extracted:
- 6 specific offer types (Win Your Money Back, Giveaway, Decoy, Buy X Get Y, etc.)
- Exact success metrics (70% completion rate for WYMB, 70-80% choose premium for Decoy)
- Hard requirements (tracking capability for WYMB, legal compliance for Giveaways)
- Scoring factors (margin levels, backend strength, capacity, etc.)

**Your Task:**
Do the same for Upsell, Downsell, and Continuity offers. Read the PDF thoroughly and take notes on all offer types, requirements, and decision factors BEFORE building anything.

**⚠️ Warning:** The "Offer-Specific Content Guidelines" section at the bottom of this guide contains **PLACEHOLDER EXAMPLES ONLY** based on general business knowledge. **You MUST replace these with actual content from the PDFs.**

---

### STEP 1: Create Questions Data Structure

**File:** `/public/money model/[OfferType]/question_flows.json`

**Template:**
```json
{
  "questions": [
    {
      "id": "Q1_[descriptive_name]",
      "text": "Question text here?",
      "type": "single_choice",
      "options": [
        "option_1_value",
        "option_2_value",
        "option_3_value"
      ],
      "store_as": "[field_name]",
      "tags": ["tag1", "tag2"]
    }
    // ... 9 more questions for total of 10
  ]
}
```

**Requirements:**
- Exactly 10 questions (Q1-Q10)
- Each question must have 3-7 single-choice options
- Use snake_case for option values
- Each question must have unique `id` and `store_as` fields

**Question Topics to Cover:**
1. Business model or product type
2. Current pricing/margin structure
3. Customer lifetime value or repeat purchase rate
4. Existing customer engagement/satisfaction
5. Delivery/fulfillment capability
6. Current offer portfolio (what exists)
7. Customer journey stage
8. Primary business goal
9. Revenue/growth targets
10. Customer preference or market position

---

### STEP 2: Create Enhanced Questions for React Component

**File:** `/public/[offer-type]-questions.json`

**Template:**
```json
{
  "metadata": {
    "version": "1.0.0",
    "total_questions": 10,
    "estimated_completion_time_minutes": 3,
    "last_updated": "2025-12-04"
  },
  "questions": [
    {
      "id": "q1_[name]",
      "question": "What type of business do you run?",
      "subtext": "Helpful context about why this matters",
      "options": [
        {
          "label": "Human-Readable Label",
          "value": "snake_case_value",
          "description": "Brief explanation of this option"
        }
        // ... more options
      ]
    }
    // ... 9 more questions
  ]
}
```

**Key Requirements:**
- Match exact option values from Step 1's `question_flows.json`
- Add helpful `subtext` for each question
- Add clear `description` for each option
- Use human-readable `label` text

**Reference:** See `/public/attraction-offer-questions.json` for complete example

---

### STEP 3: Create Offers Scoring Matrix

**File:** `/public/money model/[OfferType]/offers.json`

**Template Structure:**
```json
[
  {
    "id": "offer_unique_id",
    "name": "Display Name of Offer",
    "description": "1-2 sentence description of this offer type and when it works best.",

    "eligibility_rules": {
      "required_followups": [
        "F[OfferInitial]1_followup_id",
        "F[OfferInitial]2_followup_id"
      ],
      "hard_disqualifiers": [
        {
          "field": "question_field_name",
          "disallowed": ["value1", "value2"]
        }
      ]
    },

    "scoring_weights": {
      "Q1_business_model": {
        "digital_product": 3,
        "physical_product": 2,
        "saas_software": 1,
        "coaching_consulting": -1
      },
      "Q2_[field_name]": {
        "option_value": 4,
        "another_option": 2,
        "poor_fit_option": -2
      }
      // ... weights for all Q1-Q10
    },

    "max_possible_score": 30,

    "funnel_template": {
      "headline_patterns": [
        "Example headline 1",
        "Example headline 2"
      ],
      "offer_structure": [
        "Step 1: What happens first",
        "Step 2: What happens next",
        "Step 3: Final step"
      ],
      "upsell_sequence": [
        "When to present upsell 1",
        "When to present upsell 2"
      ],
      "followup_sequence": [
        "Day 0: Welcome email",
        "Day 3: Value email",
        "Day 7: Case study"
      ],
      "metrics": [
        "Key metric 1",
        "Key metric 2",
        "Key metric 3"
      ]
    }
  }
  // ... more offers (typically 4-6 offer types per category)
]
```

**Scoring Guidelines:**
- Positive scores (1-4): Good fit indicators
- Zero (0): Neutral / doesn't matter
- Negative scores (-1 to -5): Poor fit indicators
- Higher absolute values = stronger signal
- `max_possible_score` should be sum of highest possible scores across all questions

**Hard Disqualifiers:**
Use these to automatically exclude offers that won't work. Examples:
- Continuity offers require repeat purchase capability
- Upsells require existing customer base
- Downsells require higher-tier products to downgrade from

---

### STEP 4: Create Phase 2 Follow-up Questions

**File:** `/public/money model/[OfferType]/phase_2_followups.json`

**Template:**
```json
{
  "phase_2_followup_logic": {
    "description": "After scoring phase-1 questions, ask follow-ups for top 2 offers to validate eligibility.",
    "offers_to_followups": {

      "offer_id_1": [
        {
          "id": "F[Initial]1_followup_name",
          "text": "Follow-up question to validate this offer?",
          "type": "single_choice",
          "options": ["yes", "maybe", "no"],
          "store_as": "offer1_validation_field"
        },
        {
          "id": "F[Initial]2_second_followup",
          "text": "Second validation question?",
          "type": "single_choice",
          "options": ["yes", "no"],
          "store_as": "offer1_second_check"
        }
      ],

      "offer_id_2": [
        {
          "id": "F[Initial]3_followup_name",
          "text": "Validation question for offer 2?",
          "type": "single_choice",
          "options": ["yes", "maybe", "no"],
          "store_as": "offer2_validation_field"
        }
      ]

      // ... follow-ups for each offer
    },

    "logic_rules": {
      "ask_top_two_offers_only": true,
      "max_followup_questions_per_offer": 2,
      "skip_if_not_in_top_two": true,
      "auto_rule_out_if_hard_no": true,
      "if_both_offers_fail_followups": "fallback_to_next_best_offer"
    }
  }
}
```

**Purpose:**
Follow-up questions validate that the recommended offer is truly viable. For example:
- "Can you deliver this digitally?" for scalable offers
- "Do you have customer service capacity?" for high-touch offers
- "Are you comfortable with subscriptions?" for continuity offers

---

### STEP 5: Create React Component

**File:** `/src/[OfferType]Flow.jsx`

**Base Template:** Copy `/src/AttractionOfferFlow.jsx` and modify:

**Find and Replace:**
```javascript
// 1. Change all component references
AttractionOfferFlow → [OfferType]Flow
attraction-offer-flow → [offer-type]-flow
attraction-offer-questions.json → [offer-type]-questions.json
attraction_offer_assessments → [offer_type]_assessments

// 2. Update file paths
'/money model/Attraction/offers.json' → '/money model/[OfferType]/offers.json'

// 3. Update CSS import
import './AttractionOfferFlow.css' → import './[OfferType]Flow.css'

// 4. Update welcome message
Update the WELCOME stage with appropriate messaging for this offer type
```

**Key Customizations:**

1. **Welcome Message** (lines ~315-330):
```javascript
if (stage === STAGES.WELCOME) {
  return (
    <div className="[offer-type]-flow">
      {renderProgress()}
      <div className="welcome-container">
        <div className="welcome-content">
          <h1 className="welcome-greeting">Find Your Perfect [Offer Type]</h1>
          <div className="welcome-message">
            <p><strong>[Compelling hook specific to this offer type]</strong></p>
            <p>[2-3 paragraphs explaining the value of this assessment]</p>
            <p className="welcome-cta-text">[Clear CTA]</p>
          </div>
        </div>
        <button className="primary-button" onClick={() => setStage(STAGES.Q1)}>
          Let's Find Your [Offer Type]
        </button>
      </div>
    </div>
  )
}
```

2. **Calculating Stage Message** (lines ~425-440):
```javascript
<div className="calculating-steps">
  <div className="calculating-step active">✓ Evaluating your [business aspect]</div>
  <div className="calculating-step active">✓ Checking [key constraints]</div>
  <div className="calculating-step active">✓ Scoring [N] [offer type] strategies</div>
  <div className="calculating-step active">✓ Finding your best match</div>
</div>
```

3. **Database Table Name** (line ~207):
```javascript
await supabase.from('[offer_type]_assessments').insert([{
```

---

### STEP 6: Create CSS Stylesheet

**File:** `/src/[OfferType]Flow.css`

**Base Template:** Copy `/src/AttractionOfferFlow.css` and modify:

**Find and Replace:**
```css
/* 1. Update main class name */
.attraction-offer-flow → .[offer-type]-flow

/* 2. Keep everything else the same */
/* All other styling remains identical */
```

**Optional Color Customizations:**
If you want to differentiate the flows visually:

```css
/* Change gradient for different offer type */
.[offer-type]-flow {
  /* Attraction: Purple (#4a0ea8, #5e17eb, #7c3aed) */
  /* Upsell: Blue-Purple (#3730a3, #4f46e5, #6366f1) */
  /* Downsell: Amber (#92400e, #b45309, #d97706) */
  /* Continuity: Green-Blue (#065f46, #047857, #059669) */
  background: linear-gradient(135deg, [color1] 0%, [color2] 50%, [color3] 100%);
}

/* Update accent colors to match */
.reveal-badge {
  background: linear-gradient(135deg, [accent1], [accent2]);
}
```

---

### STEP 7: Create Database Migration

**File:** `/supabase/migrations/20251204_0[X]_[offer_type]_assessments.sql`

**Migration Number:**
- Upsell: `20251204_02_upsell_assessments.sql`
- Downsell: `20251204_03_downsell_assessments.sql`
- Continuity: `20251204_04_continuity_assessments.sql`

**Template:**
```sql
-- =============================================
-- [OFFER TYPE] ASSESSMENTS SYSTEM
-- Stores user responses and recommendations for [offer type] flow
-- =============================================

-- Table: [offer_type]_assessments
CREATE TABLE IF NOT EXISTS [offer_type]_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID NOT NULL,
  user_name TEXT,
  email TEXT NOT NULL,

  -- User responses to all 10 questions
  responses JSONB NOT NULL,

  -- Recommended offer details
  recommended_offer_id TEXT NOT NULL,
  recommended_offer_name TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  total_score INTEGER,

  -- All offer scores for comparison
  all_offer_scores JSONB,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_session_id UNIQUE (session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_[offer_type]_assessments_user ON [offer_type]_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_[offer_type]_assessments_email ON [offer_type]_assessments(email);
CREATE INDEX IF NOT EXISTS idx_[offer_type]_assessments_session ON [offer_type]_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_[offer_type]_assessments_offer ON [offer_type]_assessments(recommended_offer_id);
CREATE INDEX IF NOT EXISTS idx_[offer_type]_assessments_created ON [offer_type]_assessments(created_at DESC);

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_[offer_type]_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_[offer_type]_assessments_updated_at
  BEFORE UPDATE ON [offer_type]_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_[offer_type]_assessments_updated_at();

-- RLS Policies
ALTER TABLE [offer_type]_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create [offer_type] assessments"
  ON [offer_type]_assessments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own assessments by user_id"
  ON [offer_type]_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own assessments by email"
  ON [offer_type]_assessments
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Anyone can view assessments by session"
  ON [offer_type]_assessments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can update their own assessments"
  ON [offer_type]_assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON [offer_type]_assessments TO anon, authenticated;

-- Comments
COMMENT ON TABLE [offer_type]_assessments IS 'Stores user responses and recommendations from [offer type] assessment flow';
COMMENT ON COLUMN [offer_type]_assessments.session_id IS 'Anonymous session UUID before authentication';
COMMENT ON COLUMN [offer_type]_assessments.responses IS 'JSONB object containing all 10 question responses';
COMMENT ON COLUMN [offer_type]_assessments.recommended_offer_id IS 'ID of top-scoring offer';
COMMENT ON COLUMN [offer_type]_assessments.confidence_score IS 'Normalized score (0.00-1.00) for recommended offer';
COMMENT ON COLUMN [offer_type]_assessments.all_offer_scores IS 'Array of all offers with scores for comparison';
```

**Apply Migration:**
```bash
npx supabase db push
```

---

### STEP 8: Add Route to AppRouter

**File:** `/src/AppRouter.jsx`

**1. Add Import (top of file):**
```javascript
import [OfferType]Flow from './[OfferType]Flow'
```

**2. Add CSS Import:**
```javascript
import './[OfferType]Flow.css'
```

**3. Add Route (around line 43, after PersonaAssessment routes):**
```javascript
{/* [Offer Type] Assessment - Public Lead Magnet */}
<Route path="/[offer-type]" element={<[OfferType]Flow />} />
```

**Route Paths:**
- Upsell: `/upsell-offer`
- Downsell: `/downsell-offer`
- Continuity: `/continuity-offer`

---

## Content Guidelines by Offer Type

**⚠️ IMPORTANT: These are PLACEHOLDER EXAMPLES based on general business knowledge.**

**You MUST replace all content below with actual information from the PDFs.**

The examples below are provided as a starting framework, but the actual offer types, success factors, questions, and scoring criteria should come directly from reading the Upsell, Downsell, and Continuity Offers PDFs.

---

### UPSELL OFFERS

**🔴 PLACEHOLDER CONTENT - Replace with actual PDF content**

**Focus Areas (Generic - Update from PDF):**
- Current customer satisfaction/engagement
- Product portfolio breadth
- Customer journey maturity
- Value ladder potential
- Delivery capacity for premium tiers

**Example Offer Types:**
- One-Time Upsell (OTO)
- Order Bump
- Cross-Sell Bundle
- Premium Tier Upgrade
- Done-For-You Service
- VIP/Concierge Tier

**Key Questions:**
1. What's your current product/service offering?
2. What's your average customer satisfaction score?
3. How many customers do you currently have?
4. What's your average order value?
5. Do you have higher-tier products/services?
6. How often do customers buy multiple products?
7. What's your primary upsell goal?
8. Can you deliver premium/done-for-you services?
9. What's your customer lifetime value?
10. How sophisticated is your customer base?

---

### DOWNSELL OFFERS

**🔴 PLACEHOLDER CONTENT - Replace with actual PDF content**

**Focus Areas (Generic - Update from PDF):**
- Cart abandonment rate
- Price sensitivity
- Refund/churn reasons
- Product modularity (can you strip features?)
- Customer objections

**Example Offer Types:**
- Payment Plan
- Lite/Starter Version
- Trial Period
- Partial Refund + Keep Product
- Downgrade to Lower Tier
- Pause/Freeze Membership

**Key Questions:**
1. What's your current cart abandonment rate?
2. Why do customers typically not buy? (price, trust, timing)
3. Can you offer payment plans?
4. Do you have a lite/basic version of your offer?
5. What's your refund rate?
6. Why do customers typically request refunds?
7. Can you modularize your product/service?
8. What's your primary retention goal?
9. How price-sensitive is your market?
10. Do you have lifetime vs. subscription options?

---

### CONTINUITY OFFERS

**🔴 PLACEHOLDER CONTENT - Replace with actual PDF content**

**Focus Areas (Generic - Update from PDF):**
- Repeat purchase behavior
- Subscription readiness
- Content/value generation capability
- Churn prevention mechanisms
- Recurring value delivery

**Example Offer Types:**
- Monthly Membership
- Subscription Box
- Retainer/Recurring Service
- Auto-Replenishment
- SaaS Model
- Community Access
- Content Library Subscription

**Key Questions:**
1. How often do customers currently repurchase?
2. What type of recurring value can you provide?
3. Can you generate new content/value monthly?
4. What's your current churn rate (if applicable)?
5. Do customers prefer one-time or ongoing?
6. Can you automate recurring delivery?
7. What's your customer engagement level?
8. What's your primary continuity goal?
9. How much recurring revenue do you have now?
10. What's your ideal continuity model?

---

## Testing Checklist

After implementation, test each flow:

- [ ] **Load Test**: Navigate to `/[offer-type]` - page loads without errors
- [ ] **Question Flow**: All 10 questions display correctly
- [ ] **Option Selection**: Clicking options advances to next question
- [ ] **Progress Indicator**: Dots and progress bar update correctly
- [ ] **Calculating Stage**: Animation displays for 1.5 seconds
- [ ] **Scoring Logic**: Correct offer is recommended based on answers
- [ ] **Reveal Screen**:
  - Offer name displays
  - Confidence % shows correctly
  - Funnel structure renders
  - Metrics display in grid
  - Alternative offers listed
- [ ] **Name Capture**: Input validation works
- [ ] **Email Capture**: Email format validation works
- [ ] **Code Verification**: 6-digit code input works
- [ ] **Database Save**: Check Supabase table for new record
- [ ] **Redirect**: Success screen redirects to `/me` after 2 seconds

---

## Common Issues & Solutions

### Issue: "Cannot find module ./[OfferType]Flow.jsx"
**Solution:** Ensure exact capitalization in filename and import statement

### Issue: "Failed to load assessment data"
**Solution:** Check that both JSON files exist and are valid JSON (use JSONLint)

### Issue: "Cannot read property 'questions' of null"
**Solution:** Questions JSON structure doesn't match expected format - verify `questions` array exists

### Issue: Database insert fails
**Solution:**
1. Verify migration ran successfully: `npx supabase db push`
2. Check table exists: Query `SELECT * FROM [offer_type]_assessments LIMIT 1;`
3. Verify RLS policies allow inserts for anonymous users

### Issue: Scoring returns all zeros
**Solution:**
1. Verify option values in React questions JSON exactly match offer scoring keys
2. Check that `scoring_weights` exists for all Q1-Q10 in offers.json
3. Console.log the answers object to debug matching

### Issue: Wrong offer recommended
**Solution:**
1. Verify scoring weights align with offer strengths
2. Check hard disqualifiers aren't eliminating top offers
3. Review max_possible_score calculation (should be sum of all highest weights)

---

## Development Tips

1. **Start with Questions**: Design the 10 questions first, before building anything else
2. **Reuse Config Files**: The `config.json` and `results_templates.json` from Attraction can be reused as-is
3. **Test Scoring Logic**: Create a test file with known answers to verify expected offers win
4. **Consistent Naming**: Use exact same casing everywhere (component name, CSS class, table name)
5. **Copy-Paste Safely**: When copying AttractionOfferFlow, do a full find-replace to avoid missing references
6. **Validate JSON**: Use JSONLint.com to validate all JSON files before testing
7. **Check Console**: Browser console will show helpful errors for missing files or data structure issues

---

## File Completion Checklist

For each offer type (Upsell, Downsell, Continuity), ensure you have:

- [ ] `/public/money model/[OfferType]/question_flows.json`
- [ ] `/public/money model/[OfferType]/offers.json`
- [ ] `/public/money model/[OfferType]/phase_2_followups.json`
- [ ] `/public/[offer-type]-questions.json`
- [ ] `/src/[OfferType]Flow.jsx`
- [ ] `/src/[OfferType]Flow.css`
- [ ] `/supabase/migrations/20251204_0[X]_[offer_type]_assessments.sql`
- [ ] Updated `/src/AppRouter.jsx` with import and route

---

## Reference Files

Use these completed files as reference examples:

**Attraction Offer Flow (Completed):**
- `/public/money model/Attraction/question_flows.json`
- `/public/money model/Attraction/offers.json`
- `/public/money model/Attraction/phase_2_followups.json`
- `/public/attraction-offer-questions.json`
- `/src/AttractionOfferFlow.jsx`
- `/src/AttractionOfferFlow.css`
- `/supabase/migrations/20251204_01_attraction_offer_assessments.sql`

**Persona Assessment (Reference for UI patterns):**
- `/src/PersonaAssessment.jsx`
- `/src/PersonaAssessment.css`
- `/public/persona-assessment.json`

---

## Quick Start Command Summary

```bash
# 1. Create all files (follow templates above)

# 2. Apply database migration
npx supabase db push

# 3. Start dev server (if not running)
npm run dev

# 4. Test the flow
# Navigate to: http://localhost:5173/[offer-type]

# 5. Verify database record
# Check Supabase dashboard → Table Editor → [offer_type]_assessments
```

---

## Success Criteria

Each implementation is complete when:

✅ User can complete full 10-question flow
✅ Scoring system recommends appropriate offer
✅ Data saves to Supabase correctly
✅ Email verification works
✅ User redirects to profile after completion
✅ No console errors during flow
✅ Mobile responsive design works
✅ All stage transitions animate smoothly

---

## Questions?

If you encounter issues not covered in this guide:
1. Check browser console for error messages
2. Verify all file paths match exactly (case-sensitive)
3. Ensure JSON files are valid (use JSONLint)
4. Compare your implementation to AttractionOfferFlow reference files
5. Check that database migration ran successfully

---

## 🎯 Final Reminder: PDF-First Approach

**The Attraction Offer flow works well because it was built from the actual PDF content.**

For Upsell, Downsell, and Continuity flows to be equally effective:

1. **📖 Start by reading the PDF** - Don't skip STEP 0
2. **📝 Take detailed notes** - Extract all offer types, requirements, metrics
3. **🎯 Use actual content** - Replace all placeholder examples with PDF-based content
4. **✅ Validate against PDF** - Ensure scoring weights match PDF methodology
5. **🧪 Test with known scenarios** - Verify expected offers win for different business types

**Quality > Speed**

Taking 30 minutes to thoroughly read and understand the PDF will save hours of rework later. The scoring matrix is only as good as the understanding of what makes each offer succeed or fail.

**Happy Building! 🚀**
