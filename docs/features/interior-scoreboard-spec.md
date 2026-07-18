# Interior Scoreboard

*Spec: July 2026. Status: Design final, ready to build.*

## What We're Building

One new metric: **Clarity**. Everything else already exists.

The Vibe Rise app moves users along the Sprouter diagonal (Zone Calibration). Two axes:
- **Y axis = Action/Safety** → already measured by **Capacity Score** (0-100, `useCapacityScore.js`)
- **X axis = Self-knowledge** → measured by **Clarity** (new, per-cluster resonance)

Both rising together = Self-Actualisation. That's the thesis.

---

## Clarity

**What it measures**: How well you know what path to pursue. Resonance between the AI-generated mirror (Life Map clusters) and your felt experience, sharpened by action.

### How it works

1. User completes Life Map → AI generates skill/problem/persona clusters
2. User rates each cluster on a resonance scale:

| Rating | Label | Meaning |
|---|---|---|
| 5 | "This IS me" | Goosebumps. You'd screenshot it. |
| 4 | "Yeah, that's right" | Accurate, no resistance |
| 3 | "Partly" | Some hits, some doesn't |
| 2 | "Not quite" | See why AI said it but doesn't land |
| 1 | "That's not me" | Feels off, needs re-clustering |

3. **Clarity Score = average resonance across all rated clusters**
4. As new data comes in, resonance updates:
   - Courage challenge completed on a tagged quest → cluster gets reinforced or questioned
   - Curiosity entered that "lit me up" → convergence signal strengthens
   - Healing flow reveals a connected wound → problem cluster resonance sharpens
   - Periodic re-rating prompt: "Based on what you've done this month, does [cluster] still feel right?"

### Life path taxonomy tagging (the key unlock)

For Clarity to update from courage challenge data, each quest (life path) needs taxonomy tags connecting it to the wheel taxonomy segments.

When a life path becomes a quest, AI maps it to:
- Skill segments (e.g., "Dance Facilitator" → performing, coaching, connecting)
- Problem segments (e.g., → voice_taken, life_not_yours)
- Persona segments (e.g., → seekers, achievers)

Tags stored on `quests` table: `skill_tags[]`, `problem_tags[]`, `persona_tags[]`.

When a courage challenge on that quest is completed, the wahoo classification becomes behavioral evidence FOR those taxonomy segments. Vibe Rise outcome on a quest tagged "performing" = resonance with the related skill cluster goes UP. This creates a feedback loop: **action sharpens the mirror**.

### What feeds Clarity

| Action | How it feeds Clarity |
|---|---|
| Life Map completion | Initial clusters + first resonance rating |
| Courage challenge on tagged quest | Behavioral evidence for/against clusters |
| Curiosity input with "lit me up / was okay / bored" | Convergence signal (which branches light up) |
| Healing flow | Wound cluster resonance sharpens |
| Cross-pollination tag | Convergence (paths feeding each other) |
| Periodic re-rating | User updates resonance directly |

### What needs building

1. Resonance rating UI after Life Map (per-cluster 1-5 slider)
2. Quest-to-taxonomy tagging (AI maps quest label → skill/problem/persona segments at creation)
3. Re-rating trigger (after N challenges or monthly prompt)
4. `curiosity_signal` field on curiosity inputs (lit_me_up / was_okay / bored)

### Database changes

**On `quests` table** (new fields):
- `skill_tags` text[] — skill segment IDs
- `problem_tags` text[] — problem segment IDs
- `persona_tags` text[] — persona segment IDs

**On `nikigai_clusters` table** (new fields):
- `resonance_rating` integer 1-5
- `resonance_updated_at` timestamp

**On `curiosity_inputs` table** (new field):
- `curiosity_signal` text — lit_me_up / was_okay / bored

---

## Per-Completion Experience

Every completion should produce a visible progress signal. No action goes into the void.

### Courage challenge completion

The challenge's own `depth_level` (on `groan_challenges`) determines if there's one extra question beyond the standard flow.

```
Standard flow (all courage challenges):
  1. "How did that feel?"                    (4 states — exists)
  2. "I am someone who..."                   (identity statement dropdown — new)
  3. "Better, worse, or as expected?"        (3% check — exists)

Extra by depth:
  L0 (education):  "Lit me up / Was okay / Bored"     → feeds Clarity convergence
  L1 (testing):    nothing extra
  L2 (practising): nothing extra (Vibe Rise state IS the identity fit signal)
  L3 (charging):   "What did you earn from this?"      → feeds Scale Alignment
  L4 (teaching):   "How many people did this reach?"   → feeds Scale Alignment
```

