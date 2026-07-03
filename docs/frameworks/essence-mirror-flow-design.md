# Essence Mirror Flow Design

> **Status**: Draft v3 — final structure
> **Route**: `/shadow-work` (replaces current Shadow Work flow)
> **Level**: 1 (Identity)
> **Core thesis**: Your shadows are your essence, suppressed. The most authentic parts of yourself are the ones you were told to hide.

---

## The Idea

Instead of 12 fixed archetype boxes, the Essence Mirror uses 12 archetypes as **ingredients** and blends a unique essence profile per user. Three multi-select questions accumulate signal across all 12 archetypes, then a Pixar vision pick confirms the primary. The secondary comes from the runner-up, creating cross-archetype blends that feel deeply personal.

**Example output:**
> **Primary**: Heart Alchemist — *You transform pain into gold*
> **Secondary**: Radiant Rebel — *But you do it with fire, not silence*
>
> "Your alchemy has teeth. You don't just hold space — you crack it open."
>
> **Essence wound**: "You were told you're too emotional AND too intense. So you learned to dim both."

---

## The 12 Archetype Ingredients

### Activator Group (high energy, action-first)

| Archetype | Essence | Superpower | Essence Wound |
|-----------|---------|------------|---------------|
| **Radiant Rebel** | Disruptive truth-teller with heart | Ignites courage in the quiet | "You're too intense. Calm down." |
| **Playful Creator** | Joy, innovation, curiosity-led action | Alchemizes boredom into magic | "Stop being silly. Grow up." |
| **Sacred Jester** | Disruption through play, subversive joy | Disarms defenses with humor | "Why can't you just be normal?" |

### Transmuter Group (emotional depth, transformation)

| Archetype | Essence | Superpower | Essence Wound |
|-----------|---------|------------|---------------|
| **Mystic Messenger** | Inner knowing, intuitive depth | Hears what isn't said | "You're too sensitive. Get your head out of the clouds." |
| **Truth-Teller** | Clarity, boldness, no-BS simplicity | Cracks illusions with precision | "Stop being so dramatic." |
| **Heart Alchemist** | Liberation, emotion, transformation through truth | Transmutes chaos into meaning | "You're too emotional. Stop making everything a big deal." |

### Stabilizer Group (grounding, structure, care)

| Archetype | Essence | Superpower | Essence Wound |
|-----------|---------|------------|---------------|
| **Grounded Guardian** | Devotion, protection, integrity | Stabilizes wild energy | "You're too controlling. Let go." |
| **Heart Holder** | Steady presence that calms bodies | Co-regulates rooms | "You're too sensitive. Stop babying people." |
| **Rhythm Architect** | Turning chaos into repeatable rhythm | Builds rails that free others | "You're controlling. Just chill." |

### Bridger Group (connection, translation, vision)

| Archetype | Essence | Superpower | Essence Wound |
|-----------|---------|------------|---------------|
| **Wise Sage** | Translator of complexity | Connects dots and names frames | "You're overthinking. Stop being so abstract." |
| **Cosmic Connector** | Multidimensional vision, integration | Weaves worlds together | "That's too complicated. No one cares." |
| **Compassionate Leader** | Grounded authority, trust-building | Holds the center when things shake | "You're too much to carry. Worry about yourself." |

### Per-Archetype Rich Data (from original GPT)

Each archetype also carries:
- `poetic_line` — one-line identity statement
- `poetic_vision` — "what if" future vision
- `energetic_transmission` — how others experience your energy
- `recognition_pattern` — when/why people seek you out
- `inner_child_desire` — what you wanted to do as a kid
- `characters` — 3 famous/fictional examples
- `vision_in_action` — what it looks like when you're living it

---

## Flow Structure (v4 — Final)

### What we already know about the user

By the time a user hits this flow, we have:
- **Wound stage selections** (from onboarding) — which childhood patterns resonate
- **Zone diagnosis** (from Level 1) — where they sit on the Identity graph (Outcast / Diagonal / Chameleon)
- **Tension scores** (from HomeFirstTime) — direction, vulnerability, enough, passion

