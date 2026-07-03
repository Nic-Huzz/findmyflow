# Octalysis Future Features

Features identified during Octalysis framework analysis for future implementation.

---

## 1. Zarlo Personalization (CD1: Epic Meaning)

### Current State
- Zarlo has access to user's wheel data (skills, problems, personas)
- `wheelContext`, `wheelSummary`, `gapAnalysis` already generated in `zarloEngine.js`
- Responses are currently template-based, not dynamically personalized

### Future Implementation Options

**Option A: Template-Based Personalization (Lower effort)**
- Add template variables that reference wheel data
- Create response variations for different wheel combinations
- Example: `"Given your gift for ${topSkill}, here's how I'd approach pricing..."`

**Option B: AI-Driven Personalization (Higher effort)**
- Send wheel data to Claude API for truly personalized responses
- Dynamic, contextual, unique per user
- Higher API costs but genuinely personal

### Key Personalization Points
1. Pricing/money advice → reference their persona
2. Visibility advice → reference their skills
3. Content ideas → reference their problems they solve
4. Encouragement → reference their essence archetype

### Files to Modify
- `src/lib/zarlo/zarloEngine.js` - add personalization layer
- `src/lib/zarlo/zarloPageContent.js` - add template variables
- `src/components/Zarlo/ZarloChat.jsx` - handle personalized responses

---

## 2. Skill Trees / Essence-Aligned Milestones (CD2: Accomplishment)

### Decision Pending
Traditional skill trees (volume-based) may conflict with FindMyFlow's philosophy of working WITH your nervous system. Alternative: Essence-aligned milestones that reward courage and consistency over volume.

### Option A: Traditional Skill Trees (Volume-Based)
```
ATTRACT TOWER
├─ Content Creator I (5 posts) → II (25) → III (100)
├─ Page Builder I (1 page) → II (5) → III (20)

NURTURE TOWER
├─ Contact Keeper I (10) → II (50) → III (200)
├─ Sequence Builder I (1) → II (5) → III (10)
├─ Pipeline Pro I ($1k) → II ($10k) → III ($50k)
```

**Pros:** Clear progression, motivating thresholds
**Cons:** Encourages grinding, may feel inauthentic

### Option B: Essence-Aligned Milestones (Courage-Based)
```
ATTRACT TOWER
├─ First Voice (create 1st content) - "You spoke"
├─ Consistent Creator (7 days of content) - "You showed up"
├─ Visible (share publicly) - "You were seen"

NURTURE TOWER
├─ First Connection (add 1st contact) - "You reached out"
├─ Relationship Builder (send 1st sequence) - "You nurtured"
├─ Value Creator (close 1st deal) - "You exchanged value"

TOOLS TOWER
├─ Data Curious (view analytics) - "You looked"
├─ Truth Seeker (review funnel) - "You faced the numbers"
├─ Optimizer (make data-driven change) - "You evolved"
```

**Pros:** Fits FindMyFlow philosophy, rewards courage over volume
**Cons:** Fewer milestones, less "game-y" progression

### Questions to Resolve
1. Volume-based or courage-based?
2. Should milestones unlock features or just recognition?
3. Visual journey map or simple badge collection?

### Files to Create/Modify
- `src/lib/crm/skillTrees.js` or `milestonesConfig.js` - define structure
- `src/components/crm/SkillTree.jsx` or `MilestoneMap.jsx` - visual component
- `src/pages/crm/` tower pages - display progress

---

## 3. Anticipation Triggers via Zarlo (CD2: Accomplishment)

### Concept
Zarlo pops up at key moments to build excitement before rewards, creating anticipation and strengthening the Zarlo relationship.

### Priority Triggers (Start Here)

| Priority | Trigger | Zarlo Message |
|----------|---------|---------------|
| 1 | 1 challenge from stage graduation | "You're ONE challenge away from unlocking [Next Stage]. Your Stage Groan awaits. Ready?" |
| 2 | Day 6 of 7 streak | "Tomorrow makes a perfect week. Your nervous system is learning: you can be consistent." |
| 3 | 9/10 weekly actions | "You're ONE away from completing your weekly goal. One more and you've proven something to yourself." |
| 4 | First-time achievements | "You did it. Your first [X]. And look — you survived. That's the lesson." |
| 5 | Return after 3+ day gap | "Hey, you're back. No judgment here — life happens. Want to ease back in?" |

