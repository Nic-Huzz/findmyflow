# Zone Calibration Card

## The Visual

8 stacked corridors. Each corridor represents one domain of life. Two walls (failure modes) on either side. A dot showing where the user currently sits. Gold dot = sweet spot. Purple dot = pinned to a wall.

```
MY ZONE CALIBRATION

Identity      Chameleon --------◆----------- Outcast
Vulnerability Over-share -----------◆------- Fortress
Direction     Martyr ----------------◆------ Navel-Gazer
Enough        Perfectionist ◆-------------- Procrastinator
Growth        Failure --------◆------------- Comfort
Execution     Burnout --------◆------------- Stalling
Passion       Reckless --------------◆------ Playing Safe
Play          Chaos --------◆-------------- Caged
```

At a glance: how many gold dots (sweet spot) vs purple dots (pinned to wall). The more gold, the more your nervous system is letting you operate freely. The more purple, the more protectors are running the show.

---

## The 8 Corridors

| # | Domain | Left Wall (too much) | Sweet Spot | Right Wall (too little) |
|---|--------|---------------------|------------|------------------------|
| 1 | Identity | Chameleon: shape-shift to belong, lose yourself | Authenticity AND belonging | Outcast: reject belonging, isolate |
| 2 | Vulnerability | Over-share: bleed on people who didn't ask | Right depth, right people, right time | Fortress: nothing gets in, nobody sees the real you |
| 3 | Direction | Martyr: serve everyone else's vision, never yours | Essence expressed in service of others | Navel-Gazer: so focused on self you never serve anyone |
| 4 | Enough | Perfectionist: nothing is ever ready, gas and brake | Ship when it's good enough, improve as you go | Procrastinator: never start, wait for permission |
| 5 | Growth | Failure Zone: challenges so far beyond ability you crash | Challenge matched to ability (the groan zone) | Comfort Zone: never challenged, never growing |
| 6 | Execution | Burnout: output so high your body breaks | Sustainable output with emotional wellbeing | Stalling: can't sustain movement, start-stop cycle |
| 7 | Passion | Reckless: risk everything on passion without evidence | Risk proportional to passion AND evidence | Playing Safe: never risk, passion stays theoretical |
| 8 | Play | Chaos: no structure, pure impulse, nothing holds | Genuine play within safety | Caged: so controlled that play feels dangerous |

---

## Where It Lives in the App

### Option A: Standalone Route (/my-zones)
A dedicated page accessible from the /me page or Creator Home. Shows all 8 corridors with current position. Tappable to update.

### Option B: My Business Tab in /create
Sits alongside the 4-layer assessment and Scope Map position. The business layers show what you're building. The calibration card shows what your nervous system is doing underneath.

### Option C: Both
/my-zones is the full interactive version. A condensed summary card shows in My Business tab.

---

## How Users Fill It In

### Quick Version (60 seconds)
8 single-tap questions. Each shows the domain name, the two walls described in 1 sentence each, and three tap targets:

```
IDENTITY

Left: "I shape-shift to fit in. I become whoever the room needs."
Right: "I pull away from everyone. Being seen feels dangerous."

[That's me ←]  [Sweet spot ◆]  [→ That's me]
```

8 taps. Done. Card generated.

### Auto-Populated Version
If user has completed Zone Diagnosis flows in the Level tab (/zone-diagnosis/:levelNumber), those results auto-fill the corresponding corridor. User just confirms or adjusts.

### Depth Version (on demand)
Tapping any corridor expands to show:
- Which protector is guarding this corridor (Ghost, Controller, Performer, Perfectionist, People Pleaser)
- The wound that installed the wall ("What happened that made this wall necessary?")
- The 4 R's entry point for this domain

---

## How It Updates Over Time

- Re-take prompted periodically (after completing a level, on group calls, monthly)
- Each take saves a new row (history preserved, like creator_assessments)
- Timeline view: "3 months ago you were pinned to Chameleon for Identity. Now you're in the sweet spot."
- Movement is the metric, not position. Moving from wall to sweet spot in ANY domain = progress.

---

## The Shareable Card

After completing the assessment, generate a shareable image card:

### Card Layout
- Purple gradient background (brand)
- Title: "MY ZONE CALIBRATION" in gold
- 8 horizontal bars, each with:
  - Domain name on the left
  - Left wall label (small, faded)
  - Right wall label (small, faded)
  - Gold dot for sweet spot position
  - Purple dot for wall-pinned position