This existing data feeds into the AI blending step (Step 7).

---

### Step 1: The Hook (swipeable slides, no interaction)

Purple background, gold text. Same style as onboarding hook and current Shadow Work intro. Auto-advance or swipe.

| Slide | Text |
|-------|------|
| 1 | "Take a moment to think about you as a kid." / "Think about some of the things you used to love to do." |
| 2 | "Now how would it have felt if you got teased, made fun or rejected for those things?" |
| 3 | "Horrible. Shameful. Embarrassed." |
| 4 | "And we never want to feel that way so what do we do to protect ourselves?" / "We suppress that part of us." |
| 5 | "Remember a shadow is any part of ourselves we suppress." / "But why would we suppress our authentic parts?" |
| 6 | "Because at some point, someone told us they were too much." / "Let's find out which parts of you were hidden." |

---

### Steps 2-4: Superpower Rounds (3 screens of 4 cards each)

**Field used**: `superpower` — action-oriented, punchy, easy gut-reaction yes/no.

**Prompt each round**: "Do any of these sound like you?"

Multi-select (tap all that resonate). Each selection = +1 to that archetype's score.

**Round 1:**

| Card | Archetype |
|------|-----------|
| "You ignite courage in the quiet. You say what others won't and move like fire through what feels stuck." | Radiant Rebel |
| "You hear what isn't said. You decode the invisible and deliver soul signals." | Mystic Messenger |
| "You stabilize wild energy. You build safe havens and love through quiet presence." | Grounded Guardian |
| "You connect the dots and name the frame; questions drop, alignment clicks." | Wise Sage |

**Round 2:**

| Card | Archetype |
|------|-----------|
| "You alchemize boredom into magic. You make joy contagious, creativity safe, and weirdness welcome." | Playful Creator |
| "You crack illusions with precision. You speak the sharp truth wrapped in unexpected tenderness." | Truth-Teller |
| "You co-regulate rooms. With you, breath slows, shoulders drop, and real work can land." | Heart Holder |
| "You weave worlds. You connect the mystical and the practical." | Cosmic Connector |

**Round 3:**

| Card | Archetype |
|------|-----------|
| "You disarm defenses with humor. You reveal truth in the ridiculous." | Sacred Jester |
| "You transmute chaos into meaning. You give pain purpose and help people rebirth themselves." | Heart Alchemist |
| "You build the rails: standards, checklists, handoffs. Error drops. Throughput climbs." | Rhythm Architect |
| "You hold the center when things shake. You make people feel seen, safe, and ready to rise." | Compassionate Leader |

---

### Step 5: Vision Confirmation (selected archetypes only)

**Field used**: `poetic_vision` — aspirational, forward-looking. Shifts from "what you DO" to "what you WANT."

**Shows ONLY archetypes selected in rounds 1-3.** Multi-select again.

**Prompt**: "You resonated with these. Which of these futures excites you most?"

Archetypes selected in BOTH superpower rounds AND vision confirmation get +2 total. Those dropped here stay at +1. Clear separation for the Pixar pick.

Example (if they selected 5 archetypes in rounds 1-3, show all 5 with their vision text):

| Card | Archetype |
|------|-----------|
| "What if your truth became a movement? What if your unapologetic expression wasn't risky but revolutionary?" | Radiant Rebel |
| "What if your edges were the medicine? What if your rawness was the portal?" | Heart Alchemist |
| "What if safety wasn't a pause but a power? What if your calm made courage possible?" | Heart Holder |
| ... | ... |

---

### Step 6: Pixar Essence Pick (top 3-4 by score, single select)

**Field used**: `poetic_line` (essence) — the most identity-level, poetic field. Combined with Pixar images.

**Shows top 3-4 archetypes by accumulated score.** Each card has a Pixar image + the essence poetic_line. **Single select = primary archetype.**

