# Phase 3 Architecture: Challenge System Enhancement

## Overview

Enhance the existing 7-day challenge system to support persona-based progression, stage graduation, and milestone tracking. Users complete challenges to earn artifacts and graduate through stages within their persona journey.

---

## 1. Persona Stage System

### 1.1 Stage Definitions by Persona

```javascript
const PERSONA_STAGES = {
  vibe_seeker: {
    stages: ['validation', 'creation', 'testing'],
    graduation_requirements: {
      validation: {
        flows_required: ['nikigai'],
        conversations_required: 3,
        description: 'Complete Nikigai + talk to 3 people about your idea'
      },
      creation: {
        milestones: ['product_created'],
        description: 'Create your first product/offering'
      },
      testing: {
        milestones: ['tested_with_3'],
        description: 'Test your product with 3 people'
      }
    }
  },
  vibe_riser: {
    stages: ['validation', 'creation', 'testing', 'scale'],
    graduation_requirements: {
      validation: {
        flows_required: ['100m_offer'],
        conversations_required: 3,
        description: 'Complete $100M Offer flow + talk to 3 people'
      },
      creation: {
        milestones: ['offer_created'],
        description: 'Create your offer'
      },
      testing: {
        milestones: ['offer_tested_with_3'],
        description: 'Test offer with 3 people'
      },
      scale: {
        flows_required: ['100m_leads'],
        challenge_streak: 7,
        description: 'Complete $100M Leads + 7-day challenge streak'
      }
    }
  },
  movement_maker: {
    stages: ['validation', 'creation', 'testing', 'scale'],
    graduation_requirements: {
      validation: {
        flows_required: ['100m_money_model'],
        conversations_required: 3,
        description: 'Complete $100M Money Model + talk to 3 people'
      },
      creation: {
        milestones: ['model_built'],
        description: 'Build your money model'
      },
      testing: {
        milestones: ['model_tested_with_3'],
        description: 'Test model with 3 people'
      },
      scale: {
        flows_required: ['100m_leads'],
        milestones: ['acquisition_offer_launched'],
        description: 'Complete $100M Leads + launch acquisition offer'
      }
    }
  }
}
```

### 1.2 Database Schema Updates

```sql
-- Add to existing migration or create new: 20251128_01_challenge_enhancement.sql

-- Table: user_stage_progress
-- Tracks user's current stage within their persona journey
CREATE TABLE public.user_stage_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  persona text NOT NULL CHECK (persona IN ('vibe_seeker', 'vibe_riser', 'movement_maker')),
  current_stage text NOT NULL DEFAULT 'validation',
  stage_started_at timestamp with time zone DEFAULT now(),
  conversations_logged integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_stage_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_stage_progress_user_unique UNIQUE (user_id)
);

-- Table: stage_graduations
-- Records when a user graduates from one stage to the next
CREATE TABLE public.stage_graduations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  persona text NOT NULL,
  from_stage text NOT NULL,
  to_stage text NOT NULL,
  graduation_reason jsonb DEFAULT '{}', -- stores which requirements were met
  graduated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stage_graduations_pkey PRIMARY KEY (id)
);

-- Table: conversation_logs
-- Tracks when users log conversations (for graduation requirements)
CREATE TABLE public.conversation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  stage text NOT NULL,
  conversation_summary text,
  key_insights text,
  person_type text, -- 'potential_customer', 'mentor', 'peer', etc.
  logged_at timestamp with time zone DEFAULT now(),
  challenge_instance_id uuid REFERENCES public.challenge_progress(id),
  CONSTRAINT conversation_logs_pkey PRIMARY KEY (id)
);

-- Table: milestone_completions
-- Tracks arbitrary milestones (product created, tested, etc.)
CREATE TABLE public.milestone_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  milestone_id text NOT NULL, -- 'product_created', 'offer_tested_with_3', etc.
  stage text NOT NULL,
  persona text NOT NULL,
  evidence_text text, -- user's description of what they did
  completed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT milestone_completions_pkey PRIMARY KEY (id),
  CONSTRAINT milestone_completions_unique UNIQUE (user_id, milestone_id)
);

-- Add columns to challenge_progress for enhanced tracking
ALTER TABLE public.challenge_progress
ADD COLUMN IF NOT EXISTS persona text,
ADD COLUMN IF NOT EXISTS current_stage text DEFAULT 'validation',
ADD COLUMN IF NOT EXISTS streak_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_stage_progress_user ON public.user_stage_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_logs_user_stage ON public.conversation_logs(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_milestone_completions_user ON public.milestone_completions(user_id);

-- RLS Policies
ALTER TABLE public.user_stage_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_graduations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stage progress" ON public.user_stage_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own stage progress" ON public.user_stage_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own graduations" ON public.stage_graduations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own graduations" ON public.stage_graduations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own conversation logs" ON public.conversation_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own milestones" ON public.milestone_completions
  FOR ALL USING (auth.uid() = user_id);
```

