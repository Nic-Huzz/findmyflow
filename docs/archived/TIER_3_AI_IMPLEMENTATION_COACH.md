# Tier 3: AI Implementation Coach Specification

## Overview

The AI Implementation Coach (Zarlo) helps users complete implementation tasks by providing contextual guidance and generating artifacts (headlines, emails, scripts, pricing). It operates within the Implementation Tracker, activated when users click on specific tasks.

**Status:** IMPLEMENTATION COMPLETE (January 2026)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Implementation Tracker                        │
│                    (Task List with Checkboxes)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    User clicks task
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ZarloImplementationCoach                      │
│              (Slide-in desktop / Full-screen mobile)            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Pre-filled Context Display                              │   │
│  │  "Based on your [flow], I know..."                       │   │
│  │  • Offer type: [Menu Upsell]                             │   │
│  │  • Price point: [$997]                                   │   │
│  │  • Main objection: [too_expensive_upfront]               │   │
│  │  [Confirm] or [Edit]                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Clarifying Questions (if needed)                        │   │
│  │  "What's the ONE transformation they'll get?"            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Generated Artifact                                       │   │
│  │  [Copy] [Regenerate] [Save to Library]                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Business Profile (Pre-fill Context)

The coach uses `getUserBusinessProfile()` from `src/lib/businessProfile.js` to pre-fill context:

```javascript
import { getOfferContext } from '../lib/businessProfile'

// When user clicks on a task
const context = await getOfferContext(userId, 'downsell')
// Returns:
// {
//   offer: {
//     recommendedId: 'payment_plan_downsell',
//     recommendedName: 'Payment Plan Downsell',
//     mainObjection: 'too_expensive_upfront',
//     pricePoint: '2000_to_5000',
//     goal: 'increase_conversions',
//   },
//   core: { name: 'Business Accelerator', price: 2997 },
//   audience: { personas: [...], problems: [...] },
//   voice: { profileName: 'Bold & Direct', toneSettings: {...} },
//   niche: { definition: 'burnt-out professionals', painLevel: 8 }
// }
```

### 2. Voice Profile Integration

All generated content uses the user's voice profile:

```javascript
import { getVoiceForGeneration } from '../lib/businessProfile'

const { instructions } = await getVoiceForGeneration(userId)
// Returns enhanced voice instructions for AI prompts
```

### 3. Template System

Each task type has an associated template:

| Task Type | Template | Inputs Needed |
|-----------|----------|---------------|
| Create Upsell Headline | `UPSELL_HEADLINE_TEMPLATE` | transformation, timeframe, core_offer |
| Write Downsell Email | `DOWNSELL_EMAIL_TEMPLATE` | objection, what_they_get, price |
| Create Payment Plan Script | `PAYMENT_PLAN_SCRIPT_TEMPLATE` | monthly_amount, total_value |
| Write Continuity Pitch | `CONTINUITY_PITCH_TEMPLATE` | recurring_benefit, membership_name |
| Design Pricing Anchor | `PRICING_ANCHOR_TEMPLATE` | premium_price, standard_price |

---

## UI/UX Specification

### Entry Point

| Device | Behavior |
|--------|----------|
| Desktop | Slide-in panel from right (400px width) |
| Mobile | Full-screen modal |

### Pre-fill + Confirm Pattern

When coach opens, it displays known context:

```
┌────────────────────────────────────────────┐
│ 💡 I already know about your business:     │
│                                            │
│ ✓ Your downsell type: Payment Plan         │
│ ✓ Main objection: "Too expensive upfront"  │
│ ✓ Core offer price: $2,997                 │
│                                            │
│ Does this look right?                      │
│                                            │
│ [Yes, continue] [No, let me update]        │
└────────────────────────────────────────────┘
```

If user confirms, proceed to generation. If user edits, show input form.

### Generation Flow

