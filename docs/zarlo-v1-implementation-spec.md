# Zarlo v1 Implementation Spec

> **Status:** Ready for Build
> **Complexity:** Medium (rule-based, no AI)
> **Est. Files:** 5-7 new components

---

## Philosophy

Zarlo v1 is a **guide and accountability partner**, not an AI assistant. It:
- Routes users to the right experience based on their struggle
- Reframes every problem through the NS thesis lens
- Holds users accountable to their commitments
- Mirrors back patterns once data exists

**Core Thesis:**
> "You don't rise to the level of your ambitions. You fall to what feels safe to your nervous system."

---

## Component Architecture

```
src/
├── components/
│   └── Zarlo/
│       ├── ZarloChat.jsx           # Main chat interface
│       ├── ZarloChat.css           # Styling
│       ├── ZarloMessage.jsx        # Individual message bubble
│       ├── ZarloQuickReplies.jsx   # Button options for responses
│       ├── ZarloInputField.jsx     # Free text input (when needed)
│       └── index.js                # Barrel export
│
├── lib/
│   └── zarlo/
│       ├── zarloEngine.js          # Core routing logic
│       ├── zarloResponses.js       # Response templates
│       ├── zarloFlows.js           # Conversation flow definitions
│       └── zarloContext.js         # React context for Zarlo state
│
└── pages/
    └── ZarloPage.jsx               # Full-page Zarlo experience
```

---

## Database Schema