---

## 2. Challenge Selection System

### 2.1 Challenge Pool UI

Users pick challenges from a pool filtered by:
- Category (Recognise, Release, Rewire, Reconnect)
- Type (daily, weekly, anytime)
- Persona-relevance (optional future enhancement)

**UI Components:**

```jsx
// src/components/ChallengePool.jsx
// - Displays available challenges by category
// - Users tap to select which challenges to commit to for the day/week
// - Selected challenges appear in "My Active Challenges"

// src/components/ActiveChallenges.jsx
// - Shows user's selected challenges for current period
// - Quick completion interface
// - Progress tracking
```

### 2.2 Challenge Filtering Logic

```javascript
// src/lib/challengeFiltering.js

export const filterChallengesForUser = (allChallenges, userContext) => {
  const { persona, currentStage, completedFlows, hasActiveChallenge } = userContext;

  return allChallenges.filter(challenge => {
    // Filter out flow challenges if flow already completed
    if (challenge.inputType === 'flow') {
      if (completedFlows.includes(challenge.flow_id)) {
        return false;
      }
    }

    // Filter out 'coming_soon' status
    if (challenge.status === 'coming_soon') {
      return false;
    }

    return true;
  });
};

export const getChallengeRecommendations = (userContext) => {
  // AI-driven recommendations based on:
  // - User's persona and stage
  // - Past completion patterns
  // - Balance across 4 Rs
  // Returns prioritized list of recommended challenges
};
```

---

## 3. Streak & Graduation Logic

### 3.1 Streak Tracking

```javascript
// src/lib/streakTracking.js

export const updateStreak = async (userId, challengeInstanceId) => {
  // Called when user completes at least 1 challenge for the day
  // Increments streak_days
  // Updates longest_streak if current > longest

  const today = new Date().toISOString().split('T')[0];

  // Check if user already logged activity today
  const { data: todayCompletions } = await supabase
    .from('quest_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('challenge_instance_id', challengeInstanceId)
    .gte('completed_at', `${today}T00:00:00`)
    .lte('completed_at', `${today}T23:59:59`);

  if (todayCompletions.length === 1) {
    // First completion today - increment streak
    await supabase
      .from('challenge_progress')
      .update({
        streak_days: supabase.raw('streak_days + 1'),
        last_active_date: new Date().toISOString()
      })
      .eq('id', challengeInstanceId);
  }
};

export const checkStreakBreak = async (userId, challengeInstanceId) => {
  // Called on app load - checks if streak should be reset
  // If last_active_date is not yesterday, reset streak to 0
};
```

### 3.2 Graduation Checker

```javascript
// src/lib/graduationChecker.js

export const checkGraduationEligibility = async (userId) => {
  // Get user's current persona and stage
  const { data: progress } = await supabase
    .from('user_stage_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!progress) return { eligible: false };

  const requirements = PERSONA_STAGES[progress.persona]
    .graduation_requirements[progress.current_stage];

  const checks = {
    flows_completed: await checkFlowsCompleted(userId, requirements.flows_required),
    conversations_logged: progress.conversations_logged >= (requirements.conversations_required || 0),
    milestones_met: await checkMilestones(userId, requirements.milestones),
    streak_met: await checkStreak(userId, requirements.challenge_streak)
  };

  const eligible = Object.values(checks).every(Boolean);

  return {
    eligible,
    checks,
    next_stage: getNextStage(progress.persona, progress.current_stage)
  };
};

export const graduateUser = async (userId, fromStage, toStage, reason) => {
  // Record graduation
  await supabase.from('stage_graduations').insert({
    user_id: userId,
    persona: progress.persona,
    from_stage: fromStage,
    to_stage: toStage,
    graduation_reason: reason
  });

  // Update current stage
  await supabase
    .from('user_stage_progress')
    .update({ current_stage: toStage, stage_started_at: new Date().toISOString() })
    .eq('user_id', userId);

  // Return celebration data for UI
  return {
    graduated: true,
    new_stage: toStage,
    celebration_message: getStageCelebration(toStage)
  };
};
```

---

## 4. Enhanced Challenge Quests

### 4.1 New Quest Types

Add these quests to `challengeQuests.json`:

```json
{
  "id": "milestone_log_conversation",
  "category": "Rewire",
  "type": "daily",
  "name": "Customer Conversation",
  "description": "Have a conversation with someone about your idea/offer. What did you learn?",
  "points": 10,
  "inputType": "conversation_log",
  "placeholder": "Who did you talk to? What was the key insight?",
  "counts_toward_graduation": true,
  "learnMore": "Talking to real people is the fastest way to validate and improve your offer. Each conversation counts toward your stage graduation."
},
{
  "id": "milestone_product_created",
  "category": "Rewire",
  "type": "weekly",
  "name": "Product Milestone",
  "description": "Mark a milestone in building your product or offer",
  "points": 25,
  "inputType": "milestone",
  "milestone_type": "product_created",
  "placeholder": "What did you create? Share a link or description.",
  "persona_specific": ["vibe_seeker"],
  "learnMore": "This milestone counts toward your graduation to the Creation stage."
}
```

### 4.2 InputType Handlers

```javascript
// src/components/QuestInput.jsx

const QuestInput = ({ quest, onComplete }) => {
  switch (quest.inputType) {
    case 'text':
      return <TextInput quest={quest} onComplete={onComplete} />;
    case 'checkbox':
      return <CheckboxInput quest={quest} onComplete={onComplete} />;
    case 'flow':
      return <FlowTrigger quest={quest} onComplete={onComplete} />;
    case 'conversation_log':
      return <ConversationLogInput quest={quest} onComplete={onComplete} />;
    case 'milestone':
      return <MilestoneInput quest={quest} onComplete={onComplete} />;
    default:
      return <TextInput quest={quest} onComplete={onComplete} />;
  }
};

// ConversationLogInput saves to conversation_logs table AND increments counter
// MilestoneInput saves to milestone_completions table
```

---

## 5. UI Components to Build

### 5.1 Component List

| Component | Purpose | Priority |
|-----------|---------|----------|
| `StageProgressCard` | Shows current stage + progress to graduation | High |
| `GraduationModal` | Celebration when user graduates | High |
| `ChallengePool` | Browse and select challenges | High |
| `ActiveChallenges` | View/complete selected challenges | High |
| `ConversationLogInput` | Log customer conversations | High |
| `MilestoneInput` | Mark milestones complete | Medium |
| `StreakIndicator` | Show current streak flame | Medium |
| `GraduationChecklist` | Visual checklist of requirements | Medium |

### 5.2 Profile Page Updates

Update `/profile` (Profile.jsx) to show:
1. Current persona + stage badge
2. Stage progress card with graduation checklist
3. Quick stats: streak days, conversations logged, milestones hit

```jsx
// Add to Profile.jsx

<StageProgressCard
  persona={userData.persona}
  currentStage={stageProgress.current_stage}
  graduationStatus={graduationCheck}
/>
```

---

## 6. Edge Function Updates

### 6.1 graduation-check Edge Function

```typescript
// supabase/functions/graduation-check/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { user_id } = await req.json()

  // 1. Get user's current stage progress
  // 2. Check all graduation requirements
  // 3. If eligible, perform graduation
  // 4. Return graduation status

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## 7. Implementation Order for Sonnet

1. **Database Migration** - Create the SQL migration file
2. **lib/personaStages.js** - Define PERSONA_STAGES constant
3. **lib/graduationChecker.js** - Graduation eligibility logic
4. **lib/streakTracking.js** - Streak update logic
5. **components/StageProgressCard.jsx** - UI component
6. **components/GraduationModal.jsx** - Celebration modal
7. **Update Profile.jsx** - Add stage progress display
8. **components/ChallengePool.jsx** - Challenge selection UI
9. **Update challengeQuests.json** - Add new quest types
10. **Edge function** - graduation-check

---

## 8. Data Flow Diagram

```
User completes quest
        │
        ▼
quest_completions table
        │
        ├──▶ Update challenge_progress (points, artifacts)
        │
        ├──▶ Update streak (if first completion today)
        │
        ├──▶ If conversation_log type → increment conversations_logged
        │
        ├──▶ If milestone type → save to milestone_completions
        │
        └──▶ Check graduation eligibility
                    │
                    ▼
            If eligible → Graduate → Celebration Modal
```

---

## 9. Testing Checklist

- [ ] User can view their current stage and graduation requirements
- [ ] Completing a conversation quest increments the counter
- [ ] Completing a milestone quest is recorded
- [ ] Streak increments correctly (only once per day)
- [ ] Streak resets after missing a day
- [ ] Graduation modal appears when all requirements met
- [ ] Stage updates correctly after graduation
- [ ] Profile shows accurate stage information
- [ ] Challenge pool filters work correctly