**Prompt**: "This is who you are. Which one makes something inside you say yes?"

Runner-up by score = secondary archetype (AI confirms in Step 7).

**Emotional arc across steps:**
- Superpower (rounds 1-3): What you **do** → action, gut reaction
- Vision (round 4): What you **want** → aspiration, re-evaluation
- Essence (Pixar pick): Who you **are** → identity, commitment

---

### Step 7: The AI Mirror (Haiku API call)

**Input to Haiku:**
- Primary archetype (full data: poetic_line, superpower, wound, etc.)
- Secondary archetype (full data — runner-up from scoring)
- User's wound stage selections from onboarding
- User's zone diagnosis (Outcast/Diagonal/Chameleon)
- User's tension scores

**Haiku's job:**
1. Generate a blended poetic profile (~3-4 sentences) weaving both archetypes
2. Generate a blended essence wound combining both wounds
3. Generate a blended superpower statement
4. Optionally generate a blended name (e.g., "The Fierce Alchemist")

**Output displayed:**
- Dramatic reveal animation (like Boss Reveal in Zone Diagnosis)
- Primary archetype name + secondary archetype name
- Blended poetic_line
- Blended superpower
- "Does this feel like you?"

**New edge function**: `essence-mirror-blend` — single call returns full blended profile.

---

### Step 7: The Wound

Connects the essence_wound to their childhood experience.

**Prompt structure:**
> "At some point, someone told you: *[blended essence wound]*"
>
> "And so you learned to suppress the very thing that makes you powerful."
>
> [If zone data exists]: "This is why you're in the **[zone name]**. Your essence was suppressed, and the **[Boss name]** stepped in to protect you."

This is the "I feel so seen" moment. The wound stage data from onboarding makes it personal.

---

### Step 8: Create Hero Avatar

- Display the blended archetype as their new identity
- Upload selfie → `generate-avatar` edge function with enhanced prompt including blended essence data
- `buildAvatarPrompt` extended to include: primary archetype, secondary archetype, blended superpower, blended poetic_line
- Allow naming/customizing (pre-filled with archetype name or AI-generated blended name)
- Save to DB (replaces old essence archetype system)
- Transition back to Level tab

---

## Scoring Algorithm

### How archetype scores accumulate

**Superpower rounds (Steps 2-4):** Each selection = +1. Max score per archetype after 3 rounds = 1 (each archetype only appears once).

**Vision confirmation (Step 5):** Each selection = +1. Only selected archetypes from rounds 1-3 are shown.

```
After all rounds, each archetype has a score of 0-2:
  0 = never selected
  1 = selected in superpower round only (dropped in vision)
  2 = selected in BOTH superpower AND vision (strong signal)

Example:
  Heart Alchemist: 2 (superpower + vision)
  Radiant Rebel: 2 (superpower + vision)
  Heart Holder: 2 (superpower + vision)
  Mystic Messenger: 1 (superpower only, dropped in vision)
  Wise Sage: 1 (superpower only, dropped in vision)
  ... rest: 0

Top 3-4 shown in Pixar pick (Step 6): Heart Alchemist, Radiant Rebel, Heart Holder
  (score-2 archetypes first, then score-1 to fill if needed)
User picks Heart Alchemist → Primary
Runner-up = Radiant Rebel → Secondary (AI confirms in Step 7)
```

**Tie-breaking for Pixar pick cutoff:**
- Score-2 archetypes always shown
- Score-1 fill remaining spots up to 4 max
- If fewer than 3 archetypes scored above 0, show top 4 by original selection order

**The Pixar pick (Step 6) is the decisive moment.** Everything before is signal gathering; the essence pick is commitment.

---

## Images Needed

### Pixar Essence Images (12 total — one per archetype, used in Step 6 Pixar pick)

Only the user's top 3-4 are shown, but all 12 need to exist. Based on `poetic_line` (essence).