### Future Triggers (Add Later)

| Trigger | Zarlo Message |
|---------|---------------|
| 1 badge from collection complete | "Just [AUTHORITY] to complete the set!" |
| Points approaching level-up | "47 points to Level 5!" |
| 3 days from 30-day streak | "Three more days to 30. That's a month of showing up." |
| Stage Groan available | "Your Stage Groan awaits. This is the one that unlocks [Next Stage]." |
| CRM milestone approaching | "2 more deals to Pipeline Pro!" |

### Implementation Plan

**New Files:**
- `src/lib/zarlo/zarloTriggers.js` - trigger detection logic
  - `checkTriggers(userId, context)` - returns active triggers
  - `markTriggerSeen(userId, triggerId)` - prevents repeat
  - `TRIGGER_PRIORITY` - determines display order

**New Component:**
- `src/components/Zarlo/ZarloTrigger.jsx`
  - Checks triggers on mount and route change
  - Shows Zarlo bubble with contextual message
  - Dismissable, saves "seen" state

**Integration Points:**
- Mount in `CRMLayout.jsx` for CRM pages
- Mount in `App.jsx` or `Challenge.jsx` for challenge pages
- Uses existing `ZarloWidget` infrastructure

### Database Changes
- Add `zarlo_triggers_seen` table or column in `zarlo_conversations`
  - `user_id`, `trigger_id`, `seen_at`, `acted_on`

---

## 4. Community Features (CD5: Social Influence)

### Identified as Biggest Gap
Current Octalysis score for CD5: 3/10

### Existing Infrastructure
- Group codes with WhatsApp sharing (ChallengeLeaderboard.jsx)
- Weekly + all-time leaderboards with medals
- Public shareable flows via `/v/:shareToken`
- Group-specific leaderboard filtering
- Top performers in CRM analytics

### Features to Build

**Community Feed**
- Activity feed showing recent achievements across users
- "Sarah just completed her first MONEY challenge!"
- "3 people graduated to Stage 4 this week"
- Filter by: group, stage, achievement type
- Heart/celebrate reactions on feed items
- Integrates with existing group system
- Files: `src/components/CommunityFeed.jsx`, `src/lib/communityFeedService.js`
- Database: `community_feed_events` table (user_id, event_type, metadata, created_at)

**Courage Pods (Peer Accountability)**
- Small groups (3-5 people) matched by stage or persona type
- Pod creation: Users can create or join pods (extends existing group code system)
- Weekly pod check-ins: "How did your week go?"
- Pod dashboard: See all members' streaks, completions, current challenges
- Pod nudges: "Your pod completed 12 challenges this week — you contributed 4!"
- Async accountability: No real-time chat required, works via feed + nudges
- Files: `src/components/Pods/PodDashboard.jsx`, `src/lib/podService.js`
- Database: `courage_pods` table (pod_id, name, max_members), `pod_members` (pod_id, user_id, joined_at)

**Week Recap Process**
- End-of-week summary screen (triggers Sunday evening or Monday morning)
- Personal stats: quests completed, points earned, streak status, rank change
- Pod/group comparison: "You placed #3 in your pod this week"
- Highlight reel: "Your biggest win: First LIVE visibility challenge"
- Social prompt: "Share your recap?" → WhatsApp/copy link
- Next week preview: "This week's phase: FLOW — here's what's ahead"
- Files: `src/components/WeekRecap.jsx`, `src/lib/weekRecapService.js`
- Trigger: On app open after week end, or via push notification

**Community Challenges**
- Weekly community goal: "500 collective groans this week"
- Group unlocks when community hits goal

**Mentorship System**
- Movement Makers mentor Vibe Seekers
- "Graduate" users become guides
- Earn "Mentor" badge

**Social Proof on Quest Cards**
- "23 people completed this today"
- "Most popular lead magnet: Mini-course (42%)"
- Query data exists, just needs surfacing

---

## 5. Collections & Ownership (CD4: Ownership)

### Future Features

