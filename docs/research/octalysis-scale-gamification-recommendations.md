# Scale Creator Portal: Gamification Recommendations by Core Drive

**Date:** 2026-07-15
**Sources:** DCC fiction analysis, RPO fiction analysis, Live Experience Apps (NRC/Strava/Peloton/Zombies/Pokemon GO), Business Builder Games (RollerCoaster Tycoon/Stardew Valley/Game Dev Tycoon/Duolingo/Shopify), Vibe Rise consumer app (existing infrastructure)
**Current Scale Score:** 140 (Weak)
**Full analysis:** See also `octalysis-business-builder-analysis.md` in this folder

---

## Infrastructure Already in Vibe Rise (reusable)

Before designing new features, here's what the consumer app already has that can be ported to the creator portal:

| Infrastructure | Location | Reusable? |
|---|---|---|
| `useCelebrations` hook | `src/hooks/useCelebrations.js` | Yes, directly |
| Confetti + FloatingPoints | `src/components/Celebrations/` | Yes, directly |
| `hapticLight/Success/Error` | `src/lib/haptics.js` | Already used |
| Zarlo AI companion | `src/components/Zarlo/`, `src/lib/zarlo/` | Needs creator context |
| Figurine AI mentor | `src/hooks/useFigurine.js` | Needs creator context |
| Community Feed | `src/pages/PlaylistFeed.jsx` | Needs creator version |
| Weekly Review | `src/components/WeeklyReview.jsx` | Needs creator adaptation |
| Daily Check-in | `src/components/DailyCheckin.jsx` | Could adapt |
| Streak system | `useChallengeData.js` | Needs creator version |
| Level/XP system | `src/lib/stageConfig.js` | Movement XP already loaded |
| Push notifications | Full stack deployed | Needs creator triggers |
| Shareable cards | `WeeklyReviewCard.jsx` | Pattern reusable |

---

## CD1: Epic Meaning & Calling (6 → 8)

**Gap:** Strong positioning narrative but no origin story integration, no "why this matters" moment, no mission framing.

### From DCC: "Co-Creator" Effect
Carl's inventions get added to the Dungeon Codex. His actions shape the world.

**Scale equivalent:** When a creator completes their Remarkable Results, surface: "Your rule break has been added to the Scale Creator Database. Future creators will see your pattern." Their work contributes to the research corpus, not just their own business. Frame Scale as a living study, not a static tool.

### From RPO: "Destiny Child" Moment
Wade finds the Copper Key after 5 years of nobody finding it. He feels chosen.

**Scale equivalent:** After the Experience Creator matching flow, show: "Out of 100 creators we studied, your DNA matches [Creator X] most closely. They built a $2M business in [Y] years. You're on the same path, earlier." This is the "you're not random, you're a pattern" moment.

### From Zombies Run!: "Runner 5" Identity
You're Runner 5 from second one. Not aspirational. Actual.

**Scale equivalent:** From the moment someone pays, they're a "Movement Maker." Not "aspiring." Not "learning." The portal should greet them: "Welcome, Movement Maker." Their identity is granted, not earned. The playbook helps them LIVE it, not BECOME it.

**Existing infra:** Essence archetype system already does identity granting. Extend to creator context.

---

## CD2: Accomplishment & Progress (5 → 9)

**Gap:** Pipeline structure exists but no celebrations, no visible XP, no milestones, Movement XP loaded but unused.

### From DCC: Snarky Achievement Notifications
"New Achievement: You Monster!" — personality in system messages is underrated.

**Scale equivalent:** When a creator completes their positioning: toast notification with personality. Not "Positioning complete." Instead: "Your positioning statement just landed. 90% of creators never get this far. You have words for what you do now." Each playbook completion gets a unique, personality-driven message. Use Huzz's voice.

**Existing infra:** `useCelebrations` hook + `FloatingPoints` + confetti. Wire to playbook stage completions + experience pipeline milestones.

### From Peloton: Club Loyalty Tiers
Bronze → Legend. Points for showing up, not performance.

**Scale equivalent — Creator Levels:**

| Level | Name | XP Required | Unlocks |
|---|---|---|---|
| 1 | Dreamer | 0 | Portal access |
| 2 | Builder | 50 | Inner Game tab (1 module) |
| 3 | Launcher | 150 | Lightning Strike tool |
| 4 | Scaler | 400 | Creator community access |
| 5 | Movement Maker | 1000 | Featured in creator database |

**XP sources:**
- Complete playbook stage: 25 XP
- Create experience: 10 XP
- Run experience through pipeline: 15 XP
- Complete 3% improvement: 5 XP
- Weekly creator pulse: 10 XP
- Fill an event to 80%+: 20 XP

**Existing infra:** Movement XP already loaded in CreatorHomeV2 (`xpData`). Just needs display + level thresholds.

### From Strava: Post-Activity Reveals
"You set a PR on that segment!" — revealed AFTER, not during.

**Scale equivalent:** After running an experience through the pipeline, reveal: "Your Attract→Convert rate was 23%. That's up from 15% last time." Or: "You had 4 repeat attendees this time. That's a new record." Delayed reveals create anticipation for the data.

---

## CD3: Empowerment & Creativity (5 → 7)

**Gap:** Most flows are linear fill-in-the-blank. No sandbox, no "what if" exploration.

### From DCC: Chain Combos
Moonshine + torch + oil = boom jug. Combining elements creates unique outcomes.

**Scale equivalent:** Let creators MIX their positioning elements. "What if you combined your rule break with a different vehicle?" Show 2-3 AI-generated alternative positionings based on shuffling their inputs. Let them pick. The creative agency is in the CHOOSING, not the filling.

### From RPO: Build From Scratch Ownership
Wade's immersion rig described component by component.

**Scale equivalent:** Experience creation should feel like BUILDING, not form-filling. Show the experience coming together visually: format selected → time set → venue chosen → marketing plan generated → run sheet built. Each addition is a visible component. Like assembling a rig, not filling a spreadsheet.

**Existing infra:** Experience pipeline nodes already exist. Make the creation flow feel more like assembly than form entry.

### From RCT: Build-Test-See Loop (NEW)
RCT's genius: build a ride, guests react in real-time with thought bubbles. Instant feedback on what you created.

**Scale equivalent:** After creating an experience and posting attract content, show a simulated "audience reaction" prediction based on positioning + vehicle type. "Based on your rule break, here's how likely this content is to stop the scroll." Instant creative feedback before the event even happens. **3 days** (needs AI integration).

---

## CD4: Ownership & Possession (6 → 8)

**Gap:** Good identity system but no collection feeling, no badge inventory, no "look at everything I've built."

### From DCC: Infinite Inventory + Collection Sets
2,997 lumps of coal. 80 moonshine jugs. The accumulation IS the satisfaction.

**Scale equivalent — Creator Portfolio View:**
A "trophy case" that shows everything they've built:
- Experiences created (with attendee counts)
- Playbook stages completed (with dates)
- Positioning statement (framed)
- Rule break (highlighted)
- Scale Score (displayed as report card)
- Creator level badge
- Total attendees served (lifetime counter)
- Creator share card (holographic, already exists)

### From RPO: Avatar as Identity Construction
Complete identity construction: name, appearance, reputation.

**Scale equivalent:** The creator share card already exists but is hidden behind a button. Make it the HERO of the identity tab. It should feel like a trading card. Update it as they progress: new badges appear on the card, the border upgrades (bronze → silver → gold → holographic based on level).

**Existing infra:** `CreatorShareCard` modal with foil border already built. Extend with dynamic elements.

---

## CD5: Social Influence & Relatedness (2 → 6)

**Gap:** Biggest weakness. No community, no peers, no accountability.

### From DCC: "Viewers Are Watching"
Social pressure without social interaction. Brilliant for solo experiences.

**Scale equivalent:** "X creators are building their playbook right now." Ambient social presence without requiring interaction. Show anonymous activity: "A creator in Melbourne just completed their Remarkable Results." Creates "I'm not alone" feeling without community infrastructure.

### From Peloton: High Fives + Milestone Shoutouts
One-tap validation. Low effort, high impact.

**Scale equivalent — Creator Community Feed:**
Auto-post milestones: "Just completed my positioning", "Ran my 10th experience", "First sold-out event." Other Scale users react with one-tap kudos. No forced interaction. Just ambient acknowledgment.

**Existing infra:** `PlaylistFeed.jsx` + `playlistFeedService.js` in consumer app. Adapt for creator milestones.

### From Strava: Kudos
14 billion kudos given. One tap.

**Scale equivalent:** After a creator shares a win or completion, other Scale users can "Kudos" (one tap, gold sparkle animation). Counter visible: "12 creators acknowledged your rule break." Low-friction social proof.

