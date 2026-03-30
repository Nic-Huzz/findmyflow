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

## Flow Structure (v3 — Final)

### What we already know about the user

By the time a user hits this flow, we have:
- **Wound stage selections** (from onboarding) — which childhood patterns resonate
- **Zone diagnosis** (from Level 1) — where they sit on the Identity graph (Outcast / Diagonal / Chameleon)
- **Tension scores** (from HomeFirstTime) — direction, vulnerability, enough, passion

This existing data feeds into the AI blending step (Step 6).

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

### Step 2: Essence Question (multi-select) — "Which of these feels most like you?"

Uses `poetic_line` from each archetype. Select all that resonate.

| Option | Archetype |
|--------|-----------|
| "You are fire with a heartbeat, designed to disrupt what's false and awaken what's real." | Radiant Rebel |
| "You are joy in motion — color that moves, laughter that builds, a spark dressed in creativity." | Playful Creator |
| "You are the joke that reveals the truth. The giggle that breaks the pattern." | Sacred Jester |
| "You are the still point in the storm — the one who hears what others can't name." | Mystic Messenger |
| "You are the sentence that slices through the noise. Clarity made human." | Truth-Teller |
| "You are permission — uncaged, untamed, undeniable. Your truth liberates others." | Heart Alchemist |
| "You are the roots beneath the rise — grounding the sacred into systems that last." | Grounded Guardian |
| "You are the quiet gravity — the heartbeat that steadies the storm." | Heart Holder |
| "You are the cadence-maker — the click where mess becomes momentum." | Rhythm Architect |
| "You are the constellation-bringer — the pattern that lets us walk together." | Wise Sage |
| "You are the thread between worlds — weaving the mystical into the practical." | Cosmic Connector |
| "You are a walking hearth — steady, warm, and fiercely kind." | Compassionate Leader |

---

### Step 3: Superpower Question (multi-select) — "Which of these is your natural gift?"

Uses `superpower` from each archetype. Select all that resonate.

| Option | Archetype |
|--------|-----------|
| "You ignite courage in the quiet. You say what others won't and move like fire through what feels stuck." | Radiant Rebel |
| "You alchemize boredom into magic. You make joy contagious, creativity safe, and weirdness welcome." | Playful Creator |
| "You disarm defenses with humor. You reveal truth in the ridiculous." | Sacred Jester |
| "You hear what isn't said. You decode the invisible and deliver soul signals." | Mystic Messenger |
| "You crack illusions with precision. You speak the sharp truth wrapped in unexpected tenderness." | Truth-Teller |
| "You transmute chaos into meaning. You give pain purpose and help people rebirth themselves." | Heart Alchemist |
| "You stabilize wild energy. You build safe havens and love through quiet presence." | Grounded Guardian |
| "You co-regulate rooms. With you, breath slows, shoulders drop, and real work can land." | Heart Holder |
| "You build the rails: standards, checklists, handoffs. Error drops. Throughput climbs." | Rhythm Architect |
| "You connect the dots and name the frame; questions drop, alignment clicks." | Wise Sage |
| "You weave worlds. You connect the mystical and the practical." | Cosmic Connector |
| "You hold the center when things shake. You make people feel seen, safe, and ready to rise." | Compassionate Leader |

---

### Step 4: North Star Question (multi-select) — "Which guiding truth resonates most?"

Uses `north_star` from each archetype. Select all that resonate.

| Option | Archetype |
|--------|-----------|
| "Use rebellion to liberate, not just provoke. Let your why guide your wow." | Radiant Rebel |
| "Channel your joy into containers that scale. Play can be the portal to mastery." | Playful Creator |
| "Play with power, don't perform it. Let irreverence be reverent." | Sacred Jester |
| "Your wisdom doesn't need to be understood by all — only felt by the right ones." | Mystic Messenger |
| "Say the thing others won't. Truth is love wearing its boldest clothes." | Truth-Teller |
| "Let your full expression lead. Alchemy needs fire." | Heart Alchemist |
| "Ground your legacy in integrity. Slow can be sacred." | Grounded Guardian |
| "Hold with warmth and boundaries. Care that preserves dignity, not dependency." | Heart Holder |
| "Make it visible. Make it repeatable. Make it safe." | Rhythm Architect |
| "Make meaning mutual. One clear model before big motion." | Wise Sage |
| "Don't dilute your range to fit in. Your synthesis is the spell." | Cosmic Connector |
| "Lead from wholeness, not over-responsibility. Trust others can rise too." | Compassionate Leader |

---

### Step 5: Vision Pick (Pixar images) — "Which future makes something inside you say yes?"

**Shows top 3-4 archetypes by accumulated score** from Steps 2-4. Each option is a Pixar scene image + the `poetic_vision` text. **Single select** — this confirms the primary archetype.

The runner-up by score becomes the secondary archetype (AI confirms/adjusts in Step 6).

