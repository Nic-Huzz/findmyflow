# AI Co-Founder Agent System

**Date:** December 27, 2024
**Status:** Architecture Design
**Author:** Nic + Claude (Flow Agent Architect)

---

## Overview

The AI Co-Founder is an intelligent agent layer that transforms FindMyFlow from a guided self-service app into an active partner in the user's business-building journey.

**Core Principle:** AI handles production. Human handles transformation.

The transformation happens in the moment of recognition, the approval decision, and the edge-push—not in typing reflections, filling forms, or formatting offers.

---

## The Framework

```
                    AI CO-FOUNDER
                         │
          ┌──────────────┴──────────────┐
          │                             │
      🔨 DOER                       👁️ ADVISOR
    "Let me do that"             "I noticed this"
          │                             │
    ┌─────┴─────┐               ┌───────┴───────┐
    │           │               │               │
 BUSINESS    ADMIN          HEALING      ACCOUNTABILITY
  ACTION    ACTION          PATTERNS       PATTERNS
    │           │               │               │
 • Offers    • Compass       • Burnout      • Stalls
 • Copy      • Logging       • Fears        • Skips
 • Surveys   • Streaks       • Triggers     • Avoidance
 • Drafts    • Check-ins     • Blocks       • Momentum
```

### Two Core Functions

| Function | Purpose | Output |
|----------|---------|--------|
| **DOER** | Takes business and admin actions on behalf of user | Artifacts (drafts, entries, surveys) |
| **ADVISOR** | Identifies patterns and recommends action | Insights + Nudges |

### Compass Calibration

Both functions respond differently based on user's current energy state:

| Compass State | Doer Response | Advisor Response |
|---------------|---------------|------------------|
| **North (Flow)** | "You're hot. Here's your drafted Upsell - strike now." | "Momentum locked in. Day 4 streak. Keep building." |
| **East (Redirect)** | "Resistance but energy. Let me draft that scary post for you." | "You're avoiding the visibility quest. That's the one." |
| **South (Rest)** | "I'll handle Compass logs. You breathe." | "Three South days. Rest Protocol activated. No shame." |
| **West (Honour)** | "Light load today. One 2-tap check-in, that's it." | "You're coasting. That's okay. Refill before you push." |

---

## DOER Agents

These agents take action—generating, completing, and producing on behalf of the user.

### 1. OFFER ARCHITECT

**Purpose:** Generate complete Money Model drafts from cluster data

**Inputs:**
- `nikigai_clusters` (skills, problems, persona)
- Completed assessment responses
- User's voice/tone from previous entries

**Outputs:**
- Full Attraction Offer draft (headline, bullets, price anchor, CTA)
- Upsell sequence (what, why now, price)
- Downsell pivot (reduced scope, maintained value)
- Continuity model (subscription framing)

**Trigger:** User reaches Stage 4 (Money Models), or explicit request

**UX Flow:**
```
User reaches Money Model stage →
  "I've drafted your Attraction Offer based on your Flow Finder data" →
    Full preview in editor →
      Section-by-section approval →
        Export to Notion/Doc/PDF
```

---

### 2. DRAFT DEMON

**Purpose:** Pre-complete text-based quests with drafts ready to approve