```sql
-- Minimal table for Zarlo v1
CREATE TABLE zarlo_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Current state
  current_flow TEXT,                    -- 'intake', 'accountability', 'progress'
  current_step TEXT,                    -- Step within the flow

  -- User context (gathered from intake)
  primary_struggle TEXT,                -- 'visibility', 'starting_stopping', 'unclear', 'burnout', 'existing_project'
  secondary_context TEXT,               -- Follow-up answer

  -- Accountability tracking
  last_commitment TEXT,                 -- What they said they'd do
  last_commitment_date TIMESTAMP,       -- When they committed
  commitment_completed BOOLEAN,         -- Did they do it?

  -- Metadata
  messages_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_zarlo_user ON zarlo_conversations(user_id);

-- RLS Policy
ALTER TABLE zarlo_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Zarlo data"
  ON zarlo_conversations
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## Conversation Flows

### Flow 1: Intake Assessment (First-Time User)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Welcome                                                │
├─────────────────────────────────────────────────────────────────┤
│  Zarlo: "Hey! I'm Zarlo, your co-founder guide.                │
│                                                                 │
│  I'm not here to give you generic advice. I'm here to help     │
│  you understand what's actually holding you back — and it's    │
│  probably not what you think.                                   │
│                                                                 │
│  Quick question: What's the biggest thing stopping you from    │
│  building the life and business you want?"                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ I know what I want but can't get visible              │   │
│  │ ○ I keep starting and stopping                          │   │
│  │ ○ I don't know what I should be building                │   │
│  │ ○ I'm burnt out and need to heal first                  │   │
│  │ ○ I have an existing project but I'm stuck              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

User selects: "I know what I want but can't get visible"
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Follow-up (visibility branch)                         │
├─────────────────────────────────────────────────────────────────┤
│  Zarlo: "Got it. When you think about being more visible —     │
│  posting content, reaching out to people, putting yourself     │
│  out there — what comes up?"                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ Fear of being judged                                  │   │
│  │ ○ Feeling like I'm not ready yet                        │   │
│  │ ○ Worried I'll fail publicly                            │   │
│  │ ○ I just procrastinate and don't know why               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

User selects any option
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: NS Thesis Reframe                                     │
├─────────────────────────────────────────────────────────────────┤
│  Zarlo: "Here's what most people don't realize:                │
│                                                                 │
│  That's not a courage problem. It's a safety problem.          │
│                                                                 │
│  Your nervous system has learned that being visible isn't      │
│  safe. Maybe from a past experience where you put yourself     │
│  out there and got hurt. So now it pulls you back every time   │
│  you try to expand.                                            │
│                                                                 │
│  The good news? We can find exactly where your 'safe edge' is  │
│  — and start expanding it.                                     │
│                                                                 │
│  Ready to map your nervous system?"                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ Yes, let's do it (→ /nervous-system)                  │   │
│  │ ○ Tell me more first                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Accountability Check-in (Returning User)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Check Last Commitment                                 │
├─────────────────────────────────────────────────────────────────┤
│  [If user has a recent uncommpleted commitment]                │
│                                                                 │
│  Zarlo: "Welcome back! Yesterday you said you'd:               │
│                                                                 │
│  '${lastCommitment}'                                           │
│                                                                 │
│  Did you do it?"                                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ Yes, I did it!                                        │   │
│  │ ○ Partially                                             │   │
│  │ ○ No, I didn't                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

User selects: "Yes, I did it!"
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2a: Celebration                                          │
├─────────────────────────────────────────────────────────────────┤
│  Zarlo: "That's huge! 🎉                                       │
│                                                                 │
│  Every time you do something that feels uncomfortable, you're  │
│  teaching your nervous system that it's safe. That's how we    │
│  expand.                                                        │
│                                                                 │
│  What do you want to tackle next?"                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ Show me today's quests                                │   │
│  │ ○ I want to set my next commitment                      │   │
│  │ ○ I'm feeling drained today                             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

User selects: "No, I didn't"
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2b: Compassionate Inquiry                                │
├─────────────────────────────────────────────────────────────────┤
│  Zarlo: "No judgment — that's data.                            │
│                                                                 │
│  When the time came to do it, what showed up for you?"         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ I forgot                                              │   │
│  │ ○ I felt resistance and avoided it                      │   │
│  │ ○ Life got in the way                                   │   │
│  │ ○ I realized it wasn't the right thing                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

User selects: "I felt resistance and avoided it"
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Pattern Recognition                                   │
├─────────────────────────────────────────────────────────────────┤
│  Zarlo: "That resistance? That's your nervous system doing     │
│  its job — protecting you from what it perceives as danger.    │
│                                                                 │
│  The commitment might have been too big of a stretch. We want  │
│  to find your 'groan zone' — uncomfortable but doable.         │
│                                                                 │
│  Want to try a smaller version of the same thing? Or           │
│  something different?"                                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ Smaller version of the same thing                     │   │
│  │ ○ Something different                                   │   │
│  │ ○ I need to understand my resistance better first       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 3: Progress Mirror (After 5+ completions)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Pattern Share                                         │
├─────────────────────────────────────────────────────────────────┤
│  [Triggered when user opens Zarlo after reaching 5 groans]     │
│                                                                 │
│  Zarlo: "Hey — I've been watching your patterns.               │
│                                                                 │
│  You've completed ${groanCount} groans now. Here's what I      │
│  notice:                                                        │
│                                                                 │
│  🛡️ The ${topArchetype} shows up ${archetypePercent}% of      │
│  the time when you face challenges.                            │
│                                                                 │
│  👁️ Your most common fear trigger is '${topFear}'.            │
│                                                                 │
│  ${flowDirectionInsight}                                       │
│                                                                 │
│  Does this feel accurate?"                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ Yes, that's spot on                                   │   │
│  │ ○ Somewhat, but...                                      │   │
│  │ ○ Tell me more about what this means                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Routing Decision Tree

```javascript
// zarloEngine.js