**Badge Collections**
- Visibility layer badges (SCREEN → AUTHORITY)
- Stage completion trophies
- CRM milestone badges

**Visual Avatar/Profile**
- Essence archetype visual representation
- Earned accessories (streak flames, stage crowns)
- "Your Business Empire" visualization

**Portfolio Dashboard**
- "Your Assets" view: pages, sequences, deals
- Timeline of growth
- Export feature

---

## 6. Creative Expression (CD3: Creativity)

### Future Features

**Create Your Own Challenge**
- Design custom Groan challenges
- Set scary/wahoo scores
- Share with community

**Visual Offer Stack Builder**
- Simple visual representation of offer flow: Core → Upsell → Downsell → Continuity
- Show connections between offers (what leads to what)
- Click to edit each offer component
- Real-time preview of the complete stack
- Reinforces ownership (CD4) - "This is YOUR offer ecosystem"
- Could integrate with existing OfferBuilderFlow data

**Strategy Choice Branches**
- Multiple valid paths in CRM
- Show projected outcomes for each choice

---

## 7. Play Deck (CD4: Ownership + CD3: Creativity)

### Concept
Tangible "cards" users earn and collect that have emotional or practical value. Called "Play Deck" to reinforce the gamified, low-pressure approach. Cards become proof of courage users can revisit when their protective voice gets loud.

### Card Types

#### Utility Cards (Practical Use)
| Card | Earned By | Effect |
|------|-----------|--------|
| **Streak Freeze** | 30-day streak milestone | Skip 1 day without breaking streak (1/month) |
| **Double Points** | Stage graduation | 2x points for 24 hours |
| **Challenge Swap** | Complete 5 groans in a week | Swap one scary challenge for another |
| **Insight Unlock** | Complete Flow Finder | Unlock additional Zarlo personalization |

#### Courage Cards (Collectible/Emotional)
| Card | Earned By | Value |
|------|-----------|-------|
| **Visibility Tokens** | Complete challenge at each layer | Collect all 5: Screen → Live → Money → Vulnerable → Authority |
| **Proof Trophies** | Groan proof photos uploaded | Your courage moments, viewable in deck anytime |
| **Essence Affirmations** | Stage milestones | Personalized mantras based on your archetype |
| **Breakthrough Cards** | First-time achievements | "First MONEY challenge," "First Live visibility," "First Sale" |
| **Stage Completion Cards** | Graduate each stage | 8 collectible cards showing your journey |

### Visual Design Concept
```
┌─────────────────────────────────────┐
│  YOUR PLAY DECK                     │
│  12 cards collected                 │
├─────────────────────────────────────┤
│                                     │
│  UTILITY CARDS                      │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 🔥   │ │ ⚡   │ │ 🔄   │        │
│  │Freeze│ │Double│ │ Swap │        │
│  │  1   │ │  0   │ │  2   │        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│  VISIBILITY TOKENS                  │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 🖥️   │ │ 🎤   │ │ 💰   │        │
│  │SCREEN│ │ LIVE │ │MONEY │        │
│  │  ✓   │ │  ✓   │ │  ✓   │        │
│  └──────┘ └──────┘ └──────┘        │
│  ┌──────┐ ┌──────┐                 │
│  │ 💔   │ │ 👑   │                 │
│  │VULN. │ │AUTH. │                 │
│  │  🔒  │ │  🔒  │                 │
│  └──────┘ └──────┘                 │
│                                     │
│  COURAGE CARDS                      │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 🎯   │ │ 📸   │ │ ✨   │        │
│  │First │ │Proof │ │Essence│       │
│  │Groan │ │Trophy│ │Mantra │       │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
└─────────────────────────────────────┘
```

### Implementation Notes

**Database Changes:**
- `play_deck_cards` table: user_id, card_type, card_id, earned_at, used_at (for utility cards), metadata
- Or extend existing `quest_completions` / `milestone_completions` with card rewards

**Files to Create:**
- `src/components/PlayDeck/PlayDeck.jsx` - Main deck display
- `src/components/PlayDeck/PlayCard.jsx` - Individual card component
- `src/components/PlayDeck/CardDetail.jsx` - Expanded card view (for proof trophies, affirmations)
- `src/lib/playDeckService.js` - Card earning/using logic

