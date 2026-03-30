# Essence Mirror Flow Design

> **Status**: Draft v2 — refined
> **Route**: `/shadow-work` (replaces current Shadow Work flow)
> **Level**: 1 (Identity)
> **Core thesis**: Your shadows are your essence, suppressed. The most authentic parts of yourself are the ones you were told to hide.

---

## The Idea

Instead of 12 fixed archetype boxes, the Essence Mirror uses 12 archetypes as **ingredients** and blends a unique essence profile per user. The primary archetype comes from the user's winning group; the secondary comes from a different group (cross-group blending), creating profiles that feel deeply personal rather than generic.

**Example output:**
> **Primary**: Heart Alchemist (Transmuter) — *You transform pain into gold*
> **Secondary**: Radiant Rebel (Activator) — *But you do it with fire, not silence*
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

## Flow Structure (Refined)

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

### Step 2: Group Question 1 — "Which kid were you?"

4 Pixar scene images, one per group. Inner child angle. Tap to select.

**Prompt**: "Think back to the playground. Which one were you?"

| Option | Scene Description (for Pixar image) | Group |
|--------|--------------------------------------|-------|
| A | Kid leading a wild charge, rallying others into action, climbing things they shouldn't | **Activator** |
| B | Kid sitting quietly watching, feeling everything, making up stories in their head | **Transmuter** |
| C | Kid organizing the game, making sure everyone has a turn, setting up the rules | **Stabilizer** |
| D | Kid connecting two friend groups, explaining things, drawing maps of imaginary worlds | **Bridger** |

---

### Step 3: Group Question 2 — "When you feel most alive..."

4 Pixar scene images, different angle. Energy/flow state angle.

**Prompt**: "When do you feel most like yourself?"

| Option | Scene Description (for Pixar image) | Group |
|--------|--------------------------------------|-------|
| A | Character mid-leap, full of fire and momentum, sparks flying | **Activator** |
| B | Character in a quiet deep moment, transforming something painful into something beautiful | **Transmuter** |
| C | Character building something solid, organized, others feeling safe around them | **Stabilizer** |
| D | Character connecting dots on a board, seeing the big picture, bridging worlds | **Bridger** |

---

### Step 4: Tiebreaker (conditional — only if Q1 ≠ Q2)

Resolves which group is **primary** and which becomes the **secondary** source.

**Prompt**: "One more. When things get hard, which is closer to you?"

| Option | Scene Description | Group |
|--------|-------------------|-------|
| A | Character charging forward through difficulty, refusing to stop | **Activator** |
| B | Character sitting with the pain, feeling it fully, letting it transform | **Transmuter** |
| C | Character steadying the ground, holding everything together for others | **Stabilizer** |
| D | Character stepping back to see the whole picture, finding the pattern | **Bridger** |

**Resolution logic:**
- If Q1 == Q2: Primary = that group. No tiebreaker shown.
- If Q1 ≠ Q2, Q3 shown: Primary = Q3 result. Secondary = whichever of Q1/Q2 wasn't Q3.
- If Q3 matches Q1: Primary = Q1, Secondary = Q2.
- If Q3 matches Q2: Primary = Q2, Secondary = Q1.
- If Q3 is a third group: Primary = Q3, Secondary = Q1 (first instinct).

---

### Step 5: Archetype Pick — "In your essence moments..."

Shows 3 archetype options from the **primary group only**. Each option uses the `inner_child_desire` or a one-line essence description. Could use Pixar images or poetic text cards.

**Prompt**: "In those moments you feel most alive, what are you naturally being?"

Example (if primary = Transmuter):
- "The one who senses what others miss" → Mystic Messenger
- "The one who says what no one else will" → Truth-Teller
- "The one who turns pain into gold" → Heart Alchemist

User picks one. This becomes the **primary archetype**.

The **secondary archetype** is selected by the AI in the next step, from the secondary group, based on which archetype best complements the primary + existing user data.

---

### Step 6: The AI Mirror (Haiku API call)

**Input to Haiku:**
- Primary archetype (full data: poetic_line, superpower, wound, etc.)
- Secondary group (all 3 archetypes in that group)
- User's wound stage selections from onboarding
- User's zone diagnosis (Outcast/Diagonal/Chameleon)
- User's tension scores

**Haiku's job:**
1. Pick the best secondary archetype from the secondary group
2. Generate a blended poetic profile (~3-4 sentences) that weaves both archetypes
3. Generate a blended essence wound that combines both wounds
4. Generate a blended superpower statement

**Output displayed:**
- Dramatic reveal animation (like Boss Reveal in Zone Diagnosis)
- Primary archetype name + secondary archetype name
- Blended poetic_line
- Blended superpower
- "Does this feel like you?"

**Confidence gate**: If Q1 == Q2 (strong signal), show with confidence. If tiebreaker was needed, add "If this doesn't quite land, you can retake" option.

---

### Step 7: The Wound

Connects the essence_wound to their childhood experience.

