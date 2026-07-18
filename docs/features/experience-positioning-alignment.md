# Experience-Positioning Alignment

*Spec: maps blow-up brand positioning to individual experiences. Shows which experiences embody the rule break and which don't. Creates a feedback loop from results back to positioning.*

---

## The Insight

A creator has a positioning (from Remarkable Flow: rule break, assumption, what's different) AND multiple experiences with results (attendance, repeat rate, 3% improvements). The question nobody answers: **which of your experiences IS your positioning, and which contradicts it?**

The creator who says "I break the assumption that healing must be serious" but runs mostly serious workshops is misaligned. The data can show this.

---

## How It Works

### Step 1: Each experience gets tagged at creation

When a creator creates a new experience:
- **Branch**: AI-recommended from experience name/description (reuse `classify-quest-skills` edge function pattern). Creator sees "Recommended: Healing" tag, can change.
- **Delivery modes**: Multi-select from: play, ritual, music, conversation, movement, ceremony, performance, digital. Tracks HOW the experience is delivered.
- **Persona** (post-event): Creator picks "Who showed up?" from 12 persona segments. Top 2.

New fields on `experiences` table:
- `branch` text — AI-classified, editable
- `delivery_modes` text[] — multi-select at creation
- `attendee_personas` text[] — creator-selected post-event

### Step 2: Low ticket sales → Remarkable Flow diagnostic

Instead of comparing experiences against each other (too many variables), trigger a diagnostic when ticket sales are below target. The Remarkable Flow becomes a CHECKLIST for underperforming events.

**Trigger:** ticket sales < 50% of capacity with < 7 days to event, OR creator manually requests help.

**Diagnostic UI:**

```
Ticket sales are below your target for "Monthly Workshop"

Let's check your positioning against this event:

☐ Rule break clear?
  Your rule break: "Healing must be fun, not serious"
  → Does your event description communicate this?
  [View event description]

☐ Assumption visible?
  You're challenging: "Everyone assumes healing is clinical"
  → Is your marketing challenging this assumption?
  [View marketing checklist]

☐ Vehicle working?
  Your strongest vehicle: "Live events with play"
  → Is this event using your strongest vehicle?
  Delivery modes on this event: [conversation, ceremony]
  → Missing: play. Your best events have play.

☐ Reaching the right people?
  Your audience: seekers in transition
  → Where are you promoting? Are seekers there?
  [View distribution channels]

[Edit your event]  [Revisit your rule break]
```

**Data used:**
- `remarkable_angles.wound_problem` → the problem (for "rule break clear?" check)
- `remarkable_angles.assumption` → the assumption (for "assumption visible?" check)
- `narrative_builders.vehicle_type` → the vehicle (for "vehicle working?" check)
- `experiences.delivery_modes` → compare to creator's best-performing modes
- Creator's persona from useBranchScoring → "reaching the right people?" check

### Step 3: Post-event mirror (not scoring)

After each event, show a MIRROR that connects results to positioning. No scores. Just data + a question.

```
Your "Saturday Silent Disco" — 40 attendees, 85% repeat

  Branch: healing — matches your positioning ✓
  Who showed up: seekers — matches your target ✓
  Delivery: play + music + ritual
  → This IS your rule break in action.

Your "Monthly Workshop" — 8 attendees, 20% repeat

  Branch: healing — matches ✓
  Who showed up: achievers — different from your usual seekers
  Delivery: conversation (no play)
  → Different audience, different mode. Intentional experiment,
    or worth adjusting?
```

**Only surfaces when:**
- 2+ experiences exist (nothing to compare with 1)
- Results differ notably (repeat rate gap > 20%, OR attendance gap > 2x)

### Step 4: Feedback loop — evidence-based positioning updates

When the mirror shows a consistent pattern across 3+ events:
- "Your experiences with play + music average 3x the attendance of those without. Your rule break IS play. Does your positioning reflect that?"
- CTA: "Update positioning" → CreatorPositionCard
- CTA: "Design your next event with play" → experience creation

When delivery mode data accumulates:
- "Your top delivery modes by repeat rate: play (82%), ritual (71%), conversation (45%)"
- This feeds back into the Remarkable Flow vehicle selection: "your strongest vehicle is play, not conversation"

---

## Data Requirements

### New fields on `experiences` table
- `branch` text — AI-classified at creation, creator-editable
- `delivery_modes` text[] — multi-select: play, ritual, music, conversation, movement, ceremony, performance, digital
- `attendee_personas` text[] — creator-selected post-event (top 2 of 12 persona segments)

### Existing data used
- `remarkable_angles` — wound_problem, assumption, combination_insight, different, branch
- `narrative_builders` — vehicle_type
- Experience metrics — attendance (from attendee rows), repeat rate (computed), three_percent_note
- `useBranchScoring` — creator's primary branch + persona

### Edge function
- Reuse `classify-quest-skills` pattern for experience branch classification
- Same prompt: "These are experience creators. Branch = territory, not vehicle."

---

## Build Plan

| Step | What | Effort |
|------|------|--------|
| 1 | Add `branch`, `delivery_modes`, `attendee_personas` to experiences table | Migration, 2 min |
| 2 | AI-classify branch at experience creation (recommended tag, editable) | Low — reuse quest tagger |
| 3 | Delivery mode multi-select on experience creation form | Low — checkbox group |
| 4 | Post-event persona picker: "Who showed up?" (12 personas, pick 2) | Low — multi-select after event |
| 5 | Low-sales diagnostic: remarkable flow checklist triggered when sales < 50% capacity | Medium — new component, reads remarkable_angles + narrative_builders |
| 6 | Post-event mirror: compare results across events, surface patterns in delivery modes | Medium — new component, only when 2+ events with notable differences |
| 7 | Feedback loop: delivery mode patterns feed back to vehicle selection | Low — data display |

---

## What This Enables

1. **Low sales get a diagnosis, not just a number** — "Your marketing doesn't communicate your rule break" is actionable. "8 attendees" is not.
2. **Delivery modes reveal what works** — "Your events with play average 3x the attendance" is data the creator can't see without tracking modes.
3. **Positioning updates based on evidence** — "Your best events don't match your stated vehicle" triggers a positioning review, not a guess.
4. **Play as diagnostic** — Play is the Phase 3 principle. Tracking it as a delivery mode lets us test the hypothesis: do experiences with play outperform those without?
5. **The Remarkable Flow becomes a living tool** — not a one-time exercise but a diagnostic you return to when results don't match expectations.
