# AI Content Autopilot - Implementation Scope

## Executive Summary

The Autopilot is **scheduled batch generation** with smart context. Rather than replacing the Batch Generator, it automates it - running on a schedule with pre-configured settings and rich context about the user's business.

---

## Part 1: How Batch & Autopilot Coexist

### The Relationship

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTENT GENERATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   MANUAL PATH                    AUTOMATED PATH                 │
│   ───────────                    ──────────────                 │
│                                                                 │
│   ┌─────────────┐               ┌─────────────┐                │
│   │   Single    │               │  Autopilot  │                │
│   │  Generator  │               │   Settings  │                │
│   └──────┬──────┘               └──────┬──────┘                │
│          │                              │                       │
│   ┌──────┴──────┐               ┌──────┴──────┐                │
│   │    Batch    │               │  Cron Job   │                │
│   │  Generator  │               │  (Daily)    │                │
│   └──────┬──────┘               └──────┬──────┘                │
│          │                              │                       │
│          └──────────────┬───────────────┘                       │
│                         ▼                                       │
│              ┌─────────────────────┐                           │
│              │   APPROVAL QUEUE    │  ← Unified                │
│              │   (content_history) │                           │
│              └──────────┬──────────┘                           │
│                         ▼                                       │
│              ┌─────────────────────┐                           │
│              │  CONTENT CALENDAR   │                           │
│              └─────────────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Use Case Matrix

| Scenario | Best Tool | Why |
|----------|-----------|-----|
| "I have 2 hours Sunday, want to prep the week" | Batch Generator | User has time, wants control |
| "I'm launching, need 20 posts for campaign" | Batch Generator | Specific, one-time need |
| "I never have time but need consistent content" | Autopilot | Set and forget |
| "I want content ready every morning to review" | Autopilot | Routine, automated |
| "I need one post right now" | Single Generator | Immediate need |

### Shared Infrastructure

Both Batch and Autopilot use:
- Same `content_history` table (different `source` values)
- Same Approval Queue UI
- Same Voice Profile
- Same Content Generator edge function
- Same content type templates

### Key Difference

| Aspect | Batch Generator | Autopilot |
|--------|-----------------|-----------|
| Trigger | User clicks button | Cron job runs automatically |
| Configuration | Per-session (pick days, types) | Persistent settings |
| Context | Minimal (topic input) | Rich (strategy, pillars, goals) |
| Frequency | Ad-hoc | Scheduled (daily/weekly) |

---

## Part 2: Setting Up Autopilot for Success

### The Problem with "Just Generate Content"

Without context, AI generates generic content. The autopilot needs to understand:

1. **WHO** you're talking to (audience)
2. **WHAT** you help them with (transformation)
3. **WHY** they should listen (authority/proof)
4. **HOW** you're different (unique angle)
5. **WHAT'S WORKING** (performance data)

### Strategy Brief (One-Time Setup)

Before enabling autopilot, user completes a Strategy Brief:

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUTOPILOT STRATEGY BRIEF                      │
│                   "Teach AI about your business"                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STEP 1: Your Content Goal                                     │
│  ─────────────────────────                                     │
│  What's your primary goal for content right now?               │
│                                                                 │
│  ○ Build authority (become known as THE expert)                │
│  ○ Grow audience (get more followers/subscribers)              │
│  ○ Generate leads (drive people to my offer)                   │
│  ○ Nurture existing audience (stay top of mind)                │
│  ○ Launch prep (warm up for upcoming offer)                    │
│                                                                 │
│  STEP 2: Content Pillars                                       │
│  ───────────────────────                                       │
│  What 3-5 topics do you want to be known for?                  │
│                                                                 │
│  Examples for a business coach:                                │
│  • Pricing & Packaging   • Client Acquisition                  │
│  • Mindset & Identity    • Systems & Automation                │
│                                                                 │
│  Your pillars:                                                 │
│  [________________________]  [________________________]        │
│  [________________________]  [________________________]        │
│  [________________________]                                    │
│                                                                 │
│  STEP 3: Your Unique Angle                                     │
│  ─────────────────────────                                     │
│  What makes YOUR take different?                               │
│                                                                 │
│  "Unlike most [coaches], I believe [contrarian view]           │
│   because [reason from experience]"                            │
│                                                                 │
│  [____________________________________________________________]│
│  [____________________________________________________________]│
│                                                                 │
│  STEP 4: Proof Points                                          │
│  ────────────────────                                          │
│  What results can you reference? (AI will weave these in)      │
│                                                                 │
│  □ "Helped 50+ clients achieve [result]"                       │
│  □ "Built a [X] business in [Y] months"                        │
│  □ "Featured in [publication/podcast]"                         │
│  □ Custom: [____________________________________]              │
│                                                                 │
│  STEP 5: Content Style Preferences                             │
│  ─────────────────────────────────                             │
│  Beyond your voice profile, any specific preferences?          │
│                                                                 │
│  □ Always include a CTA                                        │
│  □ Use emojis sparingly                                        │
│  □ Keep posts under 200 words                                  │
│  □ Include hashtags for Instagram                              │
│  □ Never mention competitors                                   │
│  □ Custom rule: [____________________________]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Auto-Population from Existing Data

