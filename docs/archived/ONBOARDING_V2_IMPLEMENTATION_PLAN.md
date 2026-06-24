# Onboarding V2 Implementation Plan

> Created: 2026-01-13
> Purpose: Build guide for new onboarding flow, feeding into Challenges and CRM

---

## Strategic Context

This onboarding rebuild serves three purposes:
1. **Onboarding V2** - Better path routing based on wealth ladder + goal
2. **Challenge Fine-Tuning** - Emphasis determines which quests surface first
3. **CRM Integration** - Product type captured at onboarding informs CRM pipelines

### Flow Sequence (Post-Onboarding)

```
Onboarding V2 → Offer Builder V1 → Grand Slam V2 → Product Suite Builder → CRM
                     ↓
              (Create Product flow deprecated - consolidated here)
```

### Key Decisions Made

| Decision | Resolution |
|----------|------------|
| Flow Finder Lite | = Wheel Taxonomy picker (no separate flow) |
| Offer Audit | = Mode toggle in Offer Builder (not separate flow) |
| Create Product Flow | Deprecated - consolidated into Offer Builder sequence |
| Quick Capture | Uses wheel taxonomy for non-pre_ladder users |
| Multi-Product | Category selector for products 2+ (can mix wealth ladder levels) |
| Dashboard Emphasis | Lives in Flow Report Card "Next Recommended" section |
| Flow Report Card | Replaces Library of Answers at `/library` route |

---

## Phase 1: Database & Schema Updates

### 1.1 New Fields on `user_stage_progress`

```sql
-- Migration: Add onboarding V2 fields
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS employment_status TEXT;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS has_side_project BOOLEAN DEFAULT false;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS wealth_ladder_rung TEXT;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS primary_goal TEXT;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS guidance_emphasis TEXT;

-- Constraints
ALTER TABLE user_stage_progress ADD CONSTRAINT valid_employment
  CHECK (employment_status IN ('employed_exploring', 'employed_building', 'self_employed_early', 'self_employed_established') OR employment_status IS NULL);

ALTER TABLE user_stage_progress ADD CONSTRAINT valid_wealth_ladder
  CHECK (wealth_ladder_rung IN ('pre_ladder', 'service', 'productized', 'products') OR wealth_ladder_rung IS NULL);

ALTER TABLE user_stage_progress ADD CONSTRAINT valid_goal
  CHECK (primary_goal IN ('discovery', 'creation', 'monetization', 'growth') OR primary_goal IS NULL);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_stage_wealth ON user_stage_progress(wealth_ladder_rung);
```

### 1.2 Products Table (If Not Exists)

```sql
-- Check if products table exists, create if not
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Product identity
  name TEXT NOT NULL,
  description TEXT,

  -- Classification
  product_type TEXT NOT NULL,
  product_subtype TEXT,

  -- Money Model position
  money_model_tier TEXT,

  -- Pricing
  price_type TEXT,
  price_amount DECIMAL(10,2),
  subscription_interval TEXT,

  -- Status
  status TEXT DEFAULT 'draft',
  source TEXT DEFAULT 'manual', -- 'quick_capture', 'offer_builder', 'manual'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own products" ON products
  FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_products_project ON products(project_id);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
```

### 1.3 Migration for Existing Users

```sql
-- Set defaults based on existing persona
UPDATE user_stage_progress
SET
  wealth_ladder_rung = CASE
    WHEN persona = 'vibe_seeker' THEN 'pre_ladder'
    WHEN persona = 'vibe_riser' THEN 'service'
    WHEN persona = 'movement_maker' THEN 'products'
    ELSE NULL
  END,
  primary_goal = CASE
    WHEN persona = 'vibe_seeker' THEN 'discovery'
    WHEN persona = 'vibe_riser' THEN 'creation'
    WHEN persona = 'movement_maker' THEN 'growth'
    ELSE NULL
  END
WHERE wealth_ladder_rung IS NULL AND persona IS NOT NULL;
```

### 1.4 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/YYYYMMDD_onboarding_v2_schema.sql` | Create | Schema changes |
| `src/lib/supabaseClient.js` | Verify | Ensure products table accessible |

---

## Phase 2: Core Onboarding Components

### 2.1 Component Structure

```
src/
├── components/
│   └── onboarding/
│       ├── OnboardingV2.jsx           # Main orchestrator
│       ├── OnboardingV2.css           # Styles
│       ├── Q1JourneyStage.jsx         # Employment + side project
│       ├── Q2WealthLadder.jsx         # What have you created
│       ├── Q3Goal.jsx                 # What would help most (with greyed options)
│       ├── PathRouter.jsx             # Determines path 1-4
│       ├── PersonaReveal.jsx          # Shows derived persona
│       └── index.js                   # Barrel export
```

### 2.2 Q1: Journey Stage Component