| Archetype | Essence | Scene Description |
|-----------|---------|-------------------|
| **Radiant Rebel** | "You are fire with a heartbeat" | Young adult radiating fierce energy, flames dancing around them but controlled, heartbeat-like pulse of golden light from chest. Expression of passionate conviction. Purple and gold palette. |
| **Playful Creator** | "You are joy in motion" | Young adult bursting with creative energy, paint-stained hands, surrounded by swirling colors, floating musical notes, half-built inventions. Pure unfiltered joy. Vibrant saturated colors. |
| **Sacred Jester** | "The joke that reveals the truth" | Young adult with a knowing grin, juggling comedy masks that crack open to reveal golden light inside. Playful but wise expression. Purple spotlight with golden particles. |
| **Mystic Messenger** | "The still point in the storm" | Young adult perfectly still and serene at the center of a swirling cosmic storm, eyes closed, hands open. Everything chaotic around them but they are pure calm. Purple storm, golden stillness. |
| **Truth-Teller** | "The sentence that slices through the noise" | Young adult standing in sharp focus while everything around them is blurred noise and static. Their presence cuts through like a beam of golden clarity. Clean, bold, unflinching. |
| **Heart Alchemist** | "Permission — uncaged, untamed" | Young adult breaking free from golden chains that shatter into butterflies. Expression of raw liberation and emotional power. Tears and fire coexisting. Amber and purple twilight. |
| **Grounded Guardian** | "The roots beneath the rise" | Young adult standing steady with visible golden roots growing from their feet deep into the earth, while a magnificent tree grows above them sheltering others. Quiet strength. |
| **Heart Holder** | "The quiet gravity — the heartbeat that steadies the storm" | Young adult sitting calmly at the center of a gentle storm, warm golden pulse from their chest. Others sheltered close, exhaling, trusting. Storm outside, peace within. |
| **Rhythm Architect** | "The cadence-maker — where mess becomes momentum" | Young adult conducting an invisible orchestra, chaotic elements around them falling into beautiful geometric patterns and rhythm. Order emerging from chaos. Clean purple and gold lines. |
| **Wise Sage** | "The constellation-bringer" | Young adult looking up at a night sky where they've drawn golden constellation lines connecting scattered stars into a clear pattern. Others around them suddenly seeing it too. Purple sky, golden connections. |
| **Cosmic Connector** | "The thread between worlds" | Young adult standing between two dramatically different realms (mystical purple and practical gold), golden threads flowing from their hands connecting both sides. Glowing at the nexus. |
| **Compassionate Leader** | "A walking hearth — steady, warm, and fiercely kind" | Young adult with warm golden light emanating from them like a living hearth, people drawn close, feeling safe and empowered. Fierce kindness in their expression. Purple and gold warmth. |

---

## Data Storage

```sql
create table essence_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  primary_archetype text not null,
  secondary_archetype text,
  archetype_scores jsonb,           -- full scoring from Q1-Q3
  blended_name text,                -- AI-generated blended name
  blended_narrative text,           -- AI-generated poetic profile
  blended_superpower text,          -- AI-generated blended superpower
  blended_wound text,               -- AI-generated blended wound
  question_responses jsonb,         -- raw selections per question
  wound_stages_at_time jsonb,       -- snapshot of onboarding data
  zone_at_time text,                -- zone diagnosis at time of flow
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);
```

---

## Decisions Made

1. **Hook style**: Swipeable purple/gold text slides (matches onboarding and existing Shadow Work)
2. **3 superpower rounds** (4 cards each, one per group): Tap all that resonate. Punchy, action-oriented, gut reaction.
3. **Vision confirmation round**: Shows only selected archetypes with `poetic_vision` text. Re-evaluates from aspirational angle. Creates score-2 vs score-1 separation.
4. **Pixar essence pick**: Top 3-4 by score, shown with Pixar scene + `poetic_line` (essence) text. Single select = primary. Identity-level commitment.
5. **Emotional arc**: What you DO (superpower) → What you WANT (vision) → Who you ARE (essence).
6. **Cross-archetype blending**: Primary = Pixar pick. Secondary = runner-up by score. No group constraints.
7. **AI engine**: Haiku via new `essence-mirror-blend` edge function. Single call returns full blended profile.
8. **Hero avatar**: Enhanced `buildAvatarPrompt` with blended essence data. Selfie upload → Pixar hero generation.
9. **Replaces**: Old essence archetype system. Hero avatar on /me uses this.
10. **12 Pixar essence images needed**: One per archetype, used in Step 6 pick. Based on `poetic_line`.

