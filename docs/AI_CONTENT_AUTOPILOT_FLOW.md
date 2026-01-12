# AI Content Autopilot Flow

## Overview
The AI Content Autopilot acts as your "AI Co-Founder" for content creation. It proactively generates content based on your schedule, voice profile, and content strategy - then asks for your approval before posting.

## User Flow

### 1. Setup Phase (One-time)

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTOPILOT SETUP                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📅 Content Schedule                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Which days do you want to post?                       │  │
│  │ [Mon ✓] [Tue] [Wed ✓] [Thu] [Fri ✓] [Sat] [Sun]      │  │
│  │                                                       │  │
│  │ Posts per day: [1] [2] [3]                           │  │
│  │                                                       │  │
│  │ Best time to generate: [7:00 AM ▼]                   │  │
│  │ (We'll have content ready for your morning review)   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  📱 Platforms                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [✓] Instagram    [✓] LinkedIn    [ ] X/Twitter       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  🎯 Content Mix (Auto-rotate through these)                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [✓] Value Bombs         [✓] Transformation Stories   │  │
│  │ [✓] Problem→Solution    [ ] Contrarian Takes         │  │
│  │ [✓] Behind the Scenes   [✓] Quick Lists              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  🔔 Notification Preferences                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Notify me via: [Push ✓] [Email ✓] [SMS]              │  │
│  │                                                       │  │
│  │ Daily digest at: [8:00 AM ▼]                         │  │
│  │ "Here's your content for today - approve or edit"    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│              [Enable Autopilot 🚀]                          │
└─────────────────────────────────────────────────────────────┘
```

### 2. Daily Generation (Automatic)

**Behind the scenes (runs at user's chosen time):**

1. Check user's content schedule for the day
2. Load user's voice profile
3. Load recent performance data (what content performed well)
4. Load any recent news/trends in their niche (optional)
5. Generate content using the content mix rotation
6. Save to `content_queue` with status `pending_approval`
7. Send notification to user

### 3. Approval Queue

```
┌─────────────────────────────────────────────────────────────┐
│               📬 TODAY'S CONTENT QUEUE                      │
│                 Wednesday, January 8                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  2 posts ready for your review                              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  📸 Instagram • Value Bomb                            │  │
│  │  Status: ⏳ Pending Approval                          │  │
│  │                                                       │  │
│  │  "Stop trying to create 'valuable' content.          │  │
│  │                                                       │  │
│  │  Start documenting your actual journey instead.      │  │
│  │                                                       │  │
│  │  Here's what I learned this week from 3 failed       │  │
│  │  launches..."                                         │  │
│  │                                                       │  │
│  │  [Edit ✏️] [Regenerate 🔄] [Approve ✓] [Skip ⏭️]     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  💼 LinkedIn • Transformation Story                   │  │
│  │  Status: ⏳ Pending Approval                          │  │
│  │                                                       │  │
│  │  "6 months ago, I was drowning in client work..."    │  │
│  │                                                       │  │
│  │  [Edit ✏️] [Regenerate 🔄] [Approve ✓] [Skip ⏭️]     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│  Upcoming:                                                  │
│  • Friday: 2 posts (Instagram, LinkedIn)                   │
│  • Monday: 2 posts (Instagram, LinkedIn)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Approval Actions

| Action | Description |
|--------|-------------|
| **Approve** | Content is approved and scheduled for posting |
| **Edit** | Open inline editor, make changes, then approve |
| **Regenerate** | Generate a new version (with optional feedback) |
| **Skip** | Skip this slot for today |
| **Doesn't sound like me** | Voice feedback modal (improves future content) |

### 5. Post-Approval (Optional Auto-Post)

```
┌─────────────────────────────────────────────────────────────┐
│               AUTO-POST SETTINGS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  After approval:                                            │
│                                                             │
│  [ ] Post immediately                                       │
│  [✓] Schedule for optimal time (AI picks best time)        │
│  [ ] Schedule for specific time: [__:__ ▼]                 │
│  [ ] Copy to clipboard (manual posting)                    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Platform connections:                                      │
│  [✓] Instagram - @youraccount (connected)                  │
│  [✓] LinkedIn - Your Name (connected)                      │
│  [ ] Twitter/X - Not connected [Connect →]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### content_queue Table
```sql
CREATE TABLE content_queue (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),

  -- Content
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  platform TEXT NOT NULL,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  generation_time TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  status TEXT DEFAULT 'pending_approval',
  -- 'generating', 'pending_approval', 'approved', 'scheduled', 'posted', 'skipped', 'failed'

  -- Approval
  approved_at TIMESTAMPTZ,
  approved_content TEXT, -- final edited version

  -- Posting
  posted_at TIMESTAMPTZ,
  post_url TEXT,

  -- Feedback
  voice_feedback_applied BOOLEAN DEFAULT FALSE,
  regeneration_count INTEGER DEFAULT 0,

  -- Context
  voice_profile_id UUID REFERENCES voice_profiles(id),
  autopilot_settings_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### autopilot_settings Table
```sql
CREATE TABLE autopilot_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),

  -- Schedule
  is_enabled BOOLEAN DEFAULT FALSE,
  posting_days TEXT[] DEFAULT '{}', -- ['mon', 'wed', 'fri']
  posts_per_day INTEGER DEFAULT 1,
  generation_time TIME DEFAULT '07:00',

  -- Platforms
  platforms TEXT[] DEFAULT '{}', -- ['instagram', 'linkedin']

  -- Content mix
  content_types TEXT[] DEFAULT '{}',

  -- Notifications
  notify_push BOOLEAN DEFAULT TRUE,
  notify_email BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT FALSE,
  digest_time TIME DEFAULT '08:00',

  -- Auto-post settings
  auto_post_mode TEXT DEFAULT 'optimal_time',
  -- 'immediate', 'optimal_time', 'scheduled', 'clipboard'

  -- Connected accounts
  instagram_connected BOOLEAN DEFAULT FALSE,
  linkedin_connected BOOLEAN DEFAULT FALSE,
  twitter_connected BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Phases

### Phase 1: Core Autopilot
- [ ] Autopilot settings page
- [ ] Content queue table
- [ ] Daily generation cron job (Supabase Edge Function)
- [ ] Approval queue UI
- [ ] Basic approve/edit/regenerate actions

### Phase 2: Smart Features
- [ ] Performance-based content optimization
- [ ] Optimal posting time calculation
- [ ] Trend integration (optional)
- [ ] Voice improvement from feedback

### Phase 3: Auto-Posting
- [ ] Platform OAuth connections
- [ ] Auto-post to connected platforms
- [ ] Post performance tracking
- [ ] Engagement analytics

## Notification Examples

### Morning Digest (Push)
```
🌅 Good morning! Your content is ready.

2 posts waiting for approval:
• Instagram: Value Bomb
• LinkedIn: Transformation Story

[Review Now →]
```

### Reminder (If not reviewed by noon)
```
⏰ Reminder: 2 posts still need your approval

Skip today's content or review now?
[Review →] [Skip Today]
```

### Post Success
```
✅ Posted to Instagram!

Your Value Bomb post is now live.
[View Post →]
```

## Key Principles

1. **Always Human-in-the-Loop**: AI generates, human approves
2. **Voice Consistency**: Uses voice profile for authentic content
3. **Learning System**: Improves from feedback and performance data
4. **Flexible Control**: Easy to skip, pause, or adjust
5. **Minimal Friction**: One-tap approval when content is good
