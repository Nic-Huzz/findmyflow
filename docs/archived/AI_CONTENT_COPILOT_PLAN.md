# AI Content Copilot - Implementation Plan

## Overview

A unified content marketing system that combines strategy, generation, and execution into one cohesive flow.

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI CONTENT COPILOT                          │
├─────────────────────────────────────────────────────────────────┤
│  1. STRATEGY        →    2. GENERATE      →    3. EXECUTE       │
│  (Setup once)            (Weekly)              (Daily)          │
│                                                                 │
│  Lead Strategy           Batch content         Quest board      │
│  Platform prefs          for the week          with content     │
│  Time available                                pre-attached     │
│  Content types                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Schema

### New Table: `content_strategies`

Stores user's marketing strategy preferences.

```sql
CREATE TABLE content_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- From Lead Strategy Assessment (pulled automatically)
  lead_strategy TEXT, -- 'warm_outreach', 'cold_outreach', 'post_free_content', 'run_paid_ads'
  lead_strategy_assessment_id UUID REFERENCES leads_assessments(id),

  -- Platform Preferences
  primary_platform TEXT NOT NULL, -- 'linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'
  secondary_platform TEXT, -- optional

  -- Time & Frequency
  days_per_week INTEGER NOT NULL DEFAULT 5, -- 3, 4, 5, 6, 7
  minutes_per_day INTEGER NOT NULL DEFAULT 60, -- 30, 60, 120, 180

  -- Content Preferences (array of selected types)
  content_types TEXT[] NOT NULL DEFAULT '{"text_post", "carousel"}',
  -- Options: 'text_post', 'carousel', 'short_video', 'long_video', 'stories', 'threads', 'newsletter'

  -- Generated Schedule Template (JSON)
  weekly_template JSONB,
  -- Example: {
  --   "Monday": [
  --     {"slot": 1, "type": "text_post", "content_type": "transformation_story", "platform": "linkedin", "points": 10},
  --     {"slot": 2, "type": "engagement", "task": "Comment on 10 posts", "platform": "linkedin", "points": 5}
  --   ],
  --   "Tuesday": [...],
  --   ...
  -- }

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id) -- One strategy per user
);

-- RLS Policies
ALTER TABLE content_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own strategy"
  ON content_strategies FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Modify Table: `marketing_tasks`

Add link to generated content.

```sql
ALTER TABLE marketing_tasks
ADD COLUMN content_id UUID REFERENCES content_history(id),
ADD COLUMN slot_number INTEGER,
ADD COLUMN task_category TEXT; -- 'content', 'engagement', 'outreach', 'analytics', 'planning'
```

### Modify Table: `content_history`

Add link back to task.

```sql
ALTER TABLE content_history
ADD COLUMN task_id UUID REFERENCES marketing_tasks(id),
ADD COLUMN week_start_date DATE,
ADD COLUMN scheduled_day TEXT; -- 'Monday', 'Tuesday', etc.
```

---

## Phase 2: Strategy Flow Component

### File: `src/flows/ContentStrategyFlow.jsx`

**Questions Flow:**

```
Q1: Lead Strategy (auto-pulled or select)
    → Pull from leads_assessments if exists
    → Otherwise: "Which best describes your lead gen approach?"
      - Warm Outreach (DMs to people who know you)
      - Cold Outreach (DMs to strangers)
      - Content Marketing (Posts that attract leads)
      - Paid Advertising (Ads to reach new audiences)

Q2: Primary Platform
    → "Where does your ideal customer spend time?"
      - LinkedIn (B2B, professionals)
      - Instagram (Visual, lifestyle)
      - Twitter/X (Tech, news, thought leadership)
      - TikTok (Gen Z, entertainment)
      - Facebook (Local, communities)

Q3: Secondary Platform (optional)
    → "Want to add a secondary platform?"
      - Same options minus primary
      - Skip option

Q4: Days Per Week
    → "How many days per week can you post?"
      - 3 days (Tue, Thu, Sat)
      - 4 days (Mon, Wed, Fri, Sun)
      - 5 days (Mon-Fri)
      - 6 days (Mon-Sat)
      - 7 days (Every day)

Q5: Time Per Day
    → "How much time daily for content marketing?"
      - 30 minutes (Quick posts only)
      - 1 hour (Posts + some engagement)
      - 2 hours (Posts + engagement + outreach)
      - 3+ hours (Full content marketing)

