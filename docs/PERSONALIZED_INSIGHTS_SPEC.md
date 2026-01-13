# AI-Powered Personalized Insights - Feature Specification

## Overview

This document details what personalized insights users will see based on their flow responses, and how AI can enhance these insights beyond the current static results.

---

## Current State vs. Proposed Enhancements

### Money Model Flow (Attraction Offer)

#### Data Captured (10 Questions)
| Question | Data Point | Example Values |
|----------|------------|----------------|
| Q1 | Business Model | digital_product, coaching_consulting, physical_product, membership, saas, agency, hybrid |
| Q2 | Gross Margin | under_40%, 40-60%, 60-85%, 85%+ |
| Q3 | Cashflow Tolerance | must_profit, break_even, short_term_loss, free_front_end |
| Q4 | Capacity | high, moderate, low, no_capacity |
| Q5 | Tracking Ability | everything, some_things, difficult, cannot_track |
| Q6 | Lead Challenge | not_enough, no_trust, price_sensitive, slow_cycle, low_quality |
| Q7 | Backend Strength | multiple_upsells, one_backend, weak, no_backend |
| Q8 | Repeat Purchase | frequent, occasional, rare, one_time |
| Q9 | Primary Goal | leads_fast, trust, testimonials, fill_program, high_ticket, email_list |
| Q10 | Lead Preference | volume, quality, likely_buyers, balanced |

#### Current Results Shown
- ✅ Recommended offer name (e.g., "Win Your Money Back")
- ✅ Confidence percentage (e.g., "78% Match")
- ✅ Offer description (static from JSON)
- ✅ Funnel structure steps (static from JSON)
- ✅ Alternative strategy scores

#### Proposed AI-Powered Insights

**1. Personalized "Why This Works For You" Section**
```
Based on your responses, here's why "Win Your Money Back" is your best fit:

🎯 Your Goal Alignment
You want to generate testimonials and case studies. This offer is specifically
designed to turn customers into success stories by incentivizing completion.

💰 Margin & Cashflow Match
With 60-85% margins and willingness to break even upfront, you have the
financial flexibility to offer money-back incentives while staying profitable
on the backend.

📊 Your Tracking Advantage
You indicated you can track most outcomes. This is critical for "Win Your
Money Back" offers where completion must be verified.
```

**2. Personalized "Watch Out For" Section**
```
⚠️ Potential Challenges For Your Situation:

1. Backend Dependency
   You mentioned having "one strong backend offer." This model works best with
   multiple upsells. Consider: What could you add to your offer stack?

2. Capacity Consideration
   With moderate capacity, a successful "Win Your Money Back" campaign could
   overwhelm fulfillment. Plan your launch volume carefully.
```

**3. Personalized "Quick Win" Action Steps**
```
🚀 Your First 3 Steps:

1. Define Your Completion Checklist
   Based on your coaching/consulting model, create 3-5 specific actions that
   lead to measurable results.

2. Set Your Refund Threshold
   With your margin profile, you can afford to refund ~40% and still be
   profitable. Calculate your exact break-even.

3. Prepare Your Upsell Pitch
   Since completion = results, prepare a "Now you've proven it works, here's
   how to 10x your results" premium offer.
```

**4. Personalized Pricing Guidance**
```
💵 Suggested Pricing Range:

Given your:
- Business model: Coaching/Consulting
- Gross margin: 60-85%
- Cashflow tolerance: Break-even okay
- Lead preference: Quality over quantity

Recommended front-end price: $97 - $297
This allows margin for money-back while filtering for committed buyers.
```

**5. Personalized Competitor Comparison**
```
📊 How Your Strategy Compares:

Your answers suggest you're solving a TRUST problem with your leads.

| Strategy | Trust Building | Lead Volume | Your Fit |
|----------|---------------|-------------|----------|
| Win Your Money Back | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Best |
| Decoy Offer | ⭐⭐⭐ | ⭐⭐⭐ | Good |
| Free With Consumption | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Alternative |

Why "Win Your Money Back" beats the others for you:
It directly addresses your trust gap by putting skin in the game.
```

---

### Nervous System Flow

#### Data Captured
| Data Point | Source | Example Values |
|------------|--------|----------------|
| Impact Goal | Q1 | 100+, 1,000+, 10,000+, 100,000+ people |
| Income Goal | Q2 | $100K+, $500K+, $1M+ |
| Positive Change | Q3 | Free-text description |
| Current Struggle | Q4 | Free-text description |
| Sway Calibration | Test | yes_direction, no_direction |
| Being Seen Edge | Binary Search | Exact number (e.g., 5,000 people) |
| Earning Edge | Binary Search | Exact number (e.g., $150,000) |
| Safe Pursuing | Test 3 | yes/no |
| Self Sabotage | Test 4 | yes/no |
| Feels Unsafe | Test 5 | yes/no |
| Safety Contracts | 7 Tests | Array of active contracts |