**Prompt structure:**
> "At some point, someone told you: *[blended essence wound]*"
>
> "And so you learned to suppress the very thing that makes you powerful."
>
> [If zone data exists]: "This is why you're in the **[zone name]**. Your essence was suppressed, and the **[Boss name]** stepped in to protect you."

This is the "I feel so seen" moment. The wound stage data from onboarding makes it personal — the AI can reference their specific childhood pattern.

---

### Step 8: Create Hero Avatar

- Display the blended archetype as their new identity
- Allow naming/customizing (pre-filled with archetype name, editable)
- Save to DB (replaces old essence archetype system)
- Transition back to Level tab or /me page

---

## Cross-Group Blending Algorithm

### How primary + secondary are determined

```
Q1 → Group A
Q2 → Group B

If A == B:
  Primary group = A
  Secondary group = determined by AI (using wound stages, zone, tension scores)

If A != B:
  Q3 (tiebreaker) → Group C
  If C == A: Primary = A, Secondary = B
  If C == B: Primary = B, Secondary = A
  If C == neither: Primary = C, Secondary = A (first instinct)

Primary archetype = user picks from 3 options in primary group (Step 5)
Secondary archetype = AI picks from 3 options in secondary group (Step 6)
```

### What the AI blends

The AI doesn't invent new archetypes. It:
1. Takes the full data for both archetypes (poetic_line, superpower, wound, etc.)
2. Generates a **bridging narrative** that weaves both together
3. The core archetype data stays intact — the AI adds the connective tissue

---

## Images Needed

| Image | Description | Used In |
|-------|-------------|---------|
| Group Q1 - Activator | Kid leading a wild charge on playground | Step 2 |
| Group Q1 - Transmuter | Kid sitting quietly, feeling everything, storytelling | Step 2 |
| Group Q1 - Stabilizer | Kid organizing the game, making sure everyone's included | Step 2 |
| Group Q1 - Bridger | Kid connecting friend groups, drawing maps | Step 2 |
| Group Q2 - Activator | Character mid-leap, fire and momentum | Step 3 |
| Group Q2 - Transmuter | Character in deep moment, transforming pain to beauty | Step 3 |
| Group Q2 - Stabilizer | Character building something solid, others feel safe | Step 3 |
| Group Q2 - Bridger | Character connecting dots, seeing big picture | Step 3 |
| Tiebreaker - Activator | Character charging through difficulty | Step 4 |
| Tiebreaker - Transmuter | Character sitting with pain, letting it transform | Step 4 |
| Tiebreaker - Stabilizer | Character steadying the ground for others | Step 4 |
| Tiebreaker - Bridger | Character stepping back to find the pattern | Step 4 |

**Total: 12 Pixar-style images** (4 per question, 3 questions)

Archetype pick (Step 5) could use text cards instead of images to keep scope manageable.

---

## Data Storage

```sql
create table essence_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  primary_group text not null,
  secondary_group text,
  primary_archetype text not null,
  secondary_archetype text,
  blended_narrative text,
  blended_superpower text,
  blended_wound text,
  question_responses jsonb,
  wound_stages_at_time jsonb,
  zone_at_time text,
  created_at timestamptz default now(),
  unique(user_id)
);
```

---

## Decisions Made

1. **Hook style**: Swipeable purple/gold text slides (matches onboarding and existing Shadow Work)
2. **Group questions**: 2 questions with Pixar images + conditional tiebreaker (not the old nervous system questions)
3. **Cross-group blending**: Primary archetype from winning group, secondary from runner-up group (not same-group)
4. **AI engine**: Haiku for blending (cheap, fast enough for a reveal moment)
5. **Archetype pick**: One question, 3 options from primary group only
6. **Secondary selection**: AI picks from secondary group based on complement + user data
7. **Replaces**: Old essence archetype system. Hero avatar on /me uses this.
8. **Ends with**: Create Hero Avatar flow

## Open Questions (Remaining)

1. **Archetype pick presentation**: Text cards with poetic one-liners, or Pixar images for each of the 12 archetypes? (12 more images is a lot)
2. **Blended name generation**: Should the AI generate a unique name (e.g., "The Fierce Alchemist") or just show "Heart Alchemist + Radiant Rebel"?
3. **Retake policy**: One-time reveal with optional retake, or fully repeatable?
4. **Protective connection**: Show the relationship between essence → wound → protective voice → Boss in the wound step?

---

## Reference Files

- Original GPT data: `/Users/nichurrell/Library/Mobile Documents/com~apple~CloudDocs/2022 Mac/Vibe Rise/CustomGPT's/Vibe Mirror/Essence Mirror/`
- Current Shadow Work flow: `src/flows/ShadowWorkFlow.jsx`
- Essence archetype page: `src/profiles/EssenceProfile.jsx`
- Zone Diagnosis flow: `src/flows/ZoneDiagnosisFlow.jsx`
- Level config: `src/components/level/LevelConfig.js`
- Protective voices data: `src/data/protectiveVoices.js`

---

*Original IP: Huzz Hurrell. All archetype data, poetic copy, and framework from Vibe Rise / Vibe Mirror.*