Q6: Content Types (multi-select)
    → "Which content formats do you want to create?"
    → Show/hide based on time (hide video if <1hr)
      - Text posts (Quick, easy)
      - Carousels/Slides (More engaging, takes longer)
      - Short video clips (<60s, requires editing)
      - Long-form video (>60s, significant time)
      - Stories (Ephemeral, casual)
      - Threads (Multi-part posts)
      - Newsletter/Email (Weekly digest)
```

**Output:** Generates `weekly_template` JSON and saves to `content_strategies`

---

## Phase 3: Template Generation Logic

### File: `src/lib/contentStrategy.js`

```javascript
// Generate weekly template based on strategy answers
export function generateWeeklyTemplate(strategy) {
  const {
    lead_strategy,
    primary_platform,
    secondary_platform,
    days_per_week,
    minutes_per_day,
    content_types
  } = strategy

  const template = {}
  const days = getDaysForFrequency(days_per_week)

  days.forEach(day => {
    template[day] = []
    let slotNumber = 1

    // Content creation tasks (based on content_types)
    const contentTask = getContentTask(day, content_types, primary_platform, lead_strategy)
    if (contentTask) {
      template[day].push({ ...contentTask, slot: slotNumber++ })
    }

    // Secondary platform (if selected, fewer posts)
    if (secondary_platform && ['Monday', 'Wednesday', 'Friday'].includes(day)) {
      const secondaryTask = getContentTask(day, content_types, secondary_platform, lead_strategy)
      if (secondaryTask) {
        template[day].push({ ...secondaryTask, slot: slotNumber++ })
      }
    }

    // Engagement tasks (based on lead_strategy)
    const engagementTasks = getEngagementTasks(lead_strategy, primary_platform, minutes_per_day)
    engagementTasks.forEach(task => {
      template[day].push({ ...task, slot: slotNumber++ })
    })

    // Outreach tasks (if warm/cold outreach strategy)
    if (['warm_outreach', 'cold_outreach'].includes(lead_strategy)) {
      const outreachTasks = getOutreachTasks(lead_strategy, day)
      outreachTasks.forEach(task => {
        template[day].push({ ...task, slot: slotNumber++ })
      })
    }
  })

  return template
}

// Map days_per_week to actual day names
function getDaysForFrequency(daysPerWeek) {
  const dayMaps = {
    3: ['Tuesday', 'Thursday', 'Saturday'],
    4: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
    5: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    7: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }
  return dayMaps[daysPerWeek] || dayMaps[5]
}
```

### Content Type Rotation

```javascript
// Rotate content types throughout the week for variety
const CONTENT_ROTATION = {
  // Day index → preferred content type
  0: 'transformation_story',  // Monday: Story
  1: 'educational',           // Tuesday: Teach
  2: 'pain_agitation',        // Wednesday: Problem
  3: 'social_proof',          // Thursday: Proof
  4: 'offer_teaser',          // Friday: Soft sell
  5: 'educational',           // Saturday: Value
  6: 'transformation_story',  // Sunday: Story
}
```

---

## Phase 4: Updated Marketing Quests UI

### File: `src/pages/crm/CRMMarketing.jsx` (Modified)

**First-time flow:**
```jsx
if (!hasStrategy) {
  return <ContentStrategyFlow onComplete={handleStrategyComplete} />
}
```

**Quest card with content attached:**
```jsx
<div className="task-card">
  <button className="task-checkbox" onClick={() => handleToggleTask(task)}>
    {task.completed ? '✓' : ''}
  </button>

  <div className="task-content">
    <span className="task-type">{task.task_type}</span>
    <span className="task-meta">{task.platform} • {task.points_value} pts</span>

    {/* Show attached content if exists */}
    {task.content_id && (
      <div className="task-attached-content">
        <p className="content-preview">{task.content?.content?.substring(0, 100)}...</p>
        <div className="content-actions">
          <button onClick={() => copyContent(task.content?.content)}>
            📋 Copy
          </button>
          <button onClick={() => openContentEditor(task.content)}>
            ✏️ Edit
          </button>
        </div>
      </div>
    )}

    {/* Generate button if no content attached */}
    {!task.content_id && task.task_category === 'content' && (
      <button
        className="generate-btn"
        onClick={() => generateForTask(task)}
      >
        ✨ Generate Content
      </button>
    )}
  </div>