#### Current Results Shown
- ✅ Archetype name (AI-generated, e.g., "The Hidden Achiever")
- ✅ Archetype description (AI-generated)
- ✅ Earning edge (e.g., "$150K/year")
- ✅ Visibility edge (e.g., "5,000 people")
- ✅ Core limiting belief (AI-generated)
- ✅ Fear interpretation (AI-generated)
- ✅ What needs rewiring (AI-generated)

#### Proposed AI-Powered Insights

**1. Personalized "Your Expansion Roadmap"**
```
📈 Your Growth Path:

Current Edge → First Expansion → Full Vision

💰 Earning Edge Expansion:
$150K/yr → $250K/yr → $1M/yr
       ↑          ↑
    6-12mo    12-24mo

Your nervous system currently feels safe at $150K. Based on your
archetype ("Hidden Achiever"), the path to $1M looks like:

Step 1: Practice charging 20% more for current offers
Step 2: Raise visibility gradually while tracking body response
Step 3: Process the belief "If I charge more, people will reject me"
```

**2. Personalized "Pattern Recognition"**
```
🔍 Patterns We Noticed:

Based on your active safety contracts:
✓ "If I'm too successful, I'll lose my identity"
✓ "If I charge what I'm worth, people will think I'm greedy"

Combined with your archetype, this suggests:

The Root Pattern:
You learned early that being "too much" threatened connection. Success
feels like abandonment risk. Your system protects you by keeping you
small enough to stay loved.

This likely shows up as:
- Undercharging for your work
- Over-delivering to "earn" acceptance
- Dimming your wins around others
- Choosing comfort over visibility
```

**3. Personalized "Daily Practices"**
```
🧘 Your 7-Day Expansion Protocol:

Based on your specific edges and contracts, here are daily practices:

Day 1-2: Visibility Exposure
- Post something publicly without editing it 10 times
- Practice: "I am safe being seen at [current edge + 10%]"

Day 3-4: Earning Recalibration
- Review your pricing and add 15% mentally
- Journal on: "What I'm actually worth is..."

Day 5-6: Contract Release
- For your active contract "If I'm visible, I'll be judged"
- Somatic practice: Feel the fear, breathe through it, complete the action

Day 7: Integration
- Celebrate one way you expanded this week
- Notice: What felt different in your body?
```

**4. Personalized "Business Strategy Alignment"**
```
💼 How This Affects Your Business:

Your earning edge ($150K) vs your stated goal ($1M+) reveals a 6.7x gap.

This gap likely creates:
- Procrastination on revenue-generating activities
- "Imposter syndrome" when pitching higher prices
- Self-sabotage near success milestones

Recommended business adjustments:
1. Create offers at $150K FIRST (where you feel safe)
2. Document wins at this level (builds safety for expansion)
3. Gradually introduce premium offers while doing NS work
4. Don't force $1M strategies until your edge expands
```

**5. Personalized "Warning Signs"**
```
⚠️ Watch For These Self-Sabotage Patterns:

Based on your answers, you're likely to:

1. Pull Back When Visible
   Your edge is ~5,000 people. If you go viral or get unexpected
   attention, expect your system to create reasons to hide.

   What it looks like: Suddenly feeling "off," wanting to delete content,
   picking fights, getting sick

   What to do: Recognize it, breathe, stay visible anyway

2. Undercharge at Milestones
   When approaching your $150K edge, watch for urges to:
   - Offer discounts
   - Over-deliver without charging
   - Avoid asking for payment

3. Create Drama Near Success
   Your "self-sabotage" test came back YES. This means your system
   may create problems (relationship, health, business) when things
   are going too well.
```

---

## Technical Implementation

### Option A: Edge Function AI Generation (Recommended)

Expand the existing `nervous-system-mirror` Edge Function pattern:

```javascript
// supabase/functions/generate-personalized-insights/index.ts

const systemPrompt = `You are an expert business strategist and nervous system
coach. Generate personalized insights based on the user's flow responses.

For Money Model flows:
- Explain WHY the recommended offer fits their specific situation
- Identify potential challenges based on their answers
- Provide 3 specific action steps tailored to their business model
- Suggest pricing based on their margin and goals

For Nervous System flows:
- Create an expansion roadmap from current edge to stated goals
- Identify pattern connections between active contracts
- Suggest daily practices specific to their archetype
- Warn about likely self-sabotage patterns

Be specific. Reference their exact numbers and answers.`
```

