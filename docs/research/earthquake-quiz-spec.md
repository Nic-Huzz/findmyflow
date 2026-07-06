# The Earthquake Quiz — Implementation Spec

**Purpose:** Free lead magnet quiz that diagnoses the user's Protective Voice, awakening stage, and primary block. Captures email. Bridges to signup.

**Route:** `/try/earthquake`
**Auth:** None required
**Time:** 3-4 minutes (9 questions + results)
**Email gate:** Before full results reveal

---

## The Concept

"The Earthquake" is the moment someone realizes their conventional path isn't working. This quiz meets them at that moment and says: "You're not broken. Here's what's actually happening inside you."

It diagnoses FIVE things:
1. **Your loudest Protective Voice** (which of the 5 is dominant)
2. **Your awakening stage** (Matrix → Earthquake → Training → Becoming)
3. **Your primary block type** (Visibility / Money / Action)
4. **Where you've been shopping** (books / courses / therapy / quizzes — DAM intercept)
5. **Your awareness language level** (pre-language → pathless path → nervous system aware)

---

## Quiz Flow

### Screen 1: Hook

```
THE EARTHQUAKE QUIZ

Something cracked. You felt it.

Maybe it was a Sunday night dread that went too deep.
Maybe it was a promotion that felt hollow.
Maybe it was watching someone else live the life
you keep putting off.

That feeling has a name. And it's trying to tell
you something.

4 minutes. 9 questions. Zero fluff.

[Discover What's Blocking You →]
```

**Design:** Dark background, purple-to-gold gradient text on "That feeling has a name." Minimal. Cinematic.

---

### Screen 2: Question 1 — Stage Detection

```
Right now, which feels most true?

○ "I know something's off but I can't name it yet"
○ "I know I want more but I don't know what"
○ "I know what I want but I can't seem to do it"
○ "I'm building my thing but hitting walls"
```

**Scoring:**
- Option 1 → Matrix (pre-awakening)
- Option 2 → Earthquake (the crack)
- Option 3 → Early Training (blocked)
- Option 4 → Training (in progress)

---

### Screen 3: Question 2 — Voice Detection (Perfectionist)

```
When you think about putting yourself out there,
what's the FIRST thing that comes up?

○ "It's not ready yet. I need to prepare more."
○ "What will people think of me?"
○ "What if I can't control the outcome?"
○ "I should be doing more. I'm not enough yet."
○ "I'd rather stay invisible. Being seen feels unsafe."
```

**Scoring:** Each option maps directly to a voice:
- Option 1 → Perfectionist +3
- Option 2 → People Pleaser +3
- Option 3 → Controller +3
- Option 4 → Performer +3
- Option 5 → Ghost +3

---

### Screen 4: Question 3 — Voice Detection (behavioral)

```
Which pattern do you recognize most in yourself?

○ I endlessly prepare, revise, and polish — but rarely ship
○ I say yes to everything and hide what I really think
○ I need a plan for the plan before I can start
○ I'm always busy but never feel like it's enough
○ I have great work that nobody knows about
```

**Scoring:**
- Option 1 → Perfectionist +2
- Option 2 → People Pleaser +2
- Option 3 → Controller +2
- Option 4 → Performer +2
- Option 5 → Ghost +2

---

### Screen 5: Question 4 — Block Type Detection

```
What's the REAL reason you haven't made the leap?

○ "I'm scared of being judged or failing publicly"
○ "I can't afford the risk / need financial security first"
○ "I know what to do but I just... can't start"
○ "I don't know what my 'thing' actually is yet"
```

**Scoring:**
- Option 1 → Visibility block, Ghost +1
- Option 2 → Money block, Controller +1
- Option 3 → Action block, Perfectionist +1
- Option 4 → Clarity (stage = Earthquake), no voice points

---

### Screen 6: Question 5 — Voice Detection (emotional)

```
Which sentence makes your chest tighten?

○ "Just post it. It doesn't have to be perfect."
○ "Tell them what you really think."
○ "Start before you have a plan."
○ "Take a day off. You've done enough."
○ "Go live on camera right now."
```

**Scoring:**
- Option 1 → Perfectionist +2
- Option 2 → People Pleaser +2
- Option 3 → Controller +2
- Option 4 → Performer +2
- Option 5 → Ghost +2

---