export const determineNextAction = (userContext) => {
  const {
    hasCompletedNS,
    hasCompletedFlowFinder,
    primaryStruggle,
    groanCount,
    lastCompassDirection,
    hasUncompletedCommitment,
    daysSinceLastActivity
  } = userContext

  // Priority 1: Check uncommitted commitment
  if (hasUncompletedCommitment) {
    return { flow: 'accountability', step: 'check_commitment' }
  }

  // Priority 2: Burnout detection (South for 3+ days)
  if (lastCompassDirection === 'south' && daysSinceLastActivity <= 3) {
    return { flow: 'gentle_mode', step: 'acknowledge_drain' }
  }

  // Priority 3: Pattern milestone (5 groans)
  if (groanCount === 5 || groanCount === 10 || groanCount === 20) {
    return { flow: 'progress_mirror', step: 'share_patterns' }
  }

  // Priority 4: Route based on struggle
  switch (primaryStruggle) {
    case 'visibility':
    case 'starting_stopping':
      if (!hasCompletedNS) {
        return { route: '/nervous-system', message: 'ns_recommendation' }
      }
      return { route: '/healing-compass', message: 'healing_recommendation' }

    case 'unclear':
      if (!hasCompletedFlowFinder) {
        return { route: '/nikigai/skills', message: 'flowfinder_recommendation' }
      }
      return { route: '/7-day-challenge', message: 'challenge_recommendation' }

    case 'burnout':
      return { flow: 'gentle_mode', step: 'healing_focus' }

    case 'existing_project':
      return { route: '/existing-project', message: 'existing_recommendation' }

    default:
      return { flow: 'intake', step: 'welcome' }
  }
}
```

---

## Response Templates

```javascript
// zarloResponses.js