```jsx
// Q1JourneyStage.jsx
const JOURNEY_OPTIONS = [
  {
    id: 'employed_exploring',
    label: "I'm employed and exploring what's next",
    description: "Still in a job, thinking about alternatives",
    icon: '🔍',
    hasProject: false
  },
  {
    id: 'employed_building',
    label: "I'm employed but building something on the side",
    description: "Have a job AND working on my own thing",
    icon: '🌱',
    hasProject: true
  },
  {
    id: 'self_employed_early',
    label: "I'm self-employed but still figuring it out",
    description: "Left employment, business is early stage",
    icon: '🚀',
    hasProject: true
  },
  {
    id: 'self_employed_established',
    label: "I'm self-employed with an established business",
    description: "Been doing this a while, looking to grow",
    icon: '📈',
    hasProject: true
  }
]
```

### 2.3 Q2: Wealth Ladder Component

```jsx
// Q2WealthLadder.jsx
const WEALTH_LADDER_OPTIONS = [
  {
    id: 'pre_ladder',
    label: "I haven't created anything yet",
    description: "Still exploring what to build",
    icon: '💭',
    persona: 'vibe_seeker'
  },
  {
    id: 'service',
    label: "I offer a service (trading time for money)",
    description: "Coaching, consulting, freelancing, etc.",
    icon: '🤝',
    persona: 'vibe_riser'
  },
  {
    id: 'productized',
    label: "I have a productized service or course",
    description: "Packaged offering, cohorts, programs",
    icon: '📦',
    persona: 'vibe_riser'
  },
  {
    id: 'products',
    label: "I sell products (digital, software, or physical)",
    description: "Create once, sell many times",
    icon: '🛍️',
    persona: 'movement_maker'
  }
]
```

### 2.4 Q3: Goal Component (With Greyed Options)

```jsx
// Q3Goal.jsx
const GOAL_OPTIONS = [
  {
    id: 'discovery',
    label: "Discover my direction",
    description: "Figure out what I'm good at and who I help",
    icon: '🧭',
    disabledFor: [] // Available for all
  },
  {
    id: 'creation',
    label: "Create my first offer",
    description: "Package my skills into something I can sell",
    icon: '✨',
    disabledFor: [] // Available for all
  },
  {
    id: 'monetization',
    label: "Get consistent clients",
    description: "Build a system for finding and converting leads",
    icon: '💰',
    disabledFor: ['pre_ladder'] // Greyed for pre_ladder
  },
  {
    id: 'growth',
    label: "Scale and build systems",
    description: "Optimize what's working and grow",
    icon: '📈',
    disabledFor: ['pre_ladder', 'service'] // Greyed for pre_ladder and service
  }
]

// Disabled option shows tooltip on hover
const getDisabledReason = (optionId, wealthLadder) => {
  if (optionId === 'monetization' && wealthLadder === 'pre_ladder') {
    return "First, let's figure out what you're offering"
  }
  if (optionId === 'growth' && wealthLadder === 'pre_ladder') {
    return "You'll unlock this once you have something to scale"
  }
  if (optionId === 'growth' && wealthLadder === 'service') {
    return "Focus on consistent clients first, then scale"
  }
  return null
}
```

### 2.5 Path Router Logic

