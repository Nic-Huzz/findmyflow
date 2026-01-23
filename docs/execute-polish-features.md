# Execute Tab: Polish Features Implementation Plan

> Six features to make the Execute experience delightful and sticky.

---

## Overview

| Feature | Complexity | Impact | Dependencies |
|---------|------------|--------|--------------|
| Micro-celebrations | Low | High | None |
| Smart task ordering | Low | Medium | Task data structure |
| Daily digest notification | Medium | High | Push notifications |
| Progress photos | Medium | Medium | Storage (existing) |
| Undo on task complete | Low | Medium | None |
| Task templates | Medium | High | New table |

**Estimated total effort:** 2-3 weeks

---

## 1. Micro-celebrations

### What
Delightful feedback when users complete tasks, hit streaks, or level up.

### Behaviors

| Trigger | Celebration |
|---------|-------------|
| Complete single task | Checkmark animation + subtle haptic |
| Complete all daily tasks | Confetti burst + "All done!" message |
| Hit 7-day streak | Fire emoji animation + streak badge glow |
| Hit 30-day streak | Special animation + shareable card |
| Level up | Full-screen celebration + new badge reveal |
| Improvement works | Success animation + "+100 bonus!" floating text |
| First task of day | "Great start!" micro-toast |

### Implementation

#### New file: `src/components/Celebrations/`

```
Celebrations/
├── Confetti.jsx          # Canvas-based confetti animation
├── CheckmarkBurst.jsx    # Task complete animation
├── StreakFire.jsx        # Streak milestone animation
├── LevelUpModal.jsx      # Full-screen level up
├── MicroToast.jsx        # Small encouraging messages
├── FloatingPoints.jsx    # "+20 pts" floating up animation
└── index.js
```

#### Confetti.jsx (simplified)
```jsx
import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

export function triggerConfetti(options = {}) {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#5e17eb', '#7c3aed', '#ffdd27', '#22c55e']
  }
  confetti({ ...defaults, ...options })
}

export function Confetti({ trigger }) {
  useEffect(() => {
    if (trigger) triggerConfetti()
  }, [trigger])
  return null
}
```

#### Hook: useCelebrations.js
```jsx
import { useState, useCallback } from 'react'
import { triggerConfetti } from '../components/Celebrations'

export function useCelebrations() {
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [floatingPoints, setFloatingPoints] = useState(null)

  const celebrateTaskComplete = useCallback((points) => {
    // Haptic feedback (mobile)
    if (navigator.vibrate) navigator.vibrate(50)

    // Show floating points
    setFloatingPoints({ amount: points, id: Date.now() })
    setTimeout(() => setFloatingPoints(null), 1500)
  }, [])

  const celebrateAllTasksComplete = useCallback(() => {
    triggerConfetti()
  }, [])

  const celebrateLevelUp = useCallback((newLevel) => {
    setShowLevelUp(newLevel)
    triggerConfetti({ particleCount: 200, spread: 100 })
  }, [])

  const celebrateStreakMilestone = useCallback((days) => {
    triggerConfetti({
      colors: ['#f97316', '#ea580c', '#ffdd27'],
      particleCount: 50
    })
  }, [])

  return {
    celebrateTaskComplete,
    celebrateAllTasksComplete,
    celebrateLevelUp,
    celebrateStreakMilestone,
    showLevelUp,
    setShowLevelUp,
    floatingPoints
  }
}
```

#### CSS Animations (add to Execute.css)
```css
/* Floating points animation */
@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-40px) scale(1.2); }
}

.floating-points {
  position: absolute;
  right: 16px;
  top: 50%;
  font-weight: 700;
  color: var(--purple);
  animation: floatUp 1.5s ease-out forwards;
  pointer-events: none;
}

/* Checkmark burst */
@keyframes checkBurst {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.task-checkbox.completing {
  animation: checkBurst 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Streak fire glow */
@keyframes fireGlow {
  0%, 100% { filter: drop-shadow(0 0 4px #f97316); }
  50% { filter: drop-shadow(0 0 12px #f97316); }
}

.streak-badge.milestone {
  animation: fireGlow 1s ease-in-out 3;
}
```

#### Package needed
```bash
npm install canvas-confetti
```

---

## 2. Smart Task Ordering

### What
Auto-sort today's tasks by impact and quickest wins for optimal execution flow.

### Ordering Logic

```javascript
function sortTasks(tasks) {
  return tasks.sort((a, b) => {
    // 1. Incomplete before completed
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }

    // 2. High impact first (by points as proxy)
    const pointsDiff = (b.points || 0) - (a.points || 0)
    if (pointsDiff !== 0) return pointsDiff

    // 3. Phase priority (Launch > Deliver > Build > Recap)
    const phasePriority = { launch: 1, deliver: 2, build: 3, recap: 4 }
    const phaseDiff = (phasePriority[a.phase] || 5) - (phasePriority[b.phase] || 5)
    if (phaseDiff !== 0) return phaseDiff

    // 4. Older tasks first (created_at)
    return new Date(a.created_at) - new Date(b.created_at)
  })
}
```

### User Override
- User can drag to reorder manually
- Manual order persisted in localStorage for that day
- "Reset to smart order" button

### Implementation

#### In useChallengeData.js or new useExecuteTasks.js
```jsx
const [manualOrder, setManualOrder] = useState(() => {
  const saved = localStorage.getItem(`task_order_${userId}_${today}`)
  return saved ? JSON.parse(saved) : null
})

const orderedTasks = useMemo(() => {
  if (manualOrder) {
    // Apply manual order
    return manualOrder.map(id => tasks.find(t => t.id === id)).filter(Boolean)
  }
  return sortTasks(tasks)
}, [tasks, manualOrder])

const handleReorder = (newOrder) => {
  setManualOrder(newOrder.map(t => t.id))
  localStorage.setItem(`task_order_${userId}_${today}`, JSON.stringify(newOrder.map(t => t.id)))
}

const resetToSmartOrder = () => {
  setManualOrder(null)
  localStorage.removeItem(`task_order_${userId}_${today}`)
}
```

#### UI Addition
```jsx
<div className="task-list-header">
  <h3>Today's Tasks</h3>
  {manualOrder && (
    <button className="reset-order-btn" onClick={resetToSmartOrder}>
      ↻ Smart Order
    </button>
  )}
</div>
```

---

## 3. Daily Digest Notification

### What
Morning push notification summarizing today's tasks and any noteworthy context.

### Notification Content

```
🌅 Good morning, Nic!

Today's focus:
• 4 tasks across 2 projects
• 🚀 Cohort 4 launch: Day 3 of 7
• 🔥 You're on a 12-day streak!

One thing to know:
Sarah M. is waiting for her milestone check-in.

[Open Execute →]
```

### Triggers

| Time | Condition | Action |
|------|-----------|--------|
| 7:00 AM local | Has tasks for today | Send digest |
| 7:00 AM local | No tasks planned | "Plan your week" nudge |
| Sunday 7:00 PM | Week not planned | "Plan your week for tomorrow" |

### Implementation

#### Database: scheduled_notifications table (if not exists)
```sql
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'daily_digest', 'week_planning', etc.
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_notifications_pending
  ON scheduled_notifications(scheduled_for)
  WHERE sent_at IS NULL;
```

#### Edge Function: daily-digest-sender
```javascript
// supabase/functions/daily-digest-sender/index.ts

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
)

Deno.serve(async (req) => {
  // Get users with push subscriptions who have tasks today
  const { data: users } = await supabase
    .from('push_subscriptions')
    .select(`
      user_id,
      subscription,
      users:user_id (
        email,
        user_stage_progress (persona)
      )
    `)
    .eq('active', true)

  for (const user of users) {
    // Get today's tasks
    const { data: tasks } = await supabase
      .from('execute_tasks')
      .select('*')
      .eq('user_id', user.user_id)
      .eq('scheduled_date', new Date().toISOString().split('T')[0])

    if (tasks.length === 0) continue

    // Get streak
    const { data: stats } = await supabase
      .from('user_crm_stats')
      .select('current_streak')
      .eq('user_id', user.user_id)
      .single()

    // Build notification
    const notification = buildDailyDigest({
      tasks,
      streak: stats?.current_streak || 0,
      userName: user.users?.email?.split('@')[0] || 'there'
    })

    // Send push notification
    await sendPushNotification(user.subscription, notification)
  }

  return new Response(JSON.stringify({ sent: users.length }))
})

function buildDailyDigest({ tasks, streak, userName }) {
  const completedCount = tasks.filter(t => t.completed).length
  const pendingCount = tasks.length - completedCount

  let body = `${pendingCount} task${pendingCount !== 1 ? 's' : ''} today`

  if (streak >= 7) {
    body += ` • 🔥 ${streak}-day streak!`
  }

  return {
    title: `Good morning, ${userName}!`,
    body,
    data: {
      url: '/crm/execute'
    }
  }
}
```

