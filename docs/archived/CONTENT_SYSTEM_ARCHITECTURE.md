# Content System Architecture

## Current State: Disconnected Systems

```
┌─────────────────────┐     ┌─────────────────────┐
│  Batch Generator    │     │   Content Autopilot │
│  (Manual, one-off)  │     │   (Scheduled, auto) │
└─────────────────────┘     └─────────────────────┘
         │                           │
         └─────────┬─────────────────┘
                   ↓
         ┌─────────────────────┐
         │   Content History   │
         │   (Storage only)    │
         └─────────────────────┘
```

**Problems:**
1. Batch-generated content doesn't flow into autopilot queue
2. No unified content pipeline
3. Approval workflow duplicated in both
4. Performance data doesn't feed back into generation

---

## Proposed: Unified Content Pipeline

```
                    ┌─────────────────────────┐
                    │    CONTENT SOURCES      │
                    └─────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Batch      │   │   Autopilot   │   │   Single      │
│  Generator    │   │  (Scheduled)  │   │  Generator    │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ↓
                    ┌─────────────────────────┐
                    │     CONTENT QUEUE       │
                    │  (Unified approval)     │
                    │                         │
                    │  Status: pending_review │
                    │          approved       │
                    │          scheduled      │
                    │          posted         │
                    └─────────────────────────┘
                              │
                              ↓
                    ┌─────────────────────────┐
                    │    APPROVAL QUEUE       │
                    │  (Single UI for all)    │
                    └─────────────────────────┘
                              │
                              ↓
                    ┌─────────────────────────┐
                    │   CONTENT CALENDAR      │
                    │  (Visual scheduling)    │
                    └─────────────────────────┘
                              │
                              ↓
                    ┌─────────────────────────┐
                    │    POST & TRACK         │
                    │  (Engagement data)      │
                    └─────────────────────────┘
                              │
                              ↓
                    ┌─────────────────────────┐
                    │   PERFORMANCE LOOP      │
                    │  (Feeds back to AI)     │
                    └─────────────────────────┘
```

---

## Implementation Changes Needed

### 1. Unify Content Queue

Modify `content_history` to become the central queue:

```sql
-- Add queue-related fields to content_history
ALTER TABLE content_history ADD COLUMN source TEXT;
-- 'batch', 'autopilot', 'single', 'imported'

ALTER TABLE content_history ADD COLUMN review_status TEXT DEFAULT 'pending';
-- 'pending', 'approved', 'rejected', 'needs_edit'

ALTER TABLE content_history ADD COLUMN scheduled_time TIMESTAMPTZ;
ALTER TABLE content_history ADD COLUMN auto_post BOOLEAN DEFAULT FALSE;
```

### 2. Batch Generator Updates

```javascript
// After batch generation, save to unified queue
async function handleSaveAll() {
  const contentToSave = generatedContent.map(c => ({
    user_id: userId,
    content: c.content,
    content_type: c.template.id,
    platform: c.platform,
    scheduled_day: c.day,
    source: 'batch',           // NEW: Track source
    review_status: 'pending',  // NEW: Needs approval
    status: 'draft'
  }))

  await supabase.from('content_history').insert(contentToSave)

  // Redirect to unified approval queue
  navigate('/crm/content-queue')
}
```

### 3. Single Approval Queue Component

```jsx
// ContentQueue.jsx - New unified approval UI
export default function ContentQueue() {
  // Shows ALL pending content from any source:
  // - Batch generated
  // - Autopilot generated
  // - Single generator (if saved as draft)

  // Same actions for all:
  // - Approve
  // - Edit
  // - Regenerate
  // - Schedule
  // - Delete
}
```

---

## 20% Improvements

### Batch Generator
1. **Topic/Theme Input** - Let users specify what they want content about
2. **Preview Mode** - Show template examples before generating
3. **Smart Defaults** - Pre-select content types based on performance data
4. **Partial Regenerate** - Regenerate individual posts, not entire batch
5. **Draft Save** - Save progress without generating

### Content Generator (Single)
1. **Quick Presets** - "Generate like my best post"
2. **Hashtag Suggestions** - Auto-generate relevant hashtags
3. **Hook Variants** - Generate 3 hook options to choose from
4. **CTA Library** - Quick-insert proven CTAs

### Autopilot (When Built)
1. **Smart Gaps** - Detect when user skipped days, offer catch-up
2. **Trend Awareness** - Factor in trending topics
3. **Engagement-Based Timing** - Learn optimal posting times

---

## 1000% Improvements (Game Changers)

