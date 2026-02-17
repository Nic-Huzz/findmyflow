# FindMyFlow Fantasy League — Season 1 Spec

**Format:** 4 teams of 3 · 4 weeks · Head-to-head round robin + finals
**Scoring from:** Existing 7-day challenge modules in the app

---

## Schedule

| Week | Matchup A | Matchup B |
|------|-----------|-----------|
| 1 | Team 1 vs Team 2 | Team 3 vs Team 4 |
| 2 | Team 1 vs Team 3 | Team 2 vs Team 4 |
| 3 | Team 1 vs Team 4 | Team 2 vs Team 3 |
| 4 (Finals) | 1st vs 2nd | 3rd vs 4th |

Each matchup: team with higher total points that week **wins** (W/L record).
Finals seeding based on W-L record → then total points as tiebreaker.

---

## Scoring System

### How It Maps to the CRM

The app has a **9-stage system** (stageConfig.js):

| Stage | ID | Name | Tab |
|-------|----|------|-----|
| 0 | Flow Finder | 🧭 Discover skills/problems/personas | Always accessible |
| 0.5 | Play-list | 🎮 Groan Matrix + visibility layers | Always accessible |
| 1-7 | Business stages | 🔍→🛠️→🎯→💰→🎯→📢→🚀 | Progressive unlock |
| 8 | Tracking | 📊 Funnel metrics | Always accessible |

**Each stage has `voicePrompts`** — dynamically generated Essence/Protective Voice quests using `generateVoiceQuestion(stage, voiceType, archetypeName)`. These are the Voice category.

**Healing quests** (`category: Healing`) = the 4 R's: Recognise, Release, Rewire, Reconnect.

**Play-list** = Stage 0.5, the Groan Matrix with 5 visibility layers (Screen → Live → Money → Vulnerable → Authority), each with difficulty scaling.

### The 4 League Categories

Each team member earns individual points. Team score = sum of all 3 members per category.

#### 1. 📊 Business Efficiency Score
**Formula:** Total business stage points ÷ Number of business challenges completed

**CRM source:** All quests where `category === "Business"` EXCEPT Play-list stage quests
- Flow Finder flows (stage 0): mind_space, play_list_finder, persona_identifier, etc.
- Stage 1-7 quests: validation, product creation, testing, money models, offer, campaign, launch
- Stage 8 tracking: funnel calculator, funnel baseline

**Why efficiency:** A founder at Stage 1 (Validation) competes on equal footing with one at Stage 5 (Offer Creation). It rewards depth per challenge, not how far along you are.

**Example:**
- Player A: 45 business pts from 5 challenges = **9.0 efficiency**
- Player B: 30 business pts from 3 challenges = **10.0 efficiency**
- Player B wins this category despite fewer raw points

#### 2. 🎮 Play-List Score (raw points)
**CRM source:** Stage 0.5 — Groan Matrix challenges across 5 visibility layers

| Layer | Difficulty | Fear |
|-------|-----------|------|
| 📱 Screen | 1 | Being seen online |
| ⚡ Live | 2 | Real-time judgment |
| 💰 Money | 3 | "Am I worth it?" |
| 💗 Vulnerable | 4 | Rejected for real self |
| 👑 Authority | 5 | Imposter syndrome |

Points from completed Groan challenges, weighted by layer difficulty + scary/wahoo scores (Essence Zone calculation). Higher layers = more points.

**Bonus:** Completing a Groan in the "Essence Zone" (scary ≥7 AND wahoo ≥7) = 1.5x points

#### 3. 🧘 Healing Score (raw points)
**CRM source:** All quests where `category === "Healing"` — the 4 R's

| Type | Quests | Points range |
|------|--------|-------------|
| Recognise | Positive/Negative Frequency, Trigger Pattern, Nervous System Map, Healing Compass | 3-6 pts |
| Release | Daily Release Challenge, Processing Emotions, Big Release | 5-8 pts |
| Rewire | Dopamine Diet, Future Successful You, Hell Yea | 3-5 pts |
| Reconnect | Meditation, Dance, Breathwork, Self-Identified, Prayer, Weekly Task, Environment Hygiene | 3-6 pts |

Raw point total. Daily quests compound — consistency wins.

#### 4. 🛡️ Voice Score (raw points)
**CRM source:** Stage-specific `voicePrompts` — dynamically generated per user's archetype

Each business stage (1-7) has two voice quests:
- **Essence Voice:** "How did your [Archetype] [essenceAction] today?"
- **Protective Voice:** "How did your [Archetype] [protectiveBlock] today?"

Example (Stage 1 Validation):
- Essence: "How did your Radiant Rebel *ask for the validation to be complete* today?"
- Protective: "How did your Radiant Rebel *stop you from sending the validation form* today?"

Points from completing these reflections. Also includes Stage Groan completions (the big fear challenge per stage).

**Data source:** `quest_completions` table where `quest_type` matches voice/groan quest IDs

---

## Weekly Scoring Summary

Each week, per team:

```
TEAM WEEKLY SCORE = 
  Σ(member business efficiency scores) × weight
+ Σ(member play-list points) × weight  
+ Σ(member healing points) × weight
+ Σ(member voice points) × weight
```

### Category Head-to-Head (Fantasy Football Style)

