# Phase 4 Architecture: Flow Tracker System

## Overview

The Flow Tracker is a daily/event-based logging system that helps users track their internal state (excited vs tired) and external results (ease vs resistance). This creates a compass direction (N/E/S/W) that guides decision-making about what to continue, pivot, rest from, or explore.

---

## 1. Flow Compass Concept

### 1.1 The Four Directions

```
                    NORTH
              (Excited + Ease)
              "Continue - Full Flow"
                     │
                     │
    WEST ───────────┼─────────── EAST
(Tired + Ease)      │      (Excited + Resistance)
"New Opportunity"   │      "Pivot Required"
                    │
                    │
                   SOUTH
             (Tired + Resistance)
             "Rest or Stop"
```

| Direction | Internal | External | Signal |
|-----------|----------|----------|--------|
| **North** | Excited | Ease | Continue doing this - you're in flow |
| **East** | Excited | Resistance | You love it but something's not working - pivot the approach |
| **South** | Tired | Resistance | Stop or rest - this isn't the path |
| **West** | Tired | Ease | A new opportunity dropped in - explore it |

### 1.2 User Experience

**Quick Log Flow:**
1. User taps "Log Flow" button
2. Sees compass with 4 quadrants
3. Taps the direction that matches their experience
4. Types brief reasoning (what happened, what they were doing)
5. Submit - logged instantly

---

## 2. Database Schema

### 2.1 Core Tables

```sql
-- Migration: 20251128_02_flow_tracker.sql

-- Table: user_projects
-- V1: Single project per user tied to their offer/money model
CREATE TABLE public.user_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  source_flow text, -- 'nikigai', '100m_offer', '100m_money_model'
  source_session_id uuid, -- Reference to nikigai_sessions or similar
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_projects_pkey PRIMARY KEY (id)
);

-- Table: flow_entries
-- Individual flow tracking entries
CREATE TABLE public.flow_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  project_id uuid REFERENCES public.user_projects(id),

  -- Compass direction
  direction text NOT NULL CHECK (direction IN ('north', 'east', 'south', 'west')),

  -- Raw inputs (for AI analysis)
  internal_state text NOT NULL CHECK (internal_state IN ('excited', 'tired')),
  external_state text NOT NULL CHECK (external_state IN ('ease', 'resistance')),

  -- Context
  activity_description text, -- What were they doing?
  reasoning text NOT NULL, -- Why this direction?

  -- Optional: Link to specific challenge
  challenge_instance_id uuid REFERENCES public.challenge_progress(id),
  quest_completion_id uuid REFERENCES public.quest_completions(id),

  -- Timestamps
  logged_at timestamp with time zone DEFAULT now(),
  activity_date date DEFAULT CURRENT_DATE, -- What day this refers to

  CONSTRAINT flow_entries_pkey PRIMARY KEY (id)
);

-- Table: flow_patterns
-- AI-generated pattern analysis (computed periodically)
CREATE TABLE public.flow_patterns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  project_id uuid REFERENCES public.user_projects(id),

  -- Analysis period
  analysis_period text NOT NULL, -- 'weekly', 'monthly', 'all_time'
  period_start date NOT NULL,
  period_end date NOT NULL,

  -- Pattern data (AI-generated)
  dominant_direction text, -- Most common direction
  direction_distribution jsonb DEFAULT '{}', -- {"north": 5, "east": 3, "south": 2, "west": 1}
  consistency_score numeric, -- 0-1, how consistent are responses

  -- AI Insights
  reasoning_clusters jsonb DEFAULT '[]', -- Grouped themes from reasoning text
  key_patterns jsonb DEFAULT '[]', -- Array of identified patterns
  recommendations jsonb DEFAULT '[]', -- AI suggestions

  -- Summary
  summary_text text, -- Human-readable summary

  generated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT flow_patterns_pkey PRIMARY KEY (id)
);

-- Table: flow_entry_tags
-- Tags extracted from reasoning (for clustering)
CREATE TABLE public.flow_entry_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  flow_entry_id uuid NOT NULL REFERENCES public.flow_entries(id) ON DELETE CASCADE,
  tag text NOT NULL,
  tag_category text, -- 'activity', 'emotion', 'person', 'blocker', etc.
  confidence numeric DEFAULT 1.0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flow_entry_tags_pkey PRIMARY KEY (id)
);

-- Indexes for efficient queries
CREATE INDEX idx_flow_entries_user_date ON public.flow_entries(user_id, activity_date DESC);
CREATE INDEX idx_flow_entries_direction ON public.flow_entries(user_id, direction);
CREATE INDEX idx_flow_entries_project ON public.flow_entries(project_id);
CREATE INDEX idx_flow_patterns_user ON public.flow_patterns(user_id, period_start DESC);
CREATE INDEX idx_flow_entry_tags_entry ON public.flow_entry_tags(flow_entry_id);

-- RLS Policies
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_entry_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects" ON public.user_projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own flow entries" ON public.flow_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own patterns" ON public.flow_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tags" ON public.flow_entry_tags
  FOR SELECT USING (
    flow_entry_id IN (SELECT id FROM public.flow_entries WHERE user_id = auth.uid())
  );
```