### Option B: Pre-computed Insight Templates

Create insight templates for each combination of key answers:

```javascript
// src/lib/insightTemplates.js

const MONEY_MODEL_INSIGHTS = {
  // Key pattern: lead_challenge + backend_strength + primary_goal
  'no_trust_weak_backend_testimonials': {
    why_this_works: "You need trust AND testimonials, but your backend isn't strong yet...",
    watch_out_for: "Without a strong backend, you'll need to nail the upsell...",
    quick_wins: ["Build your backend offer first", "Create a completion-based incentive", "..."]
  },
  // ... more combinations
}
```

### Option C: Hybrid Approach (Best)

1. Generate core insights via AI (Edge Function)
2. Cache common insight patterns
3. Enhance with template-based specifics
4. Store generated insights in database for fast retrieval

---

## UI/UX Recommendations

### Results Page Layout

```
┌─────────────────────────────────────────┐
│     Your [Strategy/Archetype] Results    │
├─────────────────────────────────────────┤
│  [Current Results - Keep as-is]          │
│  - Recommendation + Confidence           │
│  - Core description                      │
│  - Key metrics (edges, scores)           │
├─────────────────────────────────────────┤
│  ✨ NEW: AI-Powered Insights             │
│                                         │
│  ▼ Why This Works For You               │
│  [Expandable section]                    │
│                                         │
│  ▼ Watch Out For                        │
│  [Expandable section]                    │
│                                         │
│  ▼ Your Action Steps                    │
│  [Expandable section]                    │
│                                         │
│  ▼ Personalized Recommendations         │
│  [Expandable section]                    │
├─────────────────────────────────────────┤
│  [Download Results] [Continue Journey]   │
└─────────────────────────────────────────┘
```

### Loading State

Since AI generation takes 5-15 seconds, show:
1. Core results immediately (calculated client-side)
2. "Generating personalized insights..." spinner
3. Insights appear with subtle animation

### Email Integration

Insights should also appear in Day 1 or Day 3 emails:
```
Subject: {{name}}, here's your personalized strategy breakdown

We analyzed your responses and here's what we found:

[Insert abbreviated AI insights]

Want the full breakdown? [View Your Results]
```

---

## Data Requirements

### New Database Columns/Tables

```sql
-- Add to existing public_offer_assessments
ALTER TABLE public_offer_assessments
ADD COLUMN generated_insights JSONB,
ADD COLUMN insights_generated_at TIMESTAMPTZ;

-- Add to existing public_nervous_system_responses
ALTER TABLE public_nervous_system_responses
ADD COLUMN generated_insights JSONB,
ADD COLUMN insights_generated_at TIMESTAMPTZ;
```

### Insights JSON Structure

```json
{
  "money_model": {
    "why_this_works": {
      "goal_alignment": "...",
      "margin_match": "...",
      "tracking_advantage": "..."
    },
    "watch_out_for": ["...", "..."],
    "quick_wins": ["...", "...", "..."],
    "pricing_guidance": {
      "range": "$97-$297",
      "reasoning": "..."
    },
    "competitor_comparison": {...}
  },
  "nervous_system": {
    "expansion_roadmap": {...},
    "pattern_recognition": {...},
    "daily_practices": [...],
    "business_alignment": {...},
    "warning_signs": [...]
  },
  "generated_at": "2026-01-13T...",
  "model_version": "claude-3-opus"
}
```

---

## Effort Estimate

| Component | Complexity | Notes |
|-----------|------------|-------|
| Edge Function for insights | Medium | Similar to nervous-system-mirror |
| UI updates for expandable sections | Low | Standard React components |
| Database schema changes | Low | Simple JSONB columns |
| Email integration | Low | Already have template system |
| Prompt engineering | Medium | Requires iteration |
| Testing & refinement | Medium | Need to validate quality |

**Total: ~2-3 days of focused work**

---

## Questions for Review

1. **Insight depth**: Should insights be brief (3-4 sentences each) or comprehensive (full paragraphs)?

2. **Generation timing**: Generate on-demand (slower initial load) or in background after email submission (faster load but slight delay on insights)?

3. **Caching strategy**: Cache insights for repeat visits or regenerate fresh each time?

4. **Email inclusion**: Include full insights in emails or just teasers that drive back to the app?

5. **Paid gate potential**: Should some insights be gated for paid users only?

---

## Next Steps

1. [ ] Approve this specification
2. [ ] Decide on implementation option (A/B/C)
3. [ ] Create Edge Function for insight generation
4. [ ] Design prompt templates
5. [ ] Update UI components
6. [ ] Test with real user data
7. [ ] Integrate with email sequences