### From Pokemon GO: Team Allegiance
Mystic/Valor/Instinct. Simple three-way split.

**Scale equivalent:** Creators are already matched to experience archetypes (workshop/retreat/coaching/performance/online/hybrid). Show this as a tribe: "You're in the Workshop Creators tribe. 8 other Scale users build workshops." Not competitive. Just belonging.

---

## CD6: Scarcity & Impatience (3 → 6)

**Gap:** Sequential unlocking exists but no time pressure, no urgency, no "founding member" feeling.

### From DCC: Countdown Timer
Ever-present in Carl's HUD. Creates layered urgency.

**Scale equivalent — Event Countdown:**
Already partially exists (days badge). Amplify: when an event is 14 days out with low pipeline readiness, the countdown turns amber. At 7 days, red. At 3 days, pulsing. Add: "X tasks still incomplete. Your event is in Y days."

### From DCC: Options Pacing
Class selection locked until floor 3. Store locked until floor 3.

**Scale equivalent — Inner Game Unlock Chain:**
Instead of all locked: unlock one module per playbook completion:
- Complete Results → unlocks Play Profile
- Complete Reach → unlocks Know Your Ceiling
- Complete Growth → unlocks Wound Map
- Complete Score → unlocks Limiting Beliefs

Each unlock is a surprise reveal: "You've earned access to a new tool. This one shows you what's holding you back." Creates anticipation for each playbook stage.

### From Peloton: Appointment Dynamics
Live classes at specific times create planning behaviour.

**Scale equivalent — Weekly Creator Pulse:**
Available Sunday-Monday only. Review your week: events run, pipeline progress, content posted. Award XP for completing it. Time-gated creates rhythm.

**Existing infra:** `WeeklyReview.jsx` in consumer app. Adapt for creator metrics.

---

## CD7: Unpredictability & Curiosity (2 → 7)

**Gap:** Everything predictable. No surprise rewards, no variable content, no "what happens next."

### From DCC: Mystery Box Reveals
Every loot box is a dopamine hit. "What's in the Legendary Pet Box?!"

**Scale equivalent — Insight Drops:**
After completing each playbook stage, surface an unexpected insight:
- After Results: "Your rule break matches the same pattern as [Creator X]. They blew up in [year]. Here's what they did next..."
- After Reach: "Only 18% of creators in our database chose your vehicle type. That's rare. Here's why that's an advantage..."
- After Score: "Your Scale Score is [X]/15. Creators who scored [X] typically see their first viral moment within [Y] months."

These are NOT generic. They're computed from the actual creator DNA data and the user's specific answers.

**Existing infra:** `InsightDrop.jsx` UI component is reusable. But `useInsightDrops.js` trigger logic is consumer-coupled (wahoo/streak data). Creator version needs new trigger layer reading from `remarkable_angles`, `narrative_builders`, `scale_diagnostics`. UI port = 1 day, data layer = 3-4 days.

### From DCC: Snarky Achievement Text
"Bitchmeat!" — readers LOOK FORWARD to finding out what the system says next.

**Scale equivalent:** Personality in system messages. Not "Experience created." Instead: "Your 5th experience. Most creators quit at 3. You're not most creators." Each milestone gets a unique, Huzz-voiced message that's impossible to predict.

### From Zombies Run!: Narrative Advances Through Activity
Story chapters unlock through running. Content IS the reward.

**Scale equivalent:** Unlock case studies as playbook stages complete. After Results: unlock "How Wim Hof found his rule break." After Reach: unlock "How Brene Brown's vehicle changed everything." Content rewards that deepen understanding, not just badges.

### From DCC: Oracle Effect
Mordecai's cryptic advice. "It's not worth it, not until floor 12."

**Scale equivalent — Zarlo for Creators:**
Add Zarlo to the creator portal with creator-specific context. Proactive bubbles: "Your Barcelona event is 22 days out. Based on creators at your stage, you should have your Attract content live by day -14. Want help writing it?" Cryptic hooks: "There's something about your 3% improvements I want to show you. Complete 3 more and I'll reveal it."

**Existing infra:** Full Zarlo engine (`zarloEngine.js`, `zarloPageContent.js`). WARNING: `zarloPageContent.js` has zero entries for any `/create` route. Full page context map + proactive triggers need building from scratch. Estimate 5-7 days, not 3.

---

## CD8: Loss & Avoidance (1 → 4)

**Gap:** No consequences at all. Pipeline can rot with zero feedback.

### From DCC: Visual Grave
Crawler count ticking down. Each number is a person. Dripping faucet.

**Scale equivalent — Pipeline Staleness:**
If an experience has been upcoming for 7+ days with <20% Attract readiness: "Your event is in X days and your audience doesn't know it exists yet." Not punitive. Just honest. The DCC countdown creates urgency without guilt. Same principle.

### From Strava: Relative Effort
Higher suffering score = more respect. Makes difficulty legible.

**Scale equivalent:** Show "days since last event" on the Growth tab. Not as punishment. As a mirror. "It's been 34 days since your last experience. Your top fans are waiting." Honest reflection, not guilt.

### From NRC: Celeste Model — "Bad Sessions Are Part of the Programme"
The Vibe Rise consumer app intentionally caps CD8 at 5 (pressure earns MORE, not less). Same philosophy for Scale.

**Scale equivalent:** When a creator's event has low attendance: "12 people came. That's real. Wim Hof's first ice bath had 3. The ones who make it aren't the ones who fill rooms first. They're the ones who keep running events." Reframe low performance as early-stage data, not failure.

**Keep CD8 gentle.** Scale users are already anxious about the business side. Loss mechanics should feel like honest mirrors, not punishment. Cap at 4-5, never higher.

---

## Projected Score

| CD | Before | After Tier 1+2 | Source Pattern |
|---|---|---|---|
| CD1 | 6 | 8 | DCC Co-Creator + Zombies Runner 5 |
| CD2 | 5 | 9 | DCC Achievements + Peloton Tiers + Strava Reveals |
| CD3 | 5 | 7 | DCC Chain Combos + RPO Build From Scratch |
| CD4 | 6 | 8 | DCC Collection + RPO Avatar + existing ShareCard |
| CD5 | 2 | 6 | DCC Viewers + Peloton High Fives + Strava Kudos |
| CD6 | 3 | 6 | DCC Countdown + Options Pacing + Peloton Appointments |
| CD7 | 2 | 7 | DCC Mystery Box + Snarky Text + Zombies Narrative |
| CD8 | 1 | 4 | DCC Visual Grave + Strava Effort + NRC Celeste Model |

**Before: 140 → After: 64 + 81 + 49 + 64 + 36 + 36 + 49 + 16 = 395 (Strong)**

Note: Consumer app (Vibe Rise) is currently at 498. Gap narrows from 358 to 103.

---

## Implementation Sprint Order (Updated with all 12 sources)

| Sprint | Features | Days | Score Impact | Sources |
|---|---|---|---|---|
| **1** | Celebrations + Show XP + Setup checklist | 2 | CD2 +3 | DCC, Peloton, Shopify |
| **2** | Origin story + Movement Maker identity + Co-Creator framing | 0.5 | CD1 +2 | Stardew, Zombies, DCC |
| **3** | Event countdown urgency + staleness nudge | 1 | CD6 +1, CD8 +1 | DCC, RCT |
| **4** | Sequential score reveal after events | 2 | CD2 +1, CD7 +1 | GDT, Strava |
| **5** | Inner Game unlock chain | 2 | CD6 +1, CD7 +1 | DCC |
| **6** | Building streak (weekly, forgiving) | 2 | CD6 +1 | Duolingo, Stardew |
| **7** | Insight Drops per playbook stage | 5 | CD7 +2 | DCC, GDT |
| **8** | Creator league (weekly cohort + demotion) | 5 | CD5 +3, CD8 +1 | Duolingo, DCC |
| **9** | Zarlo for creator portal | 7 | CD5 +1, CD7 +1 | DCC, NRC |
| **10** | Creator community feed + kudos | 5 | CD5 +2 | Peloton, Strava, Pokemon GO |
| **11** | Creator portfolio / trophy case | 3 | CD4 +2 | DCC, RPO, Stardew |
| **12** | Combination discovery | 2 | CD7 +1 | GDT |
| **13** | Build-test-see loop (AI content prediction) | 3 | CD3 +1 | RCT |

**Recommended start: Sprint 1 → 2 → 3 → 4 → 5**
(Celebrate → Identity → Urgency → Score Reveals → Unlock chain)

First 5 sprints = 7.5 days. Moves score from 140 to ~250. All use existing infrastructure or are copy changes.