```jsx
// PathRouter.jsx
export function determineOnboardingPath(wealthLadder, goal) {
  // Path 1: Pre-ladder → Discovery/Creation
  if (wealthLadder === 'pre_ladder') {
    return {
      path: 1,
      emphasis: goal === 'creation' ? 'fast_track_creation' : 'deep_discovery',
      startingStage: 1,
      nextFlow: '/nikigai/skills', // Flow Finder
      description: 'Start with Flow Finder to discover your skills'
    }
  }

  // Path 2: Service → Creation/Monetization
  if (wealthLadder === 'service') {
    return {
      path: 2,
      emphasis: goal === 'monetization' ? 'client_acquisition' : 'offer_refinement',
      startingStage: goal === 'monetization' ? 3 : 2,
      nextFlow: 'quick_capture', // Wheel-based capture
      description: 'Capture your existing service'
    }
  }

  // Path 3: Productized → Creation/Monetization
  if (wealthLadder === 'productized') {
    return {
      path: 3,
      emphasis: goal === 'monetization' ? 'launch_sales' : 'suite_building',
      startingStage: goal === 'monetization' ? 5 : 4,
      nextFlow: 'quick_capture',
      description: 'Capture your existing offerings'
    }
  }

  // Path 4: Products → Monetization/Growth
  if (wealthLadder === 'products') {
    return {
      path: 4,
      emphasis: goal === 'growth' ? 'scale_systems' : 'pipeline_optimization',
      startingStage: 6,
      nextFlow: 'quick_capture',
      description: 'Capture your product suite'
    }
  }
}

// Persona derivation
export function derivePersona(wealthLadder) {
  const mapping = {
    pre_ladder: 'vibe_seeker',
    service: 'vibe_riser',
    productized: 'vibe_riser',
    products: 'movement_maker'
  }
  return mapping[wealthLadder] || 'vibe_seeker'
}

// Emphasis to quest priority mapping
export const EMPHASIS_CONFIG = {
  deep_discovery: {
    unlockedStages: [0, 1],
    questPriority: ['flow_finder_skills', 'flow_finder_problems', 'flow_finder_persona'],
    dashboardHero: 'flow_finder_wheels',
    zarloPersonality: 'curious_explorer'
  },
  fast_track_creation: {
    unlockedStages: [0, 1, 2],
    questPriority: ['quick_skills', 'offer_builder', 'first_customer'],
    dashboardHero: 'offer_builder_card',
    zarloPersonality: 'action_oriented'
  },
  offer_refinement: {
    unlockedStages: [2, 3],
    questPriority: ['offer_builder', 'product_designer', 'testing'],
    dashboardHero: 'offer_health',
    zarloPersonality: 'strategic_advisor'
  },
  client_acquisition: {
    unlockedStages: [2, 3, 4],
    questPriority: ['crm_setup', 'lead_capture', 'nurture_sequence'],
    dashboardHero: 'crm_pipeline',
    zarloPersonality: 'sales_coach'
  },
  suite_building: {
    unlockedStages: [3, 4, 5],
    questPriority: ['upsell_assessment', 'downsell_assessment', 'continuity_assessment'],
    dashboardHero: 'product_suite',
    zarloPersonality: 'strategic_advisor'
  },
  launch_sales: {
    unlockedStages: [4, 5, 6],
    questPriority: ['core_four', 'funnel_builder', 'launch_sequence'],
    dashboardHero: 'campaign_progress',
    zarloPersonality: 'accountability_partner'
  },
  pipeline_optimization: {
    unlockedStages: [5, 6, 7],
    questPriority: ['funnel_calculator', 'weekly_update', 'crm_optimization'],
    dashboardHero: 'funnel_metrics',
    zarloPersonality: 'data_analyst'
  },
  scale_systems: {
    unlockedStages: [1, 2, 3, 4, 5, 6, 7],
    questPriority: ['funnel_baseline', 'bottleneck_analysis', 'systems_review'],
    dashboardHero: 'revenue_dashboard',
    zarloPersonality: 'strategic_advisor'
  }
}
```

### 2.6 Files to Create

| File | Lines Est. | Purpose |
|------|------------|---------|
| `src/components/onboarding/OnboardingV2.jsx` | ~300 | Main orchestrator |
| `src/components/onboarding/OnboardingV2.css` | ~200 | Styles |
| `src/components/onboarding/Q1JourneyStage.jsx` | ~80 | Q1 component |
| `src/components/onboarding/Q2WealthLadder.jsx` | ~80 | Q2 component |
| `src/components/onboarding/Q3Goal.jsx` | ~120 | Q3 with greyed options |
| `src/components/onboarding/PathRouter.jsx` | ~150 | Path determination logic |
| `src/components/onboarding/PersonaReveal.jsx` | ~60 | Persona reveal animation |
| `src/lib/guidanceEmphasis.js` | ~100 | EMPHASIS_CONFIG export |

---

## Phase 3: Wheel Taxonomy Quick Capture

### 3.1 Component Structure

```
src/
├── components/
│   └── onboarding/
│       ├── QuickCapture/
│       │   ├── QuickCapture.jsx           # Main orchestrator
│       │   ├── QuickCapture.css           # Styles
│       │   ├── ProjectBasics.jsx          # Name + one-liner
│       │   ├── DeliverySelector.jsx       # Category → product type
│       │   ├── WheelPicker.jsx            # Reusable wheel segment picker
│       │   ├── ProductCard.jsx            # Individual product entry
│       │   ├── MultiProductCapture.jsx    # Products 2-4 with category selector
│       │   ├── SuiteVisualization.jsx     # Money model preview
│       │   └── index.js                   # Barrel export
```

### 3.2 Quick Capture Flow Logic

```jsx
// QuickCapture.jsx
function QuickCapture({ wealthLadder, onComplete }) {
  const [step, setStep] = useState(1)
  const [numOfferings, setNumOfferings] = useState(null) // 'one', 'few', 'many'

  // Steps vary based on numOfferings
  const steps = useMemo(() => {
    const base = [
      { id: 'basics', component: ProjectBasics },
      { id: 'skills', component: () => <WheelPicker type="skills" max={3} /> },
      { id: 'problems', component: () => <WheelPicker type="problems" max={2} /> },
      { id: 'personas', component: () => <WheelPicker type="personas" max={2} /> },
    ]

    if (numOfferings === 'one') {
      base.push({ id: 'single_product', component: SingleProductCapture })
    } else if (numOfferings === 'few') {
      base.push({ id: 'multi_product', component: MultiProductCapture })
      base.push({ id: 'suite_preview', component: SuiteVisualization })
    } else if (numOfferings === 'many') {
      base.push({ id: 'core_product', component: SingleProductCapture })
      base.push({ id: 'suite_builder_prompt', component: SuiteBuilderPrompt })
    }

    base.push({ id: 'summary', component: CaptureSummary })

    return base
  }, [numOfferings])

  // Before skills, ask how many offerings
  useEffect(() => {
    if (step === 1 && wealthLadder !== 'pre_ladder' && !numOfferings) {
      // Show offering count selector
    }
  }, [step, wealthLadder, numOfferings])
}
```