**Visible progress shown after completion:**
- Quest progress bar (tasks done / total)
- Per-quest wahoo trend (e.g., "4 Vibe Rise, 1 Fun out of 5 challenges")
- Identity statement collection growing
- Which taxonomy cluster just got reinforced (skill resonance bump)

### To-do completion

```
  1. ✓ checkmark
  2. "Lit me up / Was okay / Bored"          (one optional tap — ALL to-dos)
  3. Quest progress bar updates
```

No need to detect "learning task" vs other. The "lit me up" signal is valuable for ANY task:
- "Research breathwork certification" → Lit me up = curiosity alive
- "Email 3 venues" → Bored = this task drains you
- Consistent "bored" on marketing tasks + "lit me up" on facilitation tasks = Clarity signal about what parts of this quest light you up vs don't.

### What each completion feeds

| Completion type | Immediate visible feedback | Feeds (background) |
|---|---|---|
| Courage challenge | Wahoo trend + identity collection + cluster bump | Capacity (any challenge) + Clarity (via taxonomy tags) |
| Courage L0 | + "lit me up" signal | Clarity convergence |
| Courage L3 (Scale) | + income captured | Scale Alignment |
| Courage L4 (Scale) | + reach captured | Scale Alignment |
| To-do | Progress bar + "lit me up" signal | Clarity (convergence on quest tasks) |
| Tune practice | Capacity Score number moves | Capacity |

---

## Capacity Score (existing — no changes needed)

Already built in `useCapacityScore.js`. Rolling 7-day window.

```
Capacity = Safety × Expression × Maintenance Multiplier

Safety (0-10):  practices + healing - stalls
Expression (0-10): voice work + wahoos + essence - drains
Maintenance (0-100%): sleep, exercise, sunlight, meals over 7 days

Capacity = Safety × Expression × (0.5 + Maintenance% × 0.5)
Zones: 0-25 Stuck, 25-50 Wired, 50-75 Grounded, 75-100 Vibe Rise
```

Captures daily practices, courage challenges, healing, stalls, drains. Week-over-week trend. Zone transitions trigger mystery boxes.

---

## Scale App Metrics (Creator Portal)

### Monopoly Score
Taxonomy intersection rarity vs 299 reference profiles. How unique is your combination of skills × problems × personas? Appears at stages 9+.

Full spec: `docs/features/monopoly-engine-spec.md`

### Alignment
% of income from aligned path vs total income. Requires L3 per-task income prompts (not yet built).

---

## The Complete Picture

```
CONSUMER APP (Vibe Rise)
═══════════════════════════

  Capacity  ████████░░  75 — Grounded     (existing, no changes)
  Clarity   ███████░░░  72% resonance      (new — build this)

  Both rising = Sprouter diagonal = Self-Actualisation

  Courage challenges feed BOTH:
    → Capacity: completing any challenge expands safety
    → Clarity: completing tagged challenge sharpens cluster resonance


SCALE APP (Creator Portal)
═══════════════════════════

  Monopoly   0/299 unique combination      (build when ready)
  Alignment  ██░░░░░░░░ income gap          (needs L3 prompts)
```

---

## Life Path Alignment (quest-level insight, not a metric)

Not on the scoreboard. Shown on each quest card as context.

Once quests and clusters are both tagged with skills/problems/personas, alignment % is a free query: how much do this quest's tags overlap with the user's top Life Map cluster tags?

```
Quest: Dance Facilitator
  Tags: performing, coaching, voice_taken, seekers
  Alignment with your profile: 85%
  Last 5 challenges: 4 Vibe Rise, 1 Fun
  ↑ 15% since you started
```

The wahoo classification (Vibe Rise/Fun/Pressure/Uninterested) captures FELT alignment per challenge. The taxonomy % captures ANALYTICAL alignment over time. Both visible on the quest card, neither needs a separate scoreboard metric.

Value: watching the % line move upward as Clarity sharpens. Warning signal when a quest's wahoo outcomes are consistently "Pressure" (Zone of Excellence — skilled but doesn't feel like you).

### Backdating existing quests

~21 users × ~3-5 quests each = ~80 quests to tag. One-time batch: edge function takes quest label + user's Life Map clusters → outputs skill_tags[], problem_tags[], persona_tags[]. Going forward: auto-tag at quest creation.