Each week's matchup is decided by **winning more categories**, not total points.

Each team competes across all 5 categories. Win a category = 1 point.

| Result | League Points |
|--------|---------------|
| Win 3, 4, or 5 categories | **WIN** (3 pts) |
| Win 2, lose 2 (+ 1 draw) | **DRAW** (1 pt each) |
| Win 0 or 1 categories | **LOSS** (0 pts) |

**5th Category: 📸 Content** — points for promoting their journey + the competition. See `fantasy-league-content-system.md` for full template library.

**Why this works:** A team stacked with business grinders can't win by ignoring healing and voice work. You HAVE to be balanced. This IS FindMyFlow's philosophy — all four wheels need to turn.

**Tiebreaker within a category:** If both teams score identically in a category, it's a draw for that category (no point awarded to either).

**League table:** W-D-L record → then total category wins as tiebreaker → then total raw points

---

## Weekly Flow

### Monday: Week Opens
- Matchup announced ("Team Flow vs Team Grind this week!")
- New 7-day challenges available
- Previous week's scores posted

### Monday–Sunday: The Grind
- Team members work through challenges
- Points accumulate in real-time on leaderboard
- Squad WhatsApp/Telegram group for banter + accountability

### Sunday Night: Scores Lock
- All activity before midnight counts
- Scores calculated, matchup result determined

### Monday AM: Match Report
- Auto-generated (or manual for v1) match report graphic
- Win/loss announced
- League table updated
- "Player of the Week" across all teams (highest individual score)

---

## Finals (Week 4)

**1st vs 2nd:** Championship match. Same scoring, higher stakes.
**3rd vs 4th:** Bronze match.

**Finals bonus rules:**
- All category weights become equal (25% each) — true test of balance
- "Captain's pick": Each team nominates one member whose scores count 1.5x
- Losing team in championship can challenge one category score (like VAR review) — forces engagement

**Prize:** 1 free month CRM access for winning team (TBC — risk of false answers, may adjust)
- Note: scoring system should be designed to minimize gaming (efficiency metric + category balance helps)

---

## V1 Implementation (Keep It Simple)

### Google Sheet Structure

**Tab 1: Players**
| Player | Team | Email |
|--------|------|-------|

**Tab 2: Weekly Scores**
| Week | Player | Biz_Pts | Biz_Challenges | Biz_Efficiency | Playlist_Pts | Healing_Pts | Voice_Pts | Weighted_Total |
|------|--------|---------|----------------|----------------|-------------|-------------|-----------|----------------|

**Tab 3: Team Totals**
| Week | Team | Total_Score | Opponent | Opponent_Score | Result |
|------|------|-------------|----------|----------------|--------|

**Tab 4: League Table**
| Team | W | D | L | Pts | Total_Score | Rank |
|------|---|---|---|-----|-------------|------|

**Tab 5: Leaderboard (individuals)**
| Rank | Player | Team | Total_Score | Best_Category |
|------|--------|------|-------------|---------------|

### Scoring Input
For v1, two options:
- **(A) Manual:** Huzz/Sol reads CRM data weekly, inputs to sheet
- **(B) Semi-auto:** If Supabase access granted, Sol pulls challenge completion data via API and populates sheet

### Leaderboard Display
- Simple page at `/league` on FindMyFlow
- Reads from Google Sheet (published as JSON) or Supabase view
- Shows: league table, this week's matchups, individual leaderboard
- Update: weekly (manual refresh for v1)

---

## What We Need to Build

| Item | Effort | Blocked? |
|------|--------|----------|
| Point values for each challenge action in CRM | Medium | Need to map existing challenges → point values |
| Google Sheet template | Small | No |
| Weekly score calculation (manual or script) | Small | Supabase creds for auto |
| Match report graphic template | Small | Canva or auto-gen |
| `/league` page on FindMyFlow | Medium | Need repo access or Huzz builds |
| Signup form for teams | Small | Google Form |
| Squad WhatsApp/Telegram groups | None | Huzz sets up |

---

## Pre-Launch Checklist

| Task | Owner | Status |
|------|-------|--------|
| Update scoring system in CRM | Huzz | TODO |
| Update landing page for league | Huzz | TODO |
| Finalise healing challenges | Huzz | TODO |
| Map CRM quests → 4 league categories | Sol + Huzz | TODO |
| Build Google Sheet scoring template | Sol | TODO |
| Recruit 12 players (4 teams of 3) | Huzz | Starts next week |
| Resolve voice quest mapping (dynamic quests not in JSON) | Huzz | TODO |
| Resolve Play-List carve-out from Business category | Sol + Huzz | TODO |

## Open Questions

1. **Team formation:** Do you pick teams or do people self-form squads?

2. **Supabase query access:** To automate scoring, I need to query `quest_completions` and `challenge_progress` tables. When can we get creds?

3. **Voice quest data:** The dynamic voice quests use `generateVoiceQuestion()` — are completions stored in `quest_completions` with a recognizable `quest_id` pattern (e.g., `voice_essence_stage_1`)? Need to know the exact IDs to filter.

4. **Groan challenge completions:** These are in `groan_challenges` table? What's the schema for tracking scary/wahoo scores and completion status?

---

*Created: 2026-02-13*
*Ready for Huzz review + answers to open questions*