1. **Context confirmed** → Show clarifying question (if needed)
2. **Question answered** → Generate artifact
3. **Artifact displayed** with actions:
   - **Copy** - Copy to clipboard
   - **Regenerate** - Create alternative version
   - **Save to Library** - Store in `generated_assets` table

---

## Implementation Templates

### Sample: Upsell Headline Template

```javascript
const UPSELL_HEADLINE_TEMPLATE = {
  task_id: 'create_upsell_headline',
  display_name: 'Create Upsell Headline',
  category: 'upsell',

  // Pre-filled from getUserBusinessProfile()
  context_sources: [
    'offers.upsell.recommendedName',
    'offers.upsell.goal',
    'offers.core.name',
    'offers.core.price',
    'audience.personas',
    'niche.definition',
  ],

  // Display for user confirmation
  context_display: (ctx) => [
    `Upsell type: ${ctx.offers.upsell.recommendedName}`,
    `Core offer: ${ctx.offers.core.name} ($${ctx.offers.core.price})`,
    `Goal: ${ctx.offers.upsell.goal?.replace(/_/g, ' ')}`,
  ],

  // Questions only if data missing
  clarifying_questions: [
    {
      id: 'transformation',
      question: 'What\'s the ONE big transformation this upsell delivers?',
      help: 'Focus on the result, not features. Example: "Master outbound sales in 30 days"',
      required: true,
      if_missing: 'offers.upsell.product.description', // Only ask if this is null
    },
    {
      id: 'timeframe',
      question: 'How quickly will they see results?',
      help: 'Example: "30 days", "first week", "immediately"',
      required: false,
    },
  ],

  // AI generation prompt
  generation_prompt: (ctx, answers) => `
You are a direct-response copywriter trained in Alex Hormozi's $100M Offers methodology.

CONTEXT:
- Business niche: ${ctx.niche?.definition || 'not specified'}
- Core offer: ${ctx.offers.core.name} at $${ctx.offers.core.price}
- Upsell type: ${ctx.offers.upsell.recommendedName}
- Upsell goal: ${ctx.offers.upsell.goal}
- Target transformation: ${answers.transformation}
- Timeframe: ${answers.timeframe || 'not specified'}

${ctx.voice?.instructions || ''}

Create 3 compelling upsell headlines that:
1. Lead with the transformation, not features
2. Include specific timeframe or outcome if known
3. Create urgency without being pushy
4. Sound like the voice profile above

Format:
HEADLINE 1: [headline]
Why it works: [1 sentence explanation]

HEADLINE 2: [headline]
Why it works: [1 sentence explanation]

HEADLINE 3: [headline]
Why it works: [1 sentence explanation]
`,

  // Success criteria for user
  success_tips: [
    'Pick the headline that feels most "you"',
    'Test 2-3 versions if possible',
    'The best headlines promise a specific transformation',
  ],
}
```

---

## Database: Generated Assets Library