### 3.3 WheelPicker Component (With Ring Follow-Up Questions)

Each wheel has a **dimensional follow-up question** after segment selection:

| Wheel | Primary Selection | Follow-up Question | Ring Options |
|-------|------------------|-------------------|--------------|
| **Skills** | 12 segments | "How confident are you with this skill?" | Emerging → Establishing → Mastering |
| **Problems** | 12 domains | "What's your experience with this problem space?" | Exploring → Pursuing → Proven |
| **Personas** | 12 psychographics | "Where are your ideal customers in their journey?" | Awakening → Struggling → Ready |

```jsx
// WheelPicker.jsx
import {
  SKILLS_SEGMENTS, PROBLEM_SEGMENTS, PERSONA_SEGMENTS,
  PROFICIENCY_RINGS, PROBLEMS_PROFICIENCY_RINGS, JOURNEY_STAGES
} from '../../lib/wheelTaxonomy'

function WheelPicker({ type, max, selected, onSelect }) {
  const [pendingSegment, setPendingSegment] = useState(null) // Segment awaiting ring selection
  const [showRingPicker, setShowRingPicker] = useState(false)

  const segments = useMemo(() => {
    switch (type) {
      case 'skills': return SKILLS_SEGMENTS
      case 'problems': return PROBLEM_SEGMENTS
      case 'personas': return PERSONA_SEGMENTS
    }
  }, [type])

  // Get ring options based on wheel type
  const ringOptions = useMemo(() => {
    switch (type) {
      case 'skills': return PROFICIENCY_RINGS
      case 'problems': return PROBLEMS_PROFICIENCY_RINGS
      case 'personas': return JOURNEY_STAGES
    }
  }, [type])

  // Get follow-up question based on wheel type
  const ringQuestion = useMemo(() => {
    switch (type) {
      case 'skills': return "How confident are you with this skill?"
      case 'problems': return "What's your experience with this problem space?"
      case 'personas': return "Where are your ideal customers in their journey?"
    }
  }, [type])

  const groupedSegments = useMemo(() => {
    if (type === 'problems') {
      // Group by sphere: self, relational, community, world
      return groupByProperty(segments, 'sphere')
    }
    return { all: segments }
  }, [type, segments])

  // Handle segment selection - show ring picker
  const handleSegmentClick = (segmentId) => {
    if (selected.find(s => s.id === segmentId)) {
      // Already selected - deselect it
      onSelect(selected.filter(s => s.id !== segmentId))
    } else if (selected.length < max) {
      // Show ring picker for this segment
      setPendingSegment(segmentId)
      setShowRingPicker(true)
    }
  }

  // Handle ring selection - complete the segment selection
  const handleRingSelect = (ringId) => {
    onSelect([...selected, { id: pendingSegment, ring: ringId }])
    setPendingSegment(null)
    setShowRingPicker(false)
  }

  // Ring picker modal/sheet
  if (showRingPicker && pendingSegment) {
    const segment = segments.find(s => s.id === pendingSegment)
    return (
      <div className="ring-picker-overlay">
        <div className="ring-picker-modal">
          <div className="ring-picker-header">
            <span className="segment-icon">{segment.icon}</span>
            <h3>{segment.displayName}</h3>
          </div>
          <p className="ring-question">{ringQuestion}</p>
          <div className="ring-options">
            {ringOptions.map(ring => (
              <button
                key={ring.id}
                className="ring-option"
                style={{ borderColor: ring.color }}
                onClick={() => handleRingSelect(ring.id)}
              >
                <span className="ring-label">{ring.label}</span>
                <span className="ring-description">{ring.description}</span>
              </button>
            ))}
          </div>
          <button className="cancel-btn" onClick={() => {
            setPendingSegment(null)
            setShowRingPicker(false)
          }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="wheel-picker">
      {Object.entries(groupedSegments).map(([group, items]) => (
        <div key={group} className="wheel-group">
          {group !== 'all' && <h4 className="group-label">{group}</h4>}
          <div className="segment-grid">
            {items.map(segment => {
              const selectedItem = selected.find(s => s.id === segment.id)
              return (
                <SegmentButton
                  key={segment.id}
                  segment={segment}
                  selected={!!selectedItem}
                  selectedRing={selectedItem?.ring}
                  disabled={selected.length >= max && !selectedItem}
                  onClick={() => handleSegmentClick(segment.id)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Data structure for selected segments:**
```js
// Each selected segment includes both the segment ID and the ring level
selected = [
  { id: 'clarifying', ring: 'mastering' },
  { id: 'analyzing', ring: 'establishing' },
  { id: 'connecting', ring: 'emerging' }
]
```

### 3.4 Multi-Product with Category Selector

```jsx
// MultiProductCapture.jsx
function MultiProductCapture({ wealthLadder, products, onUpdate }) {
  const addProduct = () => {
    // For product 2+, always show category selector first
    onUpdate([...products, { id: uuid(), step: 'category' }])
  }

  return (
    <div className="multi-product-capture">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          isFirst={index === 0}
          defaultCategory={index === 0 ? wealthLadder : null}
          onUpdate={(updated) => updateProduct(index, updated)}
          onRemove={() => removeProduct(index)}
        />
      ))}

      {products.length < 4 && (
        <button className="add-product-btn" onClick={addProduct}>
          + Add Another Offering
        </button>
      )}
    </div>
  )
}