**Integration Points:**
- Award cards in `useCelebrations.js` after milestones
- Display deck in Profile or dedicated `/play-deck` route
- Use utility cards from deck or via Zarlo prompt
- Show card count in sidebar/header

### Philosophy Alignment
- Cards are **proof of courage**, not gambling rewards
- Utility cards reduce pressure (freeze streak = nervous system friendly)
- Collecting visibility tokens = tangible progress through fear layers
- Proof trophies = look back at moments you were brave

---

## 8. Easter Egg Achievements (CD7: Curiosity)

### Concept
Hidden achievements users discover without being told they exist. No checklist, no progress bar — just a surprise unlock and celebration. Encourages exploration and rewards meaningful behaviour patterns.

### Courage Easter Eggs
| Achievement | Trigger | Reveal Message |
|-------------|---------|----------------|
| **Night Owl** | Complete a groan after 11pm | "Courage doesn't keep office hours." |
| **Early Bird** | Complete a groan before 6am | "Fear woke up — and so did you." |
| **Full Spectrum** | Complete one challenge at every visibility layer | "Screen to Authority. You faced them all." |
| **The Comeback** | Return and complete a quest after 7+ day absence | "You came back. That IS the achievement." |
| **Essence Hunter** | Land in the Essence Zone 3 times | "You keep finding where fear meets excitement. That's your compass." |
| **Five in a Day** | Complete 5 quests in a single day | "Some days you just have it. Today was one." |
| **Silent Streak** | Maintain 14-day streak without checking leaderboard | "You showed up for yourself, not the scoreboard." |

### Exploration Easter Eggs
| Achievement | Trigger | Reveal Message |
|-------------|---------|----------------|
| **Map Maker** | Visit every page in the CRM | "You've seen the whole kingdom. Now build it." |
| **Curious Mind** | Ask Zarlo 20+ questions across different pages | "You keep asking. That's how breakthroughs happen." |
| **Deep Diver** | Complete all sub-quests in a single category | "You didn't skim — you went deep." |
| **Compass Reader** | Log Flow Compass entries on 7 consecutive days | "A week of checking in. You're learning your own weather." |
| **Story Collector** | Add 10+ stories to Story Bank | "Your stories are your superpower. You're building an arsenal." |

### Growth Easter Eggs
| Achievement | Trigger | Reveal Message |
|-------------|---------|----------------|
| **First Blood** | Complete very first groan challenge | "You did the thing. The hardest one is always the first." |
| **Protective Voice Whisperer** | Complete Recognise + Rewire + Reconnect in same day | "You heard it, reframed it, and moved anyway." |
| **The Leap** | Jump 2+ stages in a single week | "Most people crawl. You leapt." |
| **Pod Leader** | Be top of your pod for 3 consecutive weeks | "Your consistency is contagious." |
| **Revenue Reality** | Enter first real number in Funnel Calculator (Actual mode) | "Real numbers. Real business. No more guessing." |
| **Offer Architect** | Complete all 4 money model flows | "Core, Upsell, Downsell, Continuity — your offer ecosystem exists." |

### Secret Easter Eggs (Ultra Hidden)
| Achievement | Trigger | Reveal Message |
|-------------|---------|----------------|
| **Zarlo's Friend** | Type "thank you" to Zarlo | "You're welcome. Now go be brave." |
| **Night & Day** | Complete quests at both 6am and 11pm on same day | "Dawn to dusk. Relentless." |
| **The Collector** | Earn 10 other easter egg achievements | "You found the hidden layer. Welcome to the inner circle." |

### Implementation Notes
- Easter eggs are **never shown in a list** until earned — no visible progress
- On unlock: Surprise celebration animation + reveal message + Play Deck card
- Store in `easter_egg_achievements` table (user_id, achievement_id, unlocked_at)
- Check triggers in `src/lib/easterEggService.js` — run checks after quest completions, page visits, Zarlo interactions
- Display earned easter eggs in Play Deck under a "Discoveries" section

---

## 9. Zarlo Curiosity Hooks (CD7: Curiosity)

### Concept
Zarlo drops contextual teaser messages that create "open loops" — the user has to take action to close them. Not manipulative; genuinely tied to insights Zarlo has about their data.