---

## 3. UI Components

### 3.1 FlowCompass Component

```jsx
// src/components/FlowCompass.jsx

/**
 * Interactive compass for quick flow logging
 *
 * Props:
 * - onSelect: (direction, internalState, externalState) => void
 * - selectedDirection: string | null
 * - size: 'small' | 'medium' | 'large'
 */

const FlowCompass = ({ onSelect, selectedDirection, size = 'medium' }) => {
  const directions = [
    { id: 'north', label: 'Continue', internal: 'excited', external: 'ease', color: '#10B981', icon: '⬆️' },
    { id: 'east', label: 'Pivot', internal: 'excited', external: 'resistance', color: '#F59E0B', icon: '➡️' },
    { id: 'south', label: 'Rest', internal: 'tired', external: 'resistance', color: '#EF4444', icon: '⬇️' },
    { id: 'west', label: 'Explore', internal: 'tired', external: 'ease', color: '#8B5CF6', icon: '⬅️' }
  ];

  return (
    <div className="flow-compass">
      <div className="compass-center">
        <span className="compass-icon">🧭</span>
      </div>
      {directions.map(dir => (
        <button
          key={dir.id}
          className={`compass-quadrant ${dir.id} ${selectedDirection === dir.id ? 'selected' : ''}`}
          onClick={() => onSelect(dir.id, dir.internal, dir.external)}
          style={{ '--quadrant-color': dir.color }}
        >
          <span className="quadrant-icon">{dir.icon}</span>
          <span className="quadrant-label">{dir.label}</span>
        </button>
      ))}
    </div>
  );
};
```

### 3.2 FlowLogModal Component