#### Cron Schedule (GitHub Actions or Supabase)
```yaml
# .github/workflows/daily-digest.yml
name: Daily Digest Notifications

on:
  schedule:
    # Run at various times to hit different timezones
    - cron: '0 12 * * *'  # 12:00 UTC (7am EST, 4am PST)
    - cron: '0 15 * * *'  # 15:00 UTC (7am PST)
    - cron: '0 7 * * *'   # 07:00 UTC (7am UK)

jobs:
  send-digest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Edge Function
        run: |
          curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/daily-digest-sender" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

---

## 4. Progress Photos

### What
Let users capture visual proof of their improvements (new landing page, testimonial screenshot, milestone achieved).

### Use Cases

- Screenshot of new landing page design
- Photo of testimonial received
- Before/after comparison
- Celebration moment (client win)

### Implementation

#### Database addition
```sql
ALTER TABLE improvements ADD COLUMN IF NOT EXISTS
  evidence_urls TEXT[] DEFAULT '{}';

ALTER TABLE execute_tasks ADD COLUMN IF NOT EXISTS
  completion_photo_url TEXT;

-- Or new table for more flexibility
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What it's attached to
  reference_type TEXT NOT NULL, -- 'improvement', 'task', 'milestone'
  reference_id UUID NOT NULL,

  -- Photo data
  storage_path TEXT NOT NULL,
  caption TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_progress_photos_reference
  ON progress_photos(reference_type, reference_id);
