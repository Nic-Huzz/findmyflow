# Marketing Tower: Three Pillars Implementation Plan
*January 7, 2026*

## Overview

This document outlines the implementation plan for strengthening the three core pillars of the Marketing Tower:

1. **Strategy** - Goal-based strategy with industry benchmarks
2. **Generation** - Content that executes the strategy (current + future)
3. **Intelligence** - Performance tracking that improves over time

---

## Pillar 1: Goal-Based Strategy System

### Concept: Reverse-Engineer from Revenue

Work backwards from the user's revenue goal to determine required reach:

```
Revenue Goal → Customers Needed → Leads Needed → Reach Needed → Posts Needed
```

### Industry Benchmark Conversion Rates

Based on [Ruler Analytics](https://www.ruleranalytics.com/blog/insight/conversion-rate-by-industry/), [Sprout Social](https://sproutsocial.com/insights/social-media-benchmarks-by-industry/), and internal FunnelCalculator defaults:

| Stage | Benchmark Rate | Notes |
|-------|----------------|-------|
| Reach → Engagement | 5% | Avg engagement rate on posts |
| Engagement → Lead | 25% | Opt-in rate for lead magnet |
| Lead → Nurture Engaged | 40% | Open/click nurture sequence |
| Nurture → Customer | 5% | Purchase conversion |
| Customer → Upsell | 20% | Upsell take rate |
| Customer → Downsell | 30% | Downsell (of non-upsellers) |
| Customer → Continuity | 15% | Subscription rate |

### Example Calculation

User Goal: **$10,000/month** revenue
Core Offer Price: **$500**

```
Customers needed: $10,000 / $500 = 20 customers
Nurtured leads needed: 20 / 5% = 400 engaged leads
Total leads needed: 400 / 40% = 1,000 leads
Engagements needed: 1,000 / 25% = 4,000 engagements
Reach needed: 4,000 / 5% = 80,000 people

Posts to reach 80K/month:
- If avg reach per post = 1,000 → 80 posts/month → ~20/week
- If avg reach per post = 5,000 → 16 posts/month → 4/week
```

### Database Schema Addition

```sql
-- Add to content_strategies table
ALTER TABLE content_strategies ADD COLUMN IF NOT EXISTS
  revenue_goal DECIMAL(10,2),
  customer_goal INTEGER,
  lead_goal INTEGER,
  reach_goal INTEGER,
  post_frequency_target INTEGER, -- posts per week
  custom_conversion_rates JSONB; -- override industry defaults
```

### UI Flow: Goal-Based Strategy Setup

**New Step 0: Set Your Revenue Goal**
```
"What's your monthly revenue target?"
[$__________] / month

"What's your core offer price?"
[$__________]

→ Calculate and show:
"To hit $10K/month at $500/offer, you need ~20 customers
Based on industry averages, that means:
- 1,000 leads captured
- 80,000 people reached
- ~20 posts per week (at 1K reach each)"

[Looks too much?] → "Let's see how to reduce this with better conversion rates"
[Looks achievable!] → Continue to platform selection
```

### Progress Bar Per Post

Each post contributes to the monthly goal:

```
Monthly Goal: 80,000 reach
Posts this month: 12 of 20
Estimated reach: 12,000 of 80,000 (15%)

[████████░░░░░░░░░░░░] 15% to goal
```

Implementation:
1. On post completion, estimate reach (can use platform-specific avg or actual metrics if available)
2. Sum total reach for the month
3. Show progress bar on Marketing Dashboard and each task card

---

## Pillar 2: Content Generation (Future Features)

### Current Implementation ✅
- AI content generator with voice matching
- Batch generation (week at a time)
- Voice DNA extraction from samples
- Content approval queue
- Context gathering (persona, offer, validation, performance)
- 7-day content type rotation
- **Story Bank** - Library of reusable content (stories, wins, takes) organized by category
- **Quick Context** - Per-post brain dumps (voice/text) for guided AI generation
- Voice recording for Story Bank entries
- Weekly Planning Session with preview + context input

### Future Features (Documented for Later)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Autopilot Mode** | Auto-generate next week's content every Sunday | High |
| **Social Media API** | One-click publish to Buffer/Later/Hootsuite | High |
| **Content Recycling** | Auto-resurface top performers after 90 days | Medium |
| **A/B Testing** | Track which variations perform better | Medium |
| **Multi-format Adapt** | Convert post → story → reel automatically | Medium |
| **Trending Topics** | Integrate trending hashtags/topics | Low |
| **Collaboration** | Team review/approval workflow | Low |

### Autopilot Mode (Future Sprint)

```
Every Sunday at 8pm:
1. Check if next week's content exists
2. If not, auto-generate based on strategy
3. Send notification: "Your week's content is ready for review"
4. User approves in bulk or edits individually
5. Content scheduled for posting
```

### Story Bank Enhancement Roadmap (10x → 1000000x Better)

**Current State (V1):** Manual story capture with category prompts

| Level | Feature | Impact | Complexity |
|-------|---------|--------|------------|
| **10x** | **AI Interview Mode** - Guided questions to extract stories ("Tell me about a time a client...") | Stories flow naturally vs manual writing | Medium |
| **10x** | **Screenshot-to-Story** - Upload DM/testimonial screenshot → AI extracts story | Capture wins instantly | Low |
| **10x** | **Story Performance Tracking** - Track which stories get most engagement when used | Double down on what works | Low |
| **100x** | **Auto-Mine Content History** - AI scans past content to extract reusable stories | Instant library from existing work | Medium |
| **100x** | **Story Variations Generator** - One story → 5 angles (carousel, thread, reel script, email) | 5x content from 1 input | Medium |
| **100x** | **Voice Cleanup AI** - Transcription + cleanup (remove ums, structure sentences) | Better voice capture quality | Low |
| **1000x** | **Story Gap Analysis** - AI identifies missing story types ("You have no failure_lesson stories") | Guided library building | Medium |
| **1000x** | **Story Templates** - Hero's Journey, PAS, Before/After frameworks with fill-in-blanks | Structured story capture | Low |
| **1000x** | **Auto-Link to Content Types** - AI suggests which stories to use for each post type | Smarter generation | Low |
| **10000x** | **Story Memory** - AI remembers all stories, uses naturally without explicit selection | True voice cloning | High |
| **1000000x** | **Community Story Patterns** - Anonymous aggregation of high-performing story structures | Learn from network | High |

**Quick Wins (This Week):**
1. Screenshot-to-Story capture from DMs/testimonials
2. Story usage tracking (which stories perform best)
3. Story gap analysis (what's missing from your library)

---

## Pillar 3: Intelligence Engine

### Part A: Fix Voice Feedback Loop

**Problem:** Voice feedback is collected but never read back.

**Solution:** Aggregate feedback and include in voice instructions.

#### New Function: `getVoiceFeedbackInsights(userId)`

```javascript
/**
 * Aggregate voice feedback to improve future generations
 * Returns insights like: "User says content is too formal (5x),
 * not their words (3x)"
 */
export async function getVoiceFeedbackInsights(userId) {
  const { data } = await supabase
    .from('voice_feedback')
    .select('feedback_options, feedback_comment')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20) // Last 20 feedback submissions

  if (!data || data.length === 0) return null

  // Count feedback option occurrences
  const optionCounts = {}
  const comments = []

  data.forEach(feedback => {
    (feedback.feedback_options || []).forEach(option => {
      optionCounts[option] = (optionCounts[option] || 0) + 1
    })
    if (feedback.feedback_comment) {
      comments.push(feedback.feedback_comment)
    }
  })

  // Find top issues (mentioned 2+ times)
  const topIssues = Object.entries(optionCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return {
    topIssues,
    recentComments: comments.slice(0, 3),
    totalFeedback: data.length
  }
}
```

#### Updated `buildVoiceInstructions(voiceProfile, feedbackInsights)`

```javascript
export function buildVoiceInstructions(voiceProfile, feedbackInsights = null) {
  // ... existing voice instructions ...

  // Add feedback-based corrections
  if (feedbackInsights?.topIssues?.length > 0) {
    instructions += `
IMPORTANT - User has given feedback on previous generations:
`
    feedbackInsights.topIssues.forEach(([issue, count]) => {
      const correction = FEEDBACK_CORRECTIONS[issue]
      if (correction) {
        instructions += `- ${correction}\n`
      }
    })
  }

  return instructions
}

const FEEDBACK_CORRECTIONS = {
  'too_formal': 'Make it MORE casual - user says previous content was too stiff',
  'too_casual': 'Make it MORE professional - user says previous content was too casual',
  'wrong_tone': 'Pay extra attention to matching their energy level',
  'not_my_words': 'Use simpler, more natural language - avoid jargon',
  'too_generic': 'Be MORE specific and personal - avoid generic advice',
  'missing_personality': 'Inject more personality and unique perspective',
  'wrong_structure': 'Vary sentence structure more naturally'
}
```

### Part B: Performance Intelligence Engine

**Goal:** Learn what content works and feed insights back into strategy.

#### Data Collection (Already Exists)
- `marketing_tasks` - engagement_likes, comments, shares, dms
- `content_history` - engagement_data JSONB

#### New: Performance Insights Function

```javascript
/**
 * Analyze performance data to generate actionable insights
 */
export async function getPerformanceInsights(userId) {
  // 1. Fetch last 30 days of posted content with metrics
  const { data: content } = await supabase
    .from('content_history')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'posted')
    .gte('posted_at', thirtyDaysAgo)

  // 2. Analyze patterns
  const insights = {
    bestContentType: findBestPerforming(content, 'content_type'),
    bestDayOfWeek: findBestPerforming(content, 'day_of_week'),
    bestPlatform: findBestPerforming(content, 'platform'),
    avgEngagement: calculateAvgEngagement(content),
    topPerformers: getTopN(content, 3),
    trends: {
      engagementTrend: calculateTrend(content, 'engagement'),
      reachTrend: calculateTrend(content, 'reach')
    }
  }

  // 3. Generate recommendations
  insights.recommendations = generateRecommendations(insights)

  return insights
}

function generateRecommendations(insights) {
  const recs = []

  if (insights.bestContentType) {
    recs.push({
      type: 'content_type',
      message: `Your ${insights.bestContentType.name} posts get 2x more engagement. Create more of these.`,
      action: 'increase_frequency',
      data: insights.bestContentType
    })
  }

  if (insights.bestDayOfWeek) {
    recs.push({
      type: 'timing',
      message: `${insights.bestDayOfWeek} is your best day. Schedule key content then.`,
      action: 'optimize_schedule',
      data: insights.bestDayOfWeek
    })
  }

  return recs
}
```

#### Intelligence Dashboard Widget

On CRM Dashboard, show:
```
┌─────────────────────────────────────┐
│ 💡 This Week's Insights             │
├─────────────────────────────────────┤
│ 📈 Your carousels get 3x more       │
│    engagement than text posts       │
│                                     │
│ 📅 Tuesday is your best day         │
│    (avg 45 likes vs 20 other days)  │
│                                     │
│ 🎯 Suggestion: Schedule your        │
│    carousel for Tuesday             │
└─────────────────────────────────────┘
```

### Part C: Strategy Auto-Adjustment

Over time, replace industry benchmarks with user's actual data:

```javascript
/**
 * Calculate user's actual conversion rates from historical data
 */
export async function getUserConversionRates(userId) {
  // Fetch user's actual funnel data
  const { data } = await supabase
    .from('funnel_metrics')
    .select('actual_values')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(12) // Last 12 weeks

  if (!data || data.length < 4) {
    return null // Not enough data, use industry defaults
  }

  // Calculate actual rates
  const rates = calculateActualRates(data)

  // Update strategy with personalized rates
  return {
    source: 'user_data',
    confidence: data.length >= 8 ? 'high' : 'medium',
    rates
  }
}
```

**UI: Personalized vs Industry**
```
Your Conversion Rates:
Engagement → Lead: 32% (vs 25% industry avg) ⬆️
Lead → Customer: 8% (vs 5% industry avg) ⬆️

🎉 Your funnel outperforms industry by 60%!
Updated goal: You only need 12 posts/week (not 20)
```

---

## Implementation Priority

### Sprint 1: Voice Feedback Fix ✅
1. [x] Create `getVoiceFeedbackInsights()` function
2. [x] Update `buildVoiceInstructions()` to include feedback
3. [x] Test generation with feedback corrections

### Sprint 2: Story Bank + Quick Context ✅ (Jan 9, 2026)
1. [x] Create `story_bank` database table with 10 categories
2. [x] Build StoryBank component with guided prompts per category
3. [x] Add voice recording support to Story Bank
4. [x] Create Quick Context UI in Weekly Planning (per-post brain dumps)
5. [x] Integrate Story Bank into content generation pipeline
6. [x] Wire StoryBank into CRMMarketing header

### Sprint 3: Goal-Based Strategy ✅ (Jan 9, 2026)
1. [x] Add goal fields to content_strategies table (revenue_goal, customer_goal, etc.)
2. [x] GoalBasedStrategy component exists and is functional
3. [ ] Add progress bar to Marketing Dashboard (future)

### Sprint 4: Story Bank Enhancements (10x-1000x) ✅ (Jan 9, 2026)
1. [x] **AI Interview Mode** - Guided questions per story category (all 10 categories)
2. [x] **Screenshot-to-Story** - Upload testimonial/DM screenshots → AI extracts stories
3. [x] **Auto-Mine Content History** - Select past posts → AI extracts reusable stories
4. [x] **Story Performance Tracking** - track use_count, avg_engagement, performance_score
5. [x] **Story Gap Analysis** - Shows missing story types with "Add" buttons
6. [x] **Story Memory** - Auto-select stories for content based on relevance, recency, performance
7. [x] **StoryMiner component** - Combined Screenshot + Content Mining UI

### Sprint 5: Intelligence Engine ✅ (Jan 9, 2026)
1. [x] Create `getPerformanceInsights()` function - analyzes 30 days of content data
2. [x] Build Insights widget for CRM Dashboard - `IntelligenceWidget.jsx`
3. [x] Implement recommendations system - auto-generates actionable suggestions
4. [x] Add strategy auto-adjustment - personalized conversion rates from funnel data
5. [x] Voice feedback loop integrated into content generation

### Sprint 6: Personalized Benchmarks ✅ (Jan 9, 2026)
1. [x] Track actual conversion rates over time - `getUserConversionRates()` in intelligenceEngine.js
2. [x] Replace industry defaults with user data - automatic when 3+ campaigns tracked
3. [x] Show confidence level on projections - low/medium/high based on data volume
4. [x] Compare user rates to industry benchmarks - visual comparison in widget

---

## Summary

| Pillar | Current State | Target State | Live Test Ready? |
|--------|---------------|--------------|------------------|
| **Strategy** | ✅ Goal-based + personalized benchmarks | Complete | ✅ Yes |
| **Generation** | ✅ Story Bank + Story Memory + Voice Feedback + Approval Queue | Autopilot mode (future) | ✅ Yes |
| **Intelligence** | ✅ Performance insights + recommendations + feedback loop | Complete | ✅ Yes |

---

## Live Test Readiness Assessment

### What's Ready for Testing

| Feature | Status | Notes |
|---------|--------|-------|
| Weekly content generation | ✅ Ready | Weekly Planning Session with story selection |
| Voice profile / DNA extraction | ✅ Ready | Template or custom extraction |
| Story Bank with 10 categories | ✅ Ready | AI Interview + Screenshot mining |
| Content approval queue | ✅ Ready | Bulk approve + rejection feedback |
| Mark content as posted | ✅ Ready | Status dropdown in Content History |
| Metrics entry (screenshot) | ✅ Ready | MetricsScreenshotUpload component |
| Intelligence insights | ✅ Ready | Dashboard widget with recommendations |
| Voice feedback loop | ✅ Ready | Rejection reasons feed into future generation |

### Suggested Test Protocol (1 Week)

**Day 1-2: Setup**
- Complete Voice DNA extraction OR select template
- Add 3-5 stories to Story Bank (use AI Interview)
- Generate first week of content
- Approve/reject through queue

**Day 3-5: Publish & Track**
- Post approved content to platforms
- Mark as "posted" in Content History
- Upload metrics screenshots after 24-48 hours

**Day 6-7: Analyze & Iterate**
- Review Intelligence Widget insights
- Note any voice feedback patterns
- Generate next week's content (should be improved)

### Minimum Viable for Live Test

The core loop is complete:
```
Strategy → Generate → Approve → Post → Track Metrics → Insights → Better Generation
```

### Nice-to-Have (Post-Test)
- Quick manual metrics entry (vs screenshot only)
- Daily posting reminder notifications
- One-click publish to Buffer/Later
- Auto-generate next week on Sunday (Autopilot)

---

## Future Improvement Roadmap

### 20% Improvements (Polish & UX)

| Improvement | Impact | Effort | Status |
|-------------|--------|--------|--------|
| **Quick Metrics Entry** - Manual input fields alongside screenshot upload | Faster data entry | 1-2 hrs | 📋 Planned |
| **Post Reminder Badge** - "3 posts ready" badge with checklist | Don't forget to post | 1 hr | 📋 Planned |
| **Approval Queue Toast** - "5 posts approved! Copy to clipboard?" | Faster workflow | 30 min | 📋 Planned |
| **Regenerate Preview** - Side-by-side old vs new before replacing | Confidence in regen | 1 hr | 📋 Planned |
| **Progress Bar on Dashboard** - Visual progress toward monthly goal | Motivation | 2 hrs | ✅ Done |

### 100% Improvements (New Capabilities)

| Improvement | Impact | Effort | Status |
|-------------|--------|--------|--------|
| **One-Click Publish Queue** - Buffer/Later API integration | Eliminate manual posting | 4-6 hrs | 📋 Planned |
| **Story Variation Generator** - One story → 5 formats (carousel, thread, reel, email, quote) | 5x content from 1 input | 3-4 hrs | 📋 Planned |
| **Content Performance Predictor** - AI scores drafts before posting | Smarter approval decisions | 4 hrs | 📋 Planned |
| **Weekly Digest Email** - Auto-send "Your week: 5 posts, 234 likes..." | Passive engagement | 2-3 hrs | 📋 Planned |
| **Voice A/B Testing** - Same post in 2 voice variations, track performance | Optimize voice | 4 hrs | 📋 Planned |
| **Give vs Ask Tagging** - Tag posts as brand-building or sales, track CTA conversions | Funnel attribution | 3 hrs | ✅ Done |

### 1,000,000% Improvements (Transformational)

| Improvement | Impact | Effort | Status |
|-------------|--------|--------|--------|
| **Full Autopilot** - Sunday: analyze → generate → schedule → notify | Zero-effort content | 8-12 hrs | 📋 Planned |
| **Multi-Platform Adaptation** - One piece → IG, LinkedIn, Twitter, TikTok, Email | True omni-channel | 6-8 hrs | 📋 Planned |
| **Audience Intelligence** - Scrape competitor top performers, apply patterns | Learn from market | 10+ hrs | 📋 Planned |
| **Conversation Mining** - DMs/comments → AI extracts pain points → content ideas | Content from conversations | 10+ hrs | 📋 Planned |
| **Revenue Attribution** - Track which posts led to sales, auto-double-down | Direct ROI visibility | 8+ hrs | 📋 Planned |
| **Voice Evolution** - AI detects voice shifts, suggests profile updates | Self-improving voice | 6 hrs | 📋 Planned |

---

## Changelog

### Jan 9, 2026 (Session 6) - Give/Ask Strategy Integration
- ✅ **Give/Ask Content Patterns** - 4 patterns added to content-generator:
  - `3_1`: 3 gives, 1 ask (75% value)
  - `4_1`: 4 gives, 1 ask (80% value)
  - `5_day_mixed`: Mon-Fri with ask mid-week (80% value)
  - `7_day_optimal`: Full week with 2 asks strategically placed (71% value)
- ✅ **Ask Post Generator** - New `generate_ask` action with:
  - Structured output: Headline + Body + CTA
  - CTA type selection (DM, link, comment keyword, signup, call)
  - 2 headline/CTA variations per generation
  - Platform-specific formatting
- ✅ **CTA Templates** - 5 CTA types with examples:
  - DM Me: "DM me 'READY' and I'll send you the details"
  - Link Click: "Tap the link in my bio to get started"
  - Comment Keyword: "Comment 'YES' and I'll DM you the link"
  - Direct Signup: "Join 5,000+ others → [link]"
  - Book Call: "Book a free strategy call → [link]"
- ✅ **New API Actions**:
  - `generate_ask` - Headline + CTA structured generation
  - `weekly_plan_give_ask` - Pattern-based weekly planning
  - `give_ask_patterns` - Get patterns and CTA templates
- ✅ Deployed updated content-generator edge function

### Jan 9, 2026 (Session 7) - Nervous System Pattern Tracking
- ✅ **Task Skip Capture** - Modal to understand why users don't complete tasks:
  - Category selection: External (practical blockers) vs Internal (resistance)
  - External reasons: No time, forgot, technical issue, other priorities, waiting, not relevant
  - Internal reasons: Fear of judgment, not good enough, fear of failure/success, perfectionism, overwhelm, imposter syndrome, visibility fear, rejection fear
  - Intensity slider for internal resistance (1-10)
  - Notes field for additional context
- ✅ **Database Schema** - `20260109010000_task_skip_tracking.sql`:
  - `task_skip_reasons` table with full taxonomy
  - RLS policies for user data protection
  - `user_skip_patterns` view for 30-day aggregation
- ✅ **Nervous System Analytics** - New functions in intelligenceEngine.js:
  - `getNervousSystemPatterns()` - Analyzes skip reasons over 30 days
  - `calculateTrendDirection()` - Tracks if resistance is improving/increasing
  - `generateNervousSystemInsights()` - Human-readable pattern insights
  - `getResistanceHistory()` - History for specific reason types
  - `getTaskCompletionAnalysis()` - Completed vs skipped ratio
- ✅ **Auto-Insights Generation**:
  - "Internal resistance is your main blocker" (when >60% internal)
  - "#1 resistance pattern" with intensity and trend
  - High-intensity warning when multiple fears show strongly
  - Progress celebration when patterns are improving
- ✅ **DailyPriorities Integration** - TaskSkipCapture shows when dismissing tasks
- ✅ **Component Exports** - TaskSkipCapture + reason constants available from CRM index

### Jan 9, 2026 (Session 6) - Give/Ask Strategy Framework
- ✅ **Give/Ask Patterns** - 4 battle-tested content ratios:
  - 3:1 (Give Give Give Ask) - 75% give
  - 4:1 (Give Give Give Give Ask) - 80% give
  - 5-day mixed (Give Give Ask Give Give) - 80% give
  - 7-day optimal (Give Give Ask Give Give Ask Give) - 71% give
- ✅ **CTA Templates** - 5 types with examples:
  - DM Me ("DM me 'READY' and I'll send details")
  - Link Click ("Tap the link in bio")
  - Comment Keyword ("Drop 'YES' below")
  - Sign Up ("Grab my free guide")
  - Book Call ("Schedule your free call")
- ✅ **Ask Content Generation** - Structured output:
  - Headline (attention-grabbing)
  - Body (with embedded urgency)
  - CTA object (type, text, keyword)
  - 2 variations for A/B testing
- ✅ **Weekly Plan Integration** - Auto-places Give/Ask based on pattern
- ✅ **New API Actions**:
  - `generate_ask` - Headline + CTA structured generation
  - `weekly_plan_give_ask` - Pattern-based weekly planning
  - `give_ask_patterns` - Get patterns and CTA templates
- ✅ Deployed updated content-generator edge function

### Jan 9, 2026 (Session 5) - Voice DNA, Give/Ask, Progress Bar
- ✅ **Voice DNA Enhancement** - Full voice patterns now used in generation:
  - Hook styles (how they start content)
  - Closing styles (how they end content)
  - Do's and Don'ts (critical voice boundaries)
  - Signature phrases auto-woven in
- ✅ **Give/Ask Content Tagging** - Hormozi-style content classification:
  - Give = Brand building, value (target 75%)
  - Ask = Sales, CTAs (target 25%)
  - CTA type tracking (DM, link, comment, signup, call)
  - CTA engagement + conversion tracking
  - Funnel stage attribution
- ✅ **Content Progress Bar** - Dashboard widget showing:
  - Posts this month vs target
  - Estimated reach vs goal
  - Give/Ask ratio visualization
  - Days remaining in month
- ✅ **Database Migration** - `20260109000000_give_ask_tagging.sql`:
  - Added content_intent, cta_type, cta_text columns
  - Added cta_engagements, cta_conversions tracking
  - Created cta_conversions table for attribution
- ✅ **Intelligence Engine** - New analytics functions:
  - `getGiveAskAnalytics()` - ratio and CTA performance
  - `getMonthlyProgress()` - progress toward goals
  - `trackCTAConversion()` - conversion attribution

### Jan 9, 2026 (Session 4) - Approval Queue & Live Test Ready
- ✅ **Enhanced Regeneration** - ApprovalQueue now uses full context:
  - Voice profile with feedback corrections
  - Story memory (auto-selects relevant stories)
  - Content context (persona, offer, validation data)
  - Previous content snippet to avoid repetition
- ✅ **Rejection Feedback Loop** - When rejecting content:
  - Modal with 8 quick-select reasons (too formal, off brand, wrong angle, etc.)
  - Feedback saved to `voice_feedback` table
  - AI learns from rejections to improve future content
- ✅ **Intelligence Widget Polish**:
  - Skeleton loading with shimmer animation
  - Empty state CTAs linking to content creation, metrics upload, funnel tracking
- ✅ **New Function**: `saveVoiceFeedback()` in voiceProfile.js
- 📊 **Live Test Assessment**: All 3 pillars ready for 1-week live test

### Jan 9, 2026 (Session 3) - Intelligence Engine
- ✅ **Performance Intelligence** - `getPerformanceInsights()` analyzes:
  - Best content types by engagement
  - Best posting days
  - Best platforms
  - Top performing posts
  - Engagement trends (week over week)
- ✅ **Recommendations System** - Auto-generates actionable suggestions:
  - Content type recommendations ("Carousels get 3x more engagement")
  - Timing recommendations ("Tuesday is your best day")
  - Platform focus suggestions
  - Trend alerts (engagement up/down)
- ✅ **Personalized Benchmarks** - `getUserConversionRates()`:
  - Tracks actual funnel conversion rates from user data
  - Compares to industry benchmarks
  - Shows confidence level (low/medium/high)
  - Auto-adjusts goal calculations
- ✅ **Intelligence Widget** - `IntelligenceWidget.jsx`:
  - Quick stats (posts, stories, avg engagement)
  - Highlights section (key insights)
  - Voice feedback applied alert
  - Expandable details with recommendations
  - Funnel comparison view
  - Top performers list
- ✅ **Voice Feedback Loop Active** - WeeklyPlanningSession now:
  - Fetches user's past voice feedback
  - Injects corrections into AI prompts
  - AI learns from "too formal", "not my words" etc.
- ✅ Deployed edge functions: `extract-story-from-image`, `mine-stories-from-content`

### Jan 9, 2026 (Session 2)
- ✅ **AI Interview Mode** - Added INTERVIEW_QUESTIONS for all 10 story categories with guided prompts
- ✅ **Story Performance Tracking** - Added use_count, avg_engagement, performance_score to story_bank table
- ✅ **Story Gap Analysis** - Implemented getStoryGapAnalysis() with visual alert in StoryBank UI
- ✅ **Story Memory** - Implemented selectStoriesForContent() with smart selection based on relevance, recency, performance
- ✅ **Screenshot-to-Story** - Created extract-story-from-image edge function using Claude vision
- ✅ **Auto-Mine Content History** - Created mine-stories-from-content edge function
- ✅ **StoryMiner Component** - Combined UI for both screenshot upload and content mining
- ✅ **Goal-Based Strategy DB** - Added goal columns to content_strategies table
- ✅ Updated WeeklyPlanningSession to use Story Memory for automatic story selection

### Jan 9, 2026 (Session 1)
- ✅ Story Bank implemented (10 categories with guided prompts)
- ✅ Quick Context per-post brain dumps in Weekly Planning
- ✅ Voice recording for Story Bank entries
- ✅ Story Bank integrated into content generation pipeline
- ✅ Story Bank accessible from CRMMarketing header
- 📝 Documented Story Bank enhancement roadmap (10x → 1000000x)

### Jan 7, 2026
- Initial document created
- Voice feedback integration completed