**What it drafts:**
- Groan reflections (based on Pattern Mirror's detected themes)
- Money Model copy (Attraction Offer, Upsell hooks, Downsell pivots)
- Lead Magnet outlines
- Validation survey questions

**Inputs:**
- `groan_reflections` history
- `flow_entries` recent patterns
- Pattern Mirror insights
- Quest type and requirements

**Outputs:**
- Ready-to-approve draft
- Edit suggestions
- Confidence score

**Trigger:** Quest becomes available in 7-Day Challenge

**UX Flow:**
```
User opens Quest Card →
  "Draft ready" badge visible →
    Tap to see AI draft →
      [Approve] [Edit] [Start Fresh]
```

**Example Output (Groan Quest):**
```
Based on your last 3 South days and the visibility pattern I've noticed:

DRAFT REFLECTION:
"The resistance today is about being seen again. Part of me says 'you're
not ready to put that offer out.' But I think it's the same voice that
said that 6 months ago. It's protecting me from rejection. The truth is:
I've already been rejected. I survived. This voice is fighting the last war."

[Looks Right] [Edit This] [Write My Own]
```

---

### 3. COMPASS AUTOPILOT

**Purpose:** Log Compass entries with minimal friction

**How it works:**
- Morning: "Quick check - excited or tired today?" (2 taps)
- Evening: "How'd the business flow? Ease or resistance?" (2 taps)
- Agent logs full entry with inferred direction
- User can expand to add headline/comment or just approve

**Inputs:**
- 2-tap responses (internal state, external state)
- Time of day
- Recent activity patterns
- Calendar data (future enhancement)

**Outputs:**
- Complete `flow_entries` record
- Direction inference
- Optional headline suggestion

**Trigger:** Daily at user's typical engagement time, or 36hr activity gap

**UX Flow:**
```
Push notification or app open →
  2-tap check-in widget →
    Agent logs entry →
      "Logged as East (Redirect). Add context?" →
        [Done] [Add Note]
```

**Impact:** Reduces 60-second Compass entry to 5-second confirmation

---

### 4. VALIDATION SCOUT

**Purpose:** Generate and distribute validation surveys

**What it does:**
- Generates survey questions based on persona + problem clusters
- Creates shareable link (existing `/v/:shareToken` infrastructure)
- Drafts outreach message for user to send
- Summarizes responses as they come in

**Inputs:**
- `nikigai_clusters` (persona, problems)
- `persona_profiles` data
- Stage 1 requirements

**Outputs:**
- 5-7 validation questions
- Shareable survey link
- Outreach message template
- Response summary (as responses arrive)

**Trigger:** Stage 1 (Validation), user request

**UX Flow:**
```
Stage 1 (Validation) quest appears →
  "Generate my validation survey" button →
    Agent creates 5-7 questions →
      User approves/edits →
        Link generated + outreach message drafted →
          "Copy message" → Send via their channel
```

---

### 5. CLUSTER ENRICHER

**Purpose:** Continuously improve Flow Finder cluster quality

**What it does:**
- Analyzes conversation logs and reflections for new skill/problem signals
- Suggests additions to existing clusters
- Identifies gaps in cluster coverage
- Proposes cluster merges or splits

**Inputs:**
- `nikigai_clusters` current state
- `groan_reflections` text
- `conversation_logs` if available
- Money Model assessment responses

**Outputs:**
- Suggested new cluster entries
- Gap analysis
- Enrichment confidence scores

**Trigger:** Weekly batch, or after significant new content

---

## ADVISOR Agents

These agents observe, analyze, and recommend—surfacing insights and nudging action.

### 1. LIFE QUAKE AGENT

**Purpose:** Detect burnout spirals before they become quit events

**What it sees:**
- 3+ South Compass entries in 7 days
- Quest completion frequency drops
- Groan reflection sentiment (fear/exhaustion themes)

**What it recommends:**
- Rest Protocol activation (lighter quest load)
- Healing Compass trigger
- Human check-in flag (for severe cases)

**Inputs:**
- `flow_entries` where direction = 'south' (last 7 days)
- `quest_completions` frequency delta
- `groan_reflections` sentiment analysis

**Outputs:**
```json
{
  "risk_level": "LOW|MEDIUM|HIGH",
  "south_count": 4,
  "pattern_note": "4 South entries in 5 days. Quest completions dropped 80%.",
  "intervention": {
    "type": "REST_PROTOCOL",
    "notification_message": "Your Compass has been pointing South...",
    "suggested_quests": ["rest_reflection", "one_small_win"],
    "healing_flow_nudge": true
  }
}
```

**Chain Potential:**
```
South Spiral Detected → Rest Protocol Quests → Healing Compass Trigger →
Nervous System Flow Nudge → Recovery North Entry → Celebration + Streak Reset
```

---

### 2. PATTERN MIRROR AGENT

**Purpose:** Surface recurring protective voice themes the user can't see

**What it sees:**
- VISIBILITY_FEAR: "people will judge", "who am I to"
- PRICING_FEAR: "too expensive", "not worth it"
- IMPOSTER: "not qualified", "fraud"
- PERFECTIONISM: "not ready", "needs more work"
- ABANDONMENT: "they'll leave", "rejection"
- OVERWHELM: "too much", "drowning"

**What it recommends:**
- Targeted Rewire quest
- Personalized affirmation
- Pattern insight summary

**Inputs:**
- `groan_reflections` text (all historical)
- `nervous_system_responses` themes
- `healing_compass_responses` patterns

**Outputs:**
```json
{
  "entries_analyzed": 8,
  "primary_pattern": {
    "theme": "VISIBILITY_FEAR",
    "frequency": "5 of 8 entries",
    "sample_quotes": ["What if they think I'm showing off?"],
    "insight": "Your protective voice has a clear message: visibility feels dangerous..."
  },
  "suggested_action": {
    "quest_type": "REWIRE",
    "custom_prompt": "Today's edge: One tiny act of visibility...",
    "affirmation": "Your fear of visibility is proof you have something worth seeing."
  }
}
```

**Chain Potential:**
```
Pattern Detected (visibility fear) → Targeted Rewire Quest →
Healing Compass Deep Dive → Nervous System Reframe →
Money Model Pricing Courage Boost
```

---

### 3. STAGE MOMENTUM AGENT

**Purpose:** Prevent silent stalls, keep forward motion

**What it sees:**
- Days at same stage with low quest completion
- Milestone gaps
- Avoidance patterns (starting quests, not finishing)

**What it recommends:**
- Blocker diagnosis micro-flow
- Smallest viable next action
- Stage skip permission (if appropriate)

**Inputs:**
- `user_projects.current_stage` + `updated_at`
- `quest_completions` count per stage
- `milestone_completions` gaps

**Outputs:**
```json
{
  "stall_detected": true,
  "days_at_stage": 14,
  "quest_completion_rate": 0.2,
  "likely_blocker": "validation_fear",
  "intervention": {
    "day_7_message": "You've been in Validation for a week. Here's the ONE thing...",
    "day_14_action": "stage_breakthrough_microflow",
    "smallest_action": "Send survey to ONE person today"
  }
}
```

---

### 4. STREAK GUARDIAN AGENT

**Purpose:** Intervene at the cliff before the fall

**What it sees:**
- Current streak length
- Hours since last activity
- Typical engagement time patterns
- Proximity to personal records

**What it recommends:**
- Timed nudge at optimal moment
- Micro-quest to maintain streak
- Recovery welcome after break

**Inputs:**
- `challenge_instances` streak data
- `quest_completions` timestamps
- User's typical engagement time

**Outputs:**
```json
{
  "streak_status": "AT_RISK",
  "current_streak": 5,
  "longest_streak": 6,
  "hours_since_activity": 38,
  "optimal_nudge_time": "09:30",
  "intervention": {
    "type": "NUDGE",
    "message": "Day 5. One away from your longest streak. 2 minutes.",
    "micro_quest": "compass_checkin_only"
  }
}
```

---

### 5. VALUE LADDER AGENT

**Purpose:** Spot cross-sell and upsell moments from behavior

**What it sees:**
- Money Model completion gaps (Upsell skipped, Continuity ignored)
- Stage progression speed (fast = high intent)
- Engagement depth (North frequency = confidence)

**What it recommends:**
- Contextual cross-sell prompts
- Bundle suggestions
- Premium readiness signals (retreat, cohort, 1:1)

**Inputs:**
- `*_assessments` completion status
- Stage progression velocity
- `flow_entries` momentum signals

**Outputs:**
```json
{
  "completion_gaps": ["upsell", "continuity"],
  "progression_speed": "fast",
  "engagement_level": "high",
  "recommendations": [
    {
      "type": "cross_sell",
      "target": "upsell_flow",
      "message": "You built your Attraction Offer. 73% of successful launches include an Upsell."
    },
    {
      "type": "premium_signal",
      "readiness": 0.85,
      "suggestion": "Candidate for cohort upsell"
    }
  ]
}
```

---

### 6. VIBE CALIBRATOR AGENT

**Purpose:** Match content intensity to user readiness

**What it sees:**
- Persona type vs current stage mismatch
- Cluster richness vs stage requirements
- Confidence signals from Compass patterns

**What it recommends:**
- Pathway adjustments
- Skip permissions
- Intensity modifications

**Inputs:**
- `user_stage_progress.persona`
- Current stage vs persona typical progression
- `flow_entries` confidence signals
- `nikigai_clusters` richness score

**Outputs:**
```json
{
  "persona": "vibe_seeker",
  "current_stage": 4,
  "mismatch_detected": true,
  "recommendation": {
    "type": "slow_down",
    "message": "Before Money Models, let's solidify your Attraction Offer foundation.",
    "suggested_action": "cluster_enrichment_flow"
  }
}
```

---

### 7. PATTERN INSIGHT CARD AGENT

**Purpose:** Display personalized, actionable insights on the Groans Summary page

**What it sees:**
- Fear distribution across completions
- Layer progression (SCREEN → LIVE → TRIBE → MONEY → HEART)
- Area coverage (Work, Self, Family, etc.)
- Essence/Protective voice balance
- Comfort zone patterns (repeated fear + layer combos)

**Pattern Detection Rules:**

| Pattern | Trigger | Example Output |
|---------|---------|----------------|
| Fear Avoidance | One fear < 10% while others > 30% | "You face 'Judged' fears often but avoid 'Might Fail' - consider pushing into failure territory" |
| Layer Plateau | Stuck at one layer for 3+ weeks | "You're comfortable at SCREEN level - ready to try a LIVE challenge?" |
| Area Blind Spot | One area at 0% with 5+ total groans | "Work and Self show up often, but Family hasn't appeared - worth exploring?" |
| Voice Imbalance | Essence or Protective > 80% | "You're very connected to your Essence - don't forget to acknowledge your Protective voice too" |
| Comfort Zone | Same fear + layer combo 3+ times | "You keep facing 'Judged' at SCREEN level - time to level up?" |
| Growth Celebration | New layer conquered | "You just conquered your first TRIBE challenge! How did it feel?" |

**Inputs:**
- `quest_completions` with `response_data` (fear, layer, area, outcome)
- `groan_reflections` aggregated stats
- Calculated percentages per category

**Outputs:**
```json
{
  "pattern_type": "FEAR_AVOIDANCE|LAYER_PLATEAU|AREA_BLIND_SPOT|...",
  "insight_card": {
    "headline": "<short attention-grabbing headline>",
    "body": "<2-3 sentence insight>",
    "suggested_action": "<specific next step>",
    "cta_label": "Try This"
  },
  "confidence": 0.85,
  "data_points_used": 12
}
```

**Trigger:** On Groans Summary page load, cached daily

**Technical Approach:**
- **Phase 1**: Rule-based pattern detection (no AI needed)
- **Phase 2**: AI-generated natural language using Claude Haiku
- **Fallback**: If no strong pattern detected, show encouragement or tip

**Minimum Data Required:** 5+ groan completions for meaningful patterns

---

### 8. FEAR PATTERN INSIGHTS AGENT

**Purpose:** Deep analysis of fear avoidance vs. confrontation patterns over time

**What it sees:**
- Which fears user consistently faces vs. avoids
- Layer progression over weeks/months
- Outcome patterns (better/expected/harder) by fear type
- Blind spots in fear categories

**Inputs:**
- `quest_completions` - All groan-related completions (4+ weeks history)
- `groan_reflections` - Fear selections, layer choices, outcomes
- `weekly_plans` - Weekly groan selections and completion status

**Outputs:**
```json
{
  "analysis_period": "4 weeks",
  "entries_analyzed": 28,
  "fear_avoidance_pattern": {
    "frequently_faced": [
      {"fear": "Judged", "count": 7, "success_rate": 0.85}
    ],
    "consistently_avoided": [
      {"fear": "Might Fail", "count": 1, "last_attempted": "3 weeks ago"}
    ],
    "insight": "You frequently confront 'Judged' fears but tend to avoid 'Might Fail' situations. This might indicate underlying perfectionism."
  },
  "layer_comfort_zone": {
    "comfortable_layers": ["SCREEN", "LIVE"],
    "unexplored_layers": ["TRIBE", "MONEY", "HEART"],
    "insight": "You're comfortable at SCREEN and LIVE levels but haven't ventured into TRIBE, MONEY, or HEART visibility layers yet."
  },
  "growth_edges": [
    "Try a groan challenge involving your inner circle (TRIBE level)",
    "Pick a task with potential for failure, not just judgment",
    "Consider a money-related visibility challenge when ready"
  ],
  "blind_spot_alert": "No 'Not Enough' fears logged in 6 weeks - either you've mastered this fear, or it might be worth exploring why you avoid it."
}
```

**Trigger:** Auto-generate after 4+ weeks of groan data, refresh weekly

**Location:** Groans Summary page → "Deep Insights" expandable section

**Minimum Data Required:** 4 weeks of consistent groan completions (12+ entries recommended)

---

### 9. SMART GROAN SUGGESTIONS AGENT

**Purpose:** Recommend optimal next groan challenge based on NS calibration + history

**What it sees:**
- Nervous System visibility boundary (current safe edge)
- Recent groan outcomes (better/expected/harder trends)
- Current week type (Push/Flow/Rest/Launch)
- Streak status and momentum
- Pattern Mirror's detected themes

**Algorithm:**
```
1. Get user's NS visibility boundary (e.g., stuck at LIVE level)
2. Get their most recent groan outcomes (better/expected/harder)
3. Factor in current week type:
   - Push Week → suggest next layer up
   - Flow Week → suggest comfort zone + slight stretch
   - Rest Week → suggest easiest layer
   - Launch Week → suggest whatever supports launch goals
4. Consider streak:
   - Long streak → can handle bigger push
   - Streak at risk → suggest achievable win
5. Factor in Pattern Mirror themes:
   - If visibility fear dominant → prioritize visibility groans
   - If pricing fear dominant → prioritize money-related groans
6. Generate 2-3 suggestions ranked by fit
```

**Inputs:**
- `nervous_system_responses` - Visibility boundaries, earning limits, safety contracts
- `groan_reflections` - Past outcomes and intensity ratings
- `weekly_plans` - Current week type
- `challenge_instances` - Streak data
- `pattern_insights` - Detected fear patterns

**Outputs:**
```json
{
  "recommended": {
    "challenge_description": "Post a vulnerable reflection on social media",
    "layer": "SCREEN",
    "fear_type": "Judged",
    "fit_score": 0.92,
    "reasoning": [
      "Your week type is FLOW (moderate push)",
      "You've successfully completed 3 SCREEN challenges",
      "Your NS data shows LIVE is your current edge",
      "This builds momentum without overwhelming"
    ]
  },
  "alternatives": [
    {
      "challenge_description": "Ask for feedback from a colleague",
      "layer": "TRIBE",
      "fear_type": "Judged",
      "fit_score": 0.78,
      "tag": "Bigger stretch"
    },
    {
      "challenge_description": "Share a behind-the-scenes story",
      "layer": "SCREEN",
      "fear_type": "Not Enough",
      "fit_score": 0.85,
      "tag": "Easier win"
    }
  ],
  "stretch_option": {
    "challenge_description": "Go live on Instagram for 5 minutes",
    "layer": "LIVE",
    "fear_type": "Judged",
    "note": "This would push your visibility boundary by one level"
  }
}
```

**Trigger:** When user opens Weekly Planning Flow or Groans tab

**Integration Points:**
1. **Weekly Planning Flow** - Show during groan selection step
2. **Groans Tab** - "Suggested for You" section at top
3. **Push Notifications** - "This week's groan suggestion"

**Minimum Data Required:**
- Basic suggestions: 3+ groan completions
- Personalized suggestions: NS calibration completed + 5+ groan completions
- Optimal suggestions: NS calibration + 4 weeks history + weekly plan active

---

## Zarlo: The Orchestration Layer

Zarlo is the conversational interface that unifies all agents. Users don't think about "which agent"—they talk to Zarlo.

### Zarlo's Role

```
User: "I'm stuck"
        │
        ▼
    ┌───────────┐
    │  ALFRED   │
    └─────┬─────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
 ADVISOR:    DOER:
 "Stage Momentum  "Here's the ONE
  sees 12-day     action drafted.
  stall. Blocker  Approve and it's
  is validation   done."
  fear."
```

### Zarlo's Voice

Zarlo combines Doer and Advisor into natural conversation:

> "You've been in Product Creation for 12 days. I think the blocker is validation fear—your last 3 Groans mentioned 'what if they don't want it.'
>
> Here's what I can do: I've drafted a 5-question validation survey based on your persona cluster. Takes 2 minutes to review. Want to see it?
>
> Or if you need space first, I can switch you to Rest Protocol and we revisit Thursday."

### Zarlo Behaviors by Compass State

| State | Zarlo's Approach |
|-------|-------------------|
| **North** | Aggressive Doer, cheerleading Advisor. "Let's ship." |
| **East** | Drafts the scary thing, calls out avoidance. "This is the edge." |
| **South** | Handles logistics, protects energy. "I've got the small stuff." |
| **West** | Stays quiet, validates rest. "Refilling is work too." |

---

## UX Integration

### Recommended: The Zarlo Layer

A persistent chat interface accessible from anywhere in the app.

**Where it lives:**
- Floating action button (bottom right) → opens chat drawer
- Full page at `/alfred`
- Morning Brief notification leads here

**Interface:**
```
┌─────────────────────────────────────────┐
│  Zarlo                            ✕    │
├─────────────────────────────────────────┤
│                                         │
│  Morning! You've got 3 quests today.    │
│  I've drafted 2 of them:                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ✏️ Groan Reflection (Draft Ready)│    │
│  │ [Review Draft]                   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🧭 Compass Log (2-tap ready)     │    │
│  │ Excited or Tired? [🔥] [😴]      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🎯 Validation Survey             │    │
│  │ [Generate Questions]             │    │
│  └─────────────────────────────────┘    │
│                                         │
├─────────────────────────────────────────┤
│  Type a message...              [Send]  │
└─────────────────────────────────────────┘
```

### Quest Card Enhancement

Each Quest Card gets contextual AI options:

```
┌─────────────────────────────────────┐
│ 🔥 Daily Groan: Recognise           │
│ Identify the protective voice       │
│                                     │
│ ┌─────────────┐  ┌───────────────┐  │
│ │ Start Quest │  │ 🤖 Draft for Me│  │
│ └─────────────┘  └───────────────┘  │
│                                     │
│ ⚡ AI draft based on your patterns  │
└─────────────────────────────────────┘
```

### Morning Brief

Daily summary showing overnight agent activity:

```
┌─────────────────────────────────────┐
│  ☀️ Your Morning Brief              │
│  December 28, 2024                  │
├─────────────────────────────────────┤
│                                     │
│  OVERNIGHT WORK:                    │
│  ✅ Compass logged (inferred East)  │
│  ✅ Pattern detected: Visibility x3 │
│  📝 Groan draft ready for review    │
│                                     │
│  TODAY'S FOCUS:                     │
│  → Review Groan draft (2 min)       │
│  → Validation Survey ready to send  │
│  → Day 6 of streak 🔥               │
│                                     │
│  [Open Dashboard]  [Talk to Zarlo] │
└─────────────────────────────────────┘
```

---

## Implementation Priority

### Flywheel Ranking

Prioritized by: Data Generation → WOM Trigger → Premium Upsell Signal

| Rank | Agent | Rationale | Min Data |
|------|-------|-----------|----------|
| 1 | **Life Quake** | Saves users at breaking point. Recovery stories = best WOM. | 3 days Compass |
| 2 | **Pattern Insight Card** | Immediate value on Groans Summary. Rule-based = no AI cost. | 5 groans |
| 3 | **Streak Guardian** | Retention = everything for early metrics. Easy win. | 1 day activity |
| 4 | **Compass Autopilot** | Reduces friction dramatically. Enables daily engagement. | None |
| 5 | **Smart Groan Suggestions** | Guides next action. Works with minimal data, improves with more. | 3 groans (basic) |
| 6 | **Pattern Mirror** | Creates "holy shit" moments. Natural retreat/premium upsell. | 5+ groans |
| 7 | **Draft Demon** | Removes busywork. Users get to transformation faster. | Pattern data |
| 8 | **Fear Pattern Insights** | Deep analysis but needs history. High value for engaged users. | 4 weeks (12+ groans) |
| 9 | **Stage Momentum** | Prevents silent churn. Moving users refer. | 7 days at stage |
| 10 | **Value Ladder** | Direct revenue. But needs upstream agents working first. | Stage 4+ |
| 11 | **Offer Architect** | High value but Stage 4+ only. Smaller initial audience. | Clusters + Stage 4 |

### Bali Beta Stack

**Phase 1 (Immediate - works with minimal data):**
1. Life Quake Agent (burnout detection) - 3 days Compass
2. Streak Guardian Agent (retention) - 1 day
3. Compass Autopilot (2-tap logging) - None
4. Pattern Insight Card (rule-based) - 5 groans

**Phase 2 (Post-validation - needs some history):**
5. Smart Groan Suggestions (basic → personalized) - 3-5 groans + NS
6. Pattern Mirror Agent (insight generation) - 5+ groans
7. Draft Demon (quest pre-completion) - Pattern data available
8. Zarlo chat interface - Orchestrates above

**Phase 3 (Scale - needs 4+ weeks data):**
9. Fear Pattern Insights (deep analysis) - 4 weeks / 12+ groans
10. Offer Architect (Money Model generation) - Stage 4+
11. Validation Scout (survey automation) - Stage 1
12. Full Morning Brief experience - All agents operational

---

## Agent Prompts

### Life Quake Agent Prompt

```
You are the Life Quake Agent for FindMyFlow. Your mission: catch humans before they fall.

CONTEXT:
You monitor flow_entries (Compass logs) and quest_completions for signs of burnout spirals. A "South" direction means Resistance + Tired. Three or more South entries in 7 days is a Life Quake signal.

INPUTS YOU RECEIVE:
- User's flow_entries from last 7 days (direction, logged_at, activity_description)
- Quest completion count last 7 days vs previous 7 days
- Most recent groan_reflections (if any)

YOUR TASK:
1. Assess burnout risk: LOW (0-1 South) / MEDIUM (2 South) / HIGH (3+ South)
2. If MEDIUM or HIGH, generate intervention

OUTPUT FORMAT:
{
  "risk_level": "LOW|MEDIUM|HIGH",
  "south_count": <number>,
  "pattern_note": "<what you observe>",
  "intervention": {
    "type": "REST_PROTOCOL|HUMAN_FLAG|NONE",
    "notification_message": "<warm, human message - no toxic positivity>",
    "suggested_quests": ["<lighter quest ids>"],
    "healing_flow_nudge": true|false
  }
}

VOICE GUIDELINES:
- Never say "just" or minimize their experience
- South is data, not failure - say this explicitly
- Paint the path back to North without toxic positivity
- Honor the resistance - it's protecting something
- You're not fixing them. You're witnessing them.
```

### Pattern Mirror Agent Prompt

```
You are the Pattern Mirror Agent for FindMyFlow. Your mission: show humans what they can't see.

CONTEXT:
Users write groan_reflections capturing their protective voices - the fears, doubts, and resistance that surface when they push edges. These patterns repeat, but users rarely notice. You find the signal in the noise.

INPUTS YOU RECEIVE:
- All groan_reflections for this user (text, created_at, quest context)
- nervous_system_responses if available
- healing_compass_responses if available

YOUR TASK:
1. Analyze text for recurring themes across entries
2. Identify the TOP pattern (most frequent protective voice)
3. Generate insight that creates recognition, not shame

THEME CATEGORIES TO DETECT:
- VISIBILITY_FEAR: "people will judge", "who am I to", "what if they see"
- PRICING_FEAR: "too expensive", "not worth it", "they won't pay"
- IMPOSTER: "not qualified", "others are better", "fraud"
- PERFECTIONISM: "not ready", "needs more work", "what if it fails"
- ABANDONMENT: "they'll leave", "won't stick around", "rejection"
- OVERWHELM: "too much", "can't handle", "drowning"

OUTPUT FORMAT:
{
  "entries_analyzed": <number>,
  "primary_pattern": {
    "theme": "<THEME_CATEGORY>",
    "frequency": "<X of Y entries>",
    "sample_quotes": ["<direct quotes showing pattern>"],
    "insight": "<2-3 sentence recognition of the pattern>"
  },
  "secondary_pattern": { ... } | null,
  "suggested_action": {
    "quest_type": "REWIRE|RELEASE|RECOGNISE",
    "custom_prompt": "<personalized quest prompt based on their specific pattern>",
    "affirmation": "<reframe of their fear into strength>"
  }
}

VOICE GUIDELINES:
- Pattern recognition should feel like being SEEN, not analyzed
- Use their own words back to them
- The pattern isn't the enemy - it's a protector that's overworking
- Invite curiosity, not combat
- "You're not broken, you're seeing clearly"
```

### Streak Guardian Agent Prompt

```
You are the Streak Guardian Agent for FindMyFlow. Your mission: protect momentum at the cliff edge.

CONTEXT:
Users build streaks through daily quest completions. The Day 5-6 cliff is where most streaks die - not from failure, but from forgetting. You intervene before the fall, and you welcome them back when it happens.

INPUTS YOU RECEIVE:
- challenge_instances data (current_streak, longest_streak, last_activity)
- quest_completions with timestamps
- User's typical engagement time (derived from historical patterns)
- Hours since last activity

YOUR TASK:
1. Assess streak status: SAFE / AT_RISK / BROKEN
2. Generate appropriate intervention

STREAK LOGIC:
- SAFE: Active within 20 hours, streak intact
- AT_RISK: 20-44 hours since activity, streak still valid but vulnerable
- BROKEN: 44+ hours, streak has reset

OUTPUT FORMAT:
{
  "streak_status": "SAFE|AT_RISK|BROKEN",
  "current_streak": <number>,
  "longest_streak": <number>,
  "hours_since_activity": <number>,
  "optimal_nudge_time": "<HH:MM in user timezone>",
  "intervention": {
    "type": "NONE|NUDGE|RECOVERY",
    "message": "<contextual message>",
    "micro_quest": "<smallest possible action to maintain/restart>"
  }
}

VOICE GUIDELINES:
- AT_RISK: Urgent but not guilt-inducing. "You're close" energy.
- BROKEN: Zero shame. "Streaks reset. You don't." energy.
- Celebrate proximity to personal records
- Make the ask TINY - "5 minutes" or "one reflection"
- Never imply they failed. Life happened.
```

---

## AI-First Build Checklist

Proven playbook from Pirate Eddie (20k+ convos, pre-selling Academy Founding subs). This turns Zarlo + Doers/Advisors into a transformation machine.

### Week 1: Intellectual Capital Audit

**Goal:** Index EVERYTHING. No index = no flywheel.

| Content Type | Examples | Importance Score |
|--------------|----------|------------------|
| **POV Rants/Frameworks** | EAR manifesto, quit-app rejection, "South is data not failure" | 10/10 |
| **Flow Data** | Compass patterns, 7-Day quest structures, Money Model sequences | 9/10 |
| **Healing Frameworks** | Nervous System boundaries, Groan categories, Protective voice patterns | 9/10 |
| **Beta Conversations** | Bali beta transcripts, support chats, breakthrough moments | 8/10 |
| **Stage Progressions** | 6-stage logic, graduation requirements, persona pathways | 8/10 |
| **Hormozi Frameworks** | $100M Offers adaptations, Value Ladder logic | 7/10 |
| **Generic Onboarding** | Welcome screens, basic instructions | 3/10 |

**Action Items:**
- [ ] Export all `groan_reflections`, `flow_entries`, `nikigai_clusters` to indexable format
- [ ] Document every Flow Finder prompt, Money Model question sequence
- [ ] Transcribe/summarize Bali beta breakthrough moments
- [ ] Create Airtable/spreadsheet: title, date, citation URL, importance score (1-10)

---

### Day 2: Upload + Weight Ruthlessly

**Goal:** Pipe to Claude/Supabase with smart weighting.

**High Priority (Boost Scores):**
- "Three South days → healing protocol" pattern
- Visibility fear → Rewire quest chain
- Streak cliff → recovery intervention
- Stage stall → blocker diagnosis

**Lower Priority:**
- Generic welcome copy
- Basic navigation instructions
- Boilerplate legal/support

**Technical Setup:**
```javascript
// Example weighting structure for RAG
const docWeights = {
  'ear_manifesto': 1.0,
  'compass_patterns': 0.95,
  'groan_categories': 0.9,
  'stage_progressions': 0.85,
  'hormozi_frameworks': 0.8,
  'beta_transcripts': 0.75,
  'generic_onboarding': 0.3
}
```

---

### Day 3: Vibe-Create System Prompt

**Goal:** Zarlo's soul in one prompt.

**Core Zarlo System Prompt:**
```
You are Zarlo, the AI Co-Founder of FindMyFlow.

MISSION:
Help burnt-out professionals build businesses around their natural strengths.
Reject quit apps. Paint mission freedom. Honor the journey.

FRAMEWORK - EAR:
- Empathy: Meet them where they are (Compass state)
- Autonomy: They choose the path, you illuminate options
- Relatedness: You're a co-founder, not a coach. In it together.

BEHAVIOR:
- Chain Doers (draft offers, complete quests) to Advisors (spot patterns, reframe blocks)
- Calibrate intensity to Compass: North = aggressive, South = protective
- Never toxic positivity. South is data, not failure.
- Call out avoidance with love. "That's the edge" energy.

VOICE:
- Direct, warm, co-founder energy
- Use their words back to them
- Celebrate small wins genuinely
- Challenge comfort zones without shame

CHAIN LOGIC:
Compass South detected → Life Quake assessment → Rest Protocol OR Healing nudge
Pattern detected → Mirror insight → Targeted quest → Affirmation
Stage stall → Blocker diagnosis → Smallest viable action → Momentum restored
```

**Test Prompt (Run as Super User):**
```
Input: "Corporate resistance is killing me. I know I need to post but I can't."

Expected Zarlo Response:
- Acknowledge the resistance (not dismiss it)
- Identify pattern (visibility fear likely)
- Offer Doer action (draft the post for them?)
- Advisor reframe (this IS the edge)
- Chain to relevant quest
- Upsell signal if appropriate (premium support?)
```

**Tuning Questions:**
- Does it sound like a co-founder or a chatbot?
- Does it reject quit-app energy?
- Does it calibrate to their state?
- Does it chain Doer → Advisor naturally?

---

### Week 1: Test Like a Founding Sub

**Goal:** Stress-test with real Bali beta scenarios.

**10 Test Scenarios:**

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| 1 | "Compass has been East for 5 days straight" | Acknowledge momentum + resistance. Offer to draft the scary thing. |
| 2 | "I don't know what to charge" | Pattern Mirror for pricing fear. Offer Architect draft. Value Ladder context. |
| 3 | "Everything feels heavy today" | Life Quake check. Rest Protocol if South. No productivity push. |
| 4 | "My validation survey got no responses" | Reframe (data, not failure). Scout new outreach. Stage Momentum micro-action. |
| 5 | "I've been stuck in Stage 2 for weeks" | Blocker diagnosis. Smallest viable action. Permission to skip if needed. |
| 6 | "Write my upsell offer" | Offer Architect activates. Uses cluster data. Drafts full copy. |
| 7 | "I keep avoiding the visibility quest" | Pattern Mirror (visibility fear). "That's the one." Offer to draft post. |
| 8 | "Broke my 6-day streak" | Streak Guardian recovery. Zero shame. "Streaks reset. You don't." |
| 9 | "What's the point of all this?" | EAR reframe. Mission freedom painting. Connect to their WHY from clusters. |
| 10 | "I'm ready to launch" | Celebrate. Value Ladder check (all models done?). Premium signal assessment. |

**Tuning Protocol:**
- Off-voice? → Reweight source docs
- Hallucinating? → Add more raw examples
- Too generic? → Boost POV content scores
- Missing chains? → Add explicit Doer→Advisor logic

---

### Week 2: FAQ Swarm Automation

**Goal:** Extract and automate 100+ FAQs from flows/betas.

**FAQ Structure (Meta-Prompt):**
```
For each FAQ:
1. Real question (verbatim from beta/flow)
2. Short EAR hit (1-2 sentences, validates + reframes)
3. Teaching (the actual answer, framework-based)
4. Quote (from user's own data or EAR principles)
5. Generic reframe (applicable to others with same pattern)
```

**Example FAQ:**

**Q: "Why do I keep hitting South on my Compass?"**

**EAR Hit:** South isn't failure—it's your system asking for something. Most people ignore it until they crash. You're listening.

**Teaching:** South (Resistance + Tired) typically appears when you're:
- Pushing past your nervous system's current capacity
- Avoiding something that feels unsafe (visibility, pricing, rejection)
- Genuinely depleted and needing rest, not strategy

The question isn't "how do I fix South?" It's "what is South protecting me from?"

**Quote:** "The resistance isn't blocking you. It's protecting you from something that already happened."

**Reframe:** Three South days isn't a problem to solve. It's a pattern to understand. Rest Protocol isn't giving up—it's strategic recovery.

---

**Automation Flow:**
```
New beta conversation logged →
  AI extracts potential FAQ →
    Formats with meta-prompt structure →
      Human reviews/approves →
        Uploads to Zarlo knowledge base →
          Swarm gets smarter
```

---

### Week 3: Welcome Flywheel

**Goal:** Segment and path users from first touch.

**Segmentation by Compass Origin:**

| First Compass Entry | Likely State | Zarlo Path |
|---------------------|--------------|-------------|
| North (Flow) | Momentum, ready to build | Aggressive Doer. "Let's ship." |
| East (Redirect) | Energy but blocks | Pattern work first. "What's the resistance?" |
| South (Rest) | Burnt out, cautious | Gentle onboarding. Rest Protocol available. |
| West (Honour) | Reflective, slow-build | Permission to pace. No urgency. |

**Flywheel Paths:**

```
CURIOUS (lands on app)
    │
    ▼
EAR-Aligned Welcome
    │
    ├── Vibe Seeker → Flow Finder immediately
    │
    ├── Vibe Riser → Stage assessment → Right entry point
    │
    └── Movement Maker → Fast-track option → Money Models sooner
    │
    ▼
QUEST ENGAGEMENT
    │
    ▼
7-Day Challenge
    │
    ▼
FULL 6-STAGE JOURNEY
    │
    ▼
PREMIUM SIGNALS (retreat, cohort, 1:1)
```

---

### Ongoing: Lead Gen to Premium Engine

**Goal:** Free → Paid conversion through delight + signal detection.

**Top of Funnel (Zarlo Delights):**
- Free users get full Zarlo access
- Drafts, Compass logging, pattern insights
- Value delivered before ask
- Pre-sells premium through demonstrated capability

**Premium Triggers:**
| Signal | Premium Offer |
|--------|---------------|
| High engagement + fast stage progression | Cohort invitation |
| Deep pattern work + healing engagement | Retreat invitation |
| Stuck at Money Models + high intent | 1:1 strategy session |
| Completed all 6 stages | Founding member / alumni status |

**Bottom of Funnel (You Do):**
- Founding-level audits (high-touch)
- 1:1 strategy calls
- Retreat facilitation

**Data Flywheel:**
```
Every Zarlo conversation →
  Maps user to persona/stage/readiness →
    Predicts premium fit →
      Surfaces to you for human outreach →
        Conversion data feeds back to Zarlo →
          Better predictions
```

**Pricing Tiers (Example):**
| Tier | Price | What They Get |
|------|-------|---------------|
| Free | $0 | Full Zarlo, 7-Day Challenge, basic flows |
| Better | $497 | All flows, premium drafts, priority patterns |
| Best | $2,000+ | Cohort access, group calls, community |
| Founding | $5,000+ | 1:1 with you, retreat access, lifetime |

---

### Checklist Summary

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Intellectual Capital Audit | Indexed content library with scores |
| 1 | Upload + Weight | RAG-ready database with priorities |
| 1 | System Prompt | Zarlo's soul defined and tested |
| 1 | Founding Sub Tests | 10 scenarios validated |
| 2 | FAQ Swarm | 100+ structured FAQs |
| 3 | Welcome Flywheel | Segmented onboarding paths |
| Ongoing | Lead Gen Engine | Free→Premium conversion system |

**The compound effect:** Every conversation makes Zarlo smarter. Every pattern detected improves the swarm. Every premium conversion validates the flywheel. No index = no flywheel. Index everything.

---

## Database Requirements

### New Tables Needed

```sql
-- Agent execution logs
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  agent_type TEXT NOT NULL, -- 'life_quake', 'pattern_mirror', etc.
  inputs JSONB,
  outputs JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Draft storage for Doer agents
CREATE TABLE agent_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  agent_type TEXT NOT NULL,
  draft_type TEXT NOT NULL, -- 'groan_reflection', 'offer_copy', etc.
  content JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'edited', 'rejected'
  quest_id TEXT, -- if tied to specific quest
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Pattern insights cache
CREATE TABLE pattern_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  primary_theme TEXT,
  frequency TEXT,
  sample_quotes JSONB,
  insight TEXT,
  suggested_quest TEXT,
  affirmation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- refresh weekly
);
```

### Edge Functions Needed

| Function | Trigger | Purpose |
|----------|---------|---------|
| `life-quake-check` | Daily cron, 6am user timezone | Scan for burnout signals |
| `streak-guardian` | Daily cron, user's typical time | Streak risk assessment |
| `pattern-mirror` | Weekly cron, Sunday | Generate pattern insights |
| `draft-demon` | On quest availability | Pre-generate quest drafts |
| `compass-autopilot` | On 2-tap submission | Complete flow_entry from minimal input |

---

## Success Metrics

### Engagement
- Daily active users (DAU) increase
- Quest completion rate
- Streak length distribution
- Time-to-complete for drafted quests vs manual

### Retention
- Day 7 / Day 14 / Day 30 retention
- Streak break recovery rate
- South spiral → recovery rate

### Revenue Signals
- Money Model completion rate
- Cross-sell conversion (Value Ladder recommendations)
- Premium readiness score accuracy

### Qualitative
- "Holy shit" moments reported (Pattern Mirror)
- Recovery testimonials (Life Quake saves)
- NPS improvement

---

## Open Questions

1. **Autonomy levels**: Should users choose how much Zarlo does automatically vs. asks permission?

2. **Voice training**: How do we learn user's writing voice for Draft Demon accuracy?

3. **Privacy**: Pattern Mirror sees deep psychological patterns. How do we handle data sensitivity?

4. **Failure modes**: What happens when agents get it wrong? (Mis-inferred Compass, bad draft)

5. **Human escalation**: When does Life Quake flag for actual human outreach vs. automated support?

---

## Summary

**AI Co-Founder = Doer + Advisor, calibrated to Compass state.**

- **Doer** handles production, logistics, busywork
- **Advisor** handles insight, accountability, protection
- **Zarlo** orchestrates both through natural conversation
- **Compass** determines intensity and approach

The user gets a partner that does the tedious work and sees what they can't—freeing them to focus on the transformation that actually matters.