The Strategy Brief can pre-fill from FindMyFlow data:

| Field | Source |
|-------|--------|
| Content Pillars | Skills from FlowFinder |
| Audience | Persona from FlowFinder |
| Transformation | Problem→Solution from FlowFinder |
| Unique Angle | From Nervous System / Essence work |
| Proof Points | From Validation Flow responses |
| Voice | From Voice Profile |
| What's Working | From content_history engagement data |

```javascript
// Example: Pre-populate strategy brief
async function loadStrategyContext(userId) {
  const [skills, persona, validation, topContent] = await Promise.all([
    fetchNikigaiClusters(userId, 'skills'),
    fetchPersonaProfile(userId),
    fetchValidationResponses(userId),
    fetchTopPerformingContent(userId, 5)
  ])

  return {
    suggestedPillars: skills.map(s => s.cluster_label),
    audience: persona?.ideal_customer_description,
    proofPoints: validation?.results || [],
    topPerformingTypes: analyzeContentTypes(topContent)
  }
}
```

---

## Part 3: Autopilot Settings

### Database Schema

```sql
CREATE TABLE autopilot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,

  -- Enable/disable
  is_enabled BOOLEAN DEFAULT FALSE,

  -- Schedule
  posting_days TEXT[] DEFAULT ARRAY['mon', 'wed', 'fri'],
  posts_per_day INTEGER DEFAULT 1,
  generation_time TIME DEFAULT '06:00', -- Generate early

  -- Platforms
  platforms TEXT[] DEFAULT ARRAY['instagram', 'linkedin'],

  -- Content mix (rotate through these)
  content_types TEXT[] DEFAULT ARRAY[
    'transformation_story',
    'educational',
    'pain_agitation',
    'social_proof'
  ],

  -- Strategy context
  content_goal TEXT, -- 'authority', 'growth', 'leads', 'nurture', 'launch'
  content_pillars TEXT[] DEFAULT '{}',
  unique_angle TEXT,
  proof_points TEXT[] DEFAULT '{}',
  style_rules TEXT[] DEFAULT '{}',

  -- Notifications
  notify_push BOOLEAN DEFAULT TRUE,
  notify_email BOOLEAN DEFAULT FALSE,
  digest_time TIME DEFAULT '08:00', -- When to notify user

  -- Advanced
  use_performance_data BOOLEAN DEFAULT TRUE, -- Learn from what works
  use_trending_topics BOOLEAN DEFAULT FALSE, -- Future feature

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE autopilot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own autopilot settings"
  ON autopilot_settings FOR ALL
  USING (auth.uid() = user_id);
```

### Settings Page UI

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Marketing         CONTENT AUTOPILOT           ⚙️    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🤖 Autopilot Status                                      │ │
│  │                                                           │ │
│  │  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ON]                │ │
│  │                                                           │ │
│  │  Next generation: Tomorrow 6:00 AM                       │ │
│  │  Content ready for review: 8:00 AM                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  📅 SCHEDULE                                                   │
│  ─────────────────────────────────────────────────────────────  │
│  Which days should I create content?                           │
│  [Mon ✓] [Tue  ] [Wed ✓] [Thu  ] [Fri ✓] [Sat  ] [Sun  ]      │
│                                                                 │
│  Posts per day: [1 ▼]                                          │
│                                                                 │
│  📱 PLATFORMS                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  [✓] Instagram    [✓] LinkedIn    [ ] Twitter/X               │
│                                                                 │
│  🎯 CONTENT MIX                                                │
│  ─────────────────────────────────────────────────────────────  │
│  I'll rotate through these content types:                      │
│  [✓] Transformation Stories    [✓] Educational/Value          │
│  [✓] Pain Point → Solution     [ ] Behind the Scenes          │
│  [✓] Social Proof              [ ] Contrarian Takes           │
│                                                                 │
│  📊 SMART FEATURES                                             │
│  ─────────────────────────────────────────────────────────────  │
│  [✓] Learn from my top-performing content                     │
│  [ ] Include trending topics in my niche                       │
│                                                                 │
│  🔔 NOTIFICATIONS                                              │
│  ─────────────────────────────────────────────────────────────  │
│  [✓] Push notification when content is ready                  │
│  [ ] Email digest                                              │
│  Notify me at: [8:00 AM ▼]                                     │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  [📝 Edit Strategy Brief]    [View Upcoming Content →]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Cron Job Implementation

### Edge Function: `autopilot-generate`

