# FindMyFlow - Organized Project Notes

*Last updated: January 19, 2026*

---

## 1. BUGS & IMMEDIATE FIXES

| Issue | Status | Notes |
|-------|--------|-------|
| Prayer challenge not submitting | NEEDS FIX | Check quest completion handler |
| Notifications not sending | NEEDS FIX | Timing works, but delivery fails |
| Notification timing on/off toggle | NEEDS BUILD | User should control |
| Day unlocked working but timing not | NEEDS FIX | Challenge unlock logic |
| Nikigai flow - problem clusters not relating | NEEDS FIX | Make final clusters problem-related |

---

## 2. ACTIVE FOCUS (Current Sprint)

### Validation & Testing
- [ ] Finalize validation form
- [ ] Send validation form to Josh
- [ ] Keep testing stage until people will say they'll pay

### CRM Build (Priority)
- [ ] Test CRM on yourself and others
- [ ] Build all features
- [ ] Identify core purpose of each module:
  - **Marketing** = strategy + generation + performance tracking / growing intelligence over time
  - **Sales** = executing process (templates + reminders) + measuring stats for insights

### Game Design Finalization
- [ ] Finalize current game design
- [ ] Send out for testing
- [ ] Consider: Day by day unlock? 10 days total?

---

## 3. NEAR-TERM BACKLOG

### Challenge System Redesign
- [ ] Make more like BYB and FamBam where challenge is always on and naturally rolls over
- [ ] Opt-in challenges (3-week challenges?)
- [ ] Week-over-week stats tracking
- [ ] AI identifies type of week: Rest, Healing, Sales, Rewire, Build
- [ ] Remove '7-day challenge' concept - make it part of showing up in your business
- [ ] Fewer challenges, more targeted onboarding

### Zarlo AI Enhancements
- [ ] Pop-up in corner (complete)
- [ ] Completes business actions
- [ ] Reflects patterns and recommends
- [ ] Voice drop to-dos with reminder system
- [ ] Provides weekly review based on all data captured

### CRM Detailed Build
- [ ] For generation: pre-check Supabase for good data, if not → brain dump option
- [ ] Carousel template (GPT carousel, Jaro frameworks)
- [ ] Score system = delivery of system?
- [ ] Sales slides showing all inclusions (WOP, kit, Hormozi)
- [ ] Email content creation / nudge user for email collection

### Money Models / Marketing Tower
- [ ] Godin/Jobbers etc built into v2 builder
- [ ] If tasks haven't completed: external reason (no time) vs internal (resistance tracking)
- [ ] Money models actions mapped and ticked off

### UI/UX Improvements
- [ ] Information dots for 3 /me tabs explaining how they fit:
  - Flow Finder: "Curiosity is the compass"
  - Nervous System: "Body puts limitations"
  - Compass: "Begin to play with the universe"
- [ ] Coloured boxes for milestones (funnel calculator)
- [ ] Link to our upsell pages
- [ ] AI-enabled pages on Library of Answers
- [ ] Resources tab instead of Library of Answers

---

## 4. FUTURE FEATURES (Parking Lot)

### AI-First Architecture
*"When AI sits at the center of the business, everything around it accelerates."*

- [ ] Zarlo facilitates all weekly reviews
- [ ] Voice capture option for analysis
- [ ] People input data because: excited to learn + points + feels like game
- [ ] Business design single focus

### WOP Build with AI Program
- [ ] Type of change / domain determines tool type:
  - Education → action
  - Finance → insights + tracking
- [ ] "Define lego brick prompts"
- [ ] Continuity offer = Build with AI
- [ ] Test 3-5 week WOP style program with friendlies

### Challenge/Game Evolution
- [ ] Weekly challenge = build in public one tool a week
- [ ] Collect feedback
- [ ] Ask if they want to build their own
- [ ] Open up all flows to feed into the app
- [ ] All flows collect feedback on accuracy + improvements
- [ ] Add "make decision with your body" as weekly groan recognise challenge

### Nathan Barry Ladder Integration
- [ ] Assess where users currently are
- [ ] Have people follow the ladder progression

### Additional Features
- [ ] Play profile before Flow Finder
- [ ] 4 business types (bootstrapper) - business model revenue calculator
- [ ] CRM tracks nervous system around each sales conversation
- [ ] Connect facilitators page
- [ ] Connect my blog
- [ ] Shadow work workshop in healing tab
- [ ] Add Flow Finder outcomes to groan
- [ ] Identify the type of day it is (rest, push etc)
- [ ] Weekly review process like I've created
- [ ] Ask how spiritual + religious texts align with Flow thesis
- [ ] Feed AltMBA into Claude to see lessons