```jsx
// src/components/FlowLogModal.jsx

/**
 * Modal for logging a flow entry
 *
 * Flow:
 * 1. Select compass direction
 * 2. Enter reasoning text
 * 3. Optional: Select activity from recent quests
 * 4. Submit
 */

const FlowLogModal = ({ isOpen, onClose, projectId, challengeInstanceId }) => {
  const [step, setStep] = useState(1); // 1: compass, 2: reasoning
  const [direction, setDirection] = useState(null);
  const [internalState, setInternalState] = useState(null);
  const [externalState, setExternalState] = useState(null);
  const [reasoning, setReasoning] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCompassSelect = (dir, internal, external) => {
    setDirection(dir);
    setInternalState(internal);
    setExternalState(external);
    setStep(2);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const { error } = await supabase.from('flow_entries').insert({
      user_id: user.id,
      project_id: projectId,
      direction,
      internal_state: internalState,
      external_state: externalState,
      reasoning,
      activity_description: activityDescription,
      challenge_instance_id: challengeInstanceId
    });

    if (!error) {
      onClose();
      // Trigger tag extraction (could be edge function or client-side)
      await extractAndSaveTags(newEntry.id, reasoning);
    }

    setIsSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {step === 1 && (
        <div className="flow-log-step">
          <h3>How did things flow?</h3>
          <FlowCompass onSelect={handleCompassSelect} />
        </div>
      )}

      {step === 2 && (
        <div className="flow-log-step">
          <div className="selected-direction-badge" style={{ background: getDirectionColor(direction) }}>
            {getDirectionLabel(direction)}
          </div>

          <label>What were you doing?</label>
          <input
            type="text"
            value={activityDescription}
            onChange={e => setActivityDescription(e.target.value)}
            placeholder="e.g., Working on landing page, Customer call..."
          />

          <label>What happened? Why this direction?</label>
          <textarea
            value={reasoning}
            onChange={e => setReasoning(e.target.value)}
            placeholder="e.g., The conversation went great and they asked about pricing..."
            rows={4}
            required
          />

          <div className="modal-actions">
            <button onClick={() => setStep(1)}>Back</button>
            <button
              onClick={handleSubmit}
              disabled={!reasoning || isSubmitting}
              className="primary"
            >
              Log Flow
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
```

### 3.3 FlowHistory Component

```jsx
// src/components/FlowHistory.jsx

/**
 * Shows recent flow entries with visual timeline
 */

const FlowHistory = ({ projectId, limit = 10 }) => {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    loadEntries();
  }, [projectId]);

  return (
    <div className="flow-history">
      <h3>Flow History</h3>
      <div className="flow-timeline">
        {entries.map(entry => (
          <div key={entry.id} className={`flow-entry-card ${entry.direction}`}>
            <div className="entry-direction">
              <span className="direction-icon">{getDirectionIcon(entry.direction)}</span>
              <span className="direction-label">{getDirectionLabel(entry.direction)}</span>
            </div>
            <p className="entry-reasoning">{entry.reasoning}</p>
            <span className="entry-date">{formatDate(entry.logged_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3.4 FlowInsights Component

```jsx
// src/components/FlowInsights.jsx

/**
 * Shows AI-generated patterns and insights
 */