### Hook Types

**Pattern-Based Hooks** (triggered by user data analysis)
| Trigger | Zarlo Hook | Resolution |
|---------|-----------|------------|
| User avoids MONEY visibility layer | "I've noticed something about where your courage stops. Finish a MONEY challenge and I'll tell you what I see." | After completion: insight about money-fear pattern |
| User has 3+ skills but no persona | "Your skills paint an interesting picture. Complete Persona Selection and I'll show you who you're meant to serve." | After completion: persona-skill connection insight |
| User's scary scores cluster high in one layer | "There's a pattern in your fear data. It's telling a story. Want to hear it?" → Opens Groan Matrix | After viewing: insight about their fear cluster |
| User hasn't tried Flow Compass in 7+ days | "Your energy patterns were getting interesting... check in today and I'll connect the dots." | After entry: energy trend insight |

**Milestone Teaser Hooks** (triggered near achievements)
| Trigger | Zarlo Hook |
|---------|-----------|
| 1 quest from completing a category | "You're closer than you think to something. Keep going today." |
| 80% through a flow | "You're deep in this now. The insight at the end is worth it." |
| Near a hidden easter egg trigger | "Something interesting might happen if you keep doing what you're doing..." |

**Return Hooks** (triggered when user returns after absence)
| Absence | Zarlo Hook |
|---------|-----------|
| 3-7 days | "While you were away, I was thinking about your [top skill]. I have a thought — want to hear it?" |
| 7-14 days | "Your protective voice probably told you not to come back. Yet here you are. That's the whole lesson." |
| 14+ days | "No guilt. No pressure. Just a question: what brought you back today?" |

