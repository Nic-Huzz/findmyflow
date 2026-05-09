# Experience Inspiration Flow

## Where It Lives

Inside `/create` when a user taps "+ New Experience". Currently they go straight to a name + date form. With this feature:

```
"+ New Experience"
        ↓
Two options:
  [I know what I want to create]  →  Name + date form (existing)
  [Find Inspiration]              →  Inspiration flow (new)
```

## The Flow

### Step 1: Pick Your North Stars (2-5 creators)

"Who inspires the kind of experience you want to create?"

Shows a condensed version of the Experience Creator Matching browse. Not the full 59-creator Netflix layout. A search/filter grid where they can quickly pick 2-5 creators.

If they already completed the matching flow, their previous selections are pre-loaded. They can keep, swap, or add.

Output: 2-5 selected creator names

### Step 2: The Blend

AI reads the selected creators' play-skills, modalities, and experience types. Finds the intersection. Presents the blend:

```
YOUR BLEND

You picked: Wim Hof + Tony Robbins

What they share:
- Body-based transformation
- High energy facilitation
- Courage through physical experience
- Audience becomes participant

What makes YOUR blend unique:
Wim Hof's somatic depth + Tony Robbins' stage energy =
experiences where people feel it in their body AND leave the
room changed.
```

This step is AI-generated. The prompt receives:
- Selected creators' play-skill tags
- Selected creators' experience types
- Selected creators' career model data (what they actually do)
- The user's own play-skills (if they've completed PlaySkillsOnboarding)

### Step 3: Experience Ideas

AI generates 3 experience concepts from the blend:

```
INSPIRED BY YOUR BLEND

1. "Somatic Fire" (Workshop, 90 min)
   Breathwork meets high-energy movement. Participants
   break through a physical barrier to unlock an emotional
   shift. Think Wim Hof's body work with Tony Robbins'
   room energy.

2. "The Rewire Room" (Workshop, 2 hr)
   Guided NLP visualization with somatic activation.
   Participants identify a limiting belief, locate it in
   their body, and physically move through it.

3. "Courage Circle" (Circle, 60 min)
   Small group courage challenges with body-based
   accountability. Each person does one scary thing
   in the room while the group witnesses.
```

Each concept shows:
- Name (AI-generated, evocative)
- Format (workshop / retreat / circle / event / online)
- Duration suggestion
- 2-3 sentence description
- Which selected creators inspired it

### Step 4: Pick or Write Your Own

Three options:
- Tap a concept → pre-fills the experience name + description
- "Mix these" → AI combines elements from multiple concepts
- "I have my own idea" → free text, skip to name + date

### Step 5: Create Experience

Standard flow: name (pre-filled from step 4), date, type. Checklist seeds. They're in the system.

The selected inspiration concept is saved to the experience record so it can be referenced later (in the checklist, in marketing copy generation, in the 3% reflection).

---

## How the AI Generates Ideas

### Input to Edge Function

```json
{
  "action": "generate_experience_ideas",
  "selectedCreators": ["Wim Hof", "Tony Robbins"],
  "creatorData": {
    "Wim Hof": {
      "playSkills": ["breathwork", "cold_exposure", "mental_resilience", "somatic"],
      "experienceType": "workshop",
      "modalities": ["breathwork", "ice_baths", "meditation", "physical_challenge"]
    },
    "Tony Robbins": {
      "playSkills": ["stage_presence", "NLP", "transformation", "motivation"],
      "experienceType": "live_events",
      "modalities": ["fire_walks", "guided_visualization", "group_dynamics", "state_change"]
    }
  },
  "userPlaySkills": ["storytelling", "coaching", "performing", "creating"],
  "userArchetype": "workshop"
}
```

### Prompt Structure