```

#### Component: ProgressPhotoUpload.jsx
```jsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ProgressPhotoUpload({
  userId,
  referenceType,
  referenceId,
  onUpload
}) {
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      // Upload to Supabase Storage (user folder for RLS)
      const fileName = `${userId}/${referenceType}/${referenceId}/${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName)

      // Save reference (include user_id for RLS)
      await supabase.from('progress_photos').insert({
        user_id: userId,
        reference_type: referenceType,
        reference_id: referenceId,
        storage_path: fileName
      })

      onUpload?.(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <label className="photo-upload-btn">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        disabled={uploading}
        hidden
      />
      {uploading ? '📤 Uploading...' : '📷 Add Photo'}
    </label>
  )
}
```

#### UI Integration
```jsx
// In task completion flow
<div className="task-complete-modal">
  <h3>Task Complete! 🎉</h3>
  <p>Want to capture this moment?</p>

  <ProgressPhotoUpload
    referenceType="task"
    referenceId={task.id}
    onUpload={(url) => setPhotoUrl(url)}
  />

  <button onClick={handleComplete}>
    {photoUrl ? 'Save with Photo' : 'Skip Photo'}
  </button>
</div>
```

---

## 5. Undo on Task Complete

### What
Show a toast with undo option when marking task complete. Reduces anxiety about accidental taps.

### Behavior

1. User taps task to complete
2. Task visually marks as complete immediately (optimistic UI)
3. Toast appears: "Task complete ✓ [Undo]"
4. Toast auto-dismisses after 5 seconds
5. If user taps Undo, task reverts
6. Database update happens after toast dismisses OR immediately if no undo

### Implementation

#### Component: UndoToast.jsx
```jsx
import { useState, useEffect } from 'react'
import './UndoToast.css'

export default function UndoToast({
  message,
  onUndo,
  onConfirm,
  duration = 5000
}) {
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.max(0, p - (100 / (duration / 100))))
    }, 100)

    const timeout = setTimeout(() => {
      setVisible(false)
      onConfirm?.()
    }, duration)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [duration, onConfirm])

  function handleUndo() {
    setVisible(false)
    onUndo?.()
  }

  if (!visible) return null

  return (
    <div className="undo-toast">
      <div className="undo-toast-content">
        <span className="undo-toast-message">{message}</span>
        <button className="undo-toast-btn" onClick={handleUndo}>
          Undo
        </button>
      </div>
      <div className="undo-toast-progress" style={{ width: `${progress}%` }} />
    </div>
  )
}
```

#### UndoToast.css
```css
.undo-toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--dark);
  color: white;
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.undo-toast-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
}

.undo-toast-message {
  font-weight: 500;
}

.undo-toast-btn {
  background: transparent;
  border: none;
  color: var(--gold);
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
}

.undo-toast-progress {
  height: 3px;
  background: var(--purple);
  transition: width 0.1s linear;
}
```

#### Usage in Execute component
```jsx
const [pendingCompletion, setPendingCompletion] = useState(null)

function handleTaskClick(task) {
  if (task.completed) {
    // Already complete, uncomplete it
    uncompleteTask(task.id)
    return
  }

  // Optimistic update
  setTasks(prev => prev.map(t =>
    t.id === task.id ? { ...t, completed: true } : t
  ))

  // Show undo toast
  setPendingCompletion(task)
}

function handleUndoComplete() {
  // Revert optimistic update
  setTasks(prev => prev.map(t =>
    t.id === pendingCompletion.id ? { ...t, completed: false } : t
  ))
  setPendingCompletion(null)
}

function handleConfirmComplete() {
  // Actually save to database
  completeTask(pendingCompletion.id)
  celebrateTaskComplete(pendingCompletion.points)
  setPendingCompletion(null)
}

return (
  <>
    {/* Task list */}

    {pendingCompletion && (
      <UndoToast
        message={`"${pendingCompletion.title}" complete ✓`}
        onUndo={handleUndoComplete}
        onConfirm={handleConfirmComplete}
      />
    )}
  </>
)
```

---

## 6. Task Templates

### What
Save and reuse frequently used task combinations. "My Launch Week", "My Delivery Week", etc.

### Behavior

- User creates template from current week's tasks
- User applies template to future weeks
- Templates are personal (not shared - aligns with "find your flow")
- Templates can be edited/deleted

### Database

```sql
CREATE TABLE IF NOT EXISTS execute_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Template data
  tasks JSONB NOT NULL, -- Array of task definitions

  -- Metadata
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_templates_user ON execute_task_templates(user_id);
```

#### Task template structure
```json
{
  "tasks": [
    {
      "title": "Transformation story post",
      "phase": "launch",
      "category": "content",
      "points": 15
    },
    {
      "title": "Send launch email",
      "phase": "launch",
      "category": "outreach",
      "points": 20
    }
  ]
}
```

### Component: TaskTemplateManager.jsx

```jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'

export default function TaskTemplateManager({
  currentTasks,
  onApplyTemplate
}) {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [templateName, setTemplateName] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [user])

  async function loadTemplates() {
    const { data } = await supabase
      .from('execute_task_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('use_count', { ascending: false })

    setTemplates(data || [])
  }

  async function saveAsTemplate() {
    if (!templateName.trim()) return

    const templateTasks = currentTasks.map(t => ({
      title: t.title,
      phase: t.phase,
      category: t.category,
      points: t.points
    }))

    await supabase.from('execute_task_templates').insert({
      user_id: user.id,
      name: templateName,
      tasks: templateTasks
    })

    setShowSaveModal(false)
    setTemplateName('')
    loadTemplates()
  }

  async function applyTemplate(template) {
    // Increment use count
    await supabase
      .from('execute_task_templates')
      .update({ use_count: template.use_count + 1 })
      .eq('id', template.id)

    onApplyTemplate(template.tasks)
  }

  async function deleteTemplate(id) {
    await supabase
      .from('execute_task_templates')
      .delete()
      .eq('id', id)

    loadTemplates()
  }

  return (
    <div className="task-templates">
      <div className="templates-header">
        <h4>Templates</h4>
        <button
          className="save-template-btn"
          onClick={() => setShowSaveModal(true)}
        >
          💾 Save Current as Template
        </button>
      </div>

      {templates.length > 0 && (
        <div className="templates-list">
          {templates.map(template => (
            <div key={template.id} className="template-item">
              <div className="template-info">
                <span className="template-name">{template.name}</span>
                <span className="template-count">
                  {template.tasks.length} tasks • Used {template.use_count}x
                </span>
              </div>
              <div className="template-actions">
                <button onClick={() => applyTemplate(template)}>
                  Apply
                </button>
                <button
                  className="delete-btn"
                  onClick={() => deleteTemplate(template.id)}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Save as Template</h3>
            <input
              type="text"
              placeholder="Template name (e.g., My Launch Week)"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <p className="modal-hint">
              Saving {currentTasks.length} tasks as a reusable template.
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button
                className="primary"
                onClick={saveAsTemplate}
                disabled={!templateName.trim()}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Implementation Order

| Week | Features | Notes |
|------|----------|-------|
| **Week 1** | Undo on task complete, Micro-celebrations | Foundational UX, no backend |
| **Week 2** | Smart task ordering, Task templates | Needs new table for templates |
| **Week 3** | Progress photos, Daily digest notification | Storage + push notification setup |

---

## Testing Checklist

### Micro-celebrations
- [ ] Confetti triggers on all daily tasks complete
- [ ] Points float up on task complete
- [ ] Haptic feedback on mobile (test iOS + Android)
- [ ] Level up modal shows correctly
- [ ] Streak milestone animation at 7, 30, 100 days

### Smart task ordering
- [ ] High-point tasks sort first
- [ ] Completed tasks sort to bottom
- [ ] Manual reorder persists
- [ ] "Reset to smart order" works
- [ ] Order resets each new day

### Daily digest
- [ ] Notification arrives at correct local time
- [ ] Content accurately reflects tasks/streak
- [ ] Deep link opens Execute tab
- [ ] Users can disable in settings

### Progress photos
- [ ] Upload works on mobile (camera capture)
- [ ] Upload works on desktop (file picker)
- [ ] Photos display in improvement history
- [ ] Photos display on task completion

### Undo on task complete
- [ ] Toast appears immediately
- [ ] Undo reverts the task
- [ ] Auto-confirm after timeout
- [ ] Points awarded only after confirm
- [ ] Multiple rapid completes handled

### Task templates
- [ ] Can save current week as template
- [ ] Can apply template to new week
- [ ] Template tasks merge with existing
- [ ] Can delete templates
- [ ] Use count increments

---

# 100% Improvement Features

> Features that fundamentally change the experience. Higher complexity, higher impact.

---

## Overview

| Feature | Complexity | Impact | Dependencies |
|---------|------------|--------|--------------|
| AI Coach Nudges | Medium | High | Anthropic API, user context |
| Improvement Suggestions | High | High | Data pipeline, similarity matching |
| Voice Logging (Zarlo) | Medium | High | Speech recognition, Zarlo widget |
| Prediction Engine | High | High | Historical data, ML model |
| Weekly Planning AI | Medium | High | Anthropic API, task menu |

**Estimated total effort:** 3-4 weeks

> **Note:** Calendar Sync has been moved to future features (see `future-features-moonshots.md`)

---

## 7. AI Coach Nudges

### What
Context-aware micro-coaching triggered by user behavior patterns. Not scheduled notifications - real-time interventions.

### Triggers & Nudges

| Trigger | Nudge | Tone |
|---------|-------|------|
| Stuck on same task 3+ days | "This task keeps rolling over. Break it down or delegate?" | Curious |
| High execution, low improvement | "You're crushing execution! Ready to level up with an improvement?" | Encouraging |
| Missed 2 consecutive days | "Missing you! What's blocking progress?" | Warm |
| Completed improvement, no outcome logged | "How did that improvement work out? Log the result for bonus points" | Prompting |
| Funnel stage at 0% for 7+ days | "Your [stage] funnel needs attention. Want a quick fix suggestion?" | Helpful |
| Week planned but 0 tasks done by Wed | "Week's halfway done - what can we knock out today?" | Urgent |
| First login of the day | "Welcome back! Your #1 priority today: [highest impact task]" | Focused |

### Implementation

#### Database: coach_nudges table
```sql
CREATE TABLE IF NOT EXISTS coach_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Nudge content
  trigger_type TEXT NOT NULL,
  message TEXT NOT NULL,
  action_type TEXT, -- 'break_down_task', 'start_improvement', 'log_outcome', etc.
  action_data JSONB DEFAULT '{}',

  -- Status
  shown_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  acted_on_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nudges_user_pending
  ON coach_nudges(user_id, shown_at)
  WHERE shown_at IS NULL;
```

#### Service: nudgeEngine.js
```javascript
// src/lib/nudgeEngine.js

const NUDGE_RULES = [
  {
    id: 'stuck_task',
    check: async (userId, context) => {
      const { data: stuckTasks } = await supabase
        .from('execute_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .lt('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())

      if (stuckTasks?.length > 0) {
        return {
          trigger_type: 'stuck_task',
          message: `"${stuckTasks[0].title}" has been waiting 3 days. Break it into smaller steps?`,
          action_type: 'break_down_task',
          action_data: { task_id: stuckTasks[0].id }
        }
      }
      return null
    },
    cooldown: 24 * 60 * 60 * 1000 // Once per day max
  },

  {
    id: 'high_execution_no_improvement',
    check: async (userId, context) => {
      const { executionRate, improvementCount } = context

      if (executionRate > 80 && improvementCount === 0) {
        return {
          trigger_type: 'high_execution_no_improvement',
          message: "You're at ${executionRate}% execution this week! Ready to test an improvement?",
          action_type: 'start_improvement',
          action_data: {}
        }
      }
      return null
    },
    cooldown: 7 * 24 * 60 * 60 * 1000 // Once per week
  },

  {
    id: 'funnel_neglected',
    check: async (userId, context) => {
      const { funnelHealth } = context
      const neglected = Object.entries(funnelHealth)
        .find(([stage, data]) => data.rate === 0 && data.daysStale >= 7)

      if (neglected) {
        const [stage] = neglected
        return {
          trigger_type: 'funnel_neglected',
          message: `Your ${stage} stage hasn't seen action in a week. Quick win idea?`,
          action_type: 'suggest_funnel_action',
          action_data: { stage }
        }
      }
      return null
    },
    cooldown: 3 * 24 * 60 * 60 * 1000
  }
]

export async function checkForNudges(userId) {
  const context = await gatherNudgeContext(userId)
  const recentNudges = await getRecentNudges(userId)

  for (const rule of NUDGE_RULES) {
    // Check cooldown (use shown_at if available, otherwise created_at)
    const lastNudge = recentNudges.find(n => n.trigger_type === rule.id)
    const lastShown = lastNudge?.shown_at || lastNudge?.created_at
    if (lastNudge && lastShown && Date.now() - new Date(lastShown) < rule.cooldown) {
      continue
    }

    const nudge = await rule.check(userId, context)
    if (nudge) {
      return await createNudge(userId, nudge)
    }
  }

  return null
}

async function gatherNudgeContext(userId) {
  // Gather all relevant context for nudge decisions
  const [tasks, improvements, funnelMetrics, stats] = await Promise.all([
    supabase.from('execute_tasks').select('*').eq('user_id', userId),
    supabase.from('improvements').select('*').eq('user_id', userId),
    supabase.from('funnel_metrics').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
    supabase.from('user_crm_stats').select('*').eq('user_id', userId).single()
  ])

  return {
    executionRate: stats.data?.execution_rate || 0,
    improvementCount: improvements.data?.filter(i => !i.outcome_logged).length || 0,
    funnelHealth: calculateFunnelHealth(funnelMetrics.data?.[0]),
    pendingTasks: tasks.data?.filter(t => !t.completed).length || 0
  }
}
```

#### Component: CoachNudge.jsx
```jsx
import { useState, useEffect } from 'react'
import { checkForNudges, dismissNudge, actOnNudge } from '../lib/nudgeEngine'
import './CoachNudge.css'

export default function CoachNudge({ userId }) {
  const [nudge, setNudge] = useState(null)

  useEffect(() => {
    checkForNudges(userId).then(setNudge)
  }, [userId])

  if (!nudge) return null

  async function handleDismiss() {
    await dismissNudge(nudge.id)
    setNudge(null)
  }

  async function handleAction() {
    await actOnNudge(nudge.id)
    // Navigate or open modal based on action_type
    handleNudgeAction(nudge.action_type, nudge.action_data)
    setNudge(null)
  }

  return (
    <div className="coach-nudge">
      <div className="nudge-avatar">🧭</div>
      <div className="nudge-content">
        <p className="nudge-message">{nudge.message}</p>
        <div className="nudge-actions">
          <button className="nudge-btn primary" onClick={handleAction}>
            {getActionLabel(nudge.action_type)}
          </button>
          <button className="nudge-btn dismiss" onClick={handleDismiss}>
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}

function getActionLabel(actionType) {
  const labels = {
    break_down_task: 'Break it down',
    start_improvement: "Let's do it",
    log_outcome: 'Log result',
    suggest_funnel_action: 'Show me'
  }
  return labels[actionType] || 'Take action'
}
```

---

## 8. Improvement Suggestions from Data

### What
Surface anonymized, aggregate insights from similar users to suggest improvements with proven results.

### Similarity Matching

Users are considered "similar" based on weighted factors:

```javascript
// src/lib/similarityEngine.js

const SIMILARITY_FACTORS = {
  offer_type: 0.30,        // coaching, course, service, product
  audience_size: 0.20,     // buckets: 0-100, 100-1k, 1k-10k, 10k+
  funnel_stage: 0.20,      // which stage they're optimizing
  industry_niche: 0.15,    // from persona data (keywords)
  business_phase: 0.15     // build, launch, deliver, recap distribution
}

const AUDIENCE_BUCKETS = ['tiny', 'small', 'medium', 'large']
// tiny: 0-100, small: 100-1k, medium: 1k-10k, large: 10k+

function getAudienceBucket(size) {
  if (size < 100) return 'tiny'
  if (size < 1000) return 'small'
  if (size < 10000) return 'medium'
  return 'large'
}

function calculateSimilarityScore(userA, userB) {
  let score = 0

  // Offer type match (exact)
  if (userA.offer_type === userB.offer_type) {
    score += SIMILARITY_FACTORS.offer_type
  }

  // Audience size (within 1 bucket)
  const bucketA = getAudienceBucket(userA.audience_size)
  const bucketB = getAudienceBucket(userB.audience_size)
  const bucketDiff = Math.abs(AUDIENCE_BUCKETS.indexOf(bucketA) - AUDIENCE_BUCKETS.indexOf(bucketB))
  if (bucketDiff <= 1) {
    score += SIMILARITY_FACTORS.audience_size * (bucketDiff === 0 ? 1 : 0.5)
  }

  // Funnel stage (exact match on stage being optimized)
  if (userA.current_funnel_focus === userB.current_funnel_focus) {
    score += SIMILARITY_FACTORS.funnel_stage
  }

  // Industry niche (keyword overlap)
  const nicheOverlap = calculateKeywordOverlap(userA.niche_keywords, userB.niche_keywords)
  score += SIMILARITY_FACTORS.industry_niche * nicheOverlap

  // Business phase distribution similarity
  const phaseSimilarity = calculatePhaseDistributionSimilarity(userA.phases, userB.phases)
  score += SIMILARITY_FACTORS.business_phase * phaseSimilarity

  return score
}
```

### Database: aggregated_improvements table
```sql
-- Store anonymized improvement outcomes for suggestion engine
CREATE TABLE IF NOT EXISTS aggregated_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Segmentation (anonymized)
  offer_type TEXT NOT NULL,
  audience_bucket TEXT NOT NULL,
  funnel_stage TEXT NOT NULL,
  niche_category TEXT, -- broad category, not user-specific

  -- Improvement details
  improvement_type TEXT NOT NULL, -- 'add_testimonials', 'video_intro', 'urgency_copy', etc.
  improvement_description TEXT NOT NULL,

  -- Aggregate outcomes
  times_tried INTEGER DEFAULT 0,
  times_positive_outcome INTEGER DEFAULT 0,
  avg_lift_percentage DECIMAL(5,2),

  -- Confidence
  confidence_score DECIMAL(3,2), -- based on sample size

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agg_improvements_segment
  ON aggregated_improvements(offer_type, audience_bucket, funnel_stage);
```

### Service: suggestionEngine.js
```javascript
// src/lib/suggestionEngine.js

export async function getSuggestionsForUser(userId) {
  // Get user's profile for matching
  const userProfile = await getUserSimilarityProfile(userId)

  // Find improvements that worked for similar users
  const { data: suggestions } = await supabase
    .from('aggregated_improvements')
    .select('*')
    .eq('offer_type', userProfile.offer_type)
    .in('audience_bucket', [userProfile.audience_bucket, getAdjacentBucket(userProfile.audience_bucket)])
    .eq('funnel_stage', userProfile.weakest_funnel_stage)
    .gte('confidence_score', 0.6) // Only suggest if we have enough data
    .gte('times_positive_outcome', 5) // Minimum success threshold
    .order('avg_lift_percentage', { ascending: false })
    .limit(3)

  return suggestions?.map(s => ({
    type: s.improvement_type,
    description: s.improvement_description,
    insight: formatInsight(s),
    confidence: s.confidence_score
  })) || []
}

function formatInsight(suggestion) {
  const successRate = Math.round((suggestion.times_positive_outcome / suggestion.times_tried) * 100)
  return `${successRate}% of similar users saw improvement (avg +${suggestion.avg_lift_percentage}%)`
}

async function getUserSimilarityProfile(userId) {
  const [persona, offers, metrics] = await Promise.all([
    supabase.from('persona_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('grand_slam_offers').select('offer_type').eq('user_id', userId).single(),
    supabase.from('funnel_metrics').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
  ])

  const funnelHealth = calculateFunnelHealth(metrics.data?.[0])
  const weakestStage = Object.entries(funnelHealth)
    .sort(([,a], [,b]) => a.rate - b.rate)[0]?.[0]

  return {
    offer_type: offers.data?.offer_type || 'coaching',
    audience_bucket: getAudienceBucket(persona.data?.audience_size || 0),
    weakest_funnel_stage: weakestStage || 'awareness',
    niche_keywords: persona.data?.niche_keywords || []
  }
}
```

### Privacy Safeguards
- Never expose individual user data
- Minimum 5 data points before surfacing a suggestion
- Broad niche categories, not specific businesses
- No user IDs in aggregated table
- Suggestions phrased as "users like you" not "specific user X"

---

## 9. Voice Logging (Zarlo Integration)

### What
Voice input integrated into Zarlo for quick data capture. Users speak, Zarlo transcribes and logs.

### Placement
- **Inside Zarlo widget** as first-class option
- Quick action buttons when Zarlo opens: "Voice Log" | "Ask Zarlo" | "Weekly Plan"
- Voice icon in message input

### Voice Commands

| Command Pattern | Action |
|----------------|--------|
| "Log a deal with [name] for [amount]" | Create deal in pipeline |
| "Complete [task name/description]" | Mark matching task complete |
| "Add task: [description]" | Create new task for today |
| "Update funnel: [X] [stage] this week" | Update funnel metrics |
| "Note: [freeform]" | Save as general note |
| "How am I doing?" | Trigger stats summary |

### Implementation

#### Update zarloPageContent.js
```javascript
// Add to src/lib/zarlo/zarloPageContent.js

export const ZARLO_QUICK_ACTIONS = [
  {
    id: 'voice_log',
    label: '🎤 Voice Log',
    description: 'Speak to log data quickly',
    action: 'voice'
  },
  {
    id: 'ask_zarlo',
    label: '💬 Ask Zarlo',
    description: 'Get help or advice',
    action: 'chat'
  },
  {
    id: 'weekly_plan',
    label: '📋 Plan Week',
    description: 'AI-assisted week planning',
    action: 'plan'
  }
]
```

#### Component: ZarloVoiceInput.jsx
```jsx
import { useState, useRef } from 'react'
import { processVoiceCommand } from '../../lib/zarlo/voiceProcessor'

export default function ZarloVoiceInput({ userId, onResult }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [processing, setProcessing] = useState(false)
  const recognitionRef = useRef(null)

  function startListening() {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input not supported in this browser')
      return
    }

    const recognition = new webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setListening(true)

    recognition.onresult = (event) => {
      const current = event.results[event.results.length - 1]
      setTranscript(current[0].transcript)

      if (current.isFinal) {
        handleFinalTranscript(current[0].transcript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setListening(false)
    }

    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    recognitionRef.current?.stop()
  }

  async function handleFinalTranscript(text) {
    setProcessing(true)

    try {
      const result = await processVoiceCommand(text, userId)
      onResult(result)
    } catch (err) {
      onResult({
        success: false,
        message: "I didn't catch that. Try again?"
      })
    } finally {
      setProcessing(false)
      setTranscript('')
    }
  }

  return (
    <div className="zarlo-voice-input">
      <button
        className={`voice-btn ${listening ? 'listening' : ''}`}
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
      >
        {listening ? '🔴' : '🎤'}
      </button>

      {transcript && (
        <div className="transcript-preview">
          {transcript}
          {processing && <span className="processing-dot">...</span>}
        </div>
      )}

      <p className="voice-hint">
        {listening ? 'Listening...' : 'Hold to speak'}
      </p>
    </div>
  )
}
```

#### Service: voiceProcessor.js
```javascript
// src/lib/zarlo/voiceProcessor.js

import { supabase } from '../supabaseClient'

const COMMAND_PATTERNS = [
  {
    pattern: /^log (?:a )?deal with (.+) for \$?([\d,]+)/i,
    action: 'create_deal',
    extract: (match) => ({
      contact_name: match[1],
      amount: parseInt(match[2].replace(',', ''))
    })
  },
  {
    pattern: /^complete (?:task )?(.+)/i,
    action: 'complete_task',
    extract: (match) => ({ task_search: match[1] })
  },
  {
    pattern: /^add task:?\s*(.+)/i,
    action: 'create_task',
    extract: (match) => ({ title: match[1] })
  },
  {
    pattern: /^update funnel:?\s*([\d,]+)\s+(\w+)/i,
    action: 'update_funnel',
    extract: (match) => ({
      count: parseInt(match[1].replace(',', '')),
      stage: match[2]
    })
  },
  {
    pattern: /^note:?\s*(.+)/i,
    action: 'create_note',
    extract: (match) => ({ content: match[1] })
  },
  {
    pattern: /^how am i doing/i,
    action: 'get_stats',
    extract: () => ({})
  }
]

export async function processVoiceCommand(transcript, userId) {
  const cleanedText = transcript.trim()

  for (const { pattern, action, extract } of COMMAND_PATTERNS) {
    const match = cleanedText.match(pattern)
    if (match) {
      const data = extract(match)
      return await executeAction(action, data, userId)
    }
  }

  // No pattern matched - treat as general note or pass to Zarlo chat
  return {
    success: true,
    action: 'fallback_chat',
    message: "I'll help you with that...",
    originalText: cleanedText
  }
}

async function executeAction(action, data, userId) {
  switch (action) {
    case 'create_deal': {
      const { error } = await supabase.from('sales_deals').insert({
        user_id: userId,
        contact_name: data.contact_name,
        value: data.amount,
        status: 'lead', // Valid statuses: lead, discovery, proposal, won, lost
        product_type: 'service' // Required field - default to service
      })
      return {
        success: !error,
        message: error
          ? 'Failed to log deal'
          : `Logged $${data.amount.toLocaleString()} deal with ${data.contact_name}`
      }
    }

    case 'complete_task': {
      // Find matching task
      const { data: tasks } = await supabase
        .from('execute_tasks')
        .select('id, title')
        .eq('user_id', userId)
        .eq('completed', false)
        .ilike('title', `%${data.task_search}%`)
        .limit(1)

      if (tasks?.length > 0) {
        await supabase
          .from('execute_tasks')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq('id', tasks[0].id)

        return {
          success: true,
          message: `Completed: "${tasks[0].title}"`
        }
      }
      return {
        success: false,
        message: `Couldn't find task matching "${data.task_search}"`
      }
    }

    case 'create_task': {
      const { error } = await supabase.from('execute_tasks').insert({
        user_id: userId,
        title: data.title,
        scheduled_date: new Date().toISOString().split('T')[0],
        phase: 'build' // Default phase
      })
      return {
        success: !error,
        message: error ? 'Failed to create task' : `Added: "${data.title}"`
      }
    }

    case 'update_funnel': {
      // Map voice commands to actual funnel_metrics column names
      const stageMap = {
        awareness: 'awareness',
        reach: 'awareness',
        attraction: 'attraction',
        engaged: 'attraction',
        leads: 'leadmagnet',
        leadmagnet: 'leadmagnet',
        optins: 'leadmagnet',
        nurture: 'nurture',
        nurtured: 'nurture',
        core: 'core',
        sales: 'core',
        conversions: 'core',
        upsell: 'upsell',
        upsells: 'upsell',
        downsell: 'downsell',
        downsells: 'downsell',
        continuity: 'continuity',
        recurring: 'continuity'
      }

      const field = stageMap[data.stage.toLowerCase()]
      if (!field) {
        return { success: false, message: `Unknown funnel stage: ${data.stage}. Try: awareness, leads, nurture, sales, upsell, downsell, continuity` }
      }

      // Get week start (Monday)
      const weekStart = getWeekStart(new Date())

      // Update or create funnel metric for this week
      const { error } = await supabase.from('funnel_metrics').upsert({
        user_id: userId,
        week_start: weekStart,
        mode: 'actual',
        [field]: data.count
      }, { onConflict: 'user_id,week_start' })

      return {
        success: !error,
        message: error
          ? 'Failed to update funnel'
          : `Updated ${field}: ${data.count}`
      }
    }

    case 'get_stats': {
      const stats = await getQuickStats(userId)
      return {
        success: true,
        message: `This week: ${stats.executionRate}% execution, ${stats.tasksCompleted} tasks done, ${stats.streak}-day streak`
      }
    }

    default:
      return { success: false, message: 'Unknown command' }
  }
}
```

---

## 10. Prediction Engine

### What
ML-powered predictions for outcomes based on current execution patterns and historical data.

### Predictions Generated

| Prediction | Based On | Display |
|------------|----------|---------|
| Week completion probability | Current pace + historical patterns | "87% likely to hit your goal this week" |
| Month revenue projection | Pipeline + conversion rates + seasonality | "$4,200 - $5,800 projected this month" |
| Streak risk | Recent activity + historical streak breaks | "Your streak is at risk - you've skipped 2 days before" |
| Improvement success probability | Similar improvements' outcomes | "72% chance this improvement works" |
| Optimal task count | Historical completion rates | "You complete 4-6 tasks most days - plan accordingly" |

### Implementation

#### Database: predictions table
```sql
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Prediction details
  prediction_type TEXT NOT NULL,
  prediction_value JSONB NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,

  -- Context
  input_data JSONB, -- What data was used
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Accuracy tracking
  actual_value JSONB,
  accuracy_logged_at TIMESTAMPTZ
);

CREATE INDEX idx_predictions_user_type
  ON predictions(user_id, prediction_type, generated_at DESC);
```

#### Service: predictionEngine.js
```javascript
// src/lib/predictionEngine.js

export async function generateWeekPrediction(userId) {
  const [weekTasks, historicalWeeks] = await Promise.all([
    getThisWeekTasks(userId),
    getHistoricalWeekData(userId, 12) // Last 12 weeks
  ])

  const currentPace = calculateCurrentPace(weekTasks)
  const historicalRate = calculateHistoricalCompletionRate(historicalWeeks)
  const dayOfWeek = new Date().getDay()

  // Simple model: weighted average of current pace and historical
  // Weight current pace more as week progresses
  const currentWeight = dayOfWeek / 7
  const historicalWeight = 1 - currentWeight

  const predictedRate = (currentPace * currentWeight) + (historicalRate * historicalWeight)

  // Confidence based on data quantity and variance
  const confidence = calculateConfidence(historicalWeeks)

  return {
    type: 'week_completion',
    value: {
      predicted_rate: Math.round(predictedRate * 100),
      current_pace: Math.round(currentPace * 100),
      historical_avg: Math.round(historicalRate * 100)
    },
    confidence,
    message: generatePredictionMessage(predictedRate, confidence)
  }
}

export async function generateRevenuePrediction(userId) {
  const [pipeline, historicalDeals, funnelMetrics] = await Promise.all([
    getPipelineDeals(userId),
    getHistoricalDeals(userId, 90), // Last 90 days
    getFunnelMetrics(userId)
  ])

  // Calculate conversion rate from pipeline
  const conversionRate = calculatePipelineConversionRate(historicalDeals)

  // Project based on current pipeline
  const pipelineValue = pipeline.reduce((sum, d) => sum + d.value, 0)
  const projectedFromPipeline = pipelineValue * conversionRate

  // Add estimated new deals based on funnel
  const newDealsProjection = estimateNewDeals(funnelMetrics, conversionRate)

  const totalProjection = projectedFromPipeline + newDealsProjection

  // Generate range (±20% based on variance)
  const variance = calculateRevenueVariance(historicalDeals)

  return {
    type: 'month_revenue',
    value: {
      low: Math.round(totalProjection * (1 - variance)),
      high: Math.round(totalProjection * (1 + variance)),
      most_likely: Math.round(totalProjection)
    },
    confidence: Math.min(0.9, historicalDeals.length / 20), // More data = more confidence
    message: formatRevenuePrediction(totalProjection, variance)
  }
}

function generatePredictionMessage(rate, confidence) {
  if (rate >= 0.9) {
    return "You're on track for an excellent week!"
  } else if (rate >= 0.7) {
    return "Solid pace - keep it up to hit your goal"
  } else if (rate >= 0.5) {
    return "You'll need to pick up the pace to finish strong"
  } else {
    return "This week needs focus - prioritize your top 3 tasks"
  }
}
```

#### Component: PredictionCard.jsx
```jsx
export default function PredictionCard({ prediction }) {
  if (!prediction) return null

  const confidenceLabel =
    prediction.confidence >= 0.8 ? 'High confidence' :
    prediction.confidence >= 0.5 ? 'Medium confidence' : 'Low confidence'

  return (
    <div className="prediction-card">
      <div className="prediction-header">
        <span className="prediction-icon">🔮</span>
        <span className="prediction-label">{getPredictionLabel(prediction.type)}</span>
        <span className={`confidence-badge ${confidenceLabel.split(' ')[0].toLowerCase()}`}>
          {confidenceLabel}
        </span>
      </div>

      <div className="prediction-value">
        {formatPredictionValue(prediction)}
      </div>

      <p className="prediction-message">{prediction.message}</p>
    </div>
  )
}
```

---

## 11. Weekly Planning AI

### What
AI-assisted weekly planning that suggests optimal task selection based on context.

### Prompt

```javascript
// src/lib/zarlo/weeklyPlanningPrompt.js

export function buildWeeklyPlanningPrompt(context) {
  return `You are a business execution coach helping ${context.userName} plan their week.

CONTEXT:
- Active Projects: ${JSON.stringify(context.projects)}
- Current Phases per Project: ${JSON.stringify(context.phases)}
- Last Week's Execution Rate: ${context.lastWeekRate}%
- Funnel Health: ${JSON.stringify(context.funnelHealth)}
- Lowest Converting Stage: ${context.weakestStage} at ${context.weakestRate}%
- Pending Improvements: ${context.pendingImprovements.length} waiting for outcomes
- Stuck Tasks (3+ days): ${context.stuckTasks.map(t => t.title).join(', ') || 'None'}
- Available Task Menu: ${JSON.stringify(context.taskMenu)}

USER'S HISTORICAL PATTERNS:
- Average tasks completed per day: ${context.avgTasksPerDay}
- Most productive day: ${context.mostProductiveDay}
- Common drop-off point: ${context.dropOffPattern || 'No clear pattern'}
- Streak history: Current ${context.currentStreak} days, longest ${context.longestStreak} days

CONSTRAINTS:
- Suggest 5-7 tasks maximum (sustainable execution > ambitious overload)
- Balance: 60% execution tasks, 30% improvement tasks, 10% learning/prep
- Prioritize tasks that address lowest-converting funnel stage
- Consider user's historical completion patterns
- Don't suggest more than ${context.avgTasksPerDay + 2} tasks per day

OUTPUT FORMAT:
Return a JSON object:
{
  "week_theme": "One sentence summary of the week's focus",
  "priority_tasks": [
    {
      "title": "Task title",
      "phase": "build|launch|deliver|recap",
      "rationale": "Why this task matters this week",
      "suggested_day": "Monday|Tuesday|etc or 'flexible'"
    }
  ],
  "improvement_focus": {
    "stage": "Which funnel stage to improve",
    "hypothesis": "What to test",
    "metric_to_watch": "How to measure success"
  },
  "stretch_goal": "Optional task if everything else is done",
  "warnings": ["Any concerns about the plan"]
}

TONE: Direct, encouraging, no fluff. Reference their specific data. Be realistic about capacity.`
}
```

### Service: weeklyPlanner.js
```javascript
// src/lib/zarlo/weeklyPlanner.js

import { buildWeeklyPlanningPrompt } from './weeklyPlanningPrompt'
import { callAnthropic } from '../anthropicClient'

export async function generateWeeklyPlan(userId) {
  const context = await gatherPlanningContext(userId)
  const prompt = buildWeeklyPlanningPrompt(context)

  const response = await callAnthropic({
    model: 'claude-3-haiku-20240307', // Fast + cheap for planning
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000
  })

  // Parse JSON from response with error handling
  let plan
  try {
    const responseText = response.content[0].text
    // Try to extract JSON object from response (handles markdown code blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON object found in response')
    }
    plan = JSON.parse(jsonMatch[0])
  } catch (parseError) {
    console.error('Failed to parse planning response:', parseError)
    return {
      error: 'Could not generate plan - AI response was not valid JSON',
      raw: response.content[0].text,
      week_theme: 'Manual planning needed',
      priority_tasks: [],
      improvement_focus: null,
      stretch_goal: null,
      warnings: ['AI response could not be parsed. Please try again or plan manually.']
    }
  }

  // Save plan for reference
  const weekStart = getWeekStart(new Date())
  await supabase.from('weekly_plans').upsert({
    user_id: userId,
    week_start: weekStart,
    plan_data: plan,
    context_snapshot: context
  }, { onConflict: 'user_id,week_start' })

  return plan
}

async function gatherPlanningContext(userId) {
  const [
    projects,
    lastWeekStats,
    funnelMetrics,
    improvements,
    stuckTasks,
    historicalStats,
    taskMenu
  ] = await Promise.all([
    getActiveProjects(userId),
    getLastWeekStats(userId),
    getLatestFunnelMetrics(userId),
    getPendingImprovements(userId),
    getStuckTasks(userId),
    getHistoricalStats(userId),
    getTaskMenuByPhase()
  ])

  const funnelHealth = calculateFunnelHealth(funnelMetrics)
  const weakest = Object.entries(funnelHealth)
    .sort(([,a], [,b]) => a.rate - b.rate)[0]

  return {
    userName: await getUserName(userId),
    projects: projects.map(p => ({ name: p.name, stage: p.current_stage })),
    phases: projects.flatMap(p => p.active_phases || ['build']),
    lastWeekRate: lastWeekStats?.execution_rate || 0,
    funnelHealth,
    weakestStage: weakest?.[0] || 'awareness',
    weakestRate: weakest?.[1]?.rate || 0,
    pendingImprovements: improvements,
    stuckTasks,
    avgTasksPerDay: historicalStats.avgTasksPerDay,
    mostProductiveDay: historicalStats.mostProductiveDay,
    dropOffPattern: historicalStats.dropOffPattern,
    currentStreak: historicalStats.currentStreak,
    longestStreak: historicalStats.longestStreak,
    taskMenu
  }
}
```

### UI Integration in Zarlo

```jsx
// In ZarloChat.jsx, add weekly planning action

function handleQuickAction(action) {
  if (action === 'plan') {
    setMode('planning')
    generateWeeklyPlan(userId).then(plan => {
      setPlan(plan)
      // Display plan in chat interface
      addMessage({
        role: 'assistant',
        content: formatPlanAsMessage(plan)
      })
    })
  }
}

function formatPlanAsMessage(plan) {
  return `## Your Week: ${plan.week_theme}

### Priority Tasks
${plan.priority_tasks.map(t =>
  `- **${t.title}** (${t.phase}) - ${t.rationale}`
).join('\n')}

### Improvement Focus
Test **${plan.improvement_focus.hypothesis}** on your ${plan.improvement_focus.stage} stage. Watch: ${plan.improvement_focus.metric_to_watch}

${plan.stretch_goal ? `### Stretch Goal\n${plan.stretch_goal}` : ''}

${plan.warnings?.length ? `### Heads Up\n${plan.warnings.join('\n')}` : ''}

Ready to add these to your week?`
}
```

---

## Shared Helper Functions

All services need these helper functions. Create `src/lib/executeHelpers.js`:

```javascript
// src/lib/executeHelpers.js
// Shared helpers for the Execute system

import { supabase } from './supabaseClient'

// ============================================
// DATE HELPERS
// ============================================

/**
 * Get Monday of the week containing the given date
 */
export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}

/**
 * Calculate days since a given date
 */
export function daysSince(dateString) {
  if (!dateString) return Infinity
  const then = new Date(dateString)
  const now = new Date()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

// ============================================
// FUNNEL HEALTH CALCULATOR
// ============================================

/**
 * Calculate health metrics for each funnel stage
 * @param {Object} metrics - Row from funnel_metrics table
 * @returns {Object} Health object with rate and staleness per stage
 */
export function calculateFunnelHealth(metrics) {
  if (!metrics) return {}

  const stages = [
    'awareness',
    'attraction',
    'leadmagnet',
    'nurture',
    'core',
    'upsell',
    'downsell',
    'continuity'
  ]

  const health = {}

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]
    const current = metrics[stage] || 0
    const previous = i > 0 ? (metrics[stages[i - 1]] || 0) : current

    health[stage] = {
      count: current,
      rate: previous > 0 ? Math.round((current / previous) * 100) : 0,
      daysStale: daysSince(metrics.updated_at)
    }
  }

  return health
}

/**
 * Get the weakest funnel stage (lowest conversion rate)
 */
export function getWeakestFunnelStage(funnelHealth) {
  if (!funnelHealth || Object.keys(funnelHealth).length === 0) {
    return { stage: 'awareness', rate: 0 }
  }

  const entries = Object.entries(funnelHealth)
    .filter(([stage]) => stage !== 'awareness') // Skip first stage
    .sort(([, a], [, b]) => a.rate - b.rate)

  const [stage, data] = entries[0] || ['awareness', { rate: 0 }]
  return { stage, rate: data.rate }
}

// ============================================
// NUDGE HELPERS
// ============================================

/**
 * Get recent nudges for cooldown checking
 */
export async function getRecentNudges(userId, days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const { data } = await supabase
    .from('coach_nudges')
    .select('id, trigger_type, shown_at, created_at')
    .eq('user_id', userId)
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false })

  return data || []
}

/**
 * Create a new nudge
 */
export async function createNudge(userId, nudgeData) {
  const { data, error } = await supabase
    .from('coach_nudges')
    .insert({
      user_id: userId,
      ...nudgeData
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create nudge:', error)
    return null
  }

  return data
}

/**
 * Mark nudge as shown
 */
export async function markNudgeShown(nudgeId) {
  await supabase
    .from('coach_nudges')
    .update({ shown_at: new Date().toISOString() })
    .eq('id', nudgeId)
}

/**
 * Dismiss a nudge
 */
export async function dismissNudge(nudgeId) {
  await supabase
    .from('coach_nudges')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', nudgeId)
}

/**
 * Mark nudge as acted upon
 */
export async function actOnNudge(nudgeId) {
  await supabase
    .from('coach_nudges')
    .update({ acted_on_at: new Date().toISOString() })
    .eq('id', nudgeId)
}

// ============================================
// STATS HELPERS
// ============================================

/**
 * Get quick stats for voice command response
 */
export async function getQuickStats(userId) {
  const weekStart = getWeekStart()

  // Get tasks for this week
  const { data: tasks } = await supabase
    .from('execute_tasks')
    .select('completed')
    .eq('user_id', userId)
    .gte('scheduled_date', weekStart)

  const tasksCompleted = tasks?.filter(t => t.completed).length || 0
  const totalTasks = tasks?.length || 0
  const executionRate = totalTasks > 0
    ? Math.round((tasksCompleted / totalTasks) * 100)
    : 0

  // Get streak
  const { data: stats } = await supabase
    .from('user_crm_stats')
    .select('current_streak')
    .eq('user_id', userId)
    .single()

  return {
    executionRate,
    tasksCompleted,
    totalTasks,
    streak: stats?.current_streak || 0
  }
}

/**
 * Get historical stats for a user
 */
export async function getHistoricalStats(userId) {
  // Get last 12 weeks of task data
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

  const { data: tasks } = await supabase
    .from('execute_tasks')
    .select('scheduled_date, completed, created_at')
    .eq('user_id', userId)
    .gte('scheduled_date', twelveWeeksAgo.toISOString().split('T')[0])

  if (!tasks || tasks.length === 0) {
    return {
      avgTasksPerDay: 3,
      mostProductiveDay: 'Monday',
      dropOffPattern: null,
      currentStreak: 0,
      longestStreak: 0
    }
  }

  // Calculate average tasks per day
  const tasksByDay = {}
  tasks.forEach(t => {
    const day = new Date(t.scheduled_date).toLocaleDateString('en-US', { weekday: 'long' })
    tasksByDay[day] = (tasksByDay[day] || 0) + (t.completed ? 1 : 0)
  })

  const totalDays = Object.keys(tasksByDay).length || 1
  const totalCompleted = tasks.filter(t => t.completed).length
  const avgTasksPerDay = Math.round(totalCompleted / totalDays * 10) / 10

  // Find most productive day
  const mostProductiveDay = Object.entries(tasksByDay)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Monday'

  // Get streak from stats
  const { data: stats } = await supabase
    .from('user_crm_stats')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .single()

  return {
    avgTasksPerDay,
    mostProductiveDay,
    dropOffPattern: null, // Could analyze patterns later
    currentStreak: stats?.current_streak || 0,
    longestStreak: stats?.longest_streak || 0
  }
}

// ============================================
// DATA FETCHING HELPERS
// ============================================

/**
 * Get active projects for a user
 */
export async function getActiveProjects(userId) {
  const { data } = await supabase
    .from('user_projects')
    .select('id, name, current_stage, active_phases')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  return data || []
}

/**
 * Get last week's execution stats
 */
export async function getLastWeekStats(userId) {
  const lastWeekStart = new Date()
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const weekStartStr = getWeekStart(lastWeekStart)

  const { data: tasks } = await supabase
    .from('execute_tasks')
    .select('completed')
    .eq('user_id', userId)
    .gte('scheduled_date', weekStartStr)
    .lt('scheduled_date', getWeekStart())

  const completed = tasks?.filter(t => t.completed).length || 0
  const total = tasks?.length || 0

  return {
    execution_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    tasks_completed: completed,
    tasks_total: total
  }
}

/**
 * Get latest funnel metrics
 */
export async function getLatestFunnelMetrics(userId) {
  const { data } = await supabase
    .from('funnel_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('mode', 'actual')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data
}

/**
 * Get pending improvements (not yet logged outcome)
 */
export async function getPendingImprovements(userId) {
  const { data } = await supabase
    .from('improvements')
    .select('*')
    .eq('user_id', userId)
    .eq('outcome_logged', false)
    .order('created_at', { ascending: false })

  return data || []
}

/**
 * Get stuck tasks (3+ days old, not completed)
 */
export async function getStuckTasks(userId) {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const { data } = await supabase
    .from('execute_tasks')
    .select('id, title, phase, created_at')
    .eq('user_id', userId)
    .eq('completed', false)
    .lt('created_at', threeDaysAgo.toISOString())

  return data || []
}

/**
 * Get this week's tasks
 */
export async function getThisWeekTasks(userId) {
  const weekStart = getWeekStart()

  const { data } = await supabase
    .from('execute_tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('scheduled_date', weekStart)

  return data || []
}

/**
 * Get historical week data for predictions
 */
export async function getHistoricalWeekData(userId, weeks = 12) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (weeks * 7))

  const { data } = await supabase
    .from('execute_tasks')
    .select('scheduled_date, completed')
    .eq('user_id', userId)
    .gte('scheduled_date', startDate.toISOString().split('T')[0])

  // Group by week
  const weeklyData = {}
  data?.forEach(task => {
    const week = getWeekStart(new Date(task.scheduled_date))
    if (!weeklyData[week]) {
      weeklyData[week] = { completed: 0, total: 0 }
    }
    weeklyData[week].total++
    if (task.completed) weeklyData[week].completed++
  })

  return Object.entries(weeklyData).map(([week, data]) => ({
    week,
    ...data,
    rate: data.total > 0 ? data.completed / data.total : 0
  }))
}

/**
 * Get user's display name
 */
export async function getUserName(userId) {
  const { data } = await supabase
    .from('user_stage_progress')
    .select('display_name')
    .eq('user_id', userId)
    .single()

  if (data?.display_name) return data.display_name

  // Fallback to email
  const { data: user } = await supabase.auth.getUser()
  return user?.user?.email?.split('@')[0] || 'there'
}

/**
 * Get task menu organized by phase
 */
export function getTaskMenuByPhase() {
  return {
    build: [
      { title: 'Create content piece', category: 'content', points: 15 },
      { title: 'Design/wireframe', category: 'design', points: 20 },
      { title: 'Write copy', category: 'content', points: 15 },
      { title: 'Build landing page', category: 'build', points: 25 },
      { title: 'Record video/audio', category: 'content', points: 20 },
      { title: 'Share progress update', category: 'content', points: 10 }
    ],
    launch: [
      { title: 'Send launch email', category: 'outreach', points: 20 },
      { title: 'Post launch content', category: 'content', points: 15 },
      { title: 'DM potential customers', category: 'outreach', points: 15 },
      { title: 'Go live/webinar', category: 'event', points: 30 },
      { title: 'Run ads', category: 'paid', points: 20 },
      { title: 'Partner outreach', category: 'outreach', points: 15 }
    ],
    deliver: [
      { title: 'Client session', category: 'delivery', points: 25 },
      { title: 'Create deliverable', category: 'delivery', points: 20 },
      { title: 'Check-in with client', category: 'delivery', points: 10 },
      { title: 'Request testimonial', category: 'proof', points: 15 },
      { title: 'Document results', category: 'proof', points: 15 },
      { title: 'Share client win', category: 'content', points: 15 }
    ],
    recap: [
      { title: 'Analyze metrics', category: 'analysis', points: 15 },
      { title: 'Write case study', category: 'content', points: 25 },
      { title: 'Update testimonials', category: 'proof', points: 15 },
      { title: 'Reflect & journal', category: 'mindset', points: 10 },
      { title: 'Plan next iteration', category: 'planning', points: 20 },
      { title: 'Share learnings', category: 'content', points: 15 }
    ]
  }
}

// ============================================
// PREDICTION HELPERS
// ============================================

/**
 * Calculate current pace for week completion prediction
 */
export function calculateCurrentPace(tasks) {
  if (!tasks || tasks.length === 0) return 0
  const completed = tasks.filter(t => t.completed).length
  return completed / tasks.length
}

/**
 * Calculate historical completion rate
 */
export function calculateHistoricalCompletionRate(weeklyData) {
  if (!weeklyData || weeklyData.length === 0) return 0.7 // Default assumption

  const totalRate = weeklyData.reduce((sum, week) => sum + week.rate, 0)
  return totalRate / weeklyData.length
}

/**
 * Calculate confidence based on data quality
 */
export function calculateConfidence(weeklyData) {
  if (!weeklyData || weeklyData.length === 0) return 0.3

  // More data = higher confidence, max at 0.9
  const dataConfidence = Math.min(0.9, weeklyData.length / 12)

  // Lower variance = higher confidence
  const rates = weeklyData.map(w => w.rate)
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length
  const variance = rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length
  const varianceConfidence = Math.max(0.3, 1 - variance)

  return Math.round(((dataConfidence + varianceConfidence) / 2) * 100) / 100
}

// ============================================
// SIMILARITY HELPERS
// ============================================

/**
 * Get adjacent audience bucket for fuzzy matching
 */
export function getAdjacentBucket(bucket) {
  const buckets = ['tiny', 'small', 'medium', 'large']
  const index = buckets.indexOf(bucket)

  if (index === 0) return 'small'
  if (index === buckets.length - 1) return 'medium'
  return buckets[index - 1] // Prefer smaller adjacent
}

/**
 * Get audience bucket from size
 */
export function getAudienceBucket(size) {
  if (size < 100) return 'tiny'
  if (size < 1000) return 'small'
  if (size < 10000) return 'medium'
  return 'large'
}
```

---

## Database Migration

```sql
-- 100% Features Migration
-- Run after polish features migration

-- Coach Nudges
CREATE TABLE IF NOT EXISTS coach_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  message TEXT NOT NULL,
  action_type TEXT,
  action_data JSONB DEFAULT '{}',
  shown_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  acted_on_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nudges_user_pending
  ON coach_nudges(user_id, shown_at)
  WHERE shown_at IS NULL;

-- Aggregated Improvements (for suggestions)
CREATE TABLE IF NOT EXISTS aggregated_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_type TEXT NOT NULL,
  audience_bucket TEXT NOT NULL,
  funnel_stage TEXT NOT NULL,
  niche_category TEXT,
  improvement_type TEXT NOT NULL,
  improvement_description TEXT NOT NULL,
  times_tried INTEGER DEFAULT 0,
  times_positive_outcome INTEGER DEFAULT 0,
  avg_lift_percentage DECIMAL(5,2),
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agg_improvements_segment
  ON aggregated_improvements(offer_type, audience_bucket, funnel_stage);

-- Predictions
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL,
  prediction_value JSONB NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  input_data JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  actual_value JSONB,
  accuracy_logged_at TIMESTAMPTZ
);

CREATE INDEX idx_predictions_user_type
  ON predictions(user_id, prediction_type, generated_at DESC);

-- Weekly Plans
CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  plan_data JSONB NOT NULL,
  context_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_weekly_plans_user_week
  ON weekly_plans(user_id, week_start);

-- RLS Policies
ALTER TABLE coach_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nudges" ON coach_nudges
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own predictions" ON predictions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own weekly plans" ON weekly_plans
  FOR ALL USING (auth.uid() = user_id);
```

---

## Implementation Order

| Week | Features | Notes |
|------|----------|-------|
| **Week 1** | Voice Logging (Zarlo), AI Coach Nudges | Core interaction improvements |
| **Week 2** | Weekly Planning AI, Prediction Engine (basic) | AI-powered planning |
| **Week 3** | Improvement Suggestions, Prediction Engine (advanced) | Data-driven features |
| **Week 4** | Testing, Polish, Bug fixes | Stabilization |

---

## Testing Checklist

### AI Coach Nudges
- [ ] Nudges trigger at appropriate times
- [ ] Cooldown periods work correctly
- [ ] Dismiss persists (doesn't re-show same nudge)
- [ ] Action buttons navigate/trigger correctly
- [ ] Multiple nudges don't stack

### Improvement Suggestions
- [ ] Similarity matching returns relevant results
- [ ] Privacy: no individual user data exposed
- [ ] Confidence threshold filters low-data suggestions
- [ ] Insights format is clear and actionable

### Voice Logging (Zarlo)
- [ ] Speech recognition starts/stops correctly
- [ ] Commands parse accurately
- [ ] Fallback to chat works
- [ ] Mobile browser support (iOS Safari, Android Chrome)
- [ ] Transcript preview shows interim results

### Prediction Engine
- [ ] Week predictions generate correctly
- [ ] Revenue projections have reasonable ranges
- [ ] Confidence scores reflect data quality
- [ ] Accuracy logging captures actual outcomes

### Weekly Planning AI
- [ ] Prompt includes all relevant context
- [ ] Response parses to valid JSON
- [ ] Suggested tasks are from valid menu
- [ ] Plan saves to database
- [ ] User can accept/modify plan
