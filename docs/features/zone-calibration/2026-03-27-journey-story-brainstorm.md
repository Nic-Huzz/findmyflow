> **Note:** The structural theory sections from this brainstorm have been consolidated into `docs/zone-calibration-framework.md` (the single source of truth). What remains here is design/planning content: onboarding concept, coverage gaps, portal design, progression gate questions, and open design questions.

# Journey Story Brainstorm — 2026-03-27

## Context
Brainstorming session on mapping the Zone Calibration Framework's 5-act journey (0,0 → Unfulfilment → The Crack → Head Full of Dreams → Self-Actualisation) as the primary game story in FindMyFlow.

---

## The Journey Story Arc

Users arrive at FindMyFlow at **The Crack** or after sitting in **Head Full of Dreams** too long. The app's job is to move them along the Sprouter diagonal toward Self-Actualisation.

### The 5 Acts

| Act | Name | What's Happening | App Position |
|-----|------|-----------------|-------------|
| 0,0 | Pure Self | Before any wounds. Full authentic expression. | Before the app (avatar anchor) |
| Unfulfilment | The Misguided Zone | All action, no self-knowledge. Busy but empty. | Before the app (told as story) |
| The Crack | The Portal | Something broke. Burnout, breakdown, quiet knowing. | **Entry point** — why they signed up |
| Head Full of Dreams | Paralysis Zone | Self-knowledge emerging, action stalled. | **Where most users ARE** — X axis building |
| Self-Actualisation | The Diagonal | Action + self-knowledge moving together. | **Where the app takes them** — Y axis activates |

### How It Maps to Features

- **X axis (Self-Knowledge) = Repair phase**: Flow Finder, Play-List, Healing, Archetypes
- **Y axis (Action) = Build phase**: Business stages 1-7
- The business IS the action that turns Head Full of Dreams into Self-Actualisation

### Onboarding Must Deliver

1. "I feel so seen" — the diagnostic mirrors them so accurately they screenshot it
2. "Now I have words for it" — framework language as a gift, not a lecture
3. "This is the coolest thing ever" — premium visual experience, genuine excitement

---

## Healing Deep Dives → Wound Stage Mapping

### Existing Deep Dives Reordered as Story Chapters

| Chapter | Title | Flow | Wound Stage | What It Identifies |
|---------|-------|------|------------|-------------------|
| 1 | "Where Are Your Edges?" | NS Boundaries | Stage 1-2 | Earning edge, visibility edge, safety contracts, protective archetype |
| 2 | "What Are You Actually Hungry For?" | Healing Compass | Stage 2-3 | Primary need, protective pattern, emotional splinter (6D body map) |
| 3 | "What's The Code Running The Show?" | Matrix Codes | Stage 3 | Top 3 limiting beliefs, behavior patterns, dominant archetype + core wound |
| 4 | "Who Did You Become To Belong?" | NEW — needs building | Stage 4 | Chameleon/Withdrawn pattern, group identity absorption, social self vs authentic self |
| 5 | "What Did You Hide To Fit In?" | Shadow Work (ARCHIVED) | Stage 5 | Shadow traits, suppressed essence, origin story |
| 6 | "What Finally Broke?" | NEW — needs building | Stage 6 | Crack type, failed safety contract, origin event |

### The Story It Tells

Chapter 1 finds the fence → Chapter 2 finds what's behind it → Chapter 3 names who built it → Chapter 4 shows how your friend group reinforced or challenged it → Chapter 5 shows what you traded to live inside it → Chapter 6 is the moment you decided the fence has to come down.

Each chapter builds on the last. By Chapter 6, the user has a complete map of how they got from 0,0 (pure self) to Unfulfilment (constructed self) — told through their own specific data, not generic theory.

### Deep Dives ARE the Repair/Build Graph Sequence

The existing healing deep dives map almost 1:1 to the framework's repair/build graph sequence. Each deep dive unsticks a specific graph. The sequence is built into the biology.

| Healing Sequence | Graph | Deep Dive | Stage Repaired | Question It Answers |
|---|---|---|---|---|
| 1st | **Identity SS** | Shadow Work (archived) | Stage 5 repair | "Who am I really?" (suppressed essence, shadow traits, origin story) |
| 2nd | **Vulnerability SS** | Healing Compass | Stage 2 repair | "Can I be honest about what I need?" (unmet need, emotional splinter) |
| 3rd | **Enough SS** | Matrix Codes | Stage 3 repair | "Do I have permission to move?" (inner critic named, limiting beliefs) |
| 4th | **Growth SS** | NS Boundaries | Build graph | "What's my real edge?" (earning edge, visibility edge, comfort zone mapped) |
| 5th | **Execution SS** | Limiting Belief Rewire | Build graph | "Why do I burn out or stall?" (root belief traced to origin) |
| 6th | **Passion-Risk** | **NEW FLOW NEEDED** | Stage 6 repair | "What do I actually care about?" (genuine passion vs hollow fuel) |

