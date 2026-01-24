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

### Future Features to Explore

**Accountability Partners**
- Pair users for weekly check-ins
- "Your courage buddy completed 3 groans this week!"
- Shared challenge mode

**Community Challenges**
- Weekly community goal: "500 collective groans this week"
- Group unlocks when community hits goal

**Mentorship System**
- Movement Makers mentor Vibe Seekers
- "Graduate" users become guides
- Earn "Mentor" badge

**Discussion Threads**
- Per-stage discussion forums
- "Ask the community" for stuck moments

**Social Proof in CRM**
- "37 users launched this week using this template"
- "Most popular lead magnet: Mini-course (42%)"

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
- Drag-and-drop offer construction
- Real-time preview
- Mix-and-match components

**Strategy Choice Branches**
- Multiple valid paths in CRM
- Show projected outcomes for each choice

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

### Phase 3: Milestones & Recognition
- Essence-aligned milestones (or skill trees - TBD)
- Collections tab
- Badge system

### Phase 4: Community
- Accountability partners
- Community challenges
- Discussion threads

### Phase 5: Advanced
- Mentorship system
- AI-driven Zarlo personalization
- Full social features

---

*Document created: January 2025*
*Based on: Octalysis Framework Analysis*