// Category selector shown for products 2+
const CATEGORY_OPTIONS = [
  {
    id: 'service',
    label: 'Service',
    description: 'I do the work myself',
    icon: '💼',
    productTypes: ['custom_service', 'packaged_service', 'live_group']
  },
  {
    id: 'productized',
    label: 'Productized',
    description: 'Packaged programs, courses',
    icon: '📦',
    productTypes: ['live_group', 'automated_group', 'managed_service', 'membership']
  },
  {
    id: 'product',
    label: 'Product',
    description: 'They buy something I created',
    icon: '🛍️',
    productTypes: ['digital_product'],
    showSubtype: true
  }
]
```

### 3.5 Data Persistence on Complete

```jsx
// Called when Quick Capture completes
async function saveQuickCaptureData(userId, data) {
  const { name, oneLiner, skills, problems, personas, products, wealthLadder, emphasis } = data

  // 1. Create project
  const { data: project } = await supabase
    .from('user_projects')
    .insert({
      user_id: userId,
      name: name,
      description: oneLiner,
      current_stage: determineStartingStage(wealthLadder, emphasis)
    })
    .select()
    .single()

  // 2. Create nikigai_clusters entries (so wheels light up)
  // Note: skills/problems/personas now include ring selection from follow-up questions
  // Format: [{ id: 'clarifying', ring: 'mastering' }, ...]
  const clusterEntries = [
    ...skills.map(item => ({
      user_id: userId,
      project_id: project.id,
      cluster_type: 'skills',
      segment_id: item.id,
      cluster_name: getSegmentName('skills', item.id),
      proficiency: item.ring || 'establishing', // Ring from follow-up question
      source: 'quick_capture'
    })),
    ...problems.map(item => ({
      user_id: userId,
      project_id: project.id,
      cluster_type: 'problems',
      segment_id: item.id,
      cluster_name: getSegmentName('problems', item.id),
      proficiency: item.ring || 'pursuing', // Ring from follow-up question
      source: 'quick_capture'
    })),
    ...personas.map(item => ({
      user_id: userId,
      project_id: project.id,
      cluster_type: 'persona',
      segment_id: item.id,
      cluster_name: getSegmentName('personas', item.id),
      journey_stage: item.ring || 'struggling', // Ring from follow-up question
      source: 'quick_capture'
    }))
  ]

  await supabase.from('nikigai_clusters').insert(clusterEntries)

  // 3. Create products entries
  const productEntries = products.map(p => ({
    user_id: userId,
    project_id: project.id,
    name: p.name,
    product_type: p.productType,
    product_subtype: p.productSubtype || null,
    money_model_tier: p.tier,
    price_amount: p.price,
    price_type: p.priceType,
    source: 'quick_capture'
  }))

  await supabase.from('products').insert(productEntries)

  // 4. Update user_stage_progress with emphasis
  await supabase
    .from('user_stage_progress')
    .update({ guidance_emphasis: emphasis })
    .eq('user_id', userId)

  return project.id
}
```

### 3.6 Files to Create

| File | Lines Est. | Purpose |
|------|------------|---------|
| `src/components/onboarding/QuickCapture/QuickCapture.jsx` | ~250 | Main orchestrator |
| `src/components/onboarding/QuickCapture/QuickCapture.css` | ~300 | Styles |
| `src/components/onboarding/QuickCapture/ProjectBasics.jsx` | ~60 | Name + one-liner |
| `src/components/onboarding/QuickCapture/WheelPicker.jsx` | ~150 | Segment picker |
| `src/components/onboarding/QuickCapture/ProductCard.jsx` | ~180 | Product entry card |
| `src/components/onboarding/QuickCapture/MultiProductCapture.jsx` | ~120 | Multi-product with category |
| `src/components/onboarding/QuickCapture/SuiteVisualization.jsx` | ~100 | Money model preview |
| `src/components/onboarding/QuickCapture/DeliverySelector.jsx` | ~100 | Category → type mapping |

---

## Phase 4: Flow Report Card

### 4.1 Component Structure

Based on `mockups/flow-report-card.html`:

```
src/
├── pages/
│   └── FlowReportCard.jsx             # Main page (replaces LibraryOfAnswers)
├── components/
│   └── report-card/
│       ├── ReportCard.jsx             # Card container
│       ├── ReportCard.css             # Styles
│       ├── IdentitySection.jsx        # Essence, Protective, Persona
│       ├── WealthLadderSection.jsx    # Visual ladder position
│       ├── YourFlowSection.jsx        # Skills, Problems, Personas from wheels
│       ├── ProductSuiteSection.jsx    # Money model tiers
│       ├── MetricsSection.jsx         # Revenue, Leads, etc.
│       ├── ProgressSection.jsx        # Completeness bar
│       ├── NextRecommended.jsx        # Emphasis-driven CTA
│       └── index.js                   # Barrel export
```

### 4.2 Data Loading

```jsx
// FlowReportCard.jsx
function FlowReportCard() {
  const { user } = useAuth()
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    async function loadReportData() {
      // Fetch all data needed for report card
      const [
        stageProgress,
        nikigaiClusters,
        products,
        leadFlowProfile,
        funnelMetrics,
        dealStats
      ] = await Promise.all([
        supabase.from('user_stage_progress').select('*').eq('user_id', user.id).single(),
        supabase.from('nikigai_clusters').select('*').eq('user_id', user.id),
        supabase.from('products').select('*').eq('user_id', user.id),
        supabase.from('lead_flow_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('funnel_metrics').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
        fetchDealStats(user.id)
      ])

      // Calculate completeness
      const completeness = calculateCompleteness({
        stageProgress: stageProgress.data,
        clusters: nikigaiClusters.data,
        products: products.data,
        profile: leadFlowProfile.data
      })

      // Determine next recommended based on emphasis
      const nextRecommended = getNextRecommended(
        stageProgress.data?.guidance_emphasis,
        completeness.gaps
      )

      setReportData({
        identity: {
          essence: leadFlowProfile.data?.essence_archetype,
          protective: leadFlowProfile.data?.protective_archetype,
          persona: stageProgress.data?.persona
        },
        wealthLadder: stageProgress.data?.wealth_ladder_rung,
        flow: {
          skills: nikigaiClusters.data?.filter(c => c.cluster_type === 'skills'),
          problems: nikigaiClusters.data?.filter(c => c.cluster_type === 'problems'),
          personas: nikigaiClusters.data?.filter(c => c.cluster_type === 'persona')
        },
        productSuite: organizeByTier(products.data),
        metrics: {
          revenue: dealStats?.totalRevenue || 0,
          leads: dealStats?.activeLeads || 0,
          goal: stageProgress.data?.revenue_goal
        },
        completeness,
        nextRecommended,
        emphasis: stageProgress.data?.guidance_emphasis
      })
    }

    loadReportData()
  }, [user.id])

  // ... render sections
}
```

### 4.3 Next Recommended Logic (Emphasis-Driven)

```jsx
// NextRecommended.jsx
function NextRecommended({ emphasis, gaps, completeness }) {
  const recommendation = useMemo(() => {
    const config = EMPHASIS_CONFIG[emphasis]

    // Find first incomplete item in quest priority
    for (const questId of config.questPriority) {
      if (gaps.includes(questId)) {
        return QUEST_RECOMMENDATIONS[questId]
      }
    }

    // Fallback to generic recommendation
    return getGenericRecommendation(completeness)
  }, [emphasis, gaps, completeness])

  return (
    <div className="next-recommended">
      <div className="next-label">Next Recommended</div>
      <div className="next-title">{recommendation.title}</div>
      <div className="next-description">{recommendation.description}</div>
      <Link to={recommendation.route} className="next-cta">
        {recommendation.cta}
      </Link>
    </div>
  )
}

