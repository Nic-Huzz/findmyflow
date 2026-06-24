# Play-List Reveal: Implementation Plan

*Council-validated. April 2026.*

---

## The Change

Reframe the Experience Creator Matching result screen from a 3-layer business model to a **Play-List pattern reveal**: "What They Couldn't Stop."

### Current → New

| Current | New |
|---|---|
| Primary: 3-layer business model (attraction/core/continuity) | Primary: Cross-creator pattern reveal ("What They Couldn't Stop") |
| Secondary: proof quotes from selected creators | Secondary: individual creator early growth stories as evidence |
| Concrete output: business architecture | Concrete output: one first step from the pattern |
| 3-layer lives in matching flow | 3-layer moves to /create portal |

---

## The Reveal Structure

### Step 1: Cross-Creator Pattern (the hero)

After the user selects 3-5 creators, identify their dominant play-skill match and show the PATTERN across all creators who share that skill.

**Example for a user with "teaching" as dominant play-skill:**

> **Their Play-List: What They Couldn't Stop**
>
> 8 out of 12 creators who share your play-skill of **teaching** all did the same thing first: they gave it away for free until someone asked to pay.
>
> Before anyone knew their names, they were researching, explaining, simplifying. Not because someone hired them to. Because they couldn't stop.

### Step 2: Individual Evidence (supporting)

Show the selected creators' early growth stories as evidence beneath the pattern. Frame around the SKILL, not the identity ("this person had your play-skill" not "you're like this person").

**Example:**

> **Brene Brown** — Researched shame for 15 years in academic journals and small conference talks before one TED talk changed everything.
>
> **Wim Hof** — Practised cold exposure alone for years to cope with grief. Local media noticed. Then scientists did.

### Step 3: Your First Step (the concrete output)

One actionable thing derived from the cross-creator pattern. Replaces the 3-layer model as the concrete output.

> **Your first step** (based on how creators with your play-skill started):
> Give a talk at a local community center or library about something you can't stop thinking about.

---

## Data Sources

All data already exists:

| Source | What it provides |
|---|---|
| `public/data/experienceCreatorGrowthStrategies.json` | `early_growth`, `scaling_move`, `growth_category`, `first_step` per creator |
| `public/data/experienceCreatorDNA.json` | `experienceType` per creator |
| `public/data/careerModels.json` | `trajectory`, `keyDecision` per creator |
| `src/lib/wheelTaxonomy.js` | 10 play-skill categories |
| `public/data/founderPlaySkills.json` | Play-skill tags per creator |

### Growth Category → Play-Skill Mapping

| Growth Category | Primary Play-Skills |
|---|---|
| free_content | storytelling, teaching |
| free_events | connecting, performing, coaching |
| academic | teaching, building |
| grassroots | connecting, speaking_up, leading |
| one_project | creating, storytelling |
| apprenticeship | building, designing |
| clinical | coaching, connecting |

---

## Cross-Creator Pattern Logic

```
Input: user's play-skills (from onboarding), selected creator names

1. Get user's top 1-2 play-skills
2. Find ALL creators in corpus (not just selected) who share those play-skills
3. Count growth_category distribution for matching creators
4. The dominant growth_category IS the pattern
5. Compose the pattern statement: "X out of Y creators who share your play-skill of [skill] all did [growth_category description]"
6. Show selected creators' individual early_growth stories as evidence
7. Show the first_step from the most relevant selected creator
```

### Pattern Statement Templates

| Growth Category | Pattern Statement |
|---|---|
| free_content | "...started by creating content nobody asked for. Blogs, videos, newsletters. Not because it paid. Because they had something to say." |
| free_events | "...started by gathering people in rooms. Free workshops, community events, open classes. Not because it was a business. Because they couldn't stop bringing people together." |
| academic | "...started by going deep. Research, clinical work, years of study. Not because the market rewarded it. Because understanding the thing mattered more than selling it." |
| grassroots | "...started by organising. Local communities, activism, word of mouth. Not because it scaled. Because the cause was louder than the career plan." |
| one_project | "...started with one project that broke through. One book, one talk, one piece of work that couldn't be ignored." |
| apprenticeship | "...started by learning under someone else. Institutions, mentors, long apprenticeships. Not because it was fast. Because mastery required it." |
| clinical | "...started with one person at a time. Clients, patients, 1:1 work. Not because it scaled. Because the transformation happened in the room." |

---

## UI Changes (ExperienceCreatorFlow.jsx)

### Result Screen — New Structure

```
1. Header: "Their Play-List" badge + archetype name (kept)
2. Selected creators chips (kept)
3. NEW: Pattern reveal card
   - "What They Couldn't Stop" heading
   - Cross-creator pattern statement (e.g., "8 out of 12 creators who share your play-skill...")
   - Pattern description paragraph
4. NEW: Evidence section
   - Each selected creator: name + early_growth story (1-2 sentences)
   - Framed as "[Name] — [early_growth]"
5. NEW: First Step card
   - "Your first step" heading
   - Concrete action from growth data
6. MOVED: 3-layer model removed from this screen
7. Save button (unchanged)
```

### What Moves to /create Portal

The 3-layer business model (attraction/core/continuity) moves to CreatorHome's "My Business" tab. Framed as "The [Archetype] Build" — shown after the user has completed matching and is ready to build.

---

## Emotional Safety Rules

1. Frame around the SKILL, not the identity: "this person had your play-skill" not "you're like this person"
2. Show the unglamorous early behaviour, not the polished origin story
3. Lead with the pattern (evidence), not the individual (aspiration)
4. The first step must be achievable with zero audience and zero budget
5. Never use em dashes, semicolons, or double hyphens in user-facing copy

---

## Build Sequence

1. Wire growth strategy data into ExperienceCreatorFlow result screen
2. Add play-skill matching logic (user skills → creator growth categories → pattern)
3. Build pattern reveal card component
4. Build evidence section (individual creator early_growth stories)
5. Build first step card
6. Remove 3-layer from result screen
7. Add 3-layer to CreatorHome "My Business" tab (as "The [Archetype] Build")

---

## Open Questions

1. Should the pattern also surface NON-SELECTED creators who share the play-skill? ("You picked Brene Brown, but here are 5 more creators who couldn't stop teaching...")
2. Should the first step be AI-personalized (using the user's specific problem/persona data) or stay generic from the growth strategy data?
3. How does this interact with the Scope Map diagnostic? The Scope Map tells you WHERE you are. The Play-List reveal tells you WHAT to do. Sequencing?