```
You help experience creators design their next experience.

The user selected these creators as inspiration:
{{creatorData}}

The user's own play-skills are:
{{userPlaySkills}}

Find the INTERSECTION between the selected creators' approaches.
What do they share? What's unique about combining them?

Then generate 3 experience concepts that:
1. Combine elements from the selected creators' styles
2. Match the user's own play-skills (so they can actually deliver it)
3. Are realistic for a first-time or early-stage facilitator
4. Have a clear transformation for participants
5. Include a specific format and duration

Return JSON:
{
  "blend": {
    "shared": ["what the creators share"],
    "unique": "what makes this specific combination special"
  },
  "ideas": [
    {
      "name": "Experience name",
      "format": "workshop|retreat|circle|event|online",
      "duration": "90 min",
      "description": "2-3 sentences",
      "inspiredBy": "Which creators and what elements"
    }
  ]
}
```

### Output Validation

- Exactly 3 ideas
- Each has name, format, duration, description, inspiredBy
- Names are evocative, not generic ("Somatic Fire" not "Breathwork Workshop")
- Descriptions focus on participant transformation, not facilitator activities

---

## Data Sources

| Source | What It Provides | File |
|---|---|---|
| Creator play-skills | What each creator is known for | `public/data/nonFounderPlaySkills.json` |
| Creator DNA | Experience type, work style | `public/data/experienceCreatorDNA.json` |
| Career models | Revenue streams, what they actually do | `public/data/careerModels.json` |
| User play-skills | What the user is good at (if completed) | `nikigai_clusters` table |
| User archetype | Their business model type (if completed matching) | `experience_creator_selections` table |

---

## Examples

### Example 1: Wim Hof + Tony Robbins

**Blend:** Somatic depth + stage energy. Body-based transformation at scale.

**Ideas:**
1. "Shaking Breathwork" - Connected breathwork paired with full-body shaking. The body releases what the mind can't let go of.
2. "The Rewire Room" - Guided NLP visualization → somatic activation → physical step forward. Participants rewire a belief by moving through it.
3. "Courage Gauntlet" - 5 escalating physical/emotional courage challenges in 90 minutes. Each one harder than the last. The group witnesses every one.

### Example 2: Priya Parker + Brene Brown

**Blend:** Intentional gathering + vulnerability research. Conversations that actually change people.

**Ideas:**
1. "The Real Conversation" - Structured vulnerability exercise. 3 rounds, each deeper. No advice, no fixing. Just witnessing.
2. "Belonging Lab" - Group experience exploring: where do you belong and where do you perform belonging? Based on Brown's research, facilitated with Parker's gathering principles.
3. "The Dinner Table" - Intimate meal (8 people max) with structured conversation prompts that escalate from surface to soul over 3 courses.

### Example 3: Adriene Mishler + Jay Shetty

**Blend:** Accessible body practice + wisdom traditions made modern. Healing that doesn't feel heavy.

**Ideas:**
1. "Morning Reset" - 30-minute movement + meditation + one intention. Designed to be the thing people actually do every day (not just once at a retreat).
2. "The Purpose Flow" - Gentle yoga sequence where each pose represents a life question. Movement as self-inquiry.
3. "Wisdom & Movement" - Partner Jay Shetty-style storytelling with Adriene-style gentle movement. Hear a principle, then embody it physically.

---

## Connection to Existing Features

| Feature | Connection |
|---|---|
| Experience Creator Matching | Previous selections pre-loaded as starting point |
| Play-skills (nikigai_clusters) | User's skills filter AI suggestions to things they can actually deliver |
| Experience Create flow | Inspiration output pre-fills name + description |
| Checklist | Seeded based on experience type from the inspiration |
| Content Generator | "Generate marketing for [inspiration concept]" uses the blend description |
| Shift Architecture (upsell) | "Want to design the reconsolidation arc for this experience?" |

---

## Database

Save inspiration to the experience record:

```sql
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS
  inspiration JSONB;
-- { selectedCreators: [...], blend: {...}, chosenConcept: {...} }
```

---

## Build Sequence

1. Add "I know what I want" / "Find Inspiration" fork to ExperienceCreate
2. Build creator quick-picker (condensed version of matching browse)
3. Add `generate_experience_ideas` action to experience-blueprint-ai edge function
4. Build blend + ideas display UI
5. Wire chosen concept into experience creation (pre-fill name + description)
6. Save inspiration to experience record

---

*Original IP: Huzz Hurrell / FindMyFlow*