---

## Identity Statement Library

### How it works

After each courage challenge, users complete: "Now that I [x], I've proven I'm someone who..."

Statements are collected into a growing library. On future completions, users see a dropdown of their previous statements (sorted by frequency) + option to write a new one. Each reuse = a vote. Statements used 5+ times = strong identity signal.

### What it feeds

Identity statements feed **Clarity**. The top-voted statements are the user's identity articulated in their own words. Combined with cluster resonance (AI-generated mirror rated 1-5), Clarity comes from two directions:
- **Cluster resonance** = the system's view of who you are
- **Identity statements** = YOUR view of who you're becoming
- When both align = high Clarity

### Aspiration engine (v2)

Based on user's taxonomy tags, generate aspirational "I am someone who..." statements from the 299-person dataset:

> "People who share your skills (performing, building) and wound (voice_taken) often describe themselves as:
>   → 'I am someone who builds stages for voices that were silenced'
>   → 'I am someone who creates spaces where expression is safe'
> Do any of these resonate?"

User taps one → goes into their library → can reuse on future challenges → Clarity sharpens toward the aspiration.

### Implementation

**v1**: Query existing `identity_statement` from `quest_completions.reflection_text` JSON. Group by text, count frequency. Show as dropdown + "Write new" on wahoo completion. No new table needed.

**v2**: Generate aspirational statements from 299 dataset via edge function. Based on user's quest taxonomy tags. Pre-compute for common tag combinations.

---

## Timeframe Tags on Tasks

When adding a task to a quest, users select a timeframe:

```
Add a task to "Dance Facilitator"

  Task: [Email 3 dance studios          ]
  
  When:  ● This week  ○ This month  ○ This quarter
  
  ☐ This is a courage challenge
  
  [Add Task]
```

Quest board groups tasks by timeframe:

```
Quest: Dance Facilitator

  THIS WEEK
  ☐ Email 3 dance studios
  ⚡ Host a mini session for friends

  THIS MONTH
  ☐ Attend 2 classes as observer
  ☐ Design a 60-min session plan

  THIS QUARTER
  ☐ Get facilitator certification
  ⚡ Run a paid public class
```

### Implementation

New field on `quest_tasks`: `timeframe` text — `week` / `month` / `quarter`. Default: `week`.

Quest board UI groups by timeframe within each quest card. Courage challenges (⚡) and to-dos (☐) live together, sorted by timeframe.

---

## Taxonomy Auto-Tagging

For Clarity to update from courage challenge data, both clusters and quests need taxonomy tags connecting them to the wheel taxonomy.

### What gets tagged

| Item | When | How | Tags |
|---|---|---|---|
| nikigai_clusters | Life Map completion | AI auto-maps freeform name → taxonomy segments | skill_tags[], problem_tags[], persona_tags[] |
| quests | Quest creation (from life path) | AI auto-maps quest label → taxonomy segments | skill_tags[], problem_tags[], persona_tags[] |

### How challenge data flows through tags

```
Challenge completed on quest "Dance Facilitator"
  → Quest auto-tagged: performing, coaching, voice_taken, seekers
  → Wahoo = Vibe Rise, identity statement = "takes risks..."
  → Clusters sharing those tags get +1 behavioral evidence
  → After 5 evidence points on shared tags → AI re-generates cluster
  → User re-rates → Clarity updates
```

Branches (from Curiosity Map) are a SEPARATE taxonomy for market landscape, NOT used for challenge-to-cluster linking. Skills/problems/personas (from Life Map) are the bridge.

### Database changes

**On `quests` table** (new fields):
- `skill_tags` text[] — skill segment IDs (e.g., ['performing', 'coaching'])
- `problem_tags` text[] — problem segment IDs (e.g., ['voice_taken'])
- `persona_tags` text[] — persona segment IDs (e.g., ['seekers'])

**On `nikigai_clusters` table** (new fields):
- `skill_tags` text[] — mapped taxonomy skill IDs
- `problem_tags` text[] — mapped taxonomy problem IDs
- `persona_tags` text[] — mapped taxonomy persona IDs
- `resonance_rating` integer 1-5
- `resonance_updated_at` timestamp
- `behavioral_evidence` integer — count of supporting challenge completions

**On `quest_tasks` table** (new fields):
- `timeframe` text — week / month / quarter (default: week)
- `task_signal` text — lit_me_up / was_okay / bored (captured on to-do completion)