const FlowInsights = ({ projectId }) => {
  const [pattern, setPattern] = useState(null);

  return (
    <div className="flow-insights">
      <h3>Flow Insights</h3>

      {/* Direction Distribution Chart */}
      <div className="direction-chart">
        <DirectionPieChart data={pattern?.direction_distribution} />
      </div>

      {/* Dominant Direction */}
      <div className="dominant-direction">
        <span>You're mostly heading:</span>
        <div className={`direction-badge ${pattern?.dominant_direction}`}>
          {getDirectionLabel(pattern?.dominant_direction)}
        </div>
      </div>

      {/* AI Summary */}
      <div className="ai-summary">
        <h4>What the patterns show:</h4>
        <p>{pattern?.summary_text}</p>
      </div>

      {/* Reasoning Clusters */}
      <div className="reasoning-clusters">
        <h4>Common themes in your reasoning:</h4>
        <div className="cluster-tags">
          {pattern?.reasoning_clusters?.map(cluster => (
            <span key={cluster.id} className="cluster-tag">
              {cluster.label} ({cluster.count})
            </span>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {pattern?.recommendations?.length > 0 && (
        <div className="recommendations">
          <h4>Suggestions:</h4>
          <ul>
            {pattern.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

---

## 4. Edge Functions

### 4.1 flow-analyze Edge Function

```typescript
// supabase/functions/flow-analyze/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const anthropic = new Anthropic()

serve(async (req) => {
  const { user_id, project_id, period = 'weekly' } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Fetch flow entries for the period
  const periodStart = getPeriodStart(period)
  const { data: entries } = await supabase
    .from('flow_entries')
    .select('*')
    .eq('user_id', user_id)
    .eq('project_id', project_id)
    .gte('activity_date', periodStart)
    .order('activity_date', { ascending: true })

  if (!entries || entries.length < 3) {
    return new Response(JSON.stringify({
      message: 'Not enough entries for analysis',
      minimum_required: 3,
      current_count: entries?.length || 0
    }))
  }

  // 2. Calculate direction distribution
  const distribution = calculateDistribution(entries)
  const dominantDirection = getDominant(distribution)
  const consistencyScore = calculateConsistency(entries)

  // 3. AI Analysis for patterns and recommendations
  const analysisPrompt = `
    Analyze these flow tracking entries from a user working on their business/project.

    Entries:
    ${entries.map(e => `
      Direction: ${e.direction} (${e.internal_state}/${e.external_state})
      Activity: ${e.activity_description || 'Not specified'}
      Reasoning: ${e.reasoning}
      Date: ${e.activity_date}
    `).join('\n---\n')}

    Direction meanings:
    - North (excited + ease): In flow, continue
    - East (excited + resistance): Love it but blocked, need to pivot approach
    - South (tired + resistance): Need to rest or stop this path
    - West (tired + ease): New opportunity appeared, explore it

    Provide analysis in JSON format:
    {
      "reasoning_clusters": [
        {"label": "theme name", "count": number, "example_entries": ["entry id"]}
      ],
      "key_patterns": [
        "Pattern observation 1",
        "Pattern observation 2"
      ],
      "recommendations": [
        "Specific actionable suggestion 1",
        "Specific actionable suggestion 2"
      ],
      "summary_text": "2-3 sentence summary of what the flow patterns reveal about the user's journey"
    }
  `

  const aiResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: analysisPrompt }]
  })

  const analysis = JSON.parse(aiResponse.content[0].text)

  // 4. Save pattern analysis
  const { data: pattern } = await supabase
    .from('flow_patterns')
    .upsert({
      user_id,
      project_id,
      analysis_period: period,
      period_start: periodStart,
      period_end: new Date().toISOString().split('T')[0],
      dominant_direction: dominantDirection,
      direction_distribution: distribution,
      consistency_score: consistencyScore,
      reasoning_clusters: analysis.reasoning_clusters,
      key_patterns: analysis.key_patterns,
      recommendations: analysis.recommendations,
      summary_text: analysis.summary_text
    }, {
      onConflict: 'user_id,project_id,analysis_period,period_start'
    })
    .select()
    .single()

  return new Response(JSON.stringify(pattern), {
    headers: { 'Content-Type': 'application/json' }
  })
})

function calculateDistribution(entries) {
  const dist = { north: 0, east: 0, south: 0, west: 0 }
  entries.forEach(e => dist[e.direction]++)
  return dist
}

function getDominant(distribution) {
  return Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])[0][0]
}

function calculateConsistency(entries) {
  // Higher score = more consistent direction choices
  const dist = calculateDistribution(entries)
  const total = entries.length
  const max = Math.max(...Object.values(dist))
  return max / total
}
```

### 4.2 flow-extract-tags Edge Function

```typescript
// supabase/functions/flow-extract-tags/index.ts

/**
 * Extracts tags from flow entry reasoning text
 * Called after each flow entry is created
 */

serve(async (req) => {
  const { entry_id, reasoning } = await req.json()

  const extractPrompt = `
    Extract key tags from this flow tracking entry reasoning.

    Reasoning: "${reasoning}"

    Extract tags in these categories:
    - activity: What they were doing (e.g., "customer_call", "writing_content", "coding")
    - emotion: Emotional state mentioned (e.g., "frustrated", "excited", "anxious")
    - person: People mentioned (e.g., "customer", "mentor", "partner")
    - blocker: Any blockers mentioned (e.g., "technical_issue", "unclear_requirements")
    - win: Any wins mentioned (e.g., "sale_closed", "positive_feedback")

    Return JSON array:
    [
      {"tag": "tag_text", "category": "category_name", "confidence": 0.0-1.0}
    ]
  `

  const aiResponse = await anthropic.messages.create({
    model: 'claude-haiku-4-20250514', // Use Haiku for speed/cost
    max_tokens: 256,
    messages: [{ role: 'user', content: extractPrompt }]
  })

  const tags = JSON.parse(aiResponse.content[0].text)

  // Save tags
  const tagRecords = tags.map(t => ({
    flow_entry_id: entry_id,
    tag: t.tag,
    tag_category: t.category,
    confidence: t.confidence
  }))

  await supabase.from('flow_entry_tags').insert(tagRecords)

  return new Response(JSON.stringify({ extracted: tags.length }))
})
```

---

## 5. Project Connection to Flows

### 5.1 Auto-Create Project After Flow Completion

```javascript
// src/lib/projectCreation.js

export const createProjectFromFlow = async (userId, flowType, sessionId, flowData) => {
  // Called when user completes Nikigai, $100M Offer, or $100M Money Model

  let projectName = '';
  let description = '';

  switch (flowType) {
    case 'nikigai':
      // Extract from nikigai_key_outcomes
      const { data: outcomes } = await supabase
        .from('nikigai_key_outcomes')
        .select('opportunity_statements, mission_statement')
        .eq('session_id', sessionId)
        .single();

      projectName = outcomes?.opportunity_statements?.[0]?.title || 'My Nikigai Project';
      description = outcomes?.mission_statement || '';
      break;

    case '100m_offer':
      // Extract from offer flow results
      projectName = flowData?.offer_name || 'My Grand Slam Offer';
      description = flowData?.offer_summary || '';
      break;

    case '100m_money_model':
      // Extract from money model results
      projectName = flowData?.model_name || 'My Money Model';
      description = flowData?.model_summary || '';
      break;
  }

  const { data: project } = await supabase
    .from('user_projects')
    .insert({
      user_id: userId,
      name: projectName,
      description,
      source_flow: flowType,
      source_session_id: sessionId
    })
    .select()
    .single();

  return project;
};
```

### 5.2 Link Flow Tracker to Challenge

```javascript
// Integration with challenge system

// When user logs flow as part of daily challenge quest
const handleFlowQuestCompletion = async (questId, flowEntryId) => {
  // Update quest completion with flow entry reference
  await supabase
    .from('quest_completions')
    .update({
      reflection_text: `Flow entry: ${flowEntryId}`,
      // Could also store in jsonb metadata
    })
    .eq('id', questId);
};
```

---

## 6. UI Pages

### 6.1 Flow Tracker Page

```jsx
// src/pages/FlowTracker.jsx

const FlowTracker = () => {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    loadActiveProject();
  }, []);

  return (
    <div className="flow-tracker-page">
      <header className="page-header">
        <h1>Flow Tracker</h1>
        <p>Track your daily flow to uncover patterns</p>
      </header>

      {/* Active Project */}
      {project ? (
        <div className="active-project-card">
          <h2>{project.name}</h2>
          <p>{project.description}</p>
          <span className="project-source">From: {project.source_flow}</span>
        </div>
      ) : (
        <div className="no-project-card">
          <p>Complete a discovery flow to start tracking</p>
          <button onClick={() => navigate('/nikigai')}>Start Nikigai</button>
        </div>
      )}

      {/* Quick Log Button */}
      <button
        className="fab-log-flow"
        onClick={() => setShowLogModal(true)}
        disabled={!project}
      >
        🧭 Log Flow
      </button>

      {/* Two-column layout on desktop */}
      <div className="tracker-grid">
        <div className="tracker-column">
          <FlowHistory projectId={project?.id} limit={7} />
        </div>
        <div className="tracker-column">
          <FlowInsights projectId={project?.id} />
        </div>
      </div>

      {/* Log Modal */}
      <FlowLogModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        projectId={project?.id}
      />
    </div>
  );
};
```

### 6.2 Add to Navigation

```jsx
// Update sidebar/nav to include Flow Tracker

<li className="nav-item" onClick={() => { navigate('/flow-tracker'); setSidebarOpen(false); }}>
  🧭 Flow Tracker
</li>
```

---

## 7. Challenge Integration

### 7.1 Daily Flow Update Quest Enhancement

Update the existing `recognise_flow_update` quest in `challengeQuests.json`:

```json
{
  "id": "recognise_flow_update",
  "category": "Recognise",
  "type": "daily",
  "name": "Daily Flow Update",
  "description": "Log how things flowed for you today using the Flow Compass",
  "points": 4,
  "inputType": "flow_compass",
  "flow_route": "/flow-tracker",
  "learnMore": "The Flow Compass tracks your internal state (excited vs tired) and external results (ease vs resistance)..."
}
```

### 7.2 New InputType Handler

```jsx
// In QuestInput.jsx, add handler for flow_compass type

case 'flow_compass':
  return (
    <FlowCompassQuest
      quest={quest}
      onComplete={(entryId) => {
        onComplete({
          quest_id: quest.id,
          reflection_text: `Flow entry logged: ${entryId}`,
          flow_entry_id: entryId
        });
      }}
    />
  );
```

---

## 8. Implementation Order for Sonnet

1. **Database Migration** - Create `20251128_02_flow_tracker.sql`
2. **lib/flowCompass.js** - Direction definitions, colors, labels
3. **components/FlowCompass.jsx** - Interactive compass UI
4. **components/FlowLogModal.jsx** - Logging interface
5. **components/FlowHistory.jsx** - Entry timeline
6. **pages/FlowTracker.jsx** - Main tracker page
7. **FlowTracker.css** - Styling (use brand colors #5e17eb, #ffdd27)
8. **Update AppRouter.jsx** - Add /flow-tracker route
9. **lib/projectCreation.js** - Auto-create project from flows
10. **Edge function: flow-analyze** - AI pattern analysis
11. **Edge function: flow-extract-tags** - Tag extraction
12. **components/FlowInsights.jsx** - Pattern display (after edge functions)
13. **Update challengeQuests.json** - Enhance flow_update quest
14. **Update Profile.jsx** - Add Flow Tracker nav item

---

## 9. Styling Guidelines

Use existing brand colors from the codebase:
- Purple (Primary): `#5e17eb`
- Gold (Accent): `#ffdd27`
- Background gradient: Same as PersonaAssessment.css

Compass direction colors:
- North: `#10B981` (Green - Go)
- East: `#F59E0B` (Amber - Caution/Pivot)
- South: `#EF4444` (Red - Stop)
- West: `#8B5CF6` (Purple - Explore)

---

## 10. Data Flow Diagram

```
User taps "Log Flow"
        │
        ▼
FlowCompass selection
        │
        ▼
Reasoning input
        │
        ▼
Save to flow_entries
        │
        ├──▶ Trigger flow-extract-tags (async)
        │           │
        │           ▼
        │    Save to flow_entry_tags
        │
        └──▶ If from challenge quest → Complete quest
                    │
                    ▼
              Update quest_completions

═══════════════════════════════════════════

Weekly/On-demand analysis trigger
        │
        ▼
flow-analyze Edge Function
        │
        ├── Fetch entries for period
        ├── Calculate distributions
        ├── AI analysis via Claude
        │
        ▼
Save to flow_patterns
        │
        ▼
FlowInsights component displays
```

---

## 11. Testing Checklist

- [ ] Compass UI is touch-friendly on mobile
- [ ] Can log flow entry with direction + reasoning
- [ ] Entries save correctly to database
- [ ] History displays in chronological order
- [ ] Tags are extracted asynchronously
- [ ] AI analysis runs when triggered
- [ ] Insights display correctly
- [ ] Project auto-creates after Nikigai completion
- [ ] Flow tracker integrates with daily challenge quest
- [ ] Navigation works from sidebar
- [ ] Styling matches brand colors

---

## 12. Future Enhancements (V2+)

- Multiple projects per user
- Goal setting per project
- Notifications/reminders to log flow
- Weekly email digest of flow patterns
- Compare flow patterns across projects
- Community patterns (anonymized insights)
- Integrate with calendar for context