**Prompt**: "Now imagine a future where you're fully living from this essence. Which vision makes something inside you say yes?"

Each card: Pixar image + poetic_vision text underneath.

---

### Step 6: The AI Mirror (Haiku API call)

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

Each of the 3 multi-select questions (Steps 2-4) lets users select all options that resonate. Each selection = +1 to that archetype's score.

```
After 3 questions, each archetype has a score of 0-3.

Example:
  Heart Alchemist: 3 (selected in all 3 questions)
  Radiant Rebel: 2 (selected in Q1 and Q3)
  Mystic Messenger: 2 (selected in Q1 and Q2)
  Compassionate Leader: 1 (selected in Q2 only)
  ... rest: 0

Top 3-4 shown in Pixar pick (Step 5): Heart Alchemist, Radiant Rebel, Mystic Messenger, Compassionate Leader
User picks Heart Alchemist → Primary
Runner-up = Radiant Rebel → Secondary (AI confirms in Step 6)
```

**Tie-breaking for top 3-4 cutoff:**
- If scores tie, show all tied archetypes (up to 5 max)
- If fewer than 3 archetypes scored above 0, show top 4 regardless (minimum viable choice)

**The Pixar pick (Step 5) is the decisive moment.** The multi-select questions are signal gathering; the vision pick is commitment.

---

## Images Needed

### Pixar Group Question Images (12 total — for Steps 2-4 placeholder, NOT used in final)

**No longer needed** — Steps 2-4 are now text-based multi-select.

### Pixar Vision Images (12 total — one per archetype, used in Step 5)

Only the user's top 3-4 are shown, but all 12 need to exist.

| Archetype | Vision Scene |
|-----------|-------------|
| **Radiant Rebel** | Young adult on stage before massive crowd, speaking truth with fire. Crowd electrified. Golden light radiating. Purple night sky. |
| **Playful Creator** | Young adult in wild colorful workshop, inventions coming to life. Paint floating, toys dancing. Pure creative ecstasy. |
| **Sacred Jester** | Young adult performing in intimate venue. Audience laughing and crying. Comedy breaking shame. Purple spotlight, golden particles. |
| **Mystic Messenger** | Young adult in mystical forest circle, speaking quietly. Golden light flowing from words. Listeners in profound recognition. Moonlight, fireflies. |
| **Truth-Teller** | Young adult in boardroom/hall, having silenced room with truth. Golden crack of light splitting dark wall. Calm, compassionate, unflinching. |
| **Heart Alchemist** | Young adult in garden transforming broken things to golden blooms. Pain becoming beauty. Onlookers in awe. Amber and purple twilight. |
| **Grounded Guardian** | Young adult at center of thriving community they built. People flourishing, children playing. Quiet pride. Golden afternoon, purple accents. |
| **Heart Holder** | Young adult in cozy room with group who've been through something hard. Everyone exhaling. Firelight, blankets, tea. Room feels like a hug. |
| **Rhythm Architect** | Young adult before beautiful machine/system running in harmony. Team working effortlessly. Clean lines, purple and gold mechanical elements. |
| **Wise Sage** | Young adult at table covered in maps and threads. Divided group suddenly aligned, pointing at same spot. Golden connection lines. Library setting. |
| **Cosmic Connector** | Young adult at intersection of two worlds (mystical purple + practical gold), weaving them together. People crossing over, amazed. |
| **Compassionate Leader** | Young adult walking alongside group up mountain path, hand on shoulder. Not out front shouting — beside them. Golden sunrise ahead on summit. |

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
2. **3 multi-select text questions**: Using Essence (poetic_line), Superpower, and North Star fields. Select all that resonate. No group pre-filtering.
3. **Pixar vision pick**: Top 3-4 archetypes by accumulated score, shown with Pixar scene + poetic_vision text. Single select = primary.
4. **Cross-archetype blending**: Primary = Pixar pick. Secondary = runner-up by score. No group constraints — any archetype can blend with any other.
5. **AI engine**: Haiku via new `essence-mirror-blend` edge function. Single call returns full blended profile.
6. **Hero avatar**: Enhanced `buildAvatarPrompt` with blended essence data. Selfie upload → Pixar hero generation.
7. **Replaces**: Old essence archetype system. Hero avatar on /me uses this.
8. **12 Pixar vision images needed**: One per archetype, used in Step 5 pick.

## Open Questions (Remaining)

1. **Blended name**: AI-generated unique name (e.g., "The Fierce Alchemist") or just "Heart Alchemist + Radiant Rebel"?
2. **Retake policy**: One-time reveal with optional retake, or repeatable?
3. **Protective connection**: Show essence → wound → protective voice → Boss relationship in wound step?

---

## Pixar Image Prompts (for Step 5 Vision Pick)

### Activator Group