- Footer: FindMyFlow branding + link
- Optional: user's name + essence archetype at top

### Share Mechanics
- "Share My Calibration" button generates image
- Direct share to Instagram Stories (sized for stories)
- Copy link to web version
- Download as PNG

### Viral Loop
User shares card → friend sees it → "What is this?" → link to /try version → friend takes assessment → gets their card → shares → loop.

The /try version would be a public lead magnet (like /try/experience-creators). No auth required. Email capture at the end to receive results.

---

## As Group Call Tool

### Check-in Format
"Pull up your calibration. Which corridor shifted since last time? Which one are you working on this fortnight?"

### The Language
Instead of "how are you?":
- "Where are you pinned?"
- "Which wall moved?"
- "Are you still on the Perfectionist wall for Enough?"

The 8 corridors become the shared vocabulary for the group.

### Accountability
"Last call you said you were working on the Fortress wall in Vulnerability. Did you do anything that moved you toward the sweet spot?"

This connects directly to Play-List challenges: a groan challenge IS a nervous system corridor experiment. "DM 10 people" is a Vulnerability corridor move (from Fortress toward sweet spot).

---

## As Content (Carousel Bridge)

The carousel teaches the concept (what are corridors, what are walls, what are protectors). The app delivers the personal result (your calibration card). The shareable card is the bridge.

Content cycle:
1. Carousel drops explaining the concept (attraction layer)
2. CTA: "Find out where you're pinned" → /try/zone-calibration
3. User takes quick assessment → gets shareable card
4. Shares card → friends ask "what is this?" → loop
5. Email captured → nurture → /get-started → full app

---

## Database

```sql
CREATE TABLE zone_calibration_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, -- for /try route (anonymous)

  identity_position TEXT CHECK (identity_position IN ('left', 'center', 'right')),
  vulnerability_position TEXT CHECK (vulnerability_position IN ('left', 'center', 'right')),
  direction_position TEXT CHECK (direction_position IN ('left', 'center', 'right')),
  enough_position TEXT CHECK (enough_position IN ('left', 'center', 'right')),
  growth_position TEXT CHECK (growth_position IN ('left', 'center', 'right')),
  execution_position TEXT CHECK (execution_position IN ('left', 'center', 'right')),
  passion_position TEXT CHECK (passion_position IN ('left', 'center', 'right')),
  play_position TEXT CHECK (play_position IN ('left', 'center', 'right')),

  sweet_spot_count INT GENERATED ALWAYS AS (
    (CASE WHEN identity_position = 'center' THEN 1 ELSE 0 END) +
    (CASE WHEN vulnerability_position = 'center' THEN 1 ELSE 0 END) +
    (CASE WHEN direction_position = 'center' THEN 1 ELSE 0 END) +
    (CASE WHEN enough_position = 'center' THEN 1 ELSE 0 END) +
    (CASE WHEN growth_position = 'center' THEN 1 ELSE 0 END) +
    (CASE WHEN execution_position = 'center' THEN 1 ELSE 0 END) +
    (CASE WHEN passion_position = 'center' THEN 1 ELSE 0 END) +
    (CASE WHEN play_position = 'center' THEN 1 ELSE 0 END)
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Multiple rows per user for tracking movement over time.

---

## Connection to Existing Features

| Feature | Connection |
|---|---|
| Zone Diagnosis Flow (/zone-diagnosis/:level) | Auto-populates the corresponding corridor |
| Play-List Groan Challenges | Each challenge IS a corridor experiment (moving from wall toward sweet spot) |
| Protective Archetype identification | Each wall has a protector. The calibration shows which protectors are active. |
| Level progression (Levels 1-8) | Each level corresponds to one corridor. Completing a level = moving that corridor toward sweet spot. |
| Scope Map (Root & Reach) | Direction corridor maps directly to Scope Map position |
| 4-Layer Assessment | Business health. Calibration card = nervous system health underneath. |
| Group calls | Check-in language. "Which wall moved?" |
| Content/Carousel | Teach the concept. Deliver the personal result. Share the card. |

---

*Original IP: Huzz Hurrell / FindMyFlow*
*Part of the Zone Calibration Framework (docs/zone-calibration-framework.md)*