## Open Questions (Remaining)

1. **Blended name**: AI-generated unique name (e.g., "The Fierce Alchemist") or just "Heart Alchemist + Radiant Rebel"?
2. **Retake policy**: One-time reveal with optional retake, or repeatable?
3. **Protective connection**: Show essence → wound → protective voice → Boss relationship in wound step?

---

## Pixar Image Prompts (for Step 6 Essence Pick)

Based on `poetic_line` (essence) — the identity-level statement.

### Activator Group

**Radiant Rebel** — *"You are fire with a heartbeat"*
Pixar-style 3D animated young adult radiating fierce energy, flames dancing around their body but controlled and intentional, a heartbeat-like pulse of golden light emanating from their chest. Expression of passionate conviction and fearless honesty. Hair and clothes moving with the energy. Dark purple background with golden fire. Close-up portrait composition, the fire IS them, not burning them. Style: Pixar/Disney quality, cinematic dramatic lighting, warm purple and gold palette.

**Playful Creator** — *"You are joy in motion"*
Pixar-style 3D animated young adult bursting with creative energy, paint-stained hands mid-throw, surrounded by swirling colors, floating musical notes, and half-built inventions that seem alive. Expression of pure unfiltered joy, mouth open in laughter, eyes sparkling with mischief. Paint splatters and origami birds orbit around them like a personal galaxy of creativity. Warm golden light catches the chaos. Style: Pixar/Disney quality, vibrant saturated colors, cinematic lighting, warm purple and gold palette.

**Sacred Jester** — *"The joke that reveals the truth"*
Pixar-style 3D animated young adult with a knowing, mischievous grin, juggling comedy and tragedy masks that are cracking open to reveal golden light inside each one. One eye winking. Playful pose but wise, ancient eyes. Purple spotlight creating dramatic shadows, golden particles floating where the masks crack. The humor is a vehicle for something sacred. Style: Pixar/Disney quality, cinematic intimate lighting, purple and gold.

### Transmuter Group

**Mystic Messenger** — *"The still point in the storm"*
Pixar-style 3D animated young adult perfectly still and serene at the center of a swirling cosmic storm, eyes closed, hands open and resting on knees in meditation. Everything around them is chaotic — wind, energy, fragments — but they sit in absolute calm. A golden glow at their center, the eye of the storm. Purple cosmic swirl surrounding a pocket of golden peace. Style: Pixar/Disney quality, magical ethereal lighting, dramatic contrast.

**Truth-Teller** — *"The sentence that slices through the noise"*
Pixar-style 3D animated young adult standing in sharp, crystal-clear focus while everything around them is blurred static and noise. Their presence literally cuts through like a beam of golden clarity. Expression calm, compassionate but completely unflinching. One hand slightly raised as if they've just spoken. A visible golden shockwave of clarity radiating outward from them. Purple hazy background clearing where the wave passes. Style: Pixar/Disney quality, dramatic cinematic lighting.

**Heart Alchemist** — *"Permission — uncaged, untamed, undeniable"*
Pixar-style 3D animated young adult breaking free from golden chains that shatter into butterflies as they snap. Expression of raw liberation and emotional power — tears streaming but eyes blazing with fire. Arms spread wide, chest open, completely vulnerable and completely powerful at the same time. Shattered chain links transforming into golden monarchs mid-air. Purple twilight background with amber light breaking through. Style: Pixar/Disney quality, magical realism, cinematic lighting.

