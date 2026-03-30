# Essence Mirror Flow Design

> **Status**: Draft — iterating
> **Route**: `/shadow-work` (replaces current Shadow Work flow)
> **Level**: 1 (Identity)
> **Core thesis**: Your shadows are your essence, suppressed. The most authentic parts of yourself are the ones you were told to hide.

---

## The Idea

Instead of 12 fixed archetype boxes, the Essence Mirror uses 12 archetypes as **ingredients** and blends a unique essence profile per user. The AI recommendation engine mixes primary + secondary archetypes based on quiz responses, creating a profile that feels deeply personal rather than generic.

**Example output:**
> **Primary**: Heart Alchemist (70%) — *You transform pain into gold*
> **Secondary**: Radiant Rebel (30%) — *But you do it with fire, not silence*
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

## Flow Structure (Draft)

### What we already know about the user before they enter

By the time a user hits this flow, we have:
- **Wound stage selections** (from onboarding) — which childhood patterns resonate
- **Zone diagnosis** (from Level 1) — where they sit on the Identity graph (Outcast / Diagonal / Chameleon)
- **Tension scores** (from HomeFirstTime) — direction, vulnerability, enough, passion

This existing data should **prime** the archetype matching, not be ignored.

### Proposed Steps

**Step 1: The Hook**
- Brief framing: "The parts of you that feel like shadows? They're actually your essence. Let's find them."
- No interaction, just emotional priming

**Step 2: Essence Questions (replaces old group assignment)**
- TBD: What questions to ask
- Should feel like self-reflection, not a personality quiz
- Need to map responses to archetype affinity scores
- Consider: using the wound stage data to skip/weight certain questions

**Step 3: The Mirror**
- AI blends primary + secondary archetype based on responses
- Shows the blended profile: poetic_line, superpower, essence_wound
- "Does this feel like you?" moment

**Step 4: The Wound**
- Reveals the essence_wound(s) — what you were told about these traits
- Connects to their zone diagnosis: "This is WHY you're in the [Chameleon/Outcast] zone"
- The suppression of essence IS the zone imbalance

**Step 5: The Vision**
- Shows poetic_vision — what life looks like when essence leads
- Characters who embody this blend
- vision_in_action

**Step 6: Save + Create Avatar**
- Save essence profile to DB
- Transition to hero avatar creation (naming, owning it)

---

## Mixing Algorithm (Draft)

### Option A: Weighted scoring from questions
Each question response adds weight to specific archetypes. Final scores determine primary (highest) and secondary (second highest). Ratio comes from relative scores.

### Option B: AI-powered blending
Send question responses + wound stage data + zone diagnosis to Claude API. Ask it to select primary + secondary from the 12 and generate a blended poetic profile. More expensive but more personal.

### Option C: Hybrid
Use weighted scoring to narrow to top 3-4 candidates, then use AI to pick the final blend and generate the personalized copy.

**Leaning toward**: Option C — deterministic narrowing + AI personalization

---

## Open Questions

1. **What questions replace the group assignment?** The old 3 questions (nervous system, sensory threshold, stress response) were very body-focused. Do we want:
   - More "when do you feel most alive?" style questions?
   - Scenario-based ("you walk into a room where...")?
   - Inner child focused ("as a kid, you were the one who...")?
   - Or use the wound stage selections we already have as primary signal?

2. **How many archetypes in the blend?** Primary + secondary, or primary + two secondaries?

3. **Should the blend generate a unique name?** e.g., "The Fierce Alchemist" (Heart Alchemist + Radiant Rebel) vs just showing the two archetypes with percentages?

4. **How does this connect to the protective archetype?** The existing app has protective voices (Performer, Controller, People Pleaser, Perfectionist, Ghost). The zone diagnosis already identifies the Boss. Should the Essence Mirror show the relationship: "Your essence is X, your protector is Y, the wound that created Y was Z"?

5. **Persona survey (Vibe Seeker / Vibe Riser / Movement Maker)**: Keep, remove, or integrate differently? This maps roughly to the tension scores we already capture.

6. **Repeatability**: Should users be able to retake this? The current Shadow Work is repeatable weekly. An essence discovery feels more like a one-time reveal with optional retake.

---

## Data Storage

### New table or extend existing?

Current `founder_dna_results` stores Play Profile data. Essence Mirror is different enough to warrant its own table:

```sql
create table essence_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  primary_archetype text not null,
  primary_weight numeric(4,2),
  secondary_archetype text not null,
  secondary_weight numeric(4,2),
  blended_name text,
  blended_poetic_line text,
  blended_superpower text,
  blended_wound text,
  question_responses jsonb,
  zone_at_time text,
  created_at timestamptz default now(),
  unique(user_id)
);
```

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