### The Deep Dive Narrative: A Rescue Mission

The 6 deep dives tell one continuous story — a rescue mission for the authentic self:

| Order | Deep Dive | Narrative | What It Reveals |
|---|---|---|---|
| 1 | **Shadow Work** | "Meet yourself." | Your authentic self (essence) who's been hiding in the shadow. The suppressed you. |
| 2 | **Healing Compass** | "What are they hungry for?" | The emotional need your essence has that isn't being met (Life Design / Connection / Mastery / Meaning) + where the wound lives in your body. |
| 3 | **Matrix Codes** | "What code is keeping them caged?" | The invisible operating system (top 3 beliefs) the inner critic runs to block the essence from getting what it needs. |
| 4 | **NS Boundaries** | "Where are they allowed to roam?" | The invisible fence — exactly how much money, visibility, and risk your nervous system permits before it self-sabotages. |
| 5 | **Limiting Belief Rewire** | "What story built the cage?" | The specific origin event where ONE of those beliefs was installed. The time machine back to the moment the code was written. |
| 6 | **Passion Excavation** (NEW) | "What would they chase if the cage was open?" | What your essence actually cares about enough to risk everything for. Genuine fuel vs constructed agenda. |

**The arc:** You meet the person trapped inside → you find out what they're starving for → you name the code keeping them locked up → you map the boundaries of their cell → you trace the lock back to who built it and why → you open the door and ask: "where do you actually want to go?"

**Implications:**
- The deep dives aren't random healing exercises. They're the LEVELS of the game.
- Each one unlocks the next graph. You can't do Growth work until Enough is addressed.
- They need to be presented in this order and framed as the healing journey sequence.
- Limiting Belief Rewire is the "time machine" — usable at any level to trace a belief to its origin.
- One gap: a Passion-Risk flow that excavates genuine passion needs building.

### Essence Archetype = The Anchor for the Entire Journey

The essence archetype IS the authentic self at 0,0 — who the user was before any wounds were installed. Each of the 12 essence archetypes has an `inner_child_desire` (what they wanted before wounds) and an `essence_wound` (what pain made them suppress it). This is already built into the data model.