export const ZARLO_RESPONSES = {
  // Intake responses
  intake: {
    welcome: {
      message: `Hey! I'm Zarlo, your co-founder guide.

I'm not here to give you generic advice. I'm here to help you understand what's actually holding you back — and it's probably not what you think.

Quick question: What's the biggest thing stopping you from building the life and business you want?`,
      options: [
        { id: 'visibility', label: "I know what I want but can't get visible" },
        { id: 'starting_stopping', label: 'I keep starting and stopping' },
        { id: 'unclear', label: "I don't know what I should be building" },
        { id: 'burnout', label: "I'm burnt out and need to heal first" },
        { id: 'existing_project', label: "I have an existing project but I'm stuck" }
      ]
    }
  },

  // NS Thesis reframes by struggle type
  reframes: {
    visibility: {
      message: `Here's what most people don't realize:

That's not a courage problem. It's a safety problem.

Your nervous system has learned that being visible isn't safe. Maybe from a past experience where you put yourself out there and got hurt. So now it pulls you back every time you try to expand.

The good news? We can find exactly where your 'safe edge' is — and start expanding it.`,
      cta: 'Ready to map your nervous system?',
      route: '/nervous-system'
    },

    starting_stopping: {
      message: `Classic self-sabotage pattern. And here's the thing most people miss:

It's not a discipline problem. It's a safety problem.

Your nervous system is pulling you back because some part of you believes that success isn't safe. Maybe you'll outgrow people you love. Maybe you'll be exposed as a fraud. Maybe you'll lose something important.

Let's find out what your system is actually protecting you from.`,
      cta: 'Ready to discover your safety contracts?',
      route: '/nervous-system'
    },

    unclear: {
      message: `Not knowing what to build can feel paralyzing. But here's what I've noticed:

Sometimes "I don't know" is actually "I'm afraid to commit."

Let's take the pressure off. Instead of figuring out your life's purpose, let's just explore what you're naturally good at, what problems you actually care about solving, and who you'd love to help.

The clarity often comes through action, not thinking.`,
      cta: 'Ready to discover your natural flow?',
      route: '/nikigai/skills'
    },

    burnout: {
      message: `I hear you. Burnout isn't just tiredness — it's your system telling you something's been off for too long.

Here's what we're going to do differently:

Instead of pushing through, we're going to work WITH your nervous system. Gentle actions. Small wins. Rebuilding trust with yourself.

You don't have to earn rest. You don't have to be productive to be worthy. Let's just start where you are.`,
      cta: 'Ready to take it slow?',
      route: '/7-day-challenge?mode=gentle'
    },

    existing_project: {
      message: `Got it — you've already built something but you're stuck.

That's actually a great place to be. You have real experience to work with.

Let's capture what you've built, identify where you're hitting resistance, and find out what's really blocking the next level.

Often the block isn't strategic — it's nervous system.`,
      cta: 'Ready to capture your project?',
      route: '/existing-project'
    }
  },

  // Accountability responses
  accountability: {
    completed: {
      message: `That's huge! 🎉

Every time you do something that feels uncomfortable, you're teaching your nervous system that it's safe. That's how we expand.

What do you want to tackle next?`,
      options: [
        { id: 'quests', label: "Show me today's quests" },
        { id: 'commit', label: 'I want to set my next commitment' },
        { id: 'drained', label: "I'm feeling drained today" }
      ]
    },

    not_completed: {
      message: `No judgment — that's data.

When the time came to do it, what showed up for you?`,
      options: [
        { id: 'forgot', label: 'I forgot' },
        { id: 'resistance', label: 'I felt resistance and avoided it' },
        { id: 'life', label: 'Life got in the way' },
        { id: 'wrong', label: "I realized it wasn't the right thing" }
      ]
    },

    resistance_response: {
      message: `That resistance? That's your nervous system doing its job — protecting you from what it perceives as danger.

The commitment might have been too big of a stretch. We want to find your 'groan zone' — uncomfortable but doable.

Want to try a smaller version of the same thing? Or something different?`,
      options: [
        { id: 'smaller', label: 'Smaller version of the same thing' },
        { id: 'different', label: 'Something different' },
        { id: 'understand', label: 'I need to understand my resistance better first' }
      ]
    }
  },

  // Progress mirror templates
  progress: {
    five_groans: (data) => ({
      message: `Hey — I've been watching your patterns.

You've completed ${data.groanCount} groans now. Here's what I notice:

🛡️ The ${data.topArchetype} shows up ${data.archetypePercent}% of the time when you face challenges.

👁️ Your most common fear trigger is '${data.topFear}'.

${data.flowDirectionInsight}

Does this feel accurate?`,
      options: [
        { id: 'accurate', label: "Yes, that's spot on" },
        { id: 'somewhat', label: 'Somewhat, but...' },
        { id: 'explain', label: 'Tell me more about what this means' }
      ]
    })
  },

  // Archetype explanations
  archetypes: {
    ghost: `The Ghost wants to disappear — to avoid being seen at all costs. Often born from experiences where visibility led to criticism, rejection, or pain.`,
    people_pleaser: `The People Pleaser is terrified of disappointing others. It'll sacrifice your authentic voice to keep everyone comfortable.`,
    perfectionist: `The Perfectionist says "not yet" forever. It's a clever way to avoid the vulnerability of actually putting something out there.`,
    performer: `The Performer only shows the polished version. Behind it is usually a fear that the real you isn't enough.`,
    controller: `The Controller needs certainty before acting. But certainty is an illusion — and waiting for it keeps you stuck.`
  },

  // Flow direction insights
  flowInsights: {
    mostly_north: `Most of your groans land in the NORTH (flow + excited). You're in a good rhythm — keep pushing your edge.`,
    mostly_east: `A lot of your groans are in the EAST (challenged but excited). That's the growth zone. You're doing the hard work.`,
    mostly_south: `I notice many of your groans feel draining (SOUTH). Let's find challenges that stretch you WITHOUT depleting you.`,
    mostly_west: `You're often in the WEST (easy but tired). Maybe it's time for a bigger challenge — or maybe you need rest first.`,
    balanced: `Your energy is balanced across directions. You're tuned in to what you need.`
  }
}
```

---

## React Component: ZarloChat

```jsx
// ZarloChat.jsx

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { determineNextAction } from '../../lib/zarlo/zarloEngine'
import { ZARLO_RESPONSES } from '../../lib/zarlo/zarloResponses'
import ZarloMessage from './ZarloMessage'
import ZarloQuickReplies from './ZarloQuickReplies'
import './ZarloChat.css'