```sql
CREATE TABLE generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,

  -- Asset details
  asset_type TEXT NOT NULL, -- 'headline', 'email', 'script', 'pricing'
  category TEXT NOT NULL,   -- 'upsell', 'downsell', 'continuity', 'attraction'
  task_id TEXT NOT NULL,    -- Reference to implementation task

  -- Content
  content TEXT NOT NULL,
  context_snapshot JSONB,   -- Snapshot of business profile at generation time
  prompt_used TEXT,         -- For learning/debugging

  -- User feedback
  selected BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Level 1 vs Level 2 Features

### Level 1: Task Guidance (MVP)
- Display pre-filled context
- Show task description and tips
- Link to relevant Hormozi principles
- Manual task completion

### Level 2: Artifact Generation (MVP)
- AI-generated headlines, emails, scripts
- Voice profile integration
- Copy/regenerate/save actions
- Generated Assets Library

### Level 3: Smart Sequencing (Roadmap)
- AI suggests which tasks to do next
- Cross-task dependency awareness
- Milestone tracking
- ROI projections

---

## Implementation Order

1. **Phase 1: Foundation** - **COMPLETE (Jan 2026)**
   - [x] Create `ZarloImplementationCoach.jsx` component
   - [x] Create `implementationTemplates.js` with 5 templates
   - [x] Add slide-in/modal UI to ImplementationTracker
   - [x] Integrate with `getUserBusinessProfile()`
   - [x] Edge function for artifact generation
   - [x] Voice profile integration
   - [x] Copy/regenerate actions

2. **Phase 2: Level 1 - Guidance** - **COMPLETE (Jan 2026)**
   - [x] Pre-fill + confirm pattern UI
   - [x] Display task tips and Hormozi principles
   - [x] "I completed this manually" flow (guidance-only mode)

3. **Phase 3: Level 2 - Generation** - **COMPLETE (Jan 2026)**
   - [x] Edge function for artifact generation
   - [x] Voice profile integration
   - [x] Copy/regenerate actions
   - [x] Create `generated_assets` table
   - [x] Save to Library functionality
   - [x] Generated Assets Library page (`/crm/assets`)

4. **Phase 4: Polish** - **COMPLETE (Jan 2026)**
   - [x] Mobile-optimized full-screen view (responsive CSS)
   - [x] Loading states and animations
   - [x] Error handling and retry
   - [x] Analytics tracking (`coach_analytics` table)

---

## Files Created/Modified

| File | Purpose | Status |
|------|---------|--------|
| `src/components/crm/ZarloImplementationCoach.jsx` | Main coach component | **Created** |
| `src/components/crm/ZarloImplementationCoach.css` | Styling | **Created** |
| `src/lib/crm/implementationTemplates.js` | Task templates (12 templates) | **Created** |
| `supabase/functions/implementation-coach/index.ts` | AI generation edge function | **Deployed** |
| `src/pages/crm/ImplementationTracker.jsx` | Added coach integration | **Modified** |
| `src/pages/crm/ImplementationTracker.css` | Added AI button styles | **Modified** |
| `src/components/crm/index.js` | Added coach export | **Modified** |
| `supabase/migrations/20260110000000_generated_assets.sql` | Assets table | **Applied** |
| `supabase/migrations/20260110100000_coach_analytics.sql` | Analytics table | **Created** |
| `src/pages/crm/GeneratedAssetsLibrary.jsx` | Library page | **Created** |
| `src/pages/crm/GeneratedAssetsLibrary.css` | Library styling | **Created** |
| `src/pages/crm/CRMDashboard.jsx` | Added Content Library nav | **Modified** |

---

## Trial Model Integration

All Tier 3 features are available during the trial period. After trial:
- Coach panel still opens but shows "Upgrade to unlock AI assistance"
- Pre-filled context is still visible (read-only)
- Generation buttons are disabled
- "See sample" links show example outputs

---

## Voice Profile Learning Loop

When users save assets or provide feedback:

```javascript
// After user selects a headline
await supabase.from('generated_assets').update({
  selected: true,
  rating: 5,
})

// Update voice profile learning
await supabase.from('voice_profiles').update({
  learned_patterns: {
    ...existingPatterns,
    preferred_headline_style: 'transformation_first',
  },
  total_generations: totalGenerations + 1,
})
```

This data feeds back into future generations for improved personalization.

---

## Completed Features Summary

- **AI Coach Component**: Slide-in panel with context confirmation, clarifying questions, and generation
- **12 Generation Templates**: Headlines, emails, scripts, pitches across all 4 offer categories
- **Voice Integration**: All generated content uses user's voice profile
- **Content Library**: Save, favorite, copy, and manage generated assets at `/crm/assets`
- **Analytics Tracking**: Events tracked in `coach_analytics` table for optimization insights

## Next Steps (Tier 4 - Data Integration)

1. [ ] CRM Integration - Connect with external CRM systems
2. [ ] Performance Analytics - Track content effectiveness
3. [ ] A/B Testing Framework - Compare content variations
4. [ ] Smart Suggestions - AI recommends next tasks based on progress