### Screen 7: Question 6 — DAM Intercept (Category Pirates)

```
What have you tried so far to figure this out?

○ Books + podcasts (Pathless Path, Ikigai, 4HWW...)
○ Online courses + programs (altMBA, coaching certs...)
○ Therapy or coaching (1-on-1 sessions)
○ Quizzes + personality tests (MBTI, Enneagram, Sparketype...)
○ Nothing yet — I'm just starting to look
○ All of the above 😅
```

**Scoring:**
- Informs results page copy — intercepts their OLD category:
  - Books → "You've got the language. Now you need the system."
  - Courses → "You don't need more information. You need integration."
  - Therapy → "Therapy heals the past. FindMyFlow builds the future. You need both."
  - Quizzes → "Quizzes give labels. You need daily action that expands what feels safe."
  - Nothing → "Good — you're starting fresh. No bad habits to unlearn."
  - All → "You've been shopping in every aisle. The problem was never the store."
- Multiple selection allowed (shows depth of searching)
- "All of the above" = strong Caged Creator signal

**Category Pirates principle:** "DAMing the demand = intercepting people shopping in the OLD category and redirecting them to YOUR new category."

---

### Screen 8: Question 7 — Language/Awareness Level (Category Pirates)

```
Which of these phrases resonates most with you?

○ "I feel stuck but I don't know why"
○ "I'm on the pathless path but I don't have a system"
○ "I know my nervous system is blocking me"
○ "I need to escape the default path"
○ "I just want to find my thing and make money from it"
```

**Scoring:**
- Maps to awareness spectrum for personalized results language:
  - Option 1 → Pre-language (needs basic framing, introduce Protective Voices gently)
  - Option 2 → Pathless Path reader (use their vocabulary: "default path," "exploring," "redefining success")
  - Option 3 → Nervous system aware (skip basics, go deep: "somatic," "dysregulation," "capacity")
  - Option 4 → Escape-focused (address fear first, then reframe: "escape WITHOUT healing relocates the cage")
  - Option 5 → Tactical/business-first (needs the "it's not information, it's integration" reframe)
- Determines vocabulary level of entire results page
- Also informs email sequence tone

**Category Pirates principle:** "Use the language your superconsumers already speak." The Language Map determines which words land and which bounce.

---

### Screen 9: Question 8 — Depth / Course History

```
How many courses, books, or programs have you done
in the last 2 years trying to figure this out?

○ 0-2 (I'm just starting to look)
○ 3-5 (I've been exploring)
○ 6-10 (I've invested serious time and money)
○ 10+ (I have a problem 😅)
```

**Scoring:**
- Informs stage confidence + content personalization
- 6+ = "Chronic Course Consumer" flag (Caged Creator confirmed)
- 10+ = Use in results: "You don't need another course. You need integration."
- Combined with Q6 (DAM intercept), paints full picture of their journey so far

---

### Screen 10: Question 9 — Aspiration (open text, optional)

```
In one sentence: what would your life look like
if nothing was blocking you?

[Text input — optional, max 200 chars]

This helps us personalize your results.

[See My Results →]
```

**Purpose:** Emotional investment + data for Zarlo personalization later. Optional so it doesn't block completion.

---

### Screen 11: Email Gate

```
Your results are ready.

We found your loudest Protective Voice and what's
actually blocking you from the life you just described.

Enter your email to unlock your full report:

[Email input]
[Reveal My Results →]

🔒 No spam. Just your report + one follow-up.
```

**On submit:**
- Save to `earthquake_quiz_leads` table (email, answers, scores, voice, stage, block)
- Track with pixel: `trackEmailCaptured`
- Transition to results

---

### Screen 10: Results — The Reveal

**Layout:** Dramatic reveal with animation. Three cards that flip/appear sequentially.

```
YOUR EARTHQUAKE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛡️ YOUR LOUDEST PROTECTIVE VOICE

    THE GHOST
    "Visibility is dangerous. Stay small.
     Don't attract attention."

    This voice developed to protect you from the
    pain of being seen. It kept you safe when showing
    up meant getting hurt.

    But now it's the reason no one knows about
    your gifts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 YOUR AWAKENING STAGE

    ●━━━━━━━●━━━━━━━○━━━━━━━○
    Matrix  Earthquake  Training  Becoming
                ↑
            YOU ARE HERE

    You've felt the crack. You know something
    needs to change. But you haven't found the
    system to actually make the move.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚧 YOUR PRIMARY BLOCK

    VISIBILITY
    Score: 8/10

    Your nervous system has learned that being
    seen = danger. This isn't a mindset problem.
    It's a safety mechanism.

    The path forward isn't "just do it."
    It's gradual nervous system expansion through
    play — starting small, building evidence that
    visibility is safe.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Screen 11: The Bridge (CTA)

```
HERE'S WHAT MOST PEOPLE DO NEXT:

❌ Buy another course (you've done that)
❌ Try harder with willpower (you've done that too)
❌ Wait for clarity to arrive (it won't)

HERE'S WHAT ACTUALLY WORKS:

✅ Face The Ghost in small, safe challenges
✅ Expand what feels safe to your nervous system
✅ Build your unique Flow: Skills × Problems × People
✅ Turn your gifts into service — through play, not force

FindMyFlow is the training program for exactly this.

[Start Your Hero Training — Free for 7 Days →]

Or: [Share Your Results] [Retake Quiz]
```

---

## Scoring System

### Voice Scoring (max 8 points per voice)

| Question | Points |
|----------|--------|
| Q2 (first reaction) | 3 pts to one voice |
| Q3 (behavioral pattern) | 2 pts to one voice |
| Q4 (block reason) | 1 pt to one voice |
| Q5 (chest tightens) | 2 pts to one voice |

**Winner:** Highest scoring voice. If tie → use Q2 answer (strongest signal).

### Stage Scoring

Primary signal from Q1. Modified by:
- Q6 course history (10+ courses + still stuck = Earthquake/Early Training)
- Q4 answer (if "don't know my thing" = Earthquake)

### Block Type Scoring

Primary signal from Q4. Cross-referenced with voice:
- Ghost dominant → Visibility block likely
- Controller dominant → Money/Action block likely
- Perfectionist dominant → Action block likely
- Performer dominant → Action block (different flavor — can't stop, can't start the RIGHT thing)
- People Pleaser dominant → Visibility block (different flavor — fear of judgment)

---

## Database Schema

```sql
CREATE TABLE earthquake_quiz_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  
  -- Raw answers
  q1_stage TEXT NOT NULL,
  q2_first_reaction TEXT NOT NULL,
  q3_behavioral TEXT NOT NULL,
  q4_real_reason TEXT NOT NULL,
  q5_chest_tightens TEXT NOT NULL,
  q6_course_count TEXT NOT NULL,
  q7_dream_life TEXT,
  
  -- Computed results
  primary_voice TEXT NOT NULL,       -- perfectionist|people_pleaser|controller|performer|ghost
  voice_scores JSONB NOT NULL,       -- {"perfectionist": 3, "ghost": 5, ...}
  awakening_stage TEXT NOT NULL,     -- matrix|earthquake|training|becoming
  primary_block TEXT NOT NULL,       -- visibility|money|action|clarity
  
  -- Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  converted_to_signup BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX idx_earthquake_email ON earthquake_quiz_leads(email);

-- RLS: Service role only (public quiz writes via edge function or anon insert)
ALTER TABLE earthquake_quiz_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert" ON earthquake_quiz_leads FOR INSERT TO anon WITH CHECK (true);
```

---

## Voice Result Content

Each voice result includes:

### The Ghost
- **The Lie:** "Visibility is dangerous. Stay small. Don't attract attention."
- **How it protected you:** Kept you safe when being seen meant criticism, rejection, or pain.
- **How it blocks you now:** Nobody knows about your gifts. Your work is invisible. You have ideas that could help people but they never see the light.
- **The Kryptonite:** Being seen anyway. One post. One video. One conversation where you show up as yourself.
- **The stat:** "73% of FindMyFlow users with The Ghost as primary voice say visibility is their #1 block."

### The Perfectionist
- **The Lie:** "You're not ready yet. One more revision. One more course."
- **How it protected you:** Prevented public failure. Kept your self-image safe.
- **How it blocks you now:** You prepare endlessly but never ship. You've started 10 things and finished none. Your standards are so high nothing ever feels "good enough."
- **The Kryptonite:** Shipping something imperfect. Done beats perfect.
- **The stat:** "People with The Perfectionist as primary voice have an average of 6.2 unfinished projects."

### The Controller
- **The Lie:** "If you can't control the outcome, don't try."
- **How it protected you:** Prevented chaos and unexpected pain. Gave you the illusion of safety.
- **How it blocks you now:** Analysis paralysis. You need a plan for the plan. You can't start without certainty — which never comes.
- **The Kryptonite:** Taking one action without knowing the outcome.

### The Performer
- **The Lie:** "Do more. Be more. Then you'll finally be enough."
- **How it protected you:** Kept your worth tied to output, so you always had "proof" you mattered.
- **How it blocks you now:** Burnout cycles. Can't rest without guilt. You're busy with the wrong things because stopping feels like dying.
- **The Kryptonite:** Resting without guilt. Recognizing you're already enough.

### The People Pleaser
- **The Lie:** "They won't like the real you. Keep everyone happy."
- **How it protected you:** Prevented conflict and rejection by making you agreeable.
- **How it blocks you now:** You can't say what you really think. Your "personal brand" is everyone else's opinion of you. You've never shown the world who you actually are.
- **The Kryptonite:** Saying something true that might make someone uncomfortable.

---

## Shareable Results Card

Generate a shareable image/card:

```
┌─────────────────────────────────────┐
│                                     │
│  MY EARTHQUAKE REPORT               │
│                                     │
│  🛡️ Loudest Voice: THE GHOST        │
│  📍 Stage: EARTHQUAKE               │
│  🚧 Block: VISIBILITY (8/10)        │
│                                     │
│  "Visibility is dangerous.          │
│   Stay small."                      │
│                                     │
│  What's YOUR protective voice?      │
│  findmyflow.nichuzz.com/try/earthquake │
│                                     │
└─────────────────────────────────────┘
```

Purple-to-gold gradient background. Shareable to Instagram stories, Twitter, LinkedIn.

---

## Follow-Up Email Sequence (1 email)

**Email 1 (immediate after quiz):**

Subject: "Your Ghost has been running the show, [Name]"

Body:
> Here's the thing about The Ghost:
>
> It's not trying to hurt you. It learned that visibility = pain.
> So it keeps you hidden. Safe. Invisible.
>
> But safe and invisible also means: no one knows about your gifts.
>
> The path forward isn't "just be more confident."
> It's showing your nervous system that being seen is safe.
> One small action at a time.
>
> That's exactly what FindMyFlow's Playground does:
> Screen → Live → Money → Vulnerable → Authority
>
> Each layer is a deeper level of saying: "This is me."
>
> [Start your 7-day free trial →]
>
> — Huzz
> (Fellow Ghost-recoverer. Took me 52 Groans.)

---

## Technical Implementation Notes

### Component Structure

```
src/flows/
├── EarthquakeQuiz.jsx          -- Main quiz flow
├── EarthquakeQuiz.css          -- Styles
├── earthquakeQuizConfig.js     -- Questions, scoring, result content
└── EarthquakeResults.jsx       -- Results + share card generation
```

### Dependencies
- Existing: `PublicEmailGate`, `PublicFlowCTA`, pixel tracking
- New: Share card generation (canvas API or pre-built SVG templates)
- Supabase: New table `earthquake_quiz_leads`

### Router Addition
```jsx
<Route path="/try/earthquake" element={<EarthquakeQuiz />} />
```

### Landing Page Changes
```jsx
// Replace waitlist CTA:
<button onClick={() => navigate('/try/earthquake')}>
  Discover What's Blocking You
</button>

// Keep secondary:
<button onClick={() => navigate('/try/flow-audit')}>
  Audit Your Offer Stack
</button>
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Quiz start rate (from landing page) | >15% of visitors |
| Quiz completion rate | >70% |
| Email capture rate | >50% of completions |
| Share rate | >10% of completions |
| Signup conversion (within 7 days) | >8% of email captures |

---

## Design Notes

- **Mobile-first** — one question per screen, large tap targets
- **Purple → gold gradient** on results reveal (Matrix → Becoming)
- **Animations:** Results cards appear sequentially with slight delay (dramatic reveal)
- **Typography:** Large, cinematic. Like a movie title card.
- **No progress bar** — creates "how many questions left?" anxiety. Use subtle dots instead.
- **Voice-specific color accents** on results (each voice could have a subtle color)

---

*Created: 2026-02-12*
*Ready for implementation by Claude Code / CEO*