```typescript
// supabase/functions/autopilot-generate/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get current day of week
  const now = new Date()
  const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()]
  const currentHour = now.getUTCHours()

  // Find users who:
  // 1. Have autopilot enabled
  // 2. Have today in their posting_days
  // 3. Haven't had content generated today
  const { data: users, error } = await supabase
    .from('autopilot_settings')
    .select(`
      *,
      voice_profiles!inner(*)
    `)
    .eq('is_enabled', true)
    .contains('posting_days', [dayOfWeek])

  if (error || !users) {
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { status: 500 })
  }

  const results = []

  for (const settings of users) {
    // Check if already generated today
    const today = now.toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('content_history')
      .select('id')
      .eq('user_id', settings.user_id)
      .eq('source', 'autopilot')
      .gte('created_at', today)

    if (existing && existing.length >= settings.posts_per_day) {
      continue // Already generated for today
    }

    // Load context for this user
    const context = await loadUserContext(supabase, settings)

    // Generate content for each platform
    for (const platform of settings.platforms) {
      // Pick content type (rotate through list)
      const contentType = pickNextContentType(settings, existing?.length || 0)

      // Generate content
      const content = await generateContent({
        platform,
        contentType,
        voiceProfile: settings.voice_profiles,
        strategyContext: {
          goal: settings.content_goal,
          pillars: settings.content_pillars,
          uniqueAngle: settings.unique_angle,
          proofPoints: settings.proof_points,
          styleRules: settings.style_rules
        },
        performanceContext: context.topPerforming
      })

      // Save to content_history
      await supabase.from('content_history').insert({
        user_id: settings.user_id,
        project_id: settings.project_id,
        content: content.text,
        content_type: contentType,
        platform,
        source: 'autopilot',
        status: 'draft',
        review_status: 'pending',
        scheduled_date: today
      })

      results.push({ user_id: settings.user_id, platform, contentType })
    }

    // Send notification
    await sendAutopilotNotification(settings.user_id, settings.posts_per_day)
  }

  return new Response(JSON.stringify({
    processed: results.length,
    results
  }))
})

async function loadUserContext(supabase, settings) {
  // Load top performing content for this user
  const { data: topContent } = await supabase
    .from('content_history')
    .select('*')
    .eq('user_id', settings.user_id)
    .eq('status', 'posted')
    .order('engagement_data->likes', { ascending: false })
    .limit(5)

  return { topPerforming: topContent || [] }
}

function pickNextContentType(settings, existingCount) {
  // Simple rotation through content types
  const types = settings.content_types
  return types[existingCount % types.length]
}
```

### Scheduling the Cron Job

Option 1: **Supabase pg_cron** (runs inside database)
```sql
-- Run every hour, check for users whose generation_time has passed
SELECT cron.schedule(
  'autopilot-generation',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url := 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/autopilot-generate',
    headers := '{"Authorization": "Bearer ' || current_setting('supabase.service_role_key') || '"}'::jsonb
  );
  $$
);
```

Option 2: **GitHub Actions** (external trigger)
```yaml
# .github/workflows/autopilot-generate.yml
name: Autopilot Content Generation
on:
  schedule:
    - cron: '0 * * * *' # Every hour
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger autopilot
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/autopilot-generate
```

Option 3: **Supabase Edge Function with Cron Trigger** (simplest)
```typescript
// In supabase/functions/autopilot-generate/index.ts
// Add to supabase config to run on schedule
```

---

## Part 5: Implementation Plan

### Phase 1: Foundation (Day 1)
- [ ] Create `autopilot_settings` table
- [ ] Create Strategy Brief form component
- [ ] Create Autopilot Settings page
- [ ] Add route `/crm/autopilot-settings`

### Phase 2: Generation (Day 2)
- [ ] Create `autopilot-generate` edge function
- [ ] Implement context loading (voice, strategy, performance)
- [ ] Test manual trigger of generation
- [ ] Verify content appears in Approval Queue with `source: 'autopilot'`

### Phase 3: Scheduling (Day 3)
- [ ] Set up cron job (pg_cron or GitHub Actions)
- [ ] Implement notification sending
- [ ] Test full flow: schedule → generate → notify → approve

### Phase 4: Polish (Day 4)
- [ ] Pre-populate Strategy Brief from existing data
- [ ] Add "pause autopilot" functionality
- [ ] Add "skip today" option
- [ ] Performance-based content type weighting

---

## Part 6: Success Metrics

### For Users
- Time saved: "I spend 5 min/day reviewing vs 2 hours creating"
- Consistency: "I haven't missed a posting day in 3 weeks"
- Quality: "AI content gets similar engagement to my manual posts"

### For System
- Approval rate: % of autopilot content approved without edits
- Regeneration rate: How often users request new versions
- Voice accuracy: "Doesn't sound like me" feedback frequency

---

## Summary

**Autopilot = Scheduled Batch + Rich Context + Smart Learning**

The key differentiator from basic batch generation:
1. **Runs automatically** on user's schedule
2. **Uses strategy context** (pillars, goals, unique angle)
3. **Learns from performance** (prioritize what works)
4. **Notifies user** when content is ready
5. **Integrates with existing** Approval Queue

This leverages everything already built while adding the automation layer.