const QUEST_RECOMMENDATIONS = {
  flow_finder_skills: {
    title: 'Discover Your Skills',
    description: 'Identify the skills that come naturally to you',
    route: '/nikigai/skills',
    cta: 'Start Skills Flow →'
  },
  offer_builder: {
    title: 'Build Your Offer',
    description: 'Package your skills into something you can sell',
    route: '/offer-builder',
    cta: 'Create Offer →'
  },
  crm_setup: {
    title: 'Set Up Your CRM',
    description: 'Start tracking your leads and deals',
    route: '/crm/sales',
    cta: 'Go to CRM →'
  },
  upsell_assessment: {
    title: 'Add an Upsell',
    description: 'Increase your customer lifetime value',
    route: '/upsell-offer',
    cta: 'Create Upsell →'
  },
  funnel_calculator: {
    title: 'Track Your Funnel',
    description: 'See how your marketing converts to revenue',
    route: '/funnel-calculator',
    cta: 'Open Calculator →'
  }
  // ... more mappings
}
```

### 4.4 Route Update

```jsx
// AppRouter.jsx - update route
<Route path="/library" element={
  <AuthGate>
    <FlowReportCard />
  </AuthGate>
} />
```

### 4.5 Files to Create/Modify

| File | Action | Lines Est. |
|------|--------|------------|
| `src/pages/FlowReportCard.jsx` | Create | ~200 |
| `src/components/report-card/ReportCard.jsx` | Create | ~80 |
| `src/components/report-card/ReportCard.css` | Create | ~400 |
| `src/components/report-card/IdentitySection.jsx` | Create | ~60 |
| `src/components/report-card/WealthLadderSection.jsx` | Create | ~80 |
| `src/components/report-card/YourFlowSection.jsx` | Create | ~100 |
| `src/components/report-card/ProductSuiteSection.jsx` | Create | ~120 |
| `src/components/report-card/MetricsSection.jsx` | Create | ~80 |
| `src/components/report-card/ProgressSection.jsx` | Create | ~60 |
| `src/components/report-card/NextRecommended.jsx` | Create | ~100 |
| `src/lib/reportCardHelpers.js` | Create | ~150 |
| `src/pages/LibraryOfAnswers.jsx` | Archive | - |

---

## Phase 5: Integration & Emphasis Logic

### 5.1 Update HomeFirstTime.jsx

```jsx
// HomeFirstTime.jsx - integrate OnboardingV2
function HomeFirstTime({ user, onComplete }) {
  const [step, setStep] = useState('welcome')

  // Steps:
  // 1. welcome - Welcome screen
  // 2. onboarding - OnboardingV2 (Q1-Q3 + path routing)
  // 3. quick_capture (if non-pre_ladder) - QuickCapture
  // 4. complete - Route to appropriate destination

  if (step === 'onboarding') {
    return (
      <OnboardingV2
        userId={user.id}
        onComplete={(result) => {
          if (result.path === 1) {
            // Pre-ladder: go straight to Flow Finder
            onComplete({ route: result.nextFlow })
          } else {
            // Non-pre-ladder: go to Quick Capture
            setOnboardingResult(result)
            setStep('quick_capture')
          }
        }}
      />
    )
  }

  if (step === 'quick_capture') {
    return (
      <QuickCapture
        wealthLadder={onboardingResult.wealthLadder}
        emphasis={onboardingResult.emphasis}
        onComplete={(projectId) => {
          onComplete({ route: '/me', projectId })
        }}
      />
    )
  }

  // ... welcome screen
}
```

### 5.2 Update Challenge Quest Priority

```jsx
// useChallengeData.js - add emphasis awareness
function useChallengeData() {
  const [emphasis, setEmphasis] = useState(null)

  useEffect(() => {
    async function loadEmphasis() {
      const { data } = await supabase
        .from('user_stage_progress')
        .select('guidance_emphasis')
        .eq('user_id', userId)
        .single()

      setEmphasis(data?.guidance_emphasis || 'deep_discovery')
    }
    loadEmphasis()
  }, [userId])

  // Sort quests by emphasis priority
  const sortedQuests = useMemo(() => {
    if (!emphasis) return quests

    const config = EMPHASIS_CONFIG[emphasis]
    const priorityOrder = config.questPriority

    return [...quests].sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.id)
      const bIndex = priorityOrder.indexOf(b.id)

      // Priority quests first, then by original order
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return 0
    })
  }, [quests, emphasis])

  // ... rest of hook
}
```

### 5.3 Connect to Existing Flows

Update these files to read/write products table:

| Flow | Integration Needed |
|------|-------------------|
| `OfferBuilderFlow.jsx` | On complete, create product entry with `source: 'offer_builder'` |
| `OfferBuilder100M/` | On complete, update product entry if exists |
| `UpsellFlow.jsx` | Create product with `money_model_tier: 'upsell'` |
| `DownsellFlow.jsx` | Create product with `money_model_tier: 'downsell'` |
| `ContinuityFlow.jsx` | Create product with `money_model_tier: 'continuity'` |
| `AttractionOfferFlow.jsx` | Create product with `money_model_tier: 'attraction'` |

### 5.4 Zarlo Personality Integration

```jsx
// ZarloChat.jsx - use emphasis for personality
function ZarloChat({ pageContext }) {
  const [emphasis, setEmphasis] = useState(null)

  // Load emphasis
  useEffect(() => {
    // ... load from user_stage_progress
  }, [])

  const systemPrompt = useMemo(() => {
    const personality = EMPHASIS_CONFIG[emphasis]?.zarloPersonality || 'curious_explorer'
    return ZARLO_PERSONALITIES[personality]
  }, [emphasis])

  // Pass to zarloEngine
}