### Stabilizer Group

**Grounded Guardian** — *"The roots beneath the rise"*
Pixar-style 3D animated young adult standing steady and grounded, with visible golden roots growing from their feet deep into the earth. Above them, a magnificent tree grows from their energy, sheltering others beneath its canopy. Their expression is quiet strength, protective devotion. People resting safely under the branches. Earth tones below, purple sky above, golden root network glowing underground. Style: Pixar/Disney quality, warm cinematic lighting, nature and architecture blend.

**Heart Holder** — *"The quiet gravity — the heartbeat that steadies the storm"*
Pixar-style 3D animated young adult sitting calmly at the center of a gentle storm, eyes soft and steady, hands resting open. A warm golden pulse emanates from their chest like a visible heartbeat. Around them, wind and rain swirl but never touch the small circle of warmth they create. A few people sheltered close, visibly exhaling, shoulders dropped, trusting. Purple stormy exterior, golden interior glow. Style: Pixar/Disney quality, cinematic lighting, emotional depth, contrast between chaos and calm.

**Rhythm Architect** — *"The cadence-maker — where mess becomes momentum"*
Pixar-style 3D animated young adult with hands raised like a conductor, chaotic floating elements around them (papers, gears, scattered pieces) falling into beautiful geometric patterns and flowing rhythm as their hands move. Expression of focused satisfaction as order emerges from chaos. Clean golden lines and purple geometric shapes crystallizing from randomness. A team behind them working in effortless flow. Style: Pixar/Disney quality, cinematic lighting, clean design aesthetic.

### Bridger Group

**Wise Sage** — *"The constellation-bringer"*
Pixar-style 3D animated young adult looking up at a vast purple night sky, one hand raised, drawing golden constellation lines that connect scattered stars into a clear, beautiful pattern. Others around them are gasping, suddenly seeing the pattern too. The sage's expression shows quiet knowing — they've always seen the connections. Golden lines glowing between stars, purple cosmic background. Style: Pixar/Disney quality, magical cinematic lighting, awe and wonder.

**Cosmic Connector** — *"The thread between worlds"*
Pixar-style 3D animated young adult standing at the intersection of two dramatically different realms — one mystical and purple (ethereal, flowing, spiritual) and one practical and golden (structured, solid, tangible). Golden threads flow from their hands connecting both sides seamlessly. They glow at the nexus point, belonging fully to both worlds. People from each side crossing over, amazed. Style: Pixar/Disney quality, magical cinematic lighting, split composition, rich detail.

**Compassionate Leader** — *"A walking hearth — steady, warm, and fiercely kind"*
Pixar-style 3D animated young adult with warm golden light emanating from them like a living hearth or campfire. People are drawn close, sitting and standing around them, clearly feeling safe and empowered. The leader's expression shows fierce kindness — not soft, not harsh, but deeply present. Purple evening landscape behind, golden warmth radiating outward. They're not on a throne — they're among their people. Style: Pixar/Disney quality, warm cinematic lighting, intimate epic feel.

---

## Reference Files

- Original GPT data: `/Users/nichurrell/Library/Mobile Documents/com~apple~CloudDocs/2022 Mac/Vibe Rise/CustomGPT's/Vibe Mirror/Essence Mirror/`
- Current Shadow Work flow: `src/flows/ShadowWorkFlow.jsx`
- Essence archetype page: `src/profiles/EssenceProfile.jsx`
- Zone Diagnosis flow: `src/flows/ZoneDiagnosisFlow.jsx`
- Level config: `src/components/level/LevelConfig.js`
- Protective voices data: `src/data/protectiveVoices.js`
- Avatar prompt builder: `src/lib/essencePreferences.js`
- Avatar edge function: `supabase/functions/generate-avatar/`
- Existing hybrid generator: `supabase/functions/essence-hybrid-generator/`

---

*Original IP: Huzz Hurrell. All archetype data, poetic copy, and framework from Vibe Rise / Vibe Mirror.*