**The protective archetype shifts per stage** (it's a response to each wound — Performer at Stage 2, Perfectionist at Stage 3, etc.). **The essence is the constant underneath all of them.** It's the thread that was there before any wound was installed.

**The journey design:**

1. **Onboarding** — walk the 6 wound stages, protective archetype emerges from the pattern of zone choices
2. **Level 1: Shadow Work (Identity SS)** — reveals the suppressed essence. "This is who you were before all of that. This is who's been waiting." The essence archetype becomes the anchor for the entire rest of the journey.
3. **Every subsequent level** — the question becomes: "Is this my essence speaking or my protective voice?" The essence is the compass. The protective is the obstacle. Every graph from Vulnerability through Execution is about reclaiming more of the essence.

**Shadow Work is where the user meets themselves.** Everything after is the journey back to that self.

**Level-by-level essence framing:**

| Level | Graph | Deep Dive | Essence Question |
|---|---|---|---|
| 1 | Identity SS | Shadow Work | "Who were you before the world told you who to be?" → Essence archetype REVEALED |
| 2 | Vulnerability SS | Healing Compass | "What does your essence actually need?" (primary need = essence hunger) |
| 3 | Enough SS | Matrix Codes | "What code is blocking your essence from moving?" (inner critic named) |
| 4 | Growth SS | NS Boundaries | "Where does your nervous system stop your essence from expanding?" |
| 5 | Execution SS | Limiting Belief Rewire | "What belief makes your essence burn out or stall?" |
| 6 | Passion-Risk | NEW FLOW | "What does your essence actually care about enough to risk it?" |

The existing `EssenceVsProtectiveTracker` already tracks the essence vs protective dynamic in daily voice check-ins. With this structure, every challenge across all levels is framed as "moving toward your essence, not away from your protective pattern."

**The 12 Essence Archetypes** (from `essenceProfiles.js`):
- Activators: Radiant Rebel, Playful Creator, Sacred Jester
- Transmuters: Wild Alchemist, Mystic Messenger, Truth-Teller
- Stabilisers: Heart Holder, Grounded Guardian, Rhythm Architect
- Bridgers: Cosmic Connector, Compassionate Leader, Wise Sage

### Coverage by Wound Stage

| Wound Stage | Coverage | Gap |
|------------|---------|-----|
| Stage 1 (Nervous System) | ~30% | Has practices but no Polyvagal education |
| Stage 2 (Attachment) | ~45% | Identifies archetypes + origins but no family excavation |
| Stage 3 (School) | ~65% | Good belief system coverage, missing explicit school excavation |
| Stage 4 (Friend Group) | **~0%** | Nothing exists. New stage. Needs deep dive built. |
| Stage 5 (Constructed Life) | **~25%** | Shadow Work archived. Biggest gap. |
| Stage 6 (The Crack) | **~10%** | Nothing exists. Needs new Crack Recognition Flow. |

### Matrix Codes Map to Wound Stages

The 5 matrix codes aren't random limiting beliefs. They map directly to where they were installed:

| Matrix Code | Core Belief | Installed At | Onboarding Zones |
|---|---|---|---|
| Emotions = Unsafe | Feeling is dangerous | Stage 1-2 (deepest) | Invisible Child, Adapted Self |
| Success = Status | Worth = external validation | Stage 2-3 | Adapted Self, Good Student, Achiever |
| Safety = Sameness | Being different is dangerous | Stage 3-4 | Good Student, Chameleon |
| Visibility = Risk | Being seen = being attacked | Stage 3-4 | Rebel/Good Student, Withdrawn |
| Worth = Productivity | Must produce to deserve | Stage 3-5 (shallowest) | Good Student, Achiever, Hollow Success |

**Onboarding integration:** When user picks an extreme zone at a stage, show the matrix code(s) mapped to that stage: "Does this feel true?" The archetype emerges from the pattern of zone choices across all 6 stages, not from a quiz.

**OPEN QUESTION: Matrix Code terminology in user profile.** After onboarding, do we surface "Your active matrix codes: Success = Status, Visibility = Risk" in their profile? Or do we know it internally (for Zarlo/challenge routing) but don't label it for the user? Concern: could be too much jargon/noise for the user. Counter-argument: the framework language as a gift, not a lecture — having words for it is empowering. Needs discussion.

### What Needs Building

1. **Un-archive Shadow Work** — the only flow touching Stage 5. Update with Zone Calibration language.
2. **Build Friend Group Deep Dive** — new flow for Stage 4. "Who did you become to belong?"
3. **Build Crack Recognition Flow** — new deep dive for Stage 6.
4. **Add stage tags to each flow** — so the system knows which wound stage each deep dive addresses.
5. **Reframe Limiting Belief Rewire** — position as a "time machine" usable at any chapter.
6. **Embed matrix codes into onboarding** — replace standalone quiz with stage-integrated code reveal.

---

## Onboarding Concept

### Proposed Flow

1. **Create Hero Avatar** — user uploads photo, AI generates hero version. This is "you at 0,0."
2. **Walk the 6 Wound Stages** — at each stage, user sees 3 AI-generated scenes with their face, chooses the one that resonates. Maps to archetypes and Polyvagal states.
3. **The Result** — personal wound map showing their pattern across life stages. A visual journey from pure self to constructed self. The "I feel so seen" moment.

### The 6 Wound Installation Stages (Onboarding Scenarios)

Each stage has a 2-axis graph with 3 zones (Top Left / Diagonal / Bottom Right). User picks the scene that resonates. AI generates scenes using the user's face at the appropriate age for each stage.

| Stage | Name | Y Axis | X Axis | Top Left (Sympathetic) | Diagonal | Bottom Right (Dorsal) |
|-------|------|--------|--------|----------------------|----------|---------------------|
| 1 | You Arrive | Attunement received | Safety present | **Overwhelmed Child** — seen but never settled. Chaotic but present caregiver. Sensitivity without ground. | **Secure Base** — attuned and safe. Ventral Vagal default set. | **Invisible Child** — physically safe but unseen. Needs met, self not witnessed. Compliance without aliveness. |
| 2 | You Learn What Works | Love received | Authentic expression | **Adapted Self** — love present but only for edited version. Suppress expression to maintain connection. Foundation of Performer, People Pleaser. | **Unconditional Belonging** — authentic expression met with love. No editing required. | **Rejected Self** — full expression, love withdrawn. Being yourself costs connection. Foundation of Ghost. |
| 3 | School Installs the OS | Conformity required | Authentic self suppressed | **The Rebel** — fights back. Authentic self survives at significant social cost. Labelled difficult. | **Grounded Student** — navigates without disappearing. Rare. | **The Good Student** — conforms completely, gets praised, loses themselves gradually. Most dangerous zone. |
| 4 | Your Friend Group Decides | Social belonging | Authentic self maintained | **The Chameleon** — high belonging, low authentic self. Absorbed the group's identity. Popular but lost themselves. The most socially successful wound. (Performer, Controller) | **Found Their Tribe** — belonging and authentic self move together. Group accepted who they actually were. Rare. | **The Withdrawn** — low belonging, high authentic self maintained. No group felt safe enough. Retreated entirely. Authentic but isolated. (Perfectionist, Ghost) |
| 5 | You Build the Constructed Life | External validation | Internal alignment | **The Achiever** — maximising validation with no compass. Builds fast, impressively, in the wrong direction. Performer/Controller in full operation. | **Intentional Builder** — external success aligned with internal truth. Rare at this stage. | **The Dropout** — rejects the game entirely. Authentic but isolated. Passion without traction. Ghost in operation. |
| 6 | You Achieve the Thing and Feel Nothing | Achievement level | Meaning level | **Hollow Success** — maximum achievement, minimum meaning. Life looks perfect outside, quietly empty inside. THIS IS UNFULFILMENT. | **Meaningful Achievement** — what you've built actually matters to you. The survivor. | **Unfulfilled Idealist** — knows what matters but hasn't built toward it. Rejected Achiever path, hasn't found alternative. |

**Archetype mapping across all stages:** Top left = Sympathetic activation (Performer, Controller). Bottom right = Dorsal collapse (Perfectionist, Ghost). People Pleaser mask layers on top of either.

### Scene Design

- Pre-generated Pixar-style illustrated scenes (not user's face). Landscape 16:9 orientation.
- Different kid per stage, same kid across the 3 scenes of that stage.
- Stage 1 (Infancy): brown-haired toddler. Stage 2 (Childhood): red-haired girl. Stage 3 (School): East Asian teen boy. Stage 4 (Friends): Black teen girl.
- 12 total scenes (4 stages x 3 options). Static assets, not generated per-user.
- Image height 155px in card layout with text pill below.

### Hero Avatar Generation (Stage 1 Milestone)

- After essence archetype is revealed via Shadow Work / essence flow
- User uploads photo → AI generates Pixar hero avatar reflecting their specific essence archetype
- Prompt includes archetype name, energy, colours, personality traits
- Uses generate-avatar-public edge function (public, no auth required, rate-limited)
- Avatar becomes their profile image and 0,0 anchor for the journey

### Onboarding Flow: The 4-Beat Story

The onboarding follows the workshop arc but visual and interactive. Photo upload comes AFTER the story lands, not before.

**Beat 1 — The Hook** (no interaction, just feeling)
- "Take a moment to think about you as a kid. How playful you were. How full of love. How care-free."
- "Remember that?"
- "So where did they go?"
- Minimal text. Purple background. Gold text. Let it breathe.

**Beat 2 — The Story** (interactive: tap which scene resonates)
- Walk 4-6 wound stages with generic illustrated cartoon scenes.
- Each stage shows 3 scenes. User taps the one that resonates.
- Minimal text per stage — the illustration tells the story.
- At each extreme: surface the matrix code belief. "Does this feel true?"
- Protective archetype pattern emerges from the choices.
- This IS the story of how they lost themselves.

**Beat 3 — The Reframe** (no interaction, let it sit)
- "What if you could build a life that fits who you actually are, not who you were told to be?"
- No tap hint. Holds longer than the other slides. User taps when ready.

**Beat 4 — The Promise** (sign up)
- "That's what FindMyFlow is for."
- Sign up CTA → enter portal at Stage 1 (Identity)

**Hero Avatar — MOVED TO STAGE 1 (Identity) in the portal**
- Avatar generation requires the essence archetype to be known first (from Shadow Work / essence flow)
- Photo upload + avatar creation becomes a milestone in Stage 1, after essence reveal
- The prompt includes essence archetype details: "Pixar hero reflecting the Radiant Rebel archetype, purple and gold, fiery energy..."
- Much more powerful than a generic avatar generated before the user knows who they are

**Key design decisions:**
- Generic illustrated Pixar cartoon scenes for the wound stages. One consistent art style. Different kid per stage, same kid across the 3 scenes of each stage.
- No photo upload during onboarding (moved to Stage 1 in portal after essence reveal).
- Stage options are the interactive moments within the story, not a separate diagnostic.

### Post-Login First Visit: Tension Layer Assessment

After sign-up, users land on 4 quick tension questions (one tap each) that locate them on the journey. Reframed from business language to universal/post-crack language:

**Q1 — Identity/Direction (maps to Level 1):**
"When it comes to knowing how you want to show up in the world..."
- 0: "I have no idea. I don't know what change I want to make or how I fit"
- 1: "I have a sense of what I care about but I can't articulate it yet"
- 2: "I can describe it but I'm still testing whether it's really me"
- 3: "I know exactly how I want to show up and the change I want to make"

**Q2 — Vulnerability (maps to Level 2):**
"When it comes to letting people see where you're really at..."
- 0: "I keep it to myself. Letting people in feels unsafe"
- 1: "I open up occasionally but only when it feels controlled"
- 2: "I can be honest with a few people, but I still filter the messy parts"
- 3: "I let people see all of it. The uncertainty, the struggle, the real me"

Works regardless of Q1 score. Lost person + Q2=0 = "confused AND can't tell anyone." Lost person + Q2=3 = "confused but has people to be honest with." The vulnerability isn't about sharing a finished identity, it's about sharing the process including the mess.

**Q3 — Enough/Execution (maps to Levels 3-5):**
"When it comes to taking action on what matters..."
- 0: "I'm stuck. Fear of judgement and not being good enough keeps me frozen"
- 1: "I start things but fear of what people think stops me finishing"
- 2: "I take action, but I still hold back the bold stuff to stay safe"
- 3: "I move. The fear is there but it doesn't decide for me anymore"

Combines inner critic (internal) with fear of judgement (external). Both blockers addressed.

**Q4 — Passion/Risk (conditional, maps to Level 6):**
Only shows if Q1-Q3 all score ≥ 2. Most post-crack users won't reach this.
"When it comes to investing in the path you're on..."
- 0: "I don't feel safe putting real skin in the game"
- 1: "I invest a little but I always keep one foot in the safe option"
- 2: "I'm committing more, but the big bet still terrifies me"
- 3: "I feel safe going all in. The risk feels right because the path is mine"

First score below 3 = starting level. Same mechanic as Zone Calibration gateway questions: "The first NO is where we begin."

### Open Design Questions

- Whether to include Huzz's personal story (rainbow clothes) as a video or illustrated vignette within the onboarding flow
- XP thresholds per level (how much Healing XP + Play-list XP to graduate)
- Boss Fight format: 1-on-1 with Huzz, or could Zarlo AI facilitate a guided version?
- Whether the zone diagnosis uses the framework's observer/projection format or direct self-assessment

---

## Play-List Challenges = The Embodiment Half of Each Level

### The Two Halves

Each level has two halves:
- **Deep Dive (Recognise)** = X axis work. Self-knowledge. The map. You see the wound, name the pattern, understand where it came from.
- **Play-List Challenges (Embody)** = Y axis work. Action from self-knowledge. You take the scary action at the right visibility layer.

Recognition without action = Head Full of Dreams. Action without recognition = Unfulfilment. Both together = the diagonal.

### Visibility Layers Map to Healing Graphs

The 5 visibility layers already escalate in the same order as the healing sequence. This wasn't designed. It emerged.

| Level | Graph | Deep Dive (Recognise) | Visibility Layer (Embody) | Question |
|---|---|---|---|---|
| 1 | Identity SS | Shadow Work | **SCREEN** | "Can I show up as me?" |
| 2 | Vulnerability SS | Healing Compass | **LIVE** | "Can I be honest in real time?" |
| 3 | Enough SS | Matrix Codes | **MONEY** | "Am I worth it?" |
| 4 | Growth SS | NS Boundaries | **VULNERABLE** | "Can I grow past the fence?" |
| 5 | Execution SS | Limiting Belief Rewire | **AUTHORITY** | "Can I sustain being the real me?" |
| 6 | Passion-Risk | NEW: Passion Excavation | **ALL LAYERS (Boss Level)** | "What would I do if I knew it would work?" |

### Level 3 (Enough/Money) Is the Hinge

The framework says "Enough is the permission gate before any action becomes possible." Level 3 is where business stages 1-7 unlock. This is where the Y-axis activates.

- **Levels 1-3** = Head Full of Dreams (X axis building, repair phase)
- **Level 3 gate** = The transition from repair to building
- **Levels 4-6** = Self-Actualisation beginning (Y axis activates, both axes moving together)

### Level 6: Boss Level

Passion-Risk is the boss level. Challenges generated from genuine passion, not obligation. Cross-layer — the risk IS the layer. "What would you do if you knew it would work?" Then do it.

### Diagonal Milestones: The Human Moments

Each stage's diagonal isn't an abstract graph position. It's a tangible human moment:

| Stage | Diagonal | Milestone Moment |
|---|---|---|
| **1. Identity** | Identity SS | "Beginning to identify your essence + what to pursue." Flow Finder + Shadow Work done. The play-list exists because YOU exist now. |
| **2. Vulnerability** | Vulnerability SS | "Share with 2 people who are your vibe tribe support pillars." Tell two real humans "I'm becoming this person" and have them see you. Relational, not performative. |
| **3. Enough** | Good Enough SS | "Deliver on your play-list for the first time." First time won't be your best. That's the point. You shipped. The inner critic didn't win. |
| **4. Growth** | Groan Zone | "How can you make it 3% better?" Not perfect. 3%. Calibrated improvement. The existing 3% improvement mechanic is literally this milestone. |
| **5. Execution** | Living Zone | "Identify a sustainable system of output to continue growing." Not just doing it once. Building the rhythm. Push/Flow/Rest/Launch weekly planning IS the Living Zone. |
| **6. Passion-Risk** | Project SS | "Turn down something safe because it doesn't light you up." The first time you say no to security because your fuel is real enough. Courageous, not reckless. |

### Progression Gate Design (OPEN)

How many Play-List challenges at a visibility layer = gate cleared?

Options under consideration:
- Fixed number (e.g., 5 per layer)
- Streak-based (3 weeks consistent)
- Essence-zone based (must hit the diagonal X times — high scary + high wahoo)
- Flexible (Zarlo judges readiness)
- Hybrid

Can users do challenges at ANY unlocked layer, or must they focus on the current level's layer? Probably allow any unlocked layer but emphasize the current one.

---

## Four Pillars of Progression (Per Stage)

"Nailing the diagonal" at each stage requires all four pillars working together:

| Pillar | What It Is | Why Needed |
|---|---|---|
| **Deep Dive** | One-time recognition moment | Can't fix what you can't see |
| **Play-List Challenges** | Weekly courage at current visibility layer | Recognition without action = Head Full of Dreams |
| **Daily Healing** | Breathwork, meditation, voice check-ins | Nervous system must HOLD the new position |
| **Deliverables** | External proof (business or personal milestones) | Internal shift without external evidence isn't integrated |

Any one alone is insufficient. The three activity types run simultaneously at each stage:
- Deep dive (once per stage)
- Play-list challenges (weekly at current layer)
- Daily healing (ongoing nervous system maintenance)

## Portal Design (Let's Play Redesign)

### Tab Structure: Level | Play-list | Healing | Bonus

**Level** (replaces Priority tab) — the current game level. A mission briefing with a boss to defeat.

Each level contains:

1. **Zone Diagnosis** (one-time) — calibration check for this stage's sweet spot graph. "Where are you? Top left, diagonal, or bottom right?" If they're at an extreme → identify the protective voice keeping them stuck. That protective voice becomes the **Boss** for this level.

2. **Deep Dive** (one-time) — the healing exercise for this stage (Shadow Work, Healing Compass, Matrix Codes, NS Boundaries, Limiting Belief Rewire, Passion Excavation).

3. **Boss Fight** (one-time) — deep healing session with Huzz. The protective voice gets confronted directly. The moment the "code gets rewritten." Unlocks after deep dive is complete.

4. **Stage Milestone** (one-time) — a specific challenge based on the DIAGONAL of each graph. This is the proof you can operate from the sweet spot:
   - Stage 1 (Identity): Beginning to identify your essence + what to pursue
   - Stage 2 (Vulnerability): Share with 2 vibe tribe support pillars
   - Stage 3 (Enough): Deliver on your play-list for the first time
   - Stage 4 (Growth): How can you make it 3% better?
   - Stage 5 (Execution): Identify a sustainable system of output
   - Stage 6 (Passion-Risk): Turn down something safe because it doesn't light you up

5. **XP Gate** (ongoing) — accumulate enough points from Play-list + Healing tabs:
   - Earn X Healing XP (from daily/weekly practices in Healing tab)
   - Earn X Play-list XP (from courage challenges in Play-list tab)

**Why the Boss concept works:**
- Personalizes the level. Two people at Stage 2 might have different bosses (Performer vs Ghost)
- Gives Zarlo context: "Your Performer is keeping you in the Burden Zone. Here's how..."
- Makes the healing session with Huzz feel like a specific mission, not a generic call
- Defeating the boss = the protective voice loses its grip at this graph
- Measurable through voice check-ins afterward (essence > protective = boss defeated)

**Boss Fight Session Recording + AI Analysis:**
- Huzz records the 1-on-1 healing session with the user
- Session transcript is fed into the system after the call
- AI analyses the transcript to build a profile of recurring themes, patterns, protective voice triggers, breakthrough moments
- Over time, this builds a rich "healing profile" per user that Zarlo can reference for deeper, more personalized coaching
- Themes that repeat across sessions become visible (e.g., "abandonment comes up in every session" or "the Performer activates around money conversations")
- This data could also inform which challenges are recommended, what Zarlo says, and when the user is ready to graduate
- Long-term: aggregate anonymized session themes across users to identify common patterns per archetype/stage and improve the framework itself

**Play-list** — weekly courage challenges at current visibility layer. The action tab. Pick, do, complete. This is where Play-list XP is earned.

**Healing** — daily + weekly healing practices. Breathwork, voice check-ins, trigger recognition, compass. Doesn't change by stage. Users find their morning routine here without navigating stage context. This is where Healing XP is earned.

**Bonus** — stays as-is (content submissions, extra quests, league content).

**How XP flows:**
- Play-list + Healing tabs are where XP is EARNED through doing
- Level tab is where XP is TRACKED against the graduation threshold
- XP bar in the header shows overall progress across both sources

### Zone Diagnosis Per Level

Each level starts with a calibration check against that stage's sweet spot graph. The user identifies which zone they're in:

| Level | Graph | Top Left (Boss) | Diagonal (Target) | Bottom Right (Boss) |
|---|---|---|---|---|
| 1 | Identity SS | Outcast Zone → Boss: fear of losing belonging | Identity Sweet Spot | Chameleon Zone → Boss: Performer/People Pleaser |
| 2 | Vulnerability SS | Burden Zone → Boss: Performer (oversharing) | Vulnerability Sweet Spot | Shallow Zone → Boss: Ghost/Perfectionist (walls up) |
| 3 | Enough SS | Perfectionist Zone → Boss: Perfectionist (never finish) | Good Enough Sweet Spot | Procrastinator Zone → Boss: Ghost/Perfectionist (never start) |
| 4 | Growth SS | Failure Zone → Boss: Performer/Controller (overshoot) | Groan Zone | Safe Zone → Boss: Perfectionist/Ghost (comfort zone) |
| 5 | Execution SS | Ruthless Discipline → Boss: Performer/Controller (burnout) | Living Zone | Rely on Motivation → Boss: Ghost/Perfectionist (stall) |
| 6 | Passion-Risk | Reckless Zone → Boss: Performer/Controller (ego risk) | Project Sweet Spot | Secure Zone → Boss: Ghost/Perfectionist (uninspired) |

The Boss is the protective voice that keeps them on THEIR side of the graph. Different users at the same level face different bosses depending on their zone.

### Header Changes

Keep the existing header layout (title, score block, category pills) but add:
- **XP level bar** below the score block — "Level 2: Vulnerability, 680/1200 XP" with stage markers
- **"Journey" button** — opens Sprouter Sweet Spot graph popup showing progress along the diagonal
- No journey map as vertical nodes. The XP bar IS the progression visualization.

### Journey Graph Popup

Accessible via "Journey" button in header. Shows the Sprouter Sweet Spot graph:
- X axis: Self-Knowledge, Y axis: Action
- Misguided Zone (top left), Paralysis Zone (bottom right)
- Gold diagonal = Self-Actualisation
- Animated dot showing current position with trail from start
- "You started in the Paralysis Zone. You're moving toward the diagonal."

### Progression: 3 Bars Per Level

Each level has 3 progress bars. All 3 must be filled to graduate. Consistent across all 6 levels.

**Bar 1: Level Quests** (one-time checklist)
Complete all to graduate:
- Zone diagnosis (identify which zone + Boss) ✓
- Deep dive (stage-specific healing exercise) ✓
- Boss fight (healing session + verification questions) ✓
- Stage milestone (diagonal challenge) ✓

**Bar 2: Healing Streak** (14 days)
- "Show up for 14 days"
- A "day" counts if you complete at least 1 healing task (low bar, just get them in the app)
- Doesn't need to be consecutive. Life happens. Bar fills toward 14.
- Visual: 14 dots that fill in as days are completed
- If they're in the app doing 1, they're likely doing more. We just hold them accountable to show up.

**Bar 3: Play-list Courage** (6 challenges)
- "Complete 6 courage challenges" at current visibility layer
- No essence zone criteria. Trust the system to recommend higher-scoring challenges over time.
- If scary/wahoo markers are low, we guide toward more stretching challenges.
- Visual: 6 slots that fill as challenges are completed
- Any pace: 1/week over 6 weeks or 3/week over 2 weeks. Their choice.

**Why 3 bars not 1 combined XP pool:**
- Can't grind healing to skip courage (or vice versa)
- Clear what's needed. No math.
- Level quests gate the must-do deep work
- Healing streak builds the habit
- Play-list courage builds the muscle
- All three required = the diagonal (self-knowledge + action + nervous system capacity)

**Boss Fight Verification:**
- Boss fight is a healing session (with Huzz or another practitioner)
- After the session, user answers verification questions in the app to confirm the shift occurred
- Questions designed to capture specific outcomes that indicate the protective voice has loosened its grip
- These questions are based on Huzz's session script process (to be designed)
- Makes it possible for users to see any qualified practitioner, not just Huzz
- The verification ensures quality regardless of who facilitated

**Boss Fight Verification Questions:**

**Pre-session (entered before the call, required to "book"):**
1. "What's the action scene you're working with?" (free text — the specific situation where the Boss shows up)
2. "When you imagine that scene, what's the tension in your body, 1-10?" (slider — somatic baseline)
3. "What does your body tell you will happen if you take that action?" (free text — the Boss voice prediction/belief)

**Post-session (entered after the call):**
4. "What age was the wound from?" (number or range — where the encoding originated)
5. "Where was the wound in your body?" (body location selector — chest, throat, stomach, shoulders, etc.)
6. "When you imagine the same scene now, what's the tension in your body, 1-10?" (slider — somatic re-measure. Delta from Q2 = quantified shift)
7. "What did the younger version of you need?" (free text — the unmet need that surfaced)
8. "What's one challenge you're going to do in the next 2 weeks to test the new wiring?" (free text — self-set challenge that becomes a REQUIRED graduation challenge in their Play-list courage bar)

**What the system does with this data:**
- Q2 vs Q6 delta = quantified shift. Drop of 3+ = mismatch landed.
- Q3 = Zarlo can reference: "Last session you discovered your body was predicting [their words]"
- Q4 + Q5 = wound age + body location builds the healing profile over time
- Q7 = the unmet need becomes the essence anchor for ongoing voice check-ins
- Q8 = self-set challenge auto-creates a Play-list challenge tagged as "Boss Fight Challenge" and counts toward the 6 required courage challenges for graduation. User can't graduate without completing the challenge they set themselves.
- Session transcript (from Fireflies) + structured answers = complete picture for AI analysis
- Across users: patterns of which Bosses resist which phases, common wound ages per level, most frequent body locations per archetype

**Pre-session questions required before booking** so both user and practitioner have context going in. The practitioner sees Q1-Q3 before the call starts.

### /me Page Redesign

**Current structure:** Hero Identity → Flow Journey (river) → Today's Quest → Hero Profile

**New structure reflecting the journey:**

**Section 1: Hero Identity (updated)**
- Avatar ring (hero avatar after Stage 1, placeholder before)
- Name + essence archetype tagline (after Stage 1 reveal)
- XP level bar: "Level 2: Vulnerability — 680/1200 XP" with stage markers
- Streak badge + current boss badge ("Fighting: The Performer")
- Journey graph button (opens Sprouter popup)

**Section 2: Current Level Summary (new)**
- Card showing current level status at a glance:
  - Level name + question ("Can I be honest about what I need?")
  - Boss identified (or "Start zone diagnosis" if not yet done)
  - Progress: deep dive ✓, boss fight pending, milestone 0/1, XP 680/800
  - CTA: "Continue Level" → navigates to Let's Play Level tab

**Section 3: Today's Actions (updated)**
- Merged view of what's actionable TODAY:
  - Active play-list challenge (if one is picked for today)
  - Daily healing tasks (breathwork, voice check-in, etc.)
  - Streak dots
- CTA: "Open Let's Play" → navigates to challenge portal

**Section 4: Flow Journey (updated)**
- HorizontalFlowRiver stays (compass entries + milestone markers)
- Level graduation milestones appear as gold markers on the river
- Boss defeats appear as special markers
- The river tells the story of the journey visually over time

**What gets removed from /me:**
- Old "Today's Quest" section (replaced by Today's Actions)
- Priority layer recommendations (replaced by Current Level Summary)
- Old onboarding check (replaced by new journey onboarding)

**What gets deprecated:**
- Priority tab → replaced by Level tab
- Old HomeFirstTime onboarding → replaced by JourneyOnboarding
- Old tension layer system → replaced by new 3+1 tension questions
- Old stage config progression → replaced by 6-level journey system (business stages become add-on)

### Design Principles

- No 4 R's labels visible to users (used behind the scenes for task design)
- XP bar replaces journey map nodes (stages are levels within the bar)
- Graduation = completing required tasks + hitting XP threshold (800 XP consistent)
- Users can do challenges at any unlocked layer, but current stage's layer is emphasized
- Flow Finder challenges become part of Level 1 (Identity) graduation requirements
- Business stages stay separate as an add-on (works for both business builders and employment careers)
- Fantasy League paused for now; future version competes over Play-list/Healing/Bonus categories, level stays separate
- All existing users start at Level 1 on migration
- Zone diagnosis uses scene card format (Pixar images for each zone, same as onboarding)

## Key Decisions Made

1. The journey IS the new primary progression (not a parallel layer)
2. Business stages are what users unlock as the Y axis activates (at Stage 3 hinge)
3. Framework language is given directly — empowerment through articulation
4. Existing healing deep dives can be reorganized by wound stage to tell a coherent story
5. Matrix codes map to wound stages (beliefs installed at specific life stages)
6. Essence archetype revealed at Stage 1 (Shadow Work) = anchor for entire journey
7. Visibility layers map to healing graphs in the same order (Screen→Live→Money→Vulnerable→Authority)
8. Onboarding: 4-beat story (Hook → Story with scene choices → Photo upload + avatar reveal → Sign up)
9. Generic illustrated scenes, not face compositing (reliability over wow factor)
10. Photo captured before account creation, stored in browser, uploaded after sign-up
11. Passion-Risk milestone: "Turn down something safe because it doesn't light you up"