const ZARLO_PERSONALITIES = {
  curious_explorer: `You are a curious, patient guide. Ask lots of questions.
    Don't rush the user toward outcomes. Help them explore and discover.`,

  action_oriented: `You are an action-focused coach. Push toward concrete next steps.
    Keep conversations brief and outcome-driven.`,

  sales_coach: `You are a sales accountability partner. Ask about follow-ups.
    Help draft outreach messages. Track commitments.`,

  strategic_advisor: `You are a strategic business advisor. Think big picture.
    Help connect dots between different areas of the business.`,

  data_analyst: `You are a metrics-focused analyst. Point out patterns.
    Identify bottlenecks. Suggest optimizations based on data.`
}
```

---

## Phase 6: Testing & Polish

### 6.1 Test Scenarios

| Scenario | Path | Expected Outcome |
|----------|------|------------------|
| New user, employed exploring, pre_ladder, discovery | 1 | → Flow Finder skills |
| New user, employed building, service, monetization | 2 | → Quick Capture → Stage 3 |
| New user, self-employed, productized, creation | 3 | → Quick Capture → Stage 4 |
| New user, established, products, growth | 4 | → Quick Capture → Stage 6 |
| Existing user, has persona but no wealth_ladder | - | Show re-onboarding banner |
| User abandons mid-onboarding | - | Resume from localStorage |

### 6.2 Existing User Migration Banner

```jsx
// App.jsx or Dashboard
function MigrationBanner({ user }) {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    async function checkMigration() {
      const { data } = await supabase
        .from('user_stage_progress')
        .select('onboarding_completed, wealth_ladder_rung')
        .eq('user_id', user.id)
        .single()

      // Show if onboarded but missing new fields
      if (data?.onboarding_completed && !data?.wealth_ladder_rung) {
        setShowBanner(true)
      }
    }
    checkMigration()
  }, [user.id])

  if (!showBanner) return null

  return (
    <div className="migration-banner">
      <p>We've improved! Update your profile for better recommendations.</p>
      <Link to="/update-profile">Update Now</Link>
      <button onClick={() => setShowBanner(false)}>Maybe Later</button>
    </div>
  )
}
```

### 6.3 Error Handling & Resume

```jsx
// OnboardingV2.jsx - localStorage resume
const STORAGE_KEY = 'onboarding_v2_progress'