function ZarloChat({ onNavigate }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [currentOptions, setCurrentOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [zarloState, setZarloState] = useState(null)
  const messagesEndRef = useRef(null)

  // Load Zarlo state and determine first message
  useEffect(() => {
    loadZarloState()
  }, [user])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadZarloState = async () => {
    if (!user?.id) return

    try {
      // Get existing Zarlo conversation
      const { data: zarloData } = await supabase
        .from('zarlo_conversations')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Get user context for routing
      const userContext = await getUserContext()

      if (zarloData) {
        setZarloState(zarloData)
        // Check if returning user with uncommitted commitment
        if (zarloData.last_commitment && !zarloData.commitment_completed) {
          showAccountabilityFlow(zarloData.last_commitment)
        } else {
          // Determine next action based on context
          const action = determineNextAction(userContext)
          handleAction(action)
        }
      } else {
        // New user - start intake
        showIntakeFlow()
      }
    } catch (error) {
      console.error('Error loading Zarlo state:', error)
      showIntakeFlow()
    } finally {
      setLoading(false)
    }
  }

  const getUserContext = async () => {
    // Fetch relevant user data for routing decisions
    const [
      { data: nsData },
      { data: flowFinderData },
      { data: groanData },
      { data: compassData }
    ] = await Promise.all([
      supabase.from('nervous_system_responses').select('id').eq('user_id', user.id).limit(1),
      supabase.from('nikigai_clusters').select('id').eq('user_id', user.id).limit(1),
      supabase.from('quest_completions').select('id').eq('user_id', user.id).in('quest_category', ['Recognise', 'Rewire', 'Reconnect']),
      supabase.from('flow_entries').select('direction').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
    ])

    return {
      hasCompletedNS: nsData?.length > 0,
      hasCompletedFlowFinder: flowFinderData?.length > 0,
      groanCount: groanData?.length || 0,
      lastCompassDirection: compassData?.[0]?.direction,
      primaryStruggle: zarloState?.primary_struggle
    }
  }

  const showIntakeFlow = () => {
    const response = ZARLO_RESPONSES.intake.welcome
    addMessage('zarlo', response.message)
    setCurrentOptions(response.options)
  }

  const showAccountabilityFlow = (commitment) => {
    addMessage('zarlo', `Welcome back! Yesterday you said you'd:\n\n"${commitment}"\n\nDid you do it?`)
    setCurrentOptions([
      { id: 'yes', label: 'Yes, I did it!' },
      { id: 'partial', label: 'Partially' },
      { id: 'no', label: "No, I didn't" }
    ])
  }

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender,
      text,
      timestamp: new Date()
    }])
  }

  const handleOptionSelect = async (option) => {
    // Add user's selection as a message
    addMessage('user', option.label)
    setCurrentOptions([])

    // Process the response based on current flow
    await processResponse(option.id)
  }

  const processResponse = async (responseId) => {
    // This is where the routing magic happens
    // Based on current state and response, determine next message

    if (!zarloState?.primary_struggle) {
      // We're in intake - save the struggle and show reframe
      await saveZarloState({ primary_struggle: responseId })

      const reframe = ZARLO_RESPONSES.reframes[responseId]
      if (reframe) {
        // Slight delay for natural feel
        setTimeout(() => {
          addMessage('zarlo', reframe.message)
          setCurrentOptions([
            { id: 'go', label: reframe.cta, route: reframe.route },
            { id: 'more', label: 'Tell me more first' }
          ])
        }, 500)
      }
    } else if (responseId === 'go') {
      // User wants to proceed - navigate to the route
      const option = currentOptions.find(o => o.id === 'go')
      if (option?.route && onNavigate) {
        onNavigate(option.route)
      }
    }
    // ... handle other response types
  }

  const saveZarloState = async (updates) => {
    const newState = { ...zarloState, ...updates, updated_at: new Date() }

    if (zarloState?.id) {
      await supabase
        .from('zarlo_conversations')
        .update(updates)
        .eq('id', zarloState.id)
    } else {
      const { data } = await supabase
        .from('zarlo_conversations')
        .insert({ user_id: user.id, ...updates })
        .select()
        .single()
      newState.id = data?.id
    }

    setZarloState(newState)
  }

  const handleAction = (action) => {
    if (action.route) {
      // Show message with CTA to navigate
      const reframe = ZARLO_RESPONSES.reframes[zarloState?.primary_struggle]
      addMessage('zarlo', action.message || reframe?.message || "Ready for your next step?")
      setCurrentOptions([
        { id: 'go', label: 'Let\'s do it', route: action.route }
      ])
    } else if (action.flow) {
      // Handle internal flows (accountability, progress mirror, etc.)
      // ... implement based on flow type
    }
  }

  if (loading) {
    return (
      <div className="zarlo-chat zarlo-loading">
        <div className="zarlo-avatar">🤖</div>
        <span>Zarlo is thinking...</span>
      </div>
    )
  }

  return (
    <div className="zarlo-chat">
      <div className="zarlo-header">
        <div className="zarlo-avatar">🤖</div>
        <div className="zarlo-title">
          <h3>Zarlo</h3>
          <span className="zarlo-subtitle">Your co-founder guide</span>
        </div>
      </div>

      <div className="zarlo-messages">
        {messages.map(msg => (
          <ZarloMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {currentOptions.length > 0 && (
        <ZarloQuickReplies
          options={currentOptions}
          onSelect={handleOptionSelect}
        />
      )}
    </div>
  )
}

export default ZarloChat
```

---

## CSS Styling

```css
/* ZarloChat.css */

.zarlo-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.zarlo-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.zarlo-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.zarlo-title h3 {
  margin: 0;
  color: white;
  font-size: 18px;
}

.zarlo-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.zarlo-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Message bubbles */
.zarlo-message {
  max-width: 85%;
  padding: 14px 18px;
  border-radius: 18px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.zarlo-message.zarlo {
  background: rgba(102, 126, 234, 0.2);
  color: white;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

.zarlo-message.user {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

/* Quick reply buttons */
.zarlo-quick-replies {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.zarlo-quick-reply {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 14px 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 15px;
}

.zarlo-quick-reply:hover {
  background: rgba(102, 126, 234, 0.3);
  border-color: rgba(102, 126, 234, 0.5);
  transform: translateY(-1px);
}

.zarlo-quick-reply:active {
  transform: translateY(0);
}

/* Loading state */
.zarlo-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.zarlo-loading .zarlo-avatar {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## Entry Points

Zarlo should be accessible from:

1. **Floating Action Button** (always visible)
```jsx
// In App.jsx or layout
<ZarloFAB onClick={() => setShowZarlo(true)} />
```

2. **Dedicated Route**
```jsx
// In AppRouter.jsx
<Route path="/zarlo" element={<AuthGate><ZarloPage /></AuthGate>} />
```

3. **Home Page Integration**
```jsx
// In HomeFirstTime.jsx or App.jsx
{showZarloWelcome && <ZarloChat embedded />}
```

---

## Migration Path

```sql
-- Migration: 20250101_zarlo_conversations.sql

CREATE TABLE zarlo_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_flow TEXT,
  current_step TEXT,
  primary_struggle TEXT,
  secondary_context TEXT,
  last_commitment TEXT,
  last_commitment_date TIMESTAMP WITH TIME ZONE,
  commitment_completed BOOLEAN DEFAULT FALSE,
  messages_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_zarlo_user ON zarlo_conversations(user_id);

ALTER TABLE zarlo_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own Zarlo data"
  ON zarlo_conversations FOR ALL
  USING (auth.uid() = user_id);
```

---

## Build Checklist

- [ ] Create `zarlo_conversations` table + migration
- [ ] Create `ZarloChat.jsx` component
- [ ] Create `ZarloMessage.jsx` component
- [ ] Create `ZarloQuickReplies.jsx` component
- [ ] Create `zarloEngine.js` routing logic
- [ ] Create `zarloResponses.js` templates
- [ ] Create `ZarloChat.css` styling
- [ ] Add Zarlo FAB to main layout
- [ ] Add `/zarlo` route
- [ ] Test intake flow
- [ ] Test accountability flow
- [ ] Test progress mirror flow
- [ ] Connect navigation to existing flows

---

## Future Enhancements (v1.1+)

- **Voice input** - "Hey Zarlo" wake word
- **Daily push notification** - "Zarlo check-in"
- **Commitment reminders** - Time-based nudges
- **Pattern AI** - Claude-powered insights (v2)
- **Conversation history** - View past Zarlo conversations