Sprints 7-9 are the heavy builds (Insight Drops, League, Zarlo) but deliver the highest long-term retention impact.

---

## Breaking 400: The Community Ceiling

After all 13 code sprints, Scale projects to ~395. To break 400+ requires understanding where the ceiling is.

**The math:**
```
Current projection after all sprints:
CD1=8(64) + CD2=9(81) + CD3=7(49) + CD4=8(64) + CD5=6(36) + CD6=6(36) + CD7=7(49) + CD8=4(16) = 395
```

**CD5 (Social) is the bottleneck.** Every app scoring 450+ has CD5 >= 7:
- DCC: CD5=9 (viewers, talk show, Carl+Donut relationship)
- Peloton: CD5=10 (live classes, instructor shoutouts, High Fives)
- Strava: CD5=9 (segments, kudos, clubs)
- Duolingo: CD5=9 (leagues, friends, streak sharing)

Scale at CD5=6 caps the total. A feed with kudos is not community. To break 400, Scale needs people who KNOW each other.

### Target: 468 (Strong-Exceptional)

| CD | Current target | Needs to be | Points gained | What it takes |
|---|---|---|---|---|
| CD5 | 6 | **8** | +28 | Real social, not just a feed |
| CD4 | 8 | **9** | +17 | Deeper ownership |
| CD7 | 7 | **8** | +15 | More unpredictability |
| CD6 | 6 | **7** | +13 | One more scarcity layer |

```
Target: 64+81+49+81+64+49+64+16 = 468
```

### CD5: 6 → 8 (the big unlock)

**Accountability pairs (operational, 0 code days)**
Matched with 1 other Scale user at your stage. Weekly async check-in: "Did you run your event? Did you complete your next playbook step?" Not competitive, just "someone is watching." Auto-rematch every 4 weeks. Requires: a matching spreadsheet and a message template. The VALUE is the human connection, not the feature.
Source: Every successful cohort program. Ship30, YYGS, On Deck.

**Group onboarding cohort (operational, 0 code days)**
New Scale users who join in the same week are grouped (4-6 people). Shared Slack/WhatsApp channel. See each other's playbook progress. The $499 setup fee already implies a cohort experience. This is how Ship30 and every successful creator program works. The community IS the product.
Source: Peloton "Here Now" + Pokemon GO Community Day gatherings.

**Monthly Scale call (operational, 0 code days)**
One group call per month. All Scale users. Screen-share wins, debrief failures, set next month's intention. Peloton's live class energy. You already run weekly Vibe Rise sessions. This is the creator version.
Source: Peloton live classes + instructor personality as retention.

**Mentor layer (1 day code + operational)**
Creators who reach Level 4+ (Scaler) opt in as mentors for Level 1-2 creators. Not time-intensive: visibility into their mentee's playbook progress + one monthly async message. Creates "paying it forward" loop. Code: opt-in toggle in Profile tab + mentor badge + read-only view of mentee progress.
Source: DCC's Mordecai (mentor), Peloton instructor shoutouts.

### CD4: 8 → 9 (deeper ownership)

**Experience templates as owned assets (2 days)**
When a creator builds an experience and runs it 3+ times, it becomes a "proven template" with a badge. They OWN a proven format. Like Stardew's maxed-out farm. The template has: run count, average attendees, average satisfaction. It's PROOF that their format works.
Source: Stardew permanent farm progression, RPO customized stronghold.

**Creator DNA profile page (3 days)**
Public-facing profile: archetype, rule break, Scale Score, experiences run, total attendees. Like a LinkedIn for experience creators. Their REPUTATION is an owned asset that grows with every event. Shareable URL. The holographic share card becomes the preview card for this page.
Source: RPO avatar identity (9/10 CD4), DCC title system.

### CD7: 7 → 8 (more surprise)

**Hidden achievements (1 day)**
Undiscovered milestones that pop when triggered:
- "Polymath: You ran 3 different experience types."
- "Cult Leader: Your repeat rate hit 40%."
- "Sold Out: Every spot filled for the first time."
- "Chain Reactor: 5 consecutive 3% improvements."
Nobody knows these exist until they trigger. Each has a unique badge.
Source: DCC easter eggs + achievement text.

**AI "what if" scenarios (2 days, included in Zarlo build)**
After running an event, Zarlo occasionally surfaces: "What if you'd priced this at $X instead of $Y? Based on similar creators, here's what might have happened..." Creates curiosity about counterfactuals and teaches pricing intuition.
Source: DCC's unpredictable system messages + RCT guest thought bubbles.

### CD6: 6 → 7 (one more layer)

**Seasonal creator challenges (1 day)**
Quarterly challenge: "Run 3 experiences this quarter." Limited-time badge for completion. Aligns to real business seasons (Q3 summer events, Q4 retreats, Q1 planning). Creates natural planning horizon.
Source: Pokemon GO Community Day (monthly time-limited windows).

**Founding member exclusivity (0 days, operational)**
First 50 Scale users get permanent "Founding" badge on their creator profile and share card. Can never be earned again. Creates FOMO for early adoption + pride for early believers. You already have the `FOUNDING` promo code. Connect the identity.
Source: DCC Legendary Pet Box (one-of-a-kind reward for being early).

### The honest insight

The features that get Scale from 395 to 468 are mostly **human-powered, not code-powered:**

| Feature | Code days | Human effort |
|---|---|---|
| Accountability pairs | 0 | Matching spreadsheet + message template |
| Group cohort | 0 | Slack channel per intake week |
| Monthly call | 0 | You on Zoom, 1 hour/month |
| Mentor layer | 1 | Opt-in management |
| Founding badge | 0 | Operational decision |
| Seasonal challenge | 1 | Quarterly goal setting |

This is the same pattern across every 450+ app:
- Duolingo's leagues work because **real humans compete**
- Peloton works because **a real instructor says your name**
- DCC works because **Carl and Donut's relationship is real**

Code facilitates social. Code can't create it. The 400+ ceiling requires COMMUNITY, not features.

### Recommended path to 468

**Phase 1: Code sprints (7.5 days) → ~250**
Sprints 1-5. Celebrations, identity, urgency, score reveals, unlock chain. Pure code.

**Phase 2: Launch community ops (0 code days) → ~350**
Monthly Scale call + accountability pairs + group cohort onboarding + founding badge. Operational, not engineering. Do this the week after Phase 1 ships.

**Phase 3: Build social infrastructure (12 days) → ~400**
Sprints 7-9. Creator league + Zarlo + community feed. Code that amplifies the community you've already built.

**Phase 4: Deepen ownership + surprise (8 days) → ~468**
Experience templates, creator profiles, hidden achievements, AI scenarios. The polish layer.

Total: ~28 code days + operational community launch. Score: 140 → 468.

---

## Per-CD Recommendations (Full Detail)

### CD1: Epic Meaning & Calling (6 → 8)

**1a. "Co-Creator" framing (0 days, copy change)**
After completing Remarkable Results, display: "Your rule break has been added to our creator database alongside 91 other experience creators." The `remarkable_angles` table + 91-creator canonical JSON (`experienceCreatorDNA.json`) already exist. Pure copy change. Frame Scale as a living research project they're contributing to, not a static tool.
Source: DCC "Carl's inventions get added to the Dungeon Codex."

**1b. "Movement Maker" identity from day one (0 days, copy change)**
Portal greeting: "Welcome, Movement Maker." Not aspirational. Granted on purchase. The identity is given, not earned. The playbook helps them LIVE it, not BECOME it. Change the loading state, the header, the welcome email copy.
Source: Zombies Run! "Runner 5" — you ARE the hero from second one.

**1c. North Star connection insight (2 days)**
After completing the Experience Creator matching flow AND Play Profile, surface: "The creators you chose share the [archetype] model. Your DNA matches [specific creator] most closely. They went from [start] to [outcome] in [years]."
Data sources: `creatorSelection.archetype` (which creators they picked + dominant archetype), `founder_dna_results` (5D DNA sliders: workRhythm, fuelType, orientation, knowledgeStyle, scaleApproach), `experienceCreatorDNA.json` (growth timelines, blow-up year, how they started). Euclidean distance matching already exists in `dnaMatching.js`. No new data, just a new display moment.
Source: RPO "Destiny Child" — Wade finds the Copper Key. He feels chosen. Scale equivalent: "You're not random. You're a pattern we've seen before."

**1d. Origin story moment (0 days, copy change) (NEW from Stardew)**
Stardew opens with the cubicle you escaped. Scale should open with a similar "you were here, now you're here" moment on first login. "You didn't start from zero. You started from a decision." Acknowledge what they left behind to build this. Display on first portal visit, not every time.
Source: Stardew Valley opening cinematic. The farm isn't the start. The decision to leave is.