function OnboardingV2({ userId, onComplete }) {
  const [state, setState] = useState(() => {
    // Check for saved progress
    const saved = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Only use if < 24 hours old
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        return { ...parsed, showResume: true }
      }
    }
    return { step: 1, answers: {} }
  })

  // Save progress on each step
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify({
      ...state,
      timestamp: Date.now()
    }))
  }, [state, userId])

  // Clear on complete
  const handleComplete = async (result) => {
    localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
    onComplete(result)
  }
}
```

---

## Dependency Graph

```
                    ┌──────────────────────────────────────────┐
                    │         DATABASE SCHEMA (Phase 1)          │
                    └─────────────────┬────────────────────────┘
                                      │
                    ┌─────────────────┴────────────────────────┐
                    │                                          │
          ┌─────────▼─────────┐                    ┌───────────▼──────────┐
          │   ONBOARDING V2   │                    │   WHEEL TAXONOMY     │
          │    (Phase 2)      │                    │    PICKER            │
          └─────────┬─────────┘                    └───────────┬──────────┘
                    │                                          │
                    │              ┌───────────────────────────┘
                    │              │
          ┌─────────▼──────────────▼──────────┐
          │         QUICK CAPTURE              │
          │           (Phase 3)               │
          └─────────────────┬─────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │        FLOW REPORT CARD           │
          │           (Phase 4)               │
          └─────────────────┬─────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │         INTEGRATION               │
          │           (Phase 5)               │
          │  • HomeFirstTime update           │
          │  • Challenge quest priority       │
          │  • Zarlo personality              │
          │  • Flow → Products sync           │
          └─────────────────┬─────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │        TESTING & POLISH           │
          │           (Phase 6)               │
          └───────────────────────────────────┘
```

---

## Estimated Timeline

| Phase | Components | Estimated Files | Complexity |
|-------|------------|-----------------|------------|
| 1. Database | 1 migration | 1 | Low |
| 2. Core Onboarding | 8 components | 9 | Medium |
| 3. Quick Capture | 8 components | 9 | Medium-High |
| 4. Flow Report Card | 11 components | 12 | Medium |
| 5. Integration | Updates to 8+ files | 8+ | Medium |
| 6. Testing | Test scenarios | - | Low |

**Total new files: ~40**
**Total modified files: ~15**

---

## Next Steps After Onboarding V2

### A. Challenge Fine-Tuning
- Review all stage quests against EMPHASIS_CONFIG
- Add missing quests identified in gaps analysis
- Update quest priority logic in useChallengeData

### B. CRM Integration
- Ensure product_type flows to CRM pipeline selection
- Add product selector to deal creation
- Surface Scripts Modal in Client Acquisition emphasis

### C. Flow Consolidation
- Add "Audit Mode" to Offer Builder
- Connect Grand Slam V2 after Offer Builder V1
- Archive deprecated flows (Create Product, old ExistingProjectFlow)

---

*Document created: 2026-01-13*