### Vision: App as Run Club for Personal Growth
- [ ] Create feed
- [ ] View protective patterns as 1v1 battles (or based on preferred game style)

---

## 5. STRATEGIC THINKING & VISION

### Core Thesis
> Burnt-out professionals fail to build businesses not because they lack skills or ideas, but because:
> 1. They don't know which business type fits their natural strengths (P3 framework)
> 2. Their nervous system blocks them from visibility/selling (internal resistance)
> 3. They lack a systematic approach to offers, content, and sales (Hormozi money models)

### The Journey
```
Discover Self → Define Business Type → Build Offer Stack → Create Content → Sell → Track & Optimize
     ↑                                                                              ↓
     └──────────────── Nervous System Work (continuous throughout) ←───────────────┘
```

### Differentiator
The NS integration - most business tools ignore why people don't execute. FindMyFlow treats the root cause (fear, perfectionism, imposter syndrome) alongside the tactical work.

### Conceptual Notes

**"Sports are just IRL games"**
- Turn building in public into a sport

**Groan List Concept**
- Things you know you're capable of but scare you
- Things you've always wanted to do but haven't
- Something you loved as a kid but haven't done since
- Can look at skill profile to make recommendations

**Everyone's Dots Merge**
- Each dot is a different part of the story
- From horizontal to vertical
- Each part has meaning individually AND fulfils meaning in the whole

**4-Level Transformation Anchor**
- Frame product types as ways to create that transformation
- "Fulfilling life path as quickly as possible without financial stress"

**Taxonomy & Market Size**
- Can link to market size opportunity?

**Essence + Protective Patterns**
- Make tied to showing up in business directly

---

## 6. ARCHITECTURE & TECHNICAL

### Flow Context Gaps (from docs/2026-01-10-flow-context-gaps-analysis.md)
- Gap 1: OfferBuilder already fetches data, just needs to use it (QUICK WIN)
- Gap 4: ContentGenerator same situation (QUICK WIN)
- Full analysis in that doc

### Flow Dependency Maps Needed
1. Master Flow Dependency Map - Tier 0 (Entry) → Tier 1 (Discovery)
2. Tier 1 → Tier 2 Data Flow - Discovery outputs feed into Offer Builder, Lead Magnet, Attraction
3. Value Ladder Flow Chain - Core → Upsell/Downsell/Continuity → Leads → Funnel → Calculator
4. Healing Flow Dependencies - NS → Healing Compass → Archetypes → Challenge Quests
5. Content & CRM Flow Dependencies - Voice + all flows → Content Generator + CRM
6. Complete Context Cascade Summary - Every flow-to-flow dependency
7. Database Context Flow - Table-to-table dependencies

### Triggers
- [ ] Connect trigger to three stages I identified with chat

### Next Version Idea
- Based on all answers, feed in to make the best tech product

---

## 7. PEOPLE & OUTREACH

### Growth Game Testers
- Ausra
- Mitch
- Tom
- Matt
- Shelby

### Ashley Updates
- [ ] Check validation flow
- [ ] "Scale in 1 week" - monetise the CRM?
- Ask Sam + Flynn?

### Josh
- [ ] Send validation form

### Public Landing Page
> "If you're interested in doing this but I'm not the right person to learn from, all groovy. But if there's a protective pattern emerging, here's a quiz"

---

## 8. QUESTIONS TO ANSWER

- [ ] Date needed in resistance flows?
- [ ] Lego bricks of each component OR containers which host lego bricks?
- [ ] Flow Finder persona - hard to bucket personas?
- [ ] How can AI pre-check Supabase for good data vs need brain dump?
- [ ] How do spiritual + religious texts align with Flow thesis?

---

## 9. DONE (Recently Completed)

- [x] Prayer challenge fix (was not submitting) - VERIFY
- [x] Update validation form
- [x] Money models actions mapped

---

## Quick Reference: Priority Order

**This Week:**
1. Fix bugs (prayer, notifications)
2. Finalize validation form → send to Josh
3. CRM build & test

**Next:**
4. Challenge system redesign (always-on, week types)
5. Zarlo enhancements
6. Marketing tower v2

**Later:**
7. WOP Build with AI program
8. Full game/run club vision

---

*Note: Feature details should live in FEATURES_ROADMAP.md. This doc is for organizing raw notes, strategic thinking, and tracking what needs attention.*