---

### CD2: Accomplishment & Progress (5 → 9)

**2a. Celebrate completions (1 day)**
Confetti + personality-driven toast on: playbook stage completion (x4), first experience created, first event sold out, positioning statement generated, Scale Score earned. Reuse `useCelebrations` hook from consumer app (`src/hooks/useCelebrations.js`). Wire `celebrateTaskComplete()` to playbook milestones.
Copy style: Not "Positioning complete." Instead: "Your positioning statement just landed. 90% of creators never get this far. You have words for what you do now." Huzz-voiced, one per milestone.
Source: DCC snarky achievement notifications ("New Achievement: You Monster!").

**2b. Show Movement XP + creator levels (1 day)**
Movement XP is already loaded in CreatorHomeV2 (`xpData` at line 276). V1 component (`CreatorHome.jsx` line 430) already renders it. Port the display pattern. Add level thresholds:

| Level | Name | XP | Unlock |
|---|---|---|---|
| 1 | Dreamer | 0 | Portal access |
| 2 | Builder | 50 | Inner Game: Play Profile |
| 3 | Launcher | 150 | Lightning Strike tool |
| 4 | Scaler | 400 | Creator community access |
| 5 | Movement Maker | 1000 | Featured in creator database |

XP sources: Complete playbook stage (25), create experience (10), run experience through pipeline (15), 3% improvement (5), weekly creator pulse (10), fill event 80%+ (20).
Source: Peloton Club tiers (Bronze → Legend). Points for showing up, not performance.

**2c. Post-experience reveals (2 days)**
After running an event through the pipeline, surface delayed insights: "Your Attract→Convert rate was 23%, up from 15% last time." "You had 4 repeat attendees. That's a new record." "Your 3% improvements are compounding: this is your 5th in a row."
Data: `contact_experiences` + pipeline readiness % + 3% chain from `experience_3pct_notes`. All exist.
Source: Strava post-activity segment PR reveals. Only revealed AFTER the activity. Creates anticipation.

**2d. Weekly Creator Pulse (3 days)**
Available Sunday-Monday only (time-gated). Review: events this week, attendees total, pipeline progress, content posted, 3% improvements logged. Award 10 XP for completion. Produces a shareable card (reuse `WeeklyReviewCard.jsx` pattern from consumer app).
Source: Peloton appointment dynamics + consumer app `WeeklyReview.jsx`.

**2e. Sequential score reveal after events (2 days) (NEW from GDT)**
GDT reveals review scores one critic at a time. Scale equivalent: after running an experience, don't show all metrics at once. Reveal them sequentially: first attendee count, then satisfaction, then repeat rate, then revenue. Each reveal is a moment of tension. Currently the pipeline shows everything at once, which flattens the dopamine.
Source: Game Dev Tycoon one-by-one critic reveal.

**2f. Collection completion grid (1 day) (NEW from Stardew)**
Stardew's shipping log shows every item you've shipped vs. what's still missing. Scale equivalent: show everything the creator COULD build, with completed items checked off. "You've completed 3 of 4 playbook stages. The Scale Score is waiting." The playbook stepper already does this partially. Add the "what's still missing" framing to make incomplete items tempting, not guilt-inducing.
Source: Stardew Valley shipping log + museum collection.

**2g. Setup checklist with progress bar (1 day) (NEW from Shopify)**
Most proven business onboarding pattern. "Your portal is 40% set up." Checklist: connect Instagram, complete positioning, create first experience, run first pipeline. Shopify's data shows users who complete the setup checklist retain significantly better. Display as a dismissible card on the Identity tab until complete.
Source: Shopify onboarding checklist.

---

### CD3: Empowerment & Creativity (5 → 7)

**3a. Alternative positionings (2 days)**
After generating positioning statement, show 2-3 AI-generated variations by shuffling inputs (swap life quake emphasis, reframe transformation angle, change audience specificity). Let them pick or edit. The creative agency is in the CHOOSING.
Source: DCC chain combos (moonshine + torch + oil = boom jug). Combining elements creates unique outcomes.

**3b. Experience creation as assembly (3 days)**
Show the experience coming together visually as components are added: format selected → time set → venue chosen → marketing plan generated → run sheet built. Each addition appears as a card/tile. Like assembling a rig, not filling a spreadsheet.
Source: RPO "Build From Scratch" — Wade's immersion rig described component by component.

---

### CD4: Ownership & Possession (6 → 8)

**4a. Creator portfolio / trophy case (3 days)**
Single "My Journey" view showing everything built:
- Experiences created (with attendee counts)
- Playbook stages completed (with dates)
- Positioning statement (framed in a card)
- Rule break (highlighted)
- Scale Score (displayed as report card)
- Creator level badge
- Total lifetime attendees served (counter)
- Creator share card (holographic, already exists)
Source: DCC infinite inventory. 2,997 lumps of coal. The accumulation IS the satisfaction.

**4b. Dynamic share card (2 days)**
The holographic `CreatorShareCard` modal already exists with foil border. Make it the hero of the Identity tab (not hidden behind a button). Upgrade border as they level: bronze → silver → gold → holographic. New badges appear on the card as playbook stages complete.
Source: RPO avatar identity construction. Complete identity: name, appearance, reputation.

**4c. Permanent monotonically increasing progress (design principle) (NEW from Stardew)**
Stardew's core genius: nothing you build can be taken away. Scale must follow the same rule. Never reset a counter. Never hide past work. Even low-attendance events should display as "your 12th experience" not be hidden. The Growth tab should show ALL events chronologically, not just successful ones. Your portfolio only grows. This creates the psychological safety to experiment that Stardew is famous for.
Source: Stardew Valley. Progress is monotonically increasing. You can never lose your farm.

---

### CD5: Social Influence & Relatedness (2 → 6)

**5a. "Here Now" counter (0.5 days)**
"X creators are in the portal right now." Simple active-session counter. Display on Identity tab. Ambient social presence without community infrastructure.
Source: Peloton "Here Now" counter. "2,400 people riding together."

**5b. Anonymous activity feed (1 day)**
"A creator in Melbourne just completed their Remarkable Results." No names, no profiles. Just ambient awareness that other people are doing this work too. Fire-and-forget inserts to a simple `creator_activity_log` table.
Source: DCC "viewers are watching." Social pressure without social interaction.

**5c. One-tap Kudos (1 day, ships with community feed)**
After a creator shares a milestone, others tap once to acknowledge. Gold sparkle animation. Counter: "12 creators acknowledged your rule break." Low-friction social proof.
Source: Strava Kudos. 14 billion given. One tap.

**5d. Creator community feed (5 days)**
Auto-post milestones: playbook stage completed, experience created, event sold out, 3% chain milestone. Other Scale users react. Consumer `PlaylistFeed.jsx` is a pattern reference (not directly portable — needs creator event types). Requires new `creator_feed_events` table + render component.
Source: Peloton High Fives + milestone shoutouts.

**5e. Archetype tribes (1 day, ships with community feed)**
"You're in the Workshop Creators tribe. 8 other Scale users build workshops." Based on `creatorSelection.archetype`. Not competitive, just belonging.
Source: Pokemon GO team allegiance (Mystic/Valor/Instinct).