**On `curiosity_inputs` table** (new field):
- `curiosity_signal` text — lit_me_up / was_okay / bored

---

## Appendix: Design Evolution

This spec went through significant iteration during a July 2026 design session:

### v1: Five metrics + foundation (discarded)
Clarity, Belief, Courage, Alignment, Convergence + Capacity as foundation. Data audit against Huzz's actual data (99 wahoos, 123 NS check-ins) revealed 3 of 5 were uncomputable. Clarity was measuring completion not actual clarity. Alignment and Convergence were the same arc. Courage × Belief were one felt experience.

### v2: Three metrics (discarded)
Process/Play/Purpose. MasterMind Council (Naval, Ken Wilber, Gay Hendricks) assessed. Identified Zone of Excellence trap (high skill + low identity fit). Gay Hendricks: detection should be behavioral (resonance) not comparative. Naval: problems taxonomy is strongest wheel. The combination IS the genius (10 skills × 12 problems × 12 personas = 1,440 positions).

### v3: Process/Expression/Clarity + Flow Score (discarded)
Expression mapped to Safety × Expression = Vibe Rise equation. Flow Score as master metric (sequential chain). But Expression wasn't adding value as a separate dashboard metric — the wahoo classification captures it per-event. Flow stages (Foggy → Seen → Converging → Unique → Aligned → Living it) added noise.

### v4: Capacity × Clarity (current)
Realized Capacity Score already exists and works. Expression data feeds Clarity silently rather than being its own metric. Monopoly + Alignment moved to Scale app (stages 9+, not relevant for consumer users still finding their path). One new metric to build (Clarity), everything else keeps working.

Key insight: the exploration was valuable for understanding how all the data connects, but the build is simple. One new metric alongside what exists.

### MasterMind Council insights (preserved)
- **Naval**: Problems taxonomy = strongest (wounds are unambiguous). Skills = vehicle. Personas = strong when "who you serve" not "who you are." The combination IS the genius.
- **Gay Hendricks**: Zone of Genius found through resonance, not comparison. The body's response to curiosity is the truest signal. "Lit me up" = the detector. Upper Limit Problem: users will deflate their monopoly. Show behavioral evidence first.
- **Zone of Excellence trap**: High skill + low identity fit = Performing not Playing. Detectable when courage challenges on a quest consistently produce "Pressure" not "Vibe Rise" outcomes. Most people's income comes from here. The warning "You're skilled at this but it doesn't light you up" may be more valuable than any score.

### Behavioral scoring for Monopoly (Scale app)
- Skills: Recurrence across 5 Life Map periods (how many contexts does this appear?)
- Problems: Emotional charge (selected + depth of writing + returned in healing + NS state shift)
- Personas: Who they actually help (behavioral evidence from Life Map + courage challenges)
- Each dimension 0-100% behavioral score. Top scores = monopoly fingerprint. Compared against 299 careerModels.json profiles.
- Huzz's actual: performing (80%) + building (60%) + voice_taken (90%) = 0/299 matches.

### Belief sliders (designed then dropped)
Two per-challenge sliders: "I'm getting good at this" (1-5) and "This feels like me" (1-5). Designed to detect Zone of Excellence (high skill, low identity fit). Dropped because: (a) "Vibe Rise" wahoo classification already captures identity fit — if it felt like Vibe Rise, it felt like you, (b) "getting good at this" is less meaningful than the identity statement which captures the belief in the user's own words, (c) some courage challenges are marketing/admin tasks where "feels like me" doesn't apply — the identity statement handles this more naturally.

### Per-task L0-L4 prompts (simplified)
Originally designed per-depth prompt matrices with 2-4 questions each. Simplified to: standard courage flow (4-state + identity statement + 3% check) + ONE extra question by depth level (L0: lit me up, L3: income, L4: reach). L1-L2 get nothing extra — the standard flow is enough. To-dos get "lit me up / was okay / bored" universally (not just learning tasks). Full original design preserved in git history.

---

## Related Docs

- `docs/features/monopoly-engine-spec.md` — Monopoly Engine, taxonomy, 299 dataset, behavioral scoring, Collect → Connect → Your Flow spine
- `docs/frameworks/zone-calibration-framework.md` — Zone Calibration (source framework for Capacity × Clarity)
- Obsidian: `Frameworks/Collect Connect Your Flow.md` — Spine framework with hero journey mapping