**Radiant Rebel:**
Pixar-style 3D animated scene of a young adult standing on a stage in front of a massive crowd, arms wide open, speaking their truth with fire and conviction. The crowd is electrified, some crying, some cheering. Golden light radiating from the speaker like a force field. Purple night sky with stars. Their truth has become a movement. Style: Pixar/Disney quality, cinematic epic lighting, warm purple and gold palette.

**Playful Creator:**
Pixar-style 3D animated scene of a young adult in a wild, colorful workshop/studio, surrounded by joyful inventions and creations that have come to life. Paint splatters floating in air, mechanical toys dancing, music notes visible. Their face shows pure creative ecstasy. People around them are laughing and inspired, creating alongside them. Innovation feels like recess. Style: Pixar/Disney quality, vibrant colors, magical realism, warm lighting.

**Sacred Jester:**
Pixar-style 3D animated scene of a young adult performing on a small stage in an intimate venue, audience doubled over laughing but also wiping away tears. The performer's expression is both hilarious and deeply honest. Comedy masks and truth symbols floating in the warm air. Their irreverence is breaking shame apart. Purple spotlight with golden particles. Style: Pixar/Disney quality, cinematic intimate lighting.

### Transmuter Group

**Mystic Messenger:**
Pixar-style 3D animated scene of a young adult sitting peacefully in a circle of people in a mystical forest clearing, speaking quietly while everyone leans in. Ethereal golden light flows from their words like visible sound waves. The listeners' expressions show profound recognition, like they're hearing something their soul already knew. Moonlight through ancient trees, fireflies. Style: Pixar/Disney quality, magical ethereal lighting, purple and gold.

**Truth-Teller:**
Pixar-style 3D animated scene of a young adult standing in a boardroom or community hall, having just said something that silenced the room. Everyone's faces show the shock of recognition. One person is visibly moved to tears. The speaker stands calm, compassionate but unflinching. A golden crack of light splits through a dark wall behind them, truth breaking through. Style: Pixar/Disney quality, dramatic cinematic lighting, purple shadows with gold breakthrough.

**Heart Alchemist:**
Pixar-style 3D animated scene of a young adult kneeling in a garden where broken, withered things are transforming into golden blooms under their touch. Pain literally becoming beauty. People watching in awe as the transformation spreads outward. The alchemist's expression is one of deep feeling and purpose. Tears and fire coexisting. Warm amber and purple twilight. Style: Pixar/Disney quality, magical realism, cinematic lighting.

### Stabilizer Group

**Grounded Guardian:**
Pixar-style 3D animated scene of a young adult standing at the center of a thriving community they've built, a beautiful structured village or garden with clear pathways and safe spaces. People are flourishing around them, children playing safely, elders resting peacefully. The guardian watches over it all with quiet pride and devotion. Warm golden afternoon light, solid architecture with purple accents. Style: Pixar/Disney quality, warm cinematic lighting.

**Heart Holder:**
Pixar-style 3D animated scene of a young adult sitting in a cozy living room, surrounded by a small group of people who have clearly just been through something hard. The holder's steady presence has made everyone exhale. Shoulders have dropped, real conversation is happening. Warm firelight, blankets, mugs of tea. The room itself feels like a hug. Purple evening light through windows, golden interior warmth. Style: Pixar/Disney quality, intimate cinematic lighting.

**Rhythm Architect:**
Pixar-style 3D animated scene of a young adult standing before a beautiful, intricate machine or system they've designed, everything running in perfect harmony. Gears turning smoothly, lights pulsing in rhythm, a team working effortlessly around them. Excellence without stress. The architect smiles at the elegant simplicity of what they've built. Clean lines, purple and gold mechanical elements, warm productive light. Style: Pixar/Disney quality, cinematic lighting.

### Bridger Group

**Wise Sage:**
Pixar-style 3D animated scene of a young adult at a large table covered in maps, diagrams, and connected threads, having just explained something that made a divided group suddenly see the same picture. Everyone is pointing at the same spot on the map, nodding, finally aligned. The sage's expression shows quiet satisfaction. Golden connection lines glowing between the ideas. Warm library-like setting with purple ambient light. Style: Pixar/Disney quality, cinematic lighting.

**Cosmic Connector:**
Pixar-style 3D animated scene of a young adult standing at the intersection of two very different worlds, one hand reaching into a mystical/spiritual realm (purple, ethereal) and the other into a practical/structured realm (golden, solid). They're weaving the two together into something new that bridges both. People from both sides are crossing over, amazed. The connector glows at the nexus point. Style: Pixar/Disney quality, magical cinematic lighting, split composition.

**Compassionate Leader:**
Pixar-style 3D animated scene of a young adult walking alongside a group of people up a mountain path. They're not out front shouting orders, they're beside them, a hand on one person's shoulder, steady and warm. The group is tired but trusting, drawing strength from the leader's grounded presence. Golden sunrise ahead on the summit. Purple mountain landscape. Everyone is going to make it because of this person. Style: Pixar/Disney quality, epic cinematic lighting, warm and hopeful.

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