**5f. Creator league (5 days) (NEW from Duolingo)**
Weekly cohort of ~10 Scale users grouped by stage. Not competitive on revenue. Competitive on ACTIVITY: playbook steps completed, experiences created, pipeline tasks done. Weekly reset. Top 3 promoted to next league. Bottom 3 demoted. Duolingo proves this works even with strangers you never interact with. The single highest-impact CD5 feature across all 12 sources. Also feeds CD8 (league demotion is the only loss mechanic that doesn't feel punitive because you lose STATUS among strangers, not your own progress).
Source: Duolingo leagues (30 users, weekly reset, promotion/demotion). Appears in 3+ source analyses.

---

### CD6: Scarcity & Impatience (3 → 6)

**6a. Event countdown urgency (1 day)**
Existing countdown badge has no color logic. Add: amber at 14 days, red at 7 days, pulsing at 3 days. Plus "X tasks still incomplete" alongside. CSS changes + simple conditional logic in `countdownLabel`.
Source: DCC countdown timer. Literally visible in Carl's HUD at all times.

**6b. Inner Game unlock chain (2 days)**
Content already exists (Play Profile, Nervous System, Wound Map, Limiting Beliefs are all built in CreatorHomeV2 line 647+). Just need progressive gating:
- Complete Results → unlocks Play Profile
- Complete Reach → unlocks Know Your Ceiling
- Complete Growth → unlocks Wound Map
- Complete Score → unlocks Limiting Beliefs
Each unlock shows a surprise reveal: "You've earned access to a new tool. Here's why it matters now." The current visual lock (opacity 0.35) becomes a real conditional gate.
Source: DCC Options Pacing (class selection locked until floor 3).

Note: Scale already implements Options Pacing in the playbook pipeline (Reach locked until Results, etc.). This is recognized as one of DCC's highest-scoring CD6 mechanics. What's missing is TIME-based scarcity, not PROGRESSION-based.

**6c. Weekly Creator Pulse time-gate (included in 2d)**
Only available Sunday-Monday. Missed window = missed XP. Creates appointment rhythm.
Source: Peloton live class scheduling.

**6d. Building streak (2 days) (NEW from Duolingo + Stardew)**
Weekly cadence, not daily (too much pressure for business builders). "You've built for 4 weeks straight." Forgiving: 1 week miss allowed without breaking streak (same pattern as consumer app's forgiving streak). Streak freeze purchasable with XP. Tracks: any activity that moves your business forward (playbook step, experience created, pipeline task, content posted).
Source: Duolingo streak (most powerful retention mechanic in mobile apps) + Stardew weekly rhythm.

**6e. Natural scarcity over artificial timers (design principle) (NEW from Stardew)**
Stardew never uses countdown clocks. Seasons just change. Scale's urgency should come from real event dates and seasonal business patterns, not artificial deadlines. "Your next event is in 14 days" is natural scarcity. "Complete this within 48 hours" is artificial and creates anxiety. Remove any artificial deadline copy from the portal.
Source: Stardew Valley seasonal model. Appears in 4+ source analyses as a pattern.

---

### CD7: Unpredictability & Curiosity (2 → 7)

**7a. Insight Drops per playbook stage (4-5 days)**
Computed from actual creator DNA data, not generic:
- After Results: "Your rule break matches the same branch as [Creator X]. Only 12% of creators in our data broke the same rule. Here's what they did next..."
- After Reach: "Your vehicle type is [X]. Only 18% chose this. That's rare. Here's why that's an advantage..."
- After Growth: "Your access architecture removed [X barrier] first. Creators who start there see [Y%] faster adoption."
- After Score: "Your Scale Score is [X]/15. Creators who scored [X] typically see their first viral moment within [Y] months."
UI: Reuse `InsightDrop.jsx` component (slide-up animation, rarity tiers). Data layer: full rebuild reading from `remarkable_angles`, `narrative_builders`, `access_architectures`, `scale_diagnostics` + `experienceCreatorDNA.json` corpus.
Source: DCC mystery box reveals. "What's in the Legendary Pet Box?!"

**7b. Zarlo for creator portal (5-7 days)**
Full build. `zarloPageContent.js` has zero entries for `/create` routes. Needs:
- Page context map for Identity/Experiences/Growth tabs
- Proactive bubble triggers: event countdown, pipeline staleness, playbook progress
- Creator-specific system prompt (business context, not healing context)
- Example bubbles: "Your Barcelona event is 22 days out and you haven't started marketing." / "There's something about your 3% improvements. Complete 3 more and I'll reveal it."
Source: DCC Oracle Effect (Mordecai's cryptic advice) + consumer Zarlo infrastructure.

**7c. Case study unlocks (2 days)**
Content rewards unlocked by playbook completion:
- After Results: "How Wim Hof found his rule break"
- After Reach: "How Brene Brown's vehicle changed everything"
- After Growth: "How Tony Robbins removed barriers at scale"
- After Score: "The 5 creators with the highest Scale Scores and what they have in common"
Source: Zombies Run! — narrative advances only through physical activity. Content IS the reward.

**7d. Personality in system messages (1 day, copy pass)**
Replace all generic toasts/alerts with Huzz-voiced messages:
- Not "Experience created." → "Your 5th experience. Most creators quit at 3. You're not most creators."
- Not "Playbook 3 of 4 complete." → "Three down. The Score is all that's left. You're about to see exactly where you stand."
Source: DCC snarky achievement text. Readers look FORWARD to what the system says next.

**7e. Combination discovery (2 days) (NEW from GDT)**
GDT's hidden gem: certain genre+topic combos work better than others, and players discover these through experimentation. Scale equivalent: show that certain positioning + vehicle + archetype combinations have higher Scale Scores in the database. "Creators with your rule break who chose [vehicle X] scored 30% higher than those who chose [vehicle Y]." Creates "what if I tried a different combination?" curiosity. Data already exists in `experienceCreatorDNA.json`.
Source: Game Dev Tycoon combination discovery system.

---

### CD8: Loss & Avoidance (1 → 4, intentionally capped)

**8a. Pipeline staleness nudge (1 day)**
If event is 7+ days out with <20% Attract readiness: "Your event is in X days and nobody knows about it exists yet. Post your first attract content." Honest mirror, not guilt. Fires once per event, not repeatedly.
Source: DCC visual grave (crawler count ticking down). Each number is a person.

**8b. "Days since last event" mirror (0.5 days)**
On Growth tab: "It's been 34 days since your last experience. Your top fans are waiting." Not punishment. Just making invisible time visible. Data from `contact_experiences` table (last event date).
Source: Strava Relative Effort. Makes difficulty legible and valued.

**8c. Gentle reframe on low attendance (1 day, copy)**
When event has <15 attendees: "12 people came. That's real. Wim Hof's first ice bath had 3. The ones who make it aren't the ones who fill rooms first. They're the ones who keep running events."
Source: NRC Coach Bennett. "Some runs feel terrible. That's how you know you're a runner."

**8d. League demotion (included in 5f league build) (NEW from Duolingo)**
Bottom 3 in weekly creator league get demoted to the previous tier. This is the only "loss" mechanic that doesn't feel punitive because you're losing STATUS among strangers, not losing your own progress. Your portfolio never shrinks (Stardew principle). Only your relative position changes. Tied to the CD5 league recommendation.
Source: Duolingo league demotion.

**8e. Keep CD8 at 4, never higher.**
Scale users are already anxious about the business side. Loss mechanics should feel like honest mirrors, not punishment. The Celeste model: pressure earns more, not less. Streak resets, but learning doesn't. No destructive loss mechanics. No "your account will be downgraded." No guilt.

---

## Corrections & Caveats (from review)

**Effort estimates to revise:**
- Sprint 2 (Insight Drops): Consumer `useInsightDrops.js` is coupled to wahoo/streak data. The UI component is reusable but the trigger/data layer needs a full rebuild for creator context (reads from `remarkable_angles`, `narrative_builders`, `scale_diagnostics`). Revise to **4-5 days**.
- Sprint 3 (Zarlo): `zarloPageContent.js` has zero entries for `/create` routes. Full page context map build from scratch, plus creator-specific proactive bubble triggers. Revise to **5-7 days**.
- Sprint 7 (Community feed): `PlaylistFeed.jsx` is consumer-coupled (wahoo completions, stage graduations). Creator feed needs different event types. Pattern reusable, module is not. Keep at **5 days**.

**Inner Game tab is NOT blank:** The content (Play Profile, Nervous System, Wound Map, Limiting Beliefs) is already built and rendered in CreatorHomeV2. The tab button is visually disabled (opacity 0.35) but the content panel exists. Sprint 4 should "expose and gate progressively" not "build modules."

**Movement XP display exists in V1:** `CreatorHome.jsx` (the non-V2 version) already displays Movement XP at line 430. Port the render pattern, don't design from scratch.

**"Co-Creator" copy is zero-engineering:** The 91-creator canonical JSON is already live. After Remarkable Results completion, just display: "Your rule break has been added to our creator database alongside 91 other experience creators." Pure copy change.

## Missed Opportunities (added from review)

**"Here Now" counter (CD5, zero infra)**
From Peloton analysis. Show "X creators are in the portal right now" on the Identity tab. Simple active-session counter query. Moves CD5 by +1 with nearly zero cost.

**Local Legend (CD2 + CD5)**
From Strava analysis. "Most consistent Movement Maker" metric: most experiences run in a 90-day rolling window. Crown icon on the creator community feed. Rewards consistency over performance. Computable from existing `contact_experiences` table.

**Existing Options Pacing credit**
Scale already implements DCC's "Options Pacing" pattern (Reach locked until Results, Growth locked until Reach, Score locked until Growth). This is one of DCC's highest-scoring CD6 mechanics. The current CD6 score of 3 should be understood as already including this pattern. What's missing is TIME-based scarcity, not PROGRESSION-based scarcity.

---

## Implementation by Difficulty

### EASY (0-1 days each, can ship this week)

| # | Feature | CDs | Days | Clarifying Questions |
|---|---|---|---|---|
| E1 | **Origin story moment** — "You didn't start from zero. You started from a decision." First-login copy. | CD1 | 0 | What copy? Should it reference their old career, or keep it generic? Do we show it as a modal, inline card, or full-screen splash? |
| E2 | **"Movement Maker" identity** — Change all portal greetings from "Creator Portal" to "Welcome, Movement Maker." | CD1 | 0 | Confirm: "Movement Maker" is the identity word everywhere inside the portal? Or just the greeting? |
| E3 | **"Co-Creator" framing** — After Remarkable Results: "Your rule break has been added alongside 91 other creators." | CD1 | 0 | Is this literally true (do we add their data to the JSON)? Or is it aspirational framing? |
| E4 | **Celebrate completions** — Confetti + toast on playbook completion, first experience, first sold-out event. | CD2 | 1 | Which milestones get confetti? Full list needed. What copy for each toast? Should we use the consumer app's confetti style or something more premium for paid users? |
| E5 | **Show Movement XP + levels** — Display XP counter + level label. Data already loaded. | CD2 | 1 | Confirm the 5 level names and thresholds: Dreamer(0), Builder(50), Launcher(150), Scaler(400), Movement Maker(1000). Where does the level display? Hero section? Sidebar? Both? |
| E6 | **Setup checklist** — "Your portal is X% set up." Dismissible card on Identity tab. | CD2 | 1 | What items go in the checklist? Suggested: Connect Instagram, Complete positioning, Create first experience, Run first pipeline. Add or remove any? |
| E7 | **Collection completion grid** — Show playbook stages as "3 of 4 complete. The Scale Score is waiting." | CD2 | 0.5 | Already partially exists in the stepper. Just needs the "what's missing" copy framing. Confirm the copy tone. |
| E8 | **Event countdown urgency** — Amber at 14 days, red at 7, pulsing at 3. "X tasks incomplete." | CD6, CD8 | 1 | Confirm thresholds: 14/7/3 days? Should it also show on the Identity tab hero, or only on Experiences tab? |
| E9 | **Pipeline staleness nudge** — "Your event is in X days and nobody knows about it yet." | CD8 | 0.5 | How often does this fire? Once per event? Once per day? Should it be a toast, inline card, or push notification? |
| E10 | **"Days since last event" mirror** — "It's been 34 days. Your top fans are waiting." | CD8 | 0.5 | Where does this display? Growth tab only? Should it disappear when an event is upcoming? |
| E11 | **Founding member badge** — Permanent badge for first 50 Scale users. | CD6 | 0 | How do we define "first 50"? By signup date? By payment date? Do we count your test accounts? What does the badge look like? |
| E12 | **Personality in system messages** — Replace generic toasts with Huzz-voiced copy. | CD7 | 1 | Need to write ~15-20 unique messages. Should these come from a copy doc you approve, or should I draft them all? |
| E13 | **"Here Now" counter** — "X creators are in the portal right now." | CD5 | 0.5 | Real-time (Supabase presence) or approximation (active sessions in last 15 min)? Where does it display? |
| E14 | **Gentle reframe on low attendance** — "12 people came. Wim Hof's first ice bath had 3." | CD8 | 0 | What threshold triggers this? <15 attendees? <50% capacity? Should it always show, or only for the first few events? |

### MEDIUM (2-5 days each)

| # | Feature | CDs | Days | Clarifying Questions |
|---|---|---|---|---|
| M1 | **Sequential score reveal** — After events, reveal metrics one by one with animation. | CD2, CD7 | 2 | How many metrics in the sequence? Suggested: attendees → satisfaction → repeat rate → revenue. Should each have a 1-2 second delay, or user-tapped? |
| M2 | **Inner Game unlock chain** — 1 module per playbook completion. Content already built. | CD6, CD7 | 2 | Confirm mapping: Results→Play Profile, Reach→Know Your Ceiling, Growth→Wound Map, Score→Limiting Beliefs. Should each unlock show a "why this matters now" explainer? |
| M3 | **Building streak** — Weekly cadence, forgiving (1 miss allowed). | CD6 | 2 | What counts as "building" for the week? Any portal activity? Or specific actions (playbook step, experience task, content posted)? Where does the streak display? |
| M4 | **North Star connection insight** — "Your DNA matches [Creator X]. They went from [start] to [outcome]." | CD1 | 2 | Requires both Experience Creator matching AND Play Profile complete. What if only one is done? Show partial insight or wait? |
| M5 | **Dynamic share card** — Border upgrades bronze→gold→holographic by level. Badges appear. | CD4 | 2 | What are the 4-5 badge designs? Should they be emoji or custom icons? Does the card auto-update or require a manual "refresh card" tap? |
| M6 | **Creator portfolio / trophy case** — Single view of everything built. | CD4 | 3 | Where does this live? New tab? Section within Identity? Should it include a "total impact" number (lifetime attendees served)? |
| M7 | **Combination discovery** — "Creators with your rule break who chose [vehicle X] scored 30% higher." | CD7 | 2 | Is this computed from the 91-creator JSON or from live Scale user data? If JSON, the sample sizes per combination are small. Show percentages or just "higher/lower"? |
| M8 | **Alternative positionings** — AI generates 2-3 variations. User picks. | CD3 | 2 | How different should the variations be? Same inputs shuffled, or genuinely reframed? Should this replace the current single-output flow or be an optional "explore alternatives" button? |
| M9 | **Build-test-see loop** — AI predicts "scroll-stop" likelihood of attract content. | CD3 | 3 | What model powers this? Claude? What data trains the prediction? Is this a number (73% scroll-stop) or a qualitative label (Strong/Weak/Needs Work)? |
| M10 | **Hidden achievements** — Secret milestones nobody knows about until triggered. | CD7 | 1 | How many to start? Suggested 5-8. Need badge names + trigger conditions + copy. Should they be visible in a "???" grid hinting at undiscovered ones, or completely invisible? |
| M11 | **Seasonal creator challenges** — Quarterly challenge with limited-time badge. | CD6 | 1 | What's Q3 2026's challenge? "Run 3 experiences this quarter"? Who defines the challenge each quarter? |
| M12 | **Experience templates as assets** — Proven template badge after 3+ runs. | CD4 | 2 | What makes a template "proven"? 3 runs minimum? Average satisfaction above X? Should templates be shareable/visible to other Scale users? |
| M13 | **Creator league** — Weekly cohort, promotion/demotion. | CD5, CD8 | 5 | How are users grouped? By signup date? By stage? What activity counts for league scoring? Promote top 3, demote bottom 3 out of how many? Is this opt-in or automatic? |
| M14 | **Creator community feed + kudos** — Auto-post milestones, one-tap reactions. | CD5 | 5 | What event types auto-post? Suggested: playbook completion, experience created, event sold out, 3% chain milestone. Do users need to approve before auto-posting? |

### HARD (5+ days each, or requires product decisions)

| # | Feature | CDs | Days | Clarifying Questions |
|---|---|---|---|---|
| H1 | **Insight Drops per playbook stage** — Computed from DNA data, surprise reveal. | CD7 | 5 | UI is reusable from consumer app but data layer is a full rebuild. What specific insights per stage? Need to compute stats from the 91-creator JSON. Are sample sizes large enough per combination to show percentages? |
| H2 | **Zarlo for creator portal** — AI companion with proactive bubbles. | CD5, CD7 | 7 | Zero page context entries exist. What personality should creator Zarlo have? Same as consumer (playful mentor) or more business-coach tone? What triggers proactive bubbles? Event countdown? Pipeline staleness? Playbook progress? All three? |
| H3 | **Creator DNA profile page** — Public-facing profile with shareable URL. | CD4 | 3 | Is this a public page anyone can see? Or only visible to other Scale users? Does it show revenue/attendee numbers (some creators may not want this public)? What URL structure? create.nichuzz.com/creator/[name]? |
| H4 | **AI "what if" scenarios** — Zarlo surfaces counterfactual pricing/format predictions. | CD7 | 2 | Included in Zarlo build. What data powers the predictions? Historical event data from this creator? Aggregate data from all Scale users? Or the 91-creator research corpus? |
| H5 | **Accountability pairs** — Matched with another Scale user, weekly check-in. | CD5 | 1 code + ongoing ops | Matching criteria: same stage? Same archetype? Same geography/timezone? How is the check-in delivered: in-app notification, email, or external (WhatsApp/Slack)? What if one person ghosts? Auto-rematch? |
| H6 | **Group onboarding cohort** — Same-week signups grouped, shared channel. | CD5 | 0 code + ongoing ops | Where does the cohort live: Slack, WhatsApp, Discord, or in-app? Who moderates? What if only 1-2 people sign up in a week? Hold until 4+? |
| H7 | **Monthly Scale call** — Group call, all Scale users. | CD5 | 0 code + ongoing ops | Who runs it (you)? What format: roundtable, presentation, hot-seat coaching? How long: 30 min, 60 min? Is attendance tracked for XP? |
| H8 | **Mentor layer** — Level 4+ creators mentor Level 1-2. | CD5 | 1 code + ongoing ops | How much time commitment for mentors? Is there compensation (free month, badge, featured profile)? What visibility does a mentor get into their mentee's data? Everything, or just playbook progress? |
| H9 | **Local Legend** — Most consistent creator crown (90-day rolling). | CD2, CD5 | 2 | Requires enough Scale users to make this meaningful. At what user count does this activate? 10? 20? What's the crown: visual badge on profile, or actual notification to the winner? |

### Summary

| Difficulty | Count | Total days | Score impact |
|---|---|---|---|
| **Easy** (E1-E14) | 14 | ~7 | 140 → ~280 |
| **Medium** (M1-M14) | 14 | ~34 | 280 → ~400 |
| **Hard** (H1-H9) | 9 | ~22 code + ongoing ops | 400 → ~468 |

**Easy features alone nearly double the score.** Most are copy changes, CSS tweaks, or wiring existing consumer app hooks.

**Medium features require design decisions.** Each has 1-3 clarifying questions that need answers before building.

**Hard features require product decisions + ongoing human effort.** The community features (H5-H8) are operationally intensive. Code is minimal but the commitment is real.

**The 90/10 rule applies:** 90% of the score gain (140→400) comes from Easy + Medium features. The last 68 points (400→468) require community operations that can't be coded.

### Decision Log (July 2026)

**Easy tier decisions:**
- E1: Origin story. Copy confirmed: "The world is going to be a better place thanks to you and your work. We're here to help you create that change." Shows once on first portal visit. Skipped if arriving from payment redirect (?welcome=scale).
- E2: Movement Maker identity woven throughout (greeting, login, email, download popup).
- E3: Co-Creator framing. **SKIPPED.** "Added to our database" felt presumptuous. May revisit if we actually build a living creator database.
- E4: Celebrate all 18 milestones. Confetti + Huzz-voiced toasts. 3-second cooldown queue.
- E5: CreatorXP (separate from consumer movementXP). Levels: Dreamer(0), Builder(50), Launcher(150), Scaler(400), Movement Maker(1000). Hero section.
- E6: Per-section "launch pad" (not "checklist"). Option B (per-tab). Framed as guidance for paid users, not setup.
- E7: Value-framed locked-stage copy. Keep simple, don't use frontier card here.
- E8: Event countdown urgency. Amber 14d, red 7d, pulse 3d. Experiences tab only.
- E9: Pipeline staleness. Daily inline card. Binary trigger (zero items completed, not percentage).
- E10: Days since last event. Growth tab. Hides when event upcoming.
- E11: Founding badge. First 50 by payment date. Manual whitelist for test accounts.
- E12: Personality messages. **MOVED TO HARD** (part of Zarlo creator build, not standalone toasts).
- E13: Here Now counter. **SKIPPED FOR NOW.** Revisit when user count justifies it.
- E14: Low attendance reframe. <50% capacity. Copy by attendance band.

**Medium tier decisions:**
- M1: Sequential score reveal. Proceeds. Shows after event close-out, one metric at a time with pauses.
- M2: Inner Game unlock chain. **NOT YET.** Concept approved (playbook completion unlocks complementary Inner Game modules) but holding until the playbook pipeline is more established with real users.
- M3: Building streak. Proceeds. Weekly cadence, growth tasks count (experience created, pipeline task, 3% note, content posted). Forgiving (1 miss allowed).
- M4: North Star connection. **SKIPPED.** Experience Creator matching shows business model paths, not personal identity. Play Profile workflow doesn't exist in creator portal yet. No clear value at this stage.
- M5: Dynamic share card. Proceeds. Custom SVG of essence avatar image. Manual "Refresh card" tap to regenerate.
- M6: Portfolio / trophy case. Proceeds. Lives on Growth page.
- M7: Combination discovery. **SKIPPED.** 91-creator JSON has too-small sample sizes per combination (2-4 per slice). Showing "30% higher" from 3 data points would be irresponsible. Revisit when corpus scales to 300+ (Monopoly doc Sprint 5).
- M8: Alternative positionings (3 options). Proceeds. Modify generate-positioning edge function to return 3 framings. User picks or edits. "Regenerate" becomes "Show me 3 more." 1-2 days.
- M9: AI content feedback (build-test-see). **SKIPPED.** Needs real social engagement data per post to make accurate predictions. ContentIntel reel analysis exists but doesn't have enough data yet. Revisit when ContentIntel is mature.
- M10: Hidden achievements. Proceeds. All 8: Polymath, Cult Leader, Sold Out, Chain Reactor, Origin Story, Night Owl, Full Stack, Century.
- M11: Quarterly experience planning. Proceeds. Refined: "What experiences are you running this quarter?" User selects from library or creates new, optionally sets dates, appears in Upcoming. End of quarter: review planned vs actual. Lives in Experiences tab.
- M12: Template sharing. **NOT YET.** Personal proven templates (3+ runs = badge) will be built later. Sharing between Scale users deferred until user base grows.
- M13: Creator league. **ON HOLD.** Concept proven (Duolingo pattern) but needs enough Scale users to be meaningful. Revisit at 20+ active users.
- M14: Community feed. Proceeds. 3 auto-post types: playbook completion, experience created, event sold out. Fully automatic, no approval needed.

**Hard tier decisions:**
- H1: Insight Drops. **AI-GENERATED** (not pre-written). Feed relevant user context to Claude: branch data, playbook progress, courage challenge patterns, 3% improvement themes, DNA matches from creator corpus. AI generates unique insights per user. Needs proper context window with real data, not generic prompts. ~5 days.
- H2: Zarlo for creator portal. Proceeds. Playful mentor personality (same as consumer). **Unlocks after first playbook stage completion** (Remarkable Results). Introduction: "You found your rule break. I'm here to help you use it." 7 utility triggers: event countdown (14d no attract), pipeline 80%+ push, 7d inactivity re-engagement, 3% improvement reinforcement, sold-out reflection prompt, Scale Score action insight, quarterly planning prompt. ~7 days. Build AFTER monopoly finder (Zarlo needs branch data for context).
- H3: Creator DNA profile page. Proceeds. **Public URL** (`create.nichuzz.com/creator/[id]`). Shows: essence avatar, archetype, positioning statement, rule break, Scale Score, branch chart, experience types, North Star creators, level badge, founding badge. **NO revenue, attendee numbers, pricing, or contact info.** Identity-focused, not metrics. ~3 days.
- H4: AI "what if" scenarios. **SKIPPED.** No real comparative pricing/outcome data across enough Scale users. Would be fabricated advice. Revisit at 20+ creators with multiple events each.
- H5: Accountability pairs. **MANUAL FOR NOW.** Nic matches users at similar stages manually. Add matching UI when 10+ active users. Zero code needed for v1.
- H6: Group onboarding cohort. **MANUAL FOR NOW.** Nic creates Slack/WhatsApp channel per intake. Zero code needed.
- H7: Monthly Scale call. **MANUAL.** Nic runs it. Format, duration, XP tracking TBD based on first few calls.
- H8: Mentor layer. **NOT YET.** Needs enough Level 4+ users to have a mentor pool.
- H9: Local Legend. **ACTIVATE AT 15+ ACTIVE USERS.** Crown for most experiences run in 90-day rolling window. Not meaningful with fewer users.

---

## Personal Monopoly Finder (Multi-CD Multiplier)

**Spec:** `docs/features/personal-monopoly-finder.md`
**Octalysis impact:** Touches 6 of 8 core drives from a single feature. The highest-impact item in this entire document.

### Why it matters for gamification

The monopoly finder is not a gamification feature. It's a POSITIONING feature. But it has massive gamification side effects because it creates a living, evolving, personally owned artifact that grows with every action the user takes.

### CD impact analysis

| CD | Current target | With monopoly | Lift | Mechanism | Confidence |
|---|---|---|---|---|---|
| CD1 | 8 | **9** | +1 | Frontier card: "Your industry is stuck at [X]. You're breaking it." Transforms business-building into a mission. Progressive confidence (60%→92%) makes the journey meaningful. | 90% |
| CD2 | 9 | **9** | 0 | Confidence percentage is identity-based progress (complements XP which is activity-based). But doesn't add a new CD2 mechanic beyond what's already projected. | — |
| CD4 | 8 | **9** | +1 | "YOUR monopoly" is the ultimate owned artifact. The branch chart is your unique shape. It grows with you, discovered through action. Nobody else has the same combination. | 92% |
| CD5 | 6 | **7** | +1 | "12 of 299 share your combination." Implicit social benchmarking. Sprint 5: "3 creators near your intersection" creates real social context without community infrastructure. | 80% |
| CD6 | 6 | **7** | +1 | "Complete the Life Map to sharpen from 60% to 75%." Confidence gating incentivises progression. "Almost nobody here" creates perceived scarcity of position. | 85% |
| CD7 | 7 | **9** | +2 | Progressive reveal ("what will it say after I finish the next step?"). Gap insight is genuinely unpredictable (vehicle vs territory). Frontier card is Oracle Effect. "Every 5th courage challenge updates your monopoly" = ongoing curiosity forever. | 90% |
| CD8 | 4 | 4 | 0 | No CD8 impact. Good. We cap CD8 intentionally. | — |

### Score impact

```
Without monopoly: 64+81+49+64+36+36+49+16 = 395
With monopoly:    81+81+49+81+49+49+81+16 = 487
Gain: +92 points (single feature)
```

This pushes Scale past the 450 threshold. Only DCC (620), Stardew (481), and Duolingo (476) score higher.

### How it integrates with existing recommendations

**Two separate visualizations (not merged):**
- **Branch chart** = who you ARE (identity/positioning). Lives above BlowUpBrandCard on Identity tab. Shows branches, gap insight, frontier, rarity.
- **Spider graph** = what you've BUILT (business metrics). Lives on Growth tab. Shows Reach, Impact, Price, Consistency, Retention, Brand.

Different data, different purpose, different tab. Do not merge.

**E1 origin story — conditional upgrade:**
- Users WITHOUT curiosity map data: show the generic origin story ("The world is going to be a better place thanks to you and your work.")
- Users WITH curiosity clusters: replace with the branch chart as the first portal moment. "Your curiosities cluster in [branches]. That's not random." Much stronger first impression. But only available if data exists.

**Insight Drops — monopoly as ONE type, not the only type:**
Monopoly reveals join the insight drop pool alongside:
- Creator DNA comparisons ("Your rule break matches [Creator X]")
- Scale Score percentiles ("Top 30% of creators who completed the diagnostic")
- Monopoly updates ("New data: Healing confirmed as primary. Confidence: 78% → 82%")

Multiple types create more variety (stronger CD7) than monopoly-only drops.

**Locked-stage copy — keep as-is:**
The value-framed locked-stage copy (E7) stays simple: "This is where you learn how your story spreads." The frontier card lives in its own section above the playbook, not crammed into locked-stage tooltips. Two different contexts, two different levels of detail.

### Implementation priority

The monopoly finder is partially built (algorithm, data sources, 5 UI surfaces specced). Sprints 0-2 from the monopoly doc are estimated at ~4 hours for visual test + branch profile mounting.

**Recommended insertion:** After Easy tier sprints 1-5 (celebrations, XP, identity, launch pads), build monopoly Sprints 0-2 BEFORE the Medium tier. The branch chart + gap insight + frontier card on the Identity tab will be the most impactful thing a new Scale user sees.

| Sprint | What | Days | CD impact |
|---|---|---|---|
| Monopoly 0 | Mount BranchInsightCard on CreatorHomeV2 (visual test) | 0.1 | — |
| Monopoly 1 | Frontier card as Remarkable Flow primer | 0.5 | CD1 +1, CD7 +1 |
| Monopoly 2 | Full branch profile (chart + gap + rarity + frontier) | 0.5 | CD4 +1, CD5 +1, CD6 +1 |
| Monopoly 3 | AI monopoly statement | 1 | CD7 +1 |

**Total: ~2 days for +92 Octalysis points.** Best ROI in the entire document.

### Caveats

1. **Data dependency.** Users need at minimum curiosity map clusters for the branch chart to show anything. Without data, the feature is invisible. This is by design (progressive reveal) but means day-1 Scale users see nothing until they complete curiosity map.
2. **Frontier card content is 50% validated.** The spec notes this: "Frontier card content pending market research validation." Until validated, show the hypothesis with a label: "Based on our research (unverified)." Don't present hypotheses as facts.
3. **91-creator competitive map (Sprint 5) is Medium-High effort.** Tagging 91 profiles with branches is manual or AI-assisted work. Don't block the core monopoly on this. Ship Sprints 0-3 first, Sprint 5 later.

---

## Creator Badges / Energetic Upgrades (Spider Graph)

**Concept:** Real business metrics gamified as visual badges, displayed as a spider/radar graph that fills out as creators hit milestones. This is NOT artificial game points. These are real achievements that prove credibility and create ownership.

**Why this matters:** Combines CD2 (visible accomplishment at each tier), CD4 (your unique creator fingerprint that only grows), and CD5 (social proof when shared). The spider graph becomes the creator's "DNA shape" that no two creators share.

### Badge Categories + Tiers

| Category | Axis Label | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Tier 5 | Tier 6 |
|---|---|---|---|---|---|---|---|
| **Reach** | Views | 100 | 500 | 1K | 5K | 10K | 50K |
| **Impact** | Attendees | 10 | 50 | 100 | 250 | 500 | 1,000 |
| **Price** | Ticket Price | $0-20 | $20-50 | $50-100 | $100-250 | $250-500 | $500+ |
| **Consistency** | Experiences Run | 3 | 10 | 25 | 50 | 100 | 250 |
| **Retention** | Repeat Rate | 5% | 15% | 25% | 40% | 60% | 80% |
| **Brand** | Scale Score | 1/15 | 3/15 | 5/15 | 7/15 | 10/15 | 13/15 |

Each tier fills the spider axis further out. 6 tiers per axis = 6 concentric rings on the graph.

### Spider Graph Visual

```
        Reach
          ▲
         / \
  Brand /   \ Impact
       /     \
      /       \
Retention --- Consistency
         \
         Price
```

- Each axis extends 0-6 (tiers)
- Filled area = your current shape
- Colour: brand purple fill with gold border at the current tier edge
- The shape is unique to every creator. Someone with high Reach + low Price looks completely different from high Price + low Reach. This IS their creator DNA visualised.

### Where It Appears

1. **Identity tab** — below the hero card, above the playbook. Always visible. The primary "how am I doing?" view.
2. **Creator share card** — mini version embedded in the holographic card. When shared, people see the creator's shape.
3. **Creator profile page** (when built) — the centrepiece of the public profile.

### Upgrade Moments

When a creator crosses a tier threshold:
- Confetti + haptic
- Toast: "Impact badge upgraded. You've reached 100 attendees. That's more than most creators achieve in their first year."
- Spider graph animates the axis extending outward
- Badge icon updates (small → medium → large glow)

### Data Sources

| Category | Source | Exists? |
|---|---|---|
| Reach (Views) | Instagram API via BrandPulse (`instagram_metrics`) | Yes, if connected |
| Impact (Attendees) | `contact_experiences` table, sum of attendees | Yes |
| Price (Ticket) | Experience ticket price field | Yes (in experience creation) |
| Consistency (Runs) | Count of completed experiences | Yes |
| Retention (Repeat) | Repeat attendee calculation (already in Growth tab) | Yes |
| Brand (Scale Score) | `scale_diagnostics.total_score` | Yes |

All data sources already exist. No new tables needed.

### Clarifying Questions

1. **Views** — Instagram API only (already connected via BrandPulse)? Or also YouTube/TikTok? Self-reported fallback if not connected?
2. **Price tier** — pulled from experience data (ticket price field)? Or self-declared?
3. **Spider graph location** — Identity tab hero, share card, and future profile page. All three? Or start with just Identity tab?
4. **Badge visual** — emoji icons, custom SVG badges, or holographic card style?
5. **Upgrade feeling** — confetti + toast on every tier upgrade? Or just major ones (Tier 3+)?
6. **7th axis?** — Should "Playbook" (stages completed, 0-4) be a 7th axis? Would make the graph a heptagon instead of hexagon.
7. **Naming** — "Energetic Upgrades" as the user-facing name? Or something else: "Creator Score", "Growth Radar", "Your Shape"?

### Effort Estimate

- Spider graph SVG component: 2 days
- Badge tier calculation logic: 1 day
- Upgrade celebration wiring: 0.5 days
- Share card integration: 1 day
- **Total: 4-5 days (Medium difficulty)**

### Score Impact

- CD2: +1 (visible tiered accomplishment)
- CD4: +1 (unique shape = owned identity)
- CD5: +0.5 (shareable proof of credibility)

Moves the spider graph into the Medium tier (M15) in the implementation table.