### 1. The Intelligence Loop 🧠
**Current:** AI generates blindly
**Upgrade:** AI learns what works for YOUR audience

```
┌─────────────────────────────────────────────────────────────┐
│                   INTELLIGENCE LOOP                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Generate → Post → Track Engagement → Learn → Generate      │
│                                                             │
│  After 10 posts, AI knows:                                 │
│  - Your best-performing content types                       │
│  - Optimal posting times                                    │
│  - Hooks that work for your audience                        │
│  - Topics that resonate                                     │
│                                                             │
│  "Your transformation stories get 3x more engagement        │
│   than educational posts. Want me to prioritize those?"     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Voice DNA Extraction 🎙️
**Current:** User manually creates voice profile (30+ min)
**Upgrade:** Import existing content, AI extracts voice in 2 min

```
┌─────────────────────────────────────────────────────────────┐
│                   VOICE DNA EXTRACTION                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Paste your best content:                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [Your existing LinkedIn posts, blog, etc.]            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Or connect your accounts:                                  │
│  [📸 Instagram] [💼 LinkedIn] [🐦 Twitter]                 │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  🧬 Extracted Voice DNA:                                    │
│                                                             │
│  Tone: Conversational with authority (7/10 casual)         │
│  Signature phrases: "Here's the thing...", "Real talk:"    │
│  Sentence style: Short punchy. Then longer explanations.   │
│  Topics: Leadership, scaling, mindset                      │
│  Hooks: Questions, contrarian statements                   │
│                                                             │
│  [Use This Voice →]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Content Multiplication Engine 🔄
**Current:** Generate one post at a time
**Upgrade:** One idea → 10 pieces of content across platforms

```
┌─────────────────────────────────────────────────────────────┐
│               CONTENT MULTIPLICATION ENGINE                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Your input: "I just hit 6 figures while working 4 days"   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Generated (10 pieces):                                     │
│                                                             │
│  📸 Instagram:                                              │
│     • Story carousel (5 slides)                            │
│     • Caption post                                          │
│     • Reel script                                           │
│                                                             │
│  💼 LinkedIn:                                               │
│     • Long-form story post                                  │
│     • Short insight post                                    │
│                                                             │
│  🐦 Twitter:                                                │
│     • Thread (8 tweets)                                     │
│     • Single viral tweet                                    │
│                                                             │
│  📧 Email:                                                  │
│     • Newsletter section                                    │
│                                                             │
│  🎬 YouTube:                                                │
│     • Short script (60 sec)                                │
│                                                             │
│  [Generate All →]                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. AI Content Strategist 🎯
**Current:** User decides what to post
**Upgrade:** AI plans your entire content strategy

```
┌─────────────────────────────────────────────────────────────┐
│                  AI CONTENT STRATEGIST                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Based on your:                                             │
│  • Business goals (grow email list)                        │
│  • Audience (burnt-out coaches)                            │
│  • Best content (transformation stories)                   │
│  • Competitor analysis                                      │
│                                                             │
│  Here's your optimal content strategy for January:          │
│                                                             │
│  Week 1: Authority Building                                 │
│  ├─ Mon: Behind-scenes of your process                     │
│  ├─ Wed: Myth buster in your niche                         │
│  └─ Fri: Transformation story                              │
│                                                             │
│  Week 2: Pain Agitation → Offer Tease                      │
│  ├─ Mon: Problem post (agitate pain)                       │
│  ├─ Wed: Solution teaser                                   │
│  └─ Fri: Soft CTA to lead magnet                          │
│                                                             │
│  [Apply Strategy →] [Customize →]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Recommended Next Focus

### Immediate (This Sprint)
1. **Unify the content queue** - Single table, single approval UI
2. **Connect batch generator to queue** - Save drafts flow to approval

### Next Sprint
3. **Build approval queue UI** - Central place for all pending content
4. **Add performance tracking** - Manual engagement entry first

### Following Sprint
5. **Voice DNA Extraction** - Fastest path to 1000% improvement
6. **Intelligence Loop MVP** - Track what works, show insights

---

## Quick Win: Unified Queue Migration

```sql
-- Migration: Unify content systems
ALTER TABLE content_history
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT,
  ADD COLUMN IF NOT EXISTS regeneration_count INTEGER DEFAULT 0;

-- Index for queue queries
CREATE INDEX IF NOT EXISTS idx_content_history_review
  ON content_history(user_id, review_status, created_at DESC);

COMMENT ON COLUMN content_history.source IS 'Where content came from: single, batch, autopilot, imported';
COMMENT ON COLUMN content_history.review_status IS 'Approval status: pending, approved, rejected, needs_edit';
```
