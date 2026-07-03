# Business Tab Methodology

> **Created:** January 27, 2026
> **Status:** Planning / Iteration
> **Related:** [Healing Map Framework](./healing-map-framework.md), [CRM Methodology](./crm-methodology.md), 7-Day Challenge, Groan Matrix

---

## Table of Contents

1. [Overview](#overview)
2. [The Action Loop](#the-action-loop)
3. [The Embedded Loop Experience](#the-embedded-loop-experience-key-ux-insight)
4. [The Four Pillars](#the-four-pillars)
5. [2D Pattern Recognition Framework](#2d-pattern-recognition-framework)
6. [Meta-Architecture: Start → Middle → End](#meta-architecture-start--middle--end)
7. [Connection to Healing Tab (USP)](#connection-to-healing-tab-usp)
8. [Stage Action Items Reference](#stage-action-items-reference)
9. [Stage Implementation Details](#stage-implementation-details)
10. [UX/UI Considerations](#uxui-considerations)
11. [Implementation Status](#implementation-status)
12. [Open Questions](#open-questions)

---

## Overview

### The Promise

> "Monetise your mission to attain financial + location independence - in 6-12 months instead of 5 years."

### The Problem

Most business education gives you:
- **Information** without addressing **resistance**
- **Strategy** without addressing **self-sabotage**
- **Tactics** without addressing **why you won't do them**

### Our Solution

The Business Tab combines:
1. **Knowledge** — Knowing what action to take
2. **Pattern Recognition** — Seeing what's blocking you
3. **Groans** — Pushing through despite fear
4. **3% System** — Compounding improvement over time

These aren't separate features. They're **one methodology** - The Action Loop.

---

## The Action Loop

### The Core Cycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     THE ACTION LOOP                                      │
│         "Knowledge → Pattern → Groan → 3% → Repeat"                     │
└─────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │  1. KNOWLEDGE │
                         │              │
                         │  "What action │
                         │   should I    │
                         │   take?"      │
                         └──────┬───────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Can I take this     │
                    │   action easily?      │
                    └───────────┬───────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
               YES                              NO
                │                               │
                │                               ▼
                │                    ┌──────────────────┐
                │                    │  2. PATTERN      │
                │                    │                  │
                │                    │  "What's the     │
                │                    │   resistance?    │
                │                    │   Which voice    │
                │                    │   is speaking?"  │
                │                    └────────┬─────────┘
                │                             │
                │                             ▼
                │                    ┌──────────────────┐
                │                    │  3. GROAN        │
                │                    │                  │
                │                    │  "Do it anyway.  │
                │                    │   Your essence   │
                │                    │   knows you can."│
                │                    └────────┬─────────┘
                │                             │
                └──────────────┬──────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  ACTION TAKEN    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  4. 3% BETTER    │
                    │                  │
                    │  "How can I make │
                    │   this 3% better │
                    │   next time?"    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  COMPOUND        │
                    │  PROGRESS        │
                    │                  │
                    │  Repeat loop.    │
                    │  Watch mastery   │
                    │  emerge.         │
                    └────────┬─────────┘
                             │
                             └────────────────┐
                                              │
                         ┌──────────────┐     │
                         │  1. KNOWLEDGE │◄────┘
                         │   (Next      │
                         │    action)   │
                         └──────────────┘
```

### The Loop Explained

| Step | Name | Question | Outcome |
|------|------|----------|---------|
| 1 | **Knowledge** | "What should I do?" | Clear action from stage guidance |
| 2 | **Pattern** | "What's stopping me?" | Awareness of protective voice/pattern |
| 3 | **Groan** | "Can I do it scared?" | Action despite fear = edge expansion |
| 4 | **3%** | "How was that? What's better?" | Iteration insight for next loop |

### Why This Works

1. **Knowledge alone doesn't create change** — People know what to do, they don't do it
2. **Patterns explain the gap** — Between knowing and doing is a protective mechanism
3. **Groans build evidence** — Each action-despite-fear rewires the nervous system
4. **3% prevents perfectionism** — You don't need to be great, just better than yesterday

---

## The Embedded Loop Experience (Key UX Insight)

### The Problem with Separate Steps

If the loop feels like 4 separate features or steps, users will:
- Skip steps they don't "feel like" doing
- See it as extra work, not integrated support
- Miss the methodology entirely

```
❌ WRONG: Task Given → [Separate] Pattern Check → [Separate] Groan → [Separate] 3%

User thinks: "Ugh, 4 things to do"
```

### The Solution: Embedded, Not Separate

The loop should be **invisible to the user** but **present in the experience**.

```
✅ RIGHT: One fluid experience with natural checkpoints

User thinks: "That was helpful"
```

### The Embedded Flow

**At the end of any question flow that gives a clear task:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   QUESTION FLOW COMPLETION                                               │
│   ══════════════════════════                                             │
│                                                                          │
│   Based on your answers, here's your next action:                        │
│                                                                          │
│   📋 "Post your offer on LinkedIn"                                       │
│                                                                          │
│   ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│   EMBEDDED PATTERN CHECK (not labeled as "Step 2")                       │
│                                                                          │
│   How do you feel about this?                                            │
│                                                                          │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│   │ Excited │  │ Nervous │  │ Resistant│  │  Numb  │                    │
│   │   😊    │  │   😰    │  │   😤    │  │   😶   │                    │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘                    │
│                                                                          │
│   If Nervous/Resistant/Numb selected:                                    │
│   "What's the voice saying?" [Quick capture - optional]                  │
│   _______________________________________________                        │
│                                                                          │
│   ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│   ESSENCE REMINDER (always shown, ambient - not a separate step)         │
│                                                                          │
│   💫 "Your essence knows you can do this.                                │
│       The resistance is protection, not truth.                           │
│       Show up as YOU, not the pattern."                                  │
│                                                                          │
│   [I'm ready →]                                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**On task completion:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   ✅ TASK COMPLETE                                                       │
│                                                                          │
│   Nice work showing up.                                                  │
│                                                                          │
│   ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│   EMBEDDED REFLECTION (feels like journaling, not a task)                │
│                                                                          │
│   How was that?                                                          │
│                                                                          │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│   │ Easier  │  │ As      │  │ Harder  │  │ Didn't  │                    │
│   │ than    │  │ expected│  │ than    │  │ finish  │                    │
│   │ expected│  │         │  │ expected│  │         │                    │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘                    │
│                                                                          │
│   ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│   3% REFLECTION (natural, optional)                                      │
│                                                                          │
│   "Next time, what's one small thing that could make this               │
│    3% smoother/better/easier?"                                           │
│                                                                          │
│   [Optional text input]                                                  │
│   _______________________________________________                        │
│                                                                          │
│   [Done →]                                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### The Key Shift

| Aspect | Before (Separate) | After (Embedded) |
|--------|-------------------|------------------|
| Pattern check | "Do Pattern step" | "How do you feel?" |
| Groan reminder | "Remember to Groan" | Essence reminder (ambient) |
| 3% reflection | "Log your 3%" | "Any insights?" (natural) |
| User perception | 4 things to do | 1 helpful experience |

### When to Embed the Loop

The "How do you feel?" + Essence reminder should appear:

| Context | Include Loop? |
|---------|---------------|
| Question flow gives a task | ✅ Yes - full embedded loop |
| Daily challenge task | ✅ Yes - full embedded loop |
| Groan Matrix challenge | ✅ Yes - already has essence framing |
| Simple info display | ❌ No - no action to take |
| CRM generated task | ⚠️ Lighter version - just completion + 3% |

---

## The Four Pillars

### 1. Knowledge (Stage System)

**Purpose:** Know exactly what action to take at each stage of business building.

**How it works:**
- 8 stages from Flow Finder to Tracking
- Each stage has specific tasks/challenges
- Guided step-by-step with proven strategies
- "Right answers" based on frameworks ($100M Offers, etc.)

**Current implementation:** 7-Day Challenge stages, Flow Finder, Money Model flows

**The insight:**
> "You don't need to figure out what to do. We've mapped the path. Your job is to walk it."

---

### 2. Groans

**Purpose:** Push beyond comfort zone edges. Find direction when unsure.

**Definition:**
> "Groans = Things your essence knows you're capable of, but your body holds fear due to past traumas."

**Two functions:**

1. **Direction Finding** — When unsure what to do, look for what makes you groan. That's your edge. That's where growth lives.

2. **Edge Pushing** — When you know what to do but resist, the groan is the signal that this action will expand you.

**Current implementation:** Groan Matrix (Skills × Visibility Layers), Groan challenges

**The insight:**
> "If it doesn't make you groan, it's not going to grow you. Comfort doesn't compound."

---

### 3. 3% System

**Purpose:** Compound improvement without perfectionism paralysis.

**How it works:**
- After each action, ask: "How could this be 3% better next time?"
- Not 50% better. Not perfect. Just 3%.
- Small improvements compound into mastery
- Creates permission to start before you're ready

**Math of 3%:**
```
Week 1:  100 (baseline)
Week 4:  112 (+12%)
Week 12: 143 (+43%)
Week 26: 204 (+104%)
Week 52: 416 (+316%)
```

**The insight:**
> "You're not going to start the best at what you do. But if you keep showing up and challenging yourself to make it 3% better, progress compounds and you end up creating something amazing — something only YOU could create."

---

### 4. Pattern Recognition / Voice Recognition

**Purpose:** Bring awareness to protective patterns blocking progress. Create accountability to show up as essence.

**How it works:**
- When resistance appears, identify the pattern/voice
- Name it (Protector, Perfectionist, People-Pleaser, etc.)
- Recognize it's trying to keep you safe
- Choose essence response anyway

**Connection to Healing Tab:**
- Same patterns that appear in triggers (Healing) appear as resistance (Business)
- Healing Tab = understand + process the pattern
- Business Tab = act despite the pattern + build new evidence

**The insight:**
> "Your patterns aren't enemies. They're outdated protection. Thank them, then choose differently."

---

## 2D Pattern Recognition Framework

### The Two Dimensions

Every resistance pattern has two dimensions:

| Dimension | Question | What It Captures |
|-----------|----------|------------------|
| **Visibility Layer (WHERE)** | Where does this fear show up? | The type of action that triggers resistance |
| **Protective Voice (HOW)** | How does this fear speak? | The pattern/voice that's trying to protect you |

### The 5 Visibility Layers (WHERE)

| Layer | Icon | Fear Core | Difficulty | Example Actions |
|-------|------|-----------|------------|-----------------|
| **Screen** | 📱 | Being seen online | 1 | Post, share, publish, be visible |
| **Live** | ⚡ | Real-time judgment | 2 | Go live, host workshops, discovery calls |
| **Money** | 💰 | "Am I worth it?" | 3 | Quote price, follow up, pitch premium |
| **Vulnerable** | 💗 | Rejected for real self | 4 | Share failure, ask for help, admit gaps |
| **Authority** | 👑 | Imposter syndrome | 5 | Claim expertise, correct others, pitch to speak |

### The 5 Protective Voices (HOW)

| Voice | Icon | Core Belief | NS Pattern | Avoidance |
|-------|------|-------------|------------|-----------|
| **Perfectionist** | 🎭 | "If I get it perfect, I can avoid shame" | Freeze + sympathetic | Starting, failing, being seen in progress |
| **People Pleaser** | 🤝 | "If I make others happy, I'll be safe" | Fawn | Stating needs, boundaries, emotional truth |
| **Controller** | 🎛️ | "Safety comes from controlling outcomes" | Sympathetic fight | Letting others lead, trusting, surrender |
| **Performer** | 🎪 | "If I do more, I'll be enough" | Sympathetic flight | Rest, stillness, vulnerability without performance |
| **Ghost** | 👻 | "Being seen is dangerous" | Dorsal vagal freeze | Connection, emotion, vulnerability, standing out |

### Why Two Dimensions Matter

Pre-tagging (combining WHERE + HOW into one selection) oversimplifies because:

1. **Same voice, different contexts** — A Perfectionist shows up differently when posting (Screen) vs pricing (Money) vs going live (Live)

2. **Richer pattern data** — Knowing "Perfectionist × Money" vs "Perfectionist × Screen" tells us WHERE to target healing work

3. **More accurate AI recommendations** — "Your Perfectionist mostly shows up around Money actions" is more actionable than just "You're a Perfectionist"

### The Two-Step UX Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  📋 Your action: "Post your offer on LinkedIn"                          │
│                                                                          │
│  How do you feel about this?                                             │
│  [😊 Excited]  [😰 Nervous]  [😤 Resistant]  [😶 Numb]                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

                              ↓ If not Excited

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  STEP 1: Where does this resistance show up?                            │
│  (What type of action triggers the feeling?)                             │
│                                                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │   📱    │  │   ⚡    │  │   💰    │  │   💗    │  │   👑    │       │
│  │ Screen  │  │  Live   │  │  Money  │  │  Vuln   │  │  Auth   │       │
│  │         │  │         │  │         │  │         │  │         │       │
│  │ Being   │  │Real-time│  │Charging │  │Showing  │  │Claiming │       │
│  │ seen    │  │judgment │  │ money   │  │weakness │  │expertise│       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

                              ↓ User taps one

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  STEP 2: Which voice is speaking?                                        │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎭 Perfectionist                                                │   │
│  │ "It's not ready/good enough yet"                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🤝 People Pleaser                                               │   │
│  │ "I don't want to bother/upset anyone"                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎛️ Controller                                                   │   │
│  │ "I can't control what happens after"                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎪 Performer                                                    │   │
│  │ "I need to prove myself more first"                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 👻 Ghost                                                        │   │
│  │ "I should stay hidden/quiet"                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

                              ↓ User taps one

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  💫 Your essence knows you can do this.                                  │
│                                                                          │
│  You noticed: 🎭 Perfectionist × 📱 Screen                              │
│                                                                          │
│  This is protection, not truth. Your Perfectionist is trying            │
│  to keep you safe from judgment — but you don't need perfection         │
│  to be worthy of being seen.                                             │
│                                                                          │
│  [I'm ready to show up anyway →]                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Contextual Voice Descriptions

The voice description can adapt based on the visibility layer selected:

| Voice × Layer | Contextual Message |
|---------------|-------------------|
| 🎭 Perfectionist × 📱 Screen | "The post isn't polished enough yet" |
| 🎭 Perfectionist × 💰 Money | "My offer isn't complete enough to charge" |
| 🎭 Perfectionist × ⚡ Live | "I'll mess up if I can't edit it" |
| 🤝 People Pleaser × 📱 Screen | "I don't want to annoy people with my content" |
| 🤝 People Pleaser × 💰 Money | "Asking for money might upset them" |
| 🤝 People Pleaser × 💗 Vulnerable | "If I show struggle, I'll be a burden" |
| 🎛️ Controller × ⚡ Live | "I can't control what questions they'll ask" |
| 🎛️ Controller × 💰 Money | "I can't control if they'll say yes" |
| 🎪 Performer × 👑 Authority | "I haven't achieved enough to claim this" |
| 🎪 Performer × 📱 Screen | "I need more credentials before posting" |
| 👻 Ghost × 📱 Screen | "I should stay quiet, not add to the noise" |
| 👻 Ghost × 💰 Money | "I don't want to draw attention by asking" |
| 👻 Ghost × 👑 Authority | "I should let others with more experience lead" |

### The 2D Pattern Map (User Profile)

Over time, this builds a rich pattern map for each user:

```
YOUR PATTERN MAP
────────────────────────────────────────────────────────────────

                         VISIBILITY LAYERS
                   📱      ⚡      💰      💗      👑
                 Screen   Live   Money   Vuln   Auth
              ┌─────────────────────────────────────────┐
 🎭 Perfect   │  ████    ██      ██████   █       ███  │
 🤝 Pleaser   │  ██      ███     █        ████    █    │
 🎛️ Control   │  █       █████   ██       █       ██   │
 🎪 Perform   │  ███     ██      ███      ██      ████ │
 👻 Ghost     │  █████   ██      █        ██      █    │
              └─────────────────────────────────────────┘

BY PROTECTIVE VOICE:
🎭 Perfectionist    ████████████████░░░░  42 occurrences
🤝 People Pleaser   ██████████░░░░░░░░░░  25 occurrences
🎛️ Controller       ████████░░░░░░░░░░░░  18 occurrences
🎪 Performer        ██████░░░░░░░░░░░░░░  14 occurrences
👻 Ghost            ████░░░░░░░░░░░░░░░░   8 occurrences

BY VISIBILITY LAYER:
💰 Money            ████████████████████  48 occurrences ← Focus area
📱 Screen           ██████████████░░░░░░  32 occurrences
👑 Authority        ████████░░░░░░░░░░░░  17 occurrences
⚡ Live             ██████░░░░░░░░░░░░░░  12 occurrences
💗 Vulnerable       ████░░░░░░░░░░░░░░░░   8 occurrences

TOP PATTERN COMBINATIONS:
1. 🎭 Perfectionist × 💰 Money (18 occurrences)
   → "Your perfectionist especially blocks you around pricing"

2. 👻 Ghost × 📱 Screen (14 occurrences)
   → "Your ghost wants you to stay invisible online"

3. 🎛️ Controller × ⚡ Live (12 occurrences)
   → "Your controller fears real-time situations you can't plan"
```

### Data Structure

Each resistance moment logs both dimensions:

```javascript
{
  // Task context
  task: "Post your offer on LinkedIn",
  stage: 3,
  timestamp: "2026-01-27T10:30:00Z",

  // Initial feeling
  initialFeeling: "nervous", // excited | nervous | resistant | numb

  // 2D Pattern capture
  visibilityLayer: "screen",        // WHERE: screen | live | money | vulnerable | authority
  protectiveVoice: "perfectionist", // HOW: perfectionist | people_pleaser | controller | performer | ghost

  // Optional: custom voice text
  customVoiceText: null, // If user selected "Other" and typed something

  // Completion data
  completed: true,
  completionFeeling: "easier_than_expected", // easier | as_expected | harder | didnt_finish

  // 3% reflection
  threePercentReflection: "Next time draft the night before"
}
```

### AI Pattern Recognition Benefits

With this 2D data, the AI can:

1. **Predict resistance** — "This task involves Money + Live. Based on your patterns, your Controller may show up. Here's how to prepare..."

2. **Personalize Groans** — Generate challenges targeting their weakest voice × layer combination

3. **Track progress** — "Your Screen resistance has dropped 40% over 4 weeks, especially with your Ghost voice"

4. **Connect to Healing Tab** — Same voices, same layers, unified pattern library across both tabs

5. **Inform CRM** — Avoid suggesting content that triggers highest-resistance combinations until ready

6. **Generate insights** — "Your Perfectionist only shows up around Money actions, not Screen. This suggests the wound is about worth/value, not about quality of work."

### Connection to Healing Tab

The same 2D framework applies in both tabs:

| Tab | WHERE Shows Up | HOW Shows Up |
|-----|---------------|--------------|
| **Business Tab** | Type of action causing resistance | Voice blocking the action |
| **Healing Tab** | Type of trigger causing reaction | Voice driving the reaction |

This creates a unified pattern library that tracks the same voices across life + business contexts.

---

## Meta-Architecture: Start → Middle → End

### The Core Pattern

The Business Tab follows the same architecture as the entire FindMyFlow ecosystem:

> "AI is great at the middle" — Balaji

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     THE FINDMYFLOW ARCHITECTURE                          │
│                                                                          │
│              Question Flows → AI Intelligence → Outputs                  │
└─────────────────────────────────────────────────────────────────────────┘

     START                    MIDDLE                      END
     (Capture)                (AI Intelligence)           (Output)
        │                          │                          │
        ▼                          ▼                          ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│  QUESTION    │          │     AI       │          │   RESULT     │
│   FLOWS      │    ──►   │  PROCESSES   │    ──►   │   TO USE     │
│              │          │              │          │              │
│ Structured   │          │ Context-rich │          │ Higher       │
│ data capture │          │ execution    │          │ quality than │
│              │          │              │          │ generic AI   │
└──────────────┘          └──────────────┘          └──────────────┘
```

### Applied to Business Tab

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BUSINESS TAB: START → MIDDLE → END                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  START (Question Flows)        MIDDLE (AI)              END (Outputs)    │
│  ─────────────────────        ──────────              ─────────────      │
│                                                                          │
│  Flow Finder                   AI understands:         Stage tasks       │
│  • Skills                      • Your unique angle     Personalized      │
│  • Problems                    • Your ideal client     groans            │
│  • Persona                     • Your offer stack      3% suggestions    │
│                                • Your patterns         Progress tracking │
│  Money Models                  • Your edges                              │
│  • Offers                                                                │
│  • Pricing                     Generates:                                │
│  • Stack                       • Right task for        "Do THIS next"    │
│                                  your stage                              │
│  Validation                    • Relevant groans       "Try THIS edge"   │
│  • Survey results              • Targeted guidance     "Here's WHY"      │
│  • Market feedback                                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why This Architecture Matters

**Generic AI (without context):**
> "Here are some tips for growing your business..."

**FindMyFlow AI (with START data):**
> "Based on your skills in breathwork and your persona's fear of being seen, your next action is to post about a client transformation. Here's a draft that uses your story about overcoming imposter syndrome..."

The more users complete question flows (START), the more intelligent the outputs (END).

### How Business Tab Feeds CRM

The Business Tab's START data becomes the CRM's inherited context:

```
BUSINESS TAB                              CRM
────────────                              ───

Skills captured        ──────────────►    Content knows your angle
Problems captured      ──────────────►    Copy speaks to real pain
Persona captured       ──────────────►    Messaging uses their language
Offer stack captured   ──────────────►    Funnels promote right products
Patterns captured      ──────────────►    Tasks avoid known triggers
3% history captured    ──────────────►    Suggestions build on learnings
```

See [CRM Methodology](./crm-methodology.md) for full details on this inheritance.

---

## Connection to Healing Tab (USP)

### The Unique Value Proposition

> "The same protective patterns that keep you stuck in healing are the same ones that block business action."

Most business programs ignore the nervous system. We integrate it.

### How They Connect

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   HEALING TAB                           BUSINESS TAB                     │
│   ───────────                           ────────────                     │
│                                                                          │
│   Frequency Spectrum                    Action Loop                      │
│   (Where am I emotionally?)             (What do I do practically?)      │
│        │                                      │                          │
│        │                                      │                          │
│        ▼                                      ▼                          │
│   ┌─────────────┐                      ┌─────────────┐                  │
│   │  PATTERN    │◄────────────────────►│  PATTERN    │                  │
│   │  (Trigger   │    SAME SYSTEM       │  (Resistance│                  │
│   │   Response) │                      │   to action)│                  │
│   └─────────────┘                      └─────────────┘                  │
│        │                                      │                          │
│        │                                      │                          │
│        ▼                                      ▼                          │
│   Healing Work                          Groan + 3%                       │
│   (4R's: Recognise,                     (Do it anyway +                  │
│    Rewire, Reconnect,                    improve)                        │
│    Release)                                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### The Integration Points

| Scenario | Healing Tab | Business Tab |
|----------|-------------|--------------|
| Pattern identified | Log trigger, track frequency | Name resistance, choose action |
| Fear response | Process through 4R's | Groan through anyway |
| Progress measurement | Hawkins frequency rising | Actions completed, 3% improvements |
| Stuck/blocked | Deeper healing work needed | Return to Pattern step |

### When to Use Which

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  USER HITS RESISTANCE                                                    │
│         │                                                                │
│         ▼                                                                │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │  Is this resistance familiar? Have you groaned through   │            │
│  │  this before?                                             │            │
│  └─────────────────────────────────────────────────────────┘            │
│         │                                                                │
│    ┌────┴────┐                                                          │
│    │         │                                                          │
│   YES        NO                                                          │
│    │         │                                                          │
│    ▼         ▼                                                          │
│  ┌───────┐  ┌────────────────────────────────────────────┐              │
│  │ GROAN │  │  This might need healing first.            │              │
│  │ (do it│  │                                            │              │
│  │anyway)│  │  Options:                                  │              │
│  └───────┘  │  1. Try the Groan anyway (build evidence)  │              │
│             │  2. Go to Healing Tab (process the pattern)│              │
│             │  3. Smaller step (reduce the groan size)   │              │
│             └────────────────────────────────────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Shared Pattern Library

Both tabs feed the same pattern recognition system:

```
YOUR PATTERNS
─────────────

Pattern: "Visibility = Danger"
├── Healing Tab: Triggers when posting content (Fear, 100)
├── Business Tab: Resistance to "go live" tasks
├── Origin: [From healing work] Criticized publicly age 12
├── Frequency trend: 100 → 125 → 150 (improving)
└── Evidence against: 3 posts this week, no attacks

Pattern: "Asking for money = Rejection"
├── Healing Tab: Triggers when pricing conversations (Shame, 20)
├── Business Tab: Resistance to sales calls
├── Origin: [From healing work] Parents fought about money
├── Frequency trend: 20 → 50 → 75 (improving)
└── Evidence against: 2 clients paid full price this month
```

---

## Stage Action Items Reference

Each stage has specific action types that move users forward. These are the "Knowledge" component of the Action Loop.

### Stage 0: Flow Finder (Always Accessible)

| Action Type | Visibility Layer | Example Actions |
|-------------|-----------------|-----------------|
| Skills Discovery | 📱 Screen | Answer questions about what energizes you |
| Problems Discovery | 📱 Screen | Identify problems you naturally solve |
| Persona Discovery | 📱 Screen | Define who you help |
| Integration | 📱 Screen | Connect skills + problems + persona |

**Groan Potential:** Low - internal work, no external visibility

### Stage 0.5: Groans (Always Accessible, User-Level)

| Action Type | Visibility Layer | Example Actions |
|-------------|-----------------|-----------------|
| Matrix Challenge | Any | Complete a challenge from your skill × layer matrix |
| Edge Expansion | Any | Do something at the edge of comfort |
| Proof Collection | 📱 Screen | Share evidence of challenges completed |

**Groan Potential:** High by design - this IS the groan stage

### Stage 1: Validation

| Action Type | Visibility Layer | Example Actions |
|-------------|-----------------|-----------------|
| Survey Creation | 📱 Screen | Create validation survey |
| Survey Distribution | 📱 Screen / ⚡ Live | Send survey to potential customers |
| Interview Outreach | 💗 Vulnerable | Ask people for feedback calls |
| Interview Conduct | ⚡ Live | Have validation conversations |
| Results Analysis | 📱 Screen | Document what you learned |

**Groan Potential:** Medium-High - requires asking for feedback

### Stage 2: Offer Design

| Action Type | Visibility Layer | Example Actions |
|-------------|-----------------|-----------------|
| Core Offer Design | 📱 Screen | Define your main offer |
| Pricing Decision | 💰 Money | Set and commit to a price |
| Downsell Design | 💰 Money | Create lower-tier option |
| Upsell Design | 💰 Money | Create higher-tier option |
| Offer Stack | 📱 Screen | Connect offers into journey |

**Groan Potential:** High around pricing decisions

### Stage 3: Attraction

| Action Type | Visibility Layer | Example Actions |
|-------------|-----------------|-----------------|
| Content Creation | 📱 Screen | Write posts, create videos |
| Content Publishing | 📱 Screen | Post on social platforms |
| Lead Magnet Creation | 📱 Screen | Create free valuable resource |
| Lead Magnet Promotion | 📱 Screen | Share lead magnet publicly |
| Audience Building | 📱 Screen | Engage, comment, build presence |

**Groan Potential:** Medium - screen visibility triggers Ghost/Perfectionist

### Stage 4: Nurture

| Action Type | Visibility Layer | Example Actions |
|-------------|-----------------|-----------------|
| Email Sequence Writing | 📱 Screen | Create nurture emails |
| DM Conversations | ⚡ Live | Respond to inquiries |
| Follow-up | 💰 Money | Re-engage past leads |
| Relationship Building | 💗 Vulnerable | Share authentically |

**Groan Potential:** Medium-High - requires persistence and vulnerability

### Stage 5: Sales

| Action Type | Visibility Layer | Example Actions |
|-------------|-----------------|-----------------|
| Discovery Calls | ⚡ Live | Have sales conversations |
| Price Presentation | 💰 Money | State your price confidently |
| Objection Handling | ⚡ Live / 💰 Money | Address concerns |
| Closing | 💰 Money | Ask for the sale |
| Follow-up | 💰 Money | Follow up on pending decisions |

**Groan Potential:** Very High - live + money combination

### Stage 6: Delivery

| Action Type | Visibility Layer | Example Actions |
|-------------|-----------------|-----------------|
| Client Onboarding | ⚡ Live | Welcome new clients |
| Service Delivery | 👑 Authority | Deliver your expertise |
| Results Tracking | 📱 Screen | Document client outcomes |
| Testimonial Requests | 💗 Vulnerable | Ask for social proof |
| Case Study Creation | 📱 Screen | Document transformation stories |

**Groan Potential:** Medium - authority claiming triggers Performer/Perfectionist

### Stage 7: Scale

| Action Type | Visibility Layer | Example Actions |
|-------------|-----------------|-----------------|
| Systems Creation | 📱 Screen | Document processes |
| Team/Contractor Hiring | 🎛️ Control | Delegate to others |
| Pricing Increases | 💰 Money | Raise your rates |
| Premium Positioning | 👑 Authority | Claim thought leadership |
| Speaking/PR | 👑 Authority | Pitch for visibility opportunities |

**Groan Potential:** Very High - authority + money + letting go of control

### Stage 8: Tracking (Always Accessible)

| Action Type | Visibility Layer | Example Actions |
|-------------|-----------------|-----------------|
| Metrics Tracking | 📱 Screen | Log funnel numbers |
| Analysis | 📱 Screen | Review what's working |
| Optimization | 📱 Screen | Adjust based on data |

**Groan Potential:** Low - internal work

### Stage × Voice × Layer Matrix

This creates a 3D matrix for personalization:

```
For User X at Stage 3 (Attraction):
├── Primary Voices: Perfectionist (42%), Ghost (25%)
├── Highest Resistance Layers: Screen, Authority
│
├── Predicted Resistance Points:
│   • "Content Creation" → Perfectionist × Screen (HIGH)
│   • "Content Publishing" → Ghost × Screen (HIGH)
│   • "Lead Magnet Promotion" → Ghost × Screen (HIGH)
│
└── AI Recommendation:
    "Your Ghost voice may try to keep you quiet when posting.
     Your Perfectionist may say it's not ready.
     Remember: Done > Perfect. Visible > Hidden."
```

---

## Stage Implementation Details

This section documents exactly how the 2D Pattern Recognition Framework (PRE-ACTION + POST-ACTION) applies to each stage's question flows and challenges.

### Design Principles

1. **One PRE-ACTION per stage journey** — Capture resistance at the moment an action is identified, not at every micro-step
2. **POST-ACTION (3%) at completion** — Embedded reflection after each task completion
3. **Groans reviewed per-stage** — Only add separate groan tracking if the groan differs from the main stage task
4. **Keep it light** — Embedded prompts, not separate challenges

### Visibility Layer Descriptions (User-Facing)

When asking "Where does this resistance show up?", use these feeling-based statements:

| Layer | Icon | User-Facing Statement |
|-------|------|----------------------|
| Screen | 📱 | "Putting myself out there where people can see and judge me" |
| Live | ⚡ | "Doing something in real-time where I can't edit or take it back" |
| Money | 💰 | "Asking someone to pay me or stating my price" |
| Vulnerable | 💗 | "Showing something unfinished or admitting I need help" |
| Authority | 👑 | "Claiming expertise or positioning myself as someone to follow" |

---

### Stage 1: Validation — Implementation Details

#### Current Components

| Component | Type | Location | Purpose |
|-----------|------|----------|---------|
| **PersonaSelectionFlow** | Question Flow | `/persona-selection` | Define ideal customer persona + problem |
| **ValidationFlowsManager** | Tool | `/validation-flows` | Create & manage validation surveys |
| **Collect Validation Responses** | Challenge | `challengeQuestsUpdate.json` | Track 3 responses milestone |
| **Analyze Validation Responses** | Challenge | `challengeQuestsUpdate.json` | Review feedback with AI |
| **Stage 1 Groan** | Challenge | `challengeQuestsUpdate.json` | "Ask 1 person for honest feedback" |

#### Current State Issues

1. **PersonaSelectionFlow SUCCESS stage** — Says "Save Results" and navigates to `/7-day-challenge`. No mention that the next step is to validate with real people.
2. **ValidationFlowsManager** — Passive response viewing. No way to mark "I received a response" or "I'm done collecting."
3. **Stage 1 Groan** — Overlaps with validation task (same action).

#### Implementation Plan

##### 1. PersonaSelectionFlow — End of Flow (PRE-ACTION)

**Location:** `src/flows/PersonaSelectionFlow.jsx` → SUCCESS stage (line ~689)

**Current:**
```jsx
<h1>✓ Persona Profiles Complete!</h1>
<p>You've defined X ideal customer personas, now choose one:</p>
// ... profile cards ...
<button onClick={saveResults}>Save Results</button>
```

**Proposed:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ✓ Persona Profile Selected!                                            │
│                                                                          │
│  Your validated combo:                                                   │
│  [Persona Name] × [Problem Name]                                        │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  📋 Your Next Step: Validate With Real People                           │
│                                                                          │
│  Before you build anything, you need to confirm this persona + problem   │
│  resonates with actual potential customers.                              │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  PRE-ACTION                                                              │
│                                                                          │
│  How do you feel about reaching out to validate this?                    │
│                                                                          │
│  [😊 Excited]  [😰 Nervous]  [😤 Resistant]  [😶 Numb]                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

        ↓ If Nervous/Resistant/Numb

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Where does this resistance show up?                                     │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📱 Screen                                                        │   │
│  │ "Putting myself out there where people can see and judge me"    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⚡ Live                                                          │   │
│  │ "Doing something in real-time where I can't edit or take back"  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 💗 Vulnerable                                                    │   │
│  │ "Showing something unfinished or admitting I need help"         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  (💰 Money and 👑 Authority less common for validation stage)          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

        ↓ User selects

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  Which voice is speaking?                                                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎭 Perfectionist                                                │   │
│  │ "My idea isn't ready for feedback yet"                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🤝 People Pleaser                                               │   │
│  │ "I don't want to bother anyone"                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎛️ Controller                                                   │   │
│  │ "I can't control what they'll say"                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎪 Performer                                                    │   │
│  │ "I need to have more figured out first"                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 👻 Ghost                                                        │   │
│  │ "I'd rather stay quiet than risk rejection"                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

        ↓ User selects

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  💫 Your essence knows you can do this.                                  │
│                                                                          │
│  You noticed: 🤝 People Pleaser × 💗 Vulnerable                         │
│                                                                          │
│  Your People Pleaser doesn't want to "bother" anyone with your idea.    │
│  But asking for feedback isn't a burden — it's an invitation to help    │
│  you build something that serves them.                                   │
│                                                                          │
│  [Start Validating →]  ← Links to validation flow creation              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Data Captured:**
```javascript
{
  stage: 1,
  source: "persona_selection_flow",
  action_type: "validate_idea",
  pre_feeling: "nervous",
  visibility_layer: "vulnerable",
  protective_voice: "people_pleaser",
  timestamp: "2026-01-27T10:30:00Z"
}
```

##### 2. ValidationFlowsManager — Two New Buttons

**Location:** `src/pages/ValidationFlowsManager.jsx`

**Current:** Passive response viewing only

**Proposed:** Add two interaction points:

###### Button 1: "Log a Response" (per-response reflection)

Appears in the responses panel. User clicks when they receive a meaningful response.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  📥 Log a Response                                                       │
│                                                                          │
│  You just received feedback from a potential customer.                   │
│                                                                          │
│  How was that experience?                                                │
│  [😌 Easier than expected]  [😐 As expected]                            │
│  [😰 Harder than expected]  [❌ They didn't respond]                    │
│                                                                          │
│  Quick insight from this response? (optional)                            │
│  [________________________________________________________]             │
│                                                                          │
│  [Log Response →]                                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Purpose:** Captures in-the-moment learning. Not full 3% reflection, just quick insight capture.

###### Button 2: "Finalize Validation" (stage completion POST-ACTION)

Appears when user has collected 3+ responses (or manually triggers it).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ✅ Finalize Validation                                                  │
│                                                                          │
│  You've collected [X] responses for your validation survey.              │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  POST-ACTION                                                             │
│                                                                          │
│  Overall, how was the validation process?                                │
│  [😌 Easier than expected]  [😐 As expected]                            │
│  [😰 Harder than expected]  [❌ Didn't finish]                          │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  What's one thing that could make validation 3% easier next time?        │
│                                                                          │
│  [________________________________________________________]             │
│                                                                          │
│  [Complete Validation Stage →]                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**On Completion:**
- Marks `milestone_validation_form_sent` complete
- Triggers celebration
- Compares PRE vs POST feeling for pattern accuracy
- Stores 3% reflection
- Advances user to next stage task

**Data Captured:**
```javascript
{
  stage: 1,
  task_id: "milestone_validation_form_sent",
  responses_collected: 5,
  post_feeling: "easier_than_expected",
  three_percent: "Send the survey link in a DM, not a public post",
  pattern_accurate: false, // nervous → easier = pattern overestimated
  timestamp: "2026-01-27T14:30:00Z"
}
```

##### 3. Analyze Validation Responses — POST-ACTION Only

**Location:** Current challenge in `challengeQuestsUpdate.json`

After AI analysis is viewed:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ✅ Analysis Complete                                                    │
│                                                                          │
│  How was reviewing this feedback?                                        │
│  [😌 Easier than expected]  [😐 As expected]                            │
│  [😰 Harder than expected]  [❌ Didn't finish]                          │
│                                                                          │
│  What insight will you carry forward?                                    │
│  [________________________________________________________]             │
│                                                                          │
│  [Complete →]                                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

##### 4. Stage 1 Groan — SKIP

**Reason:** The Stage 1 Groan ("Ask 1 person for honest feedback") is the same action as "Collect Validation Responses." Adding a separate PRE/POST for the groan would duplicate the loop.

**Resolution:** Mark Stage 1 Groan as automatically completed when validation responses milestone is reached, OR archive it in favor of the embedded loop.

#### Stage 1 Summary Table

| Component | PRE-ACTION | POST-ACTION | Notes |
|-----------|------------|-------------|-------|
| PersonaSelectionFlow | ✅ End of flow | ❌ None | Action identified here |
| Log a Response (per-response) | ❌ Skip | ⚡ Light (quick insight) | Not full 3% |
| Finalize Validation | ❌ Skip | ✅ Full (3% reflection) | Main completion point |
| Analyze Validation | ❌ Skip | ✅ Full (3% reflection) | Secondary completion |
| Stage 1 Groan | ❌ Skip | ❌ Skip | Redundant with validation task |

---

### Stage 2: Offer Design — Implementation Details

*To be documented after Stage 1 implementation is confirmed*

**Key Components to Review:**
- `AttractionOfferFlow.jsx`
- `UpsellFlow.jsx`
- `DownsellFlow.jsx`
- `ContinuityFlow.jsx`
- `OfferBuilderFlow.jsx`
- Stage 2 challenges in `challengeQuestsUpdate.json`

**Predicted High-Resistance Points:**
- Pricing Decision (💰 Money × 🎭 Perfectionist)
- Committing to offer structure (🎛️ Controller)

---

### Stage 3: Attraction — Implementation Details

*To be documented*

---

### Stage 4: Nurture — Implementation Details

*To be documented*

---

### Stage 5: Sales — Implementation Details

*To be documented*

---

### Stage 6: Delivery — Implementation Details

*To be documented*

---

### Stage 7: Scale — Implementation Details

*To be documented*

---

## UX/UI Considerations

### Current Problem

> "All components are built, but not explicit about how they feed each other and support."

The 4 pillars feel like separate features rather than one methodology.

### Potential Solutions

#### Option A: The Loop Dashboard

Show the Action Loop visually. User always knows where they are:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  YOUR ACTION LOOP                                        Stage 3        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│         KNOWLEDGE ──────► PATTERN ──────► GROAN ──────► 3%              │
│             ●                                              │             │
│             └──────────────────────────────────────────────┘             │
│                                                                          │
│  Current stage task: "Post about your offer on LinkedIn"                 │
│                                                                          │
│  Loop status:                                                            │
│  ✅ KNOWLEDGE: Task identified                                           │
│  ⏳ PATTERN: Checking for resistance...                                  │
│  ○ GROAN: Pending                                                        │
│  ○ 3%: Pending                                                           │
│                                                                          │
│  [I feel resistance →]  [No resistance, just do it →]                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Option B: Contextual Prompts

When user engages with any stage task, prompt the loop contextually:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  📋 TODAY'S TASK: Post about your offer on LinkedIn                     │
│                                                                          │
│  How does this feel?                                                     │
│                                                                          │
│  [Easy - let's do it]     [Hard - I feel resistance]                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

If "Hard" selected:
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  😰 Resistance detected. This is part of the process.                   │
│                                                                          │
│  Step 2: PATTERN - What's the resistance?                               │
│                                                                          │
│  □ "People will judge me"                                               │
│  □ "I'm not expert enough"                                              │
│  □ "What if no one engages"                                             │
│  □ "It feels salesy/gross"                                              │
│  □ Other: _______________                                               │
│                                                                          │
│  [This is a known pattern - Groan through it →]                         │
│  [This feels deep - Go to Healing Tab →]                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Option C: Unified Daily View

One daily screen that walks through the full loop:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TODAY'S ACTION LOOP                                    Mon, Jan 27     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1️⃣ KNOWLEDGE                                                           │
│  Your stage task: "Define your offer price"                              │
│  [View guidance →]                                                       │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  2️⃣ PATTERN CHECK                                                       │
│  Does this task feel easy or hard?                                       │
│  [Easy] [Hard]                                                           │
│                                                                          │
│  If hard: Which pattern is showing up?                                   │
│  [Select pattern or add new]                                             │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  3️⃣ GROAN                                                               │
│  Ready to do it anyway?                                                  │
│  [Mark as complete ✓]                                                    │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  4️⃣ 3% REFLECTION (unlocks after completion)                            │
│  "What would make this 3% better next time?"                             │
│  [Add reflection...]                                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Option D: Loop Tracker Widget

Small persistent widget showing loop progress:

```
┌────────────────────────────┐
│  Action Loop Progress      │
│                            │
│  K ● ─ P ○ ─ G ○ ─ 3 ○    │
│                            │
│  12 loops completed        │
│  This week: 3              │
│  Streak: 5 days 🔥         │
└────────────────────────────┘
```

---

## Implementation Status

### Currently Built

| Component | Location | Status |
|-----------|----------|--------|
| Stage System (Knowledge) | 7-Day Challenge stages | ✅ Built |
| Groan Matrix | Business Tab | ✅ Built |
| Groan Challenges | Business Tab | ✅ Built |
| Pattern Recognition | Various flows | ⚠️ Scattered |
| 3% Reflection | ? | ❓ Status unknown |

### Needs Building/Refinement

| Component | Priority | Notes |
|-----------|----------|-------|
| Action Loop visualization | HIGH | Makes methodology explicit |
| Pattern library (shared) | HIGH | Connect Healing + Business |
| 3% reflection prompts | MEDIUM | After each action |
| Loop progress tracking | MEDIUM | Gamification element |
| Contextual resistance prompts | MEDIUM | When user hits blocks |

---

## Open Questions

### Methodology Questions

1. **Loop frequency** — Is the loop daily? Per task? Per stage?

2. **3% storage** — Where do 3% reflections live? Journal? Per-task notes?

3. **Pattern naming** — Use same names as Healing Tab patterns? Or business-specific names?

4. **Groan sizing** — Can users "size down" a groan if it's too big? (e.g., "Post on LinkedIn" → "Draft a post")

### UX Questions

1. **Entry point** — Does user see Action Loop first, or Stage tasks first?

2. **Resistance prompt** — Always ask "easy or hard"? Or only when user seems stuck?

3. **Healing Tab handoff** — How seamless is the transition when pattern needs deeper work?

4. **Progress display** — How do we show compound progress over time?

### Integration Questions

1. **Shared patterns** — Same database table for Healing + Business patterns?

2. **Frequency tracking** — Does business action completion affect Hawkins frequency?

3. **Groan → Evidence** — Does completing a groan automatically create "evidence against pattern"?

---

## Session Notes

### January 27, 2026 — Session 2 (Stage Implementation Planning)

**Key Insights:**
- PRE-ACTION should happen once per stage journey (when action is identified), not at every micro-step
- POST-ACTION (3% reflection) should be embedded at completion, not a separate challenge
- Groans should be reviewed per-stage — skip if redundant with main task
- Visibility layer descriptions need to be feeling-based statements, not just labels
- "How was that?" question compares predicted fear vs actual reality — this is where healing happens

**Decisions Made:**
- Stage 1 Validation implementation plan documented
- PersonaSelectionFlow needs update: add "Next Step: Validate" messaging + PRE-ACTION loop
- ValidationFlowsManager needs two buttons: "Log a Response" (per-response) + "Finalize Validation" (POST-ACTION)
- Stage 1 Groan should be skipped (redundant with validation task)

**Stage 1 Implementation Summary:**
| Component | PRE-ACTION | POST-ACTION |
|-----------|------------|-------------|
| PersonaSelectionFlow | ✅ End of flow | ❌ None |
| Log a Response | ❌ Skip | ⚡ Light |
| Finalize Validation | ❌ Skip | ✅ Full |
| Analyze Validation | ❌ Skip | ✅ Full |
| Stage 1 Groan | ❌ Skip | ❌ Skip |

**Next Steps:**
- [ ] Implement Stage 1 changes (PersonaSelectionFlow + ValidationFlowsManager)
- [ ] Review and document Stage 2-7 implementation details
- [ ] Create shared ResistanceCapture component for reuse across flows
- [ ] Design database schema for resistance pattern data

---

### January 27, 2026 — Session 1

**Key Insights:**
- Four pillars are ONE methodology (Action Loop), not separate features
- Pattern recognition is the bridge between Healing and Business tabs
- 3% system prevents perfectionism paralysis
- Groans serve dual purpose: direction finding + edge pushing

**Decisions Made:**
- Separate doc from Healing Tab (cross-reference instead)
- Focus on making the loop explicit in UX
- 2D Pattern Recognition Framework: WHERE (visibility layer) × HOW (protective voice)

**Next Steps:**
- [x] Document 2D Pattern Recognition Framework
- [x] Document Stage Action Items Reference
- [x] Document Stage 1 Implementation Details
- [ ] Document Stages 2-7 Implementation Details

---

*Last Updated: January 27, 2026*