### Implementation
- Hooks checked in `src/lib/zarlo/zarloTriggerHooks.js`
- Integrate with existing ZarloWidget bubble system
- Store hook state in `zarlo_hook_state` (user_id, hook_id, shown_at, resolved_at)
- Max 1 hook per session to avoid fatigue
- Hooks expire after 7 days if unresolved (don't nag)

---

## 10. Streak-at-Risk Notifications (CD8: Loss + CD6: Scarcity)

### Concept
Push notification sent when a user's streak is in danger — they haven't completed a quest today and their streak would break if they miss tomorrow. Positive framing, not anxiety-inducing.

### Notification Logic
```
IF streak_days >= 3
AND last_quest_today === false
AND current_time >= 6pm user timezone
THEN send streak-at-risk notification
```

### Message Variations (Rotate)
| Streak Length | Message |
|--------------|---------|
| 3-6 days | "Your {X}-day streak is still going. One quest keeps it alive." |
| 7-13 days | "A whole week of showing up. Don't let today be the exception." |
| 14-29 days | "{X} days of courage. That's not luck — that's you. Keep it going?" |
| 30+ days | "A {X}-day streak is rare. Protect what you've built — one quest is all it takes." |

### Rules
- Only send once per day (6pm local time)
- Never send if user already completed a quest today
- Never send if streak is 0-2 days (not invested enough to care)
- Respect notification preferences (user can disable)
- Links directly to challenge page

### Implementation
- Extend existing push notification scheduler in Supabase edge function
- Add `streak_at_risk` notification type to `notification_preferences`
- Query: users with streak >= 3, no quest_completion today, notification enabled

---

## 11. Week Recap with Rank Change (CD5: Social + CD8: Loss)

### Concept
End-of-week summary that includes leaderboard movement. Shows users where they stand relative to their group/pod, creating both celebration (climbed) and gentle motivation (dropped).

### Recap Content
```
┌─────────────────────────────────────┐
│  YOUR WEEK IN REVIEW                │
│  Week of Jan 27 - Feb 2            │
├─────────────────────────────────────┤
│                                     │
│  STATS                              │
│  Quests completed: 14               │
│  Points earned: 230                 │
│  Streak: 12 days                    │
│                                     │
│  RANK CHANGE                        │
│  #5 → #3  ⬆️ Climbed 2 spots       │
│  "2 more quests would've been #2"   │
│                                     │
│  HIGHLIGHT                          │
│  First VULNERABLE challenge          │
│                                     │
│  NEXT WEEK: FLOW phase              │
│  "Balanced energy. Perfect for..."  │
│                                     │
│  [Share Recap]  [Plan Next Week]    │
└─────────────────────────────────────┘
```

### Rank Change Messaging
| Change | Message |
|--------|---------|
| Climbed 3+ | "You surged. {X} spots up — your consistency is showing." |
| Climbed 1-2 | "Moving up. {X} spots closer to the top." |
| No change | "Held your ground at #{X}. Consistency counts." |
| Dropped 1-2 | "Slipped {X} spots. One extra quest next week changes that." |
| Dropped 3+ | "Tough week at #{X}. Everyone has them. Fresh start Monday." |

### Trigger
- Show on first app open after Sunday midnight (or Monday push notification)
- Store `last_recap_shown` in localStorage to show once per week
- Data sourced from existing leaderboard + quest_completions queries

### Implementation
- `src/components/WeekRecap.jsx` - Recap modal/page
- `src/lib/weekRecapService.js` - Aggregate week stats + rank comparison
- Integrate with Week Recap process defined in CD5 section (Community Feed)

---

## 12. Deal Stale Warning (CD8: Loss + CRM)

### Concept
Extend existing Smart Alerts to flag deals that haven't moved pipeline stages within a threshold. Gentle nudge, not pressure.

### Thresholds
| Pipeline Stage | Stale After | Alert Level |
|---------------|-------------|-------------|
| lead | 5 days | Info (blue) |
| qualified | 7 days | Warning (yellow) |
| booked | 3 days | Warning (yellow) |
| showed | 5 days | Warning (yellow) |
| pitched | 7 days | Urgent (red) |
| follow_up | 10 days | Urgent (red) |

### Alert Messages
| Days Stale | Message |
|-----------|---------|
| At threshold | "{Deal name} hasn't moved in {X} days. Time for a check-in?" |
| 2x threshold | "{Deal name} is going cold. A quick message could save it." |
| 3x threshold | "{Deal name} may be lost. Close it or let it go — either way, decide." |

### Implementation
- Extend `src/pages/crm/SmartAlerts.jsx` — add deal staleness checks
- Query `crm_deals` for `updated_at` vs threshold per stage
- Add "Deal Health" section to Smart Alerts with colour-coded status
- Action buttons: "Follow Up" (opens deal) or "Mark Lost" (closes deal)

---

## Implementation Priority

### Phase 1: Quick Wins (Current Sprint)
- Community Impact Widget
- Completion Screen Enhancement
- Name Your HQ (CRM onboarding)
- Post-Flow Finder Rarity Reveal
- Stage Groan reframing
- Progress bars on tower cards

### Phase 2: Anticipation & Triggers
- Zarlo trigger system (Priority 1-3 triggers)
- "Last mile" messaging throughout app
- **Streak-at-Risk Notifications** - Push notification for endangered streaks
- **Deal Stale Warnings** - Extend Smart Alerts for pipeline deal health

### Phase 3: Milestones & Recognition
- Essence-aligned milestones (or skill trees - TBD)
- Collections tab
- Badge system
- **Play Deck v1** - Visibility tokens + Breakthrough cards
- **Easter Egg Achievements v1** - First batch of hidden achievements

### Phase 4: Creative & Ownership
- **Visual Offer Stack Builder** - Simple offer flow visualization
- **Play Deck v2** - Utility cards (Streak Freeze, Double Points)
- **Zarlo Curiosity Hooks** - Pattern-based and milestone teaser hooks
- Avatar upload/customization
- Achievement showcase page

### Phase 5: Community
- **Courage Pods** - Peer accountability matching
- **Community Feed** - Activity feed with achievements
- **Week Recap with Rank Change** - End-of-week summary + leaderboard movement
- Community challenges
- Discussion threads

### Phase 6: Advanced
- Mentorship system
- AI-driven Zarlo personalization
- Full social features
- **Play Deck v3** - Proof trophies with photo gallery
- **Easter Egg Achievements v2** - Secret / ultra-hidden achievements

---

*Document created: January 2025*
*Updated: February 2025 — Full CD1-CD8 review*
*Based on: Octalysis Framework Analysis*