</div>
```

**Header actions:**
```jsx
<div className="crm-header-actions">
  <button onClick={() => setShowStrategyModal(true)}>
    ⚙️ Edit Strategy
  </button>
  <button onClick={handleRegenerateWeek}>
    🔄 Regenerate Week
  </button>
  <button onClick={() => navigate('/crm/performance')}>
    📊 Analytics
  </button>
</div>
```

---

## Phase 5: Weekly Content Generation

### File: `src/lib/weeklyContentGenerator.js`

```javascript
export async function generateWeekContent(userId, weekStartDate) {
  // 1. Get user's strategy
  const strategy = await fetchContentStrategy(userId)
  if (!strategy) throw new Error('No strategy found')

  // 2. Get the weekly template
  const template = strategy.weekly_template

  // 3. Get context for content generation
  const context = await gatherContentContext(userId)

  // 4. Generate content for each content-type task
  const generatedContent = []

  for (const [day, tasks] of Object.entries(template)) {
    for (const task of tasks) {
      if (task.task_category === 'content') {
        const content = await generateSingleContent({
          contentType: task.content_type,
          platform: task.platform,
          context,
          userId
        })

        generatedContent.push({
          day,
          slot: task.slot,
          content,
          task_type: task.task_type
        })
      }
    }
  }

  // 5. Save to content_history with task links
  // 6. Create marketing_tasks for the week with content_id links

  return generatedContent
}
```

---

## Phase 6: Migration Path

### What Changes

| Current | New |
|---------|-----|
| `TASK_TEMPLATES` in taskService.js | `weekly_template` from user's strategy |
| Batch Generator (standalone) | Integrated into weekly generation |
| Single Generator (standalone) | Keep for ad-hoc, also used per-task |
| Generic tasks | Personalized tasks with content attached |

### Migration Steps

1. Create `content_strategies` table
2. Add columns to `marketing_tasks` and `content_history`
3. Build `ContentStrategyFlow.jsx`
4. Build `weeklyContentGenerator.js`
5. Update `CRMMarketing.jsx` to check for strategy
6. Update task cards to show attached content
7. Remove/deprecate `TASK_TEMPLATES` hardcoded templates

---

## Phase 7: File Structure

```
src/
├── flows/
│   └── ContentStrategyFlow.jsx       # NEW: Strategy setup wizard
│
├── lib/
│   ├── contentStrategy.js            # NEW: Strategy & template logic
│   ├── weeklyContentGenerator.js     # NEW: Batch generation for week
│   └── crm/
│       └── taskService.js            # MODIFIED: Use strategy templates
│
├── pages/crm/
│   └── CRMMarketing.jsx              # MODIFIED: Strategy check, content preview
│
├── components/crm/
│   ├── ContentGenerator.jsx          # KEEP: For ad-hoc generation
│   ├── BatchContentGenerator.jsx     # DEPRECATE: Replaced by weekly gen
│   ├── TaskCard.jsx                  # NEW: Task with content preview
│   └── StrategyModal.jsx             # NEW: Edit strategy modal
│
supabase/migrations/
└── 20260108_content_copilot.sql      # NEW: Schema changes
```

---

## Implementation Order

### Sprint 1: Foundation
- [ ] Create database migration
- [ ] Build `ContentStrategyFlow.jsx` (questions only, no generation)
- [ ] Save strategy to `content_strategies`

### Sprint 2: Template Generation
- [ ] Build template generation logic
- [ ] Generate `weekly_template` from strategy answers
- [ ] Update `CRMMarketing` to use strategy templates

### Sprint 3: Content Integration
- [ ] Build `weeklyContentGenerator.js`
- [ ] Link generated content to tasks
- [ ] Update task cards to show content preview

### Sprint 4: Polish
- [ ] Edit strategy modal
- [ ] Regenerate week button
- [ ] Error handling & loading states
- [ ] Mobile optimization

---

## Questions Resolved

| Question | Decision |
|----------|----------|
| Where do tasks come from? | User's strategy → weekly_template |
| How is content connected? | content_history.task_id ↔ marketing_tasks.content_id |
| What about existing Batch Generator? | Replaced by weekly generation |
| What about Single Generator? | Keep for ad-hoc + per-task generation |
| First-time experience? | Must complete strategy before seeing quests |

---

## Success Metrics

1. **Strategy completion rate** - % of users who complete strategy setup
2. **Content generation rate** - % of content tasks with generated content
3. **Task completion rate** - % of daily tasks marked complete
4. **Time to post** - Time from opening app to copying content

