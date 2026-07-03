# Find Your Remarkable Angle — Flow Design
*Draft. April 2026. Lives inside Creator Portal, separate from Experience Creator Matching.*

---

## Purpose

Help experience creators identify what makes them remarkable (worth remarking on) so their marketing becomes tribe-building rather than credential-listing.

This flow runs AFTER they've completed Experience Creator Matching and have been creating experiences. It uses their Life Map data, their experience history, and the 6 rule-break sources to surface their remarkable angle.

## When it triggers

- Accessible from Creator Portal "My Business" tab (card: "Find your remarkable angle")
- Prompted after 2-3 experiences completed (enough data to work with)
- Can be retaken as their angle sharpens

## The Flow (6 steps)

### Step 1: The Setup
"The people you admire didn't become known by being better. They became known by breaking a rule nobody questioned. Let's find yours."

Short, punchy. Sets the frame: this isn't about credentials or skills. It's about what rule you're positioned to break.

### Step 2: Your Wound Reveals the Rule
*Source 1 from the 6 rule-break sources. Uses Life Map problems data.*

Show the user their top 3-5 problem entries from Life Map (across all periods).

Ask: **"Which of these feels most personal? The one that still makes you angry or sad when you think about it?"**

User taps one.

Then: **"What system or standard caused this? What 'rule' does the world follow that made this happen?"**

Free text. This IS the rule they're positioned to break.

Example: User selects "Real transformation is paywalled." They write: "Healing is only for people who can afford therapists and retreats."

### Step 3: Your Background Disproves It
*Source 4. Uses Life Map full biography.*

Show a condensed version of their life journey (key moments from each Life Map period).

Ask: **"What would surprise people about your background relative to what you do now?"**

Free text. This becomes the "authority paradox" or "biography disproves" element.

Example: "I spent $30K on 52 courses and was still stuck. The thing that actually worked was dancing with strangers."

### Step 4: What Do You Do Differently?
*Sources 3 and 5. Uses career + now Life Map data.*

Ask: **"What does everyone in your field do that you think is backwards? What do you do instead?"**

Free text. This surfaces the rule break in practical terms.

Example: "Everyone does healing one-on-one in serious settings. I do it in groups through play."

### Step 5: Your One Sentence
*Synthesizes steps 2-4 into a remarkable statement.*

AI (Sonnet) reads their 3 answers and generates:
- The rule they break (1 sentence)
- Their remarkable bio (the dinner party version)
- Their tribe statement ("People who believe...")

Show all three. User can edit/refine.

Example output:
- Rule: "Healing doesn't need a therapist's office. It needs a room full of strangers willing to laugh."
- Bio: "A VC analyst who spent $30K on 52 courses and was still stuck. The thing that worked was dancing with strangers at sunrise."
- Tribe: "People who believe healing should be fun, communal, and accessible."

### Step 6: Save + Apply

Save the remarkable angle to the user's profile. This data feeds:
- Experience marketing copy (via Zarlo)
- Event bio generation (via the remarkable bio prompt)
- The Marketing Sweet Spot position (they've now moved from "Kept Secret" toward the diagonal)

CTA: "Use this in your next experience" → links to ExperienceCreate with the remarkable bio pre-loaded as the "one-line promise" checklist item.

---

## Data Shape

```sql
create table remarkable_angles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  wound_problem text,
  rule_identified text,
  biography_surprise text,
  field_difference text,
  ai_rule_statement text,
  ai_remarkable_bio text,
  ai_tribe_statement text,
  created_at timestamptz default now()
);
```

Multiple rows per user (angle sharpens over time).

---

## Edge Function

`generate-remarkable-angle` — takes the 3 free-text responses + Life Map context, generates the rule statement, bio, and tribe statement. Uses Sonnet for quality.

Prompt structure follows the event bio prompt pattern: lead with rule break, follow with evidence, close with simple truth. Include the em dash prohibition.

---

## UX Notes

- 5-10 minutes to complete
- Each step is one screen with one question
- No back-and-forth AI conversation (that's Zarlo's job). This is a structured diagnostic.
- The output is EDITABLE. The AI generates, the user refines.
- Retakeable. Each retake creates a new row, so they can see their angle evolving.

---

## How It Connects to the Marketing Sweet Spot

| Before this flow | After this flow |
|---|---|
| User is in "Kept Secret" (high trust from doing the work, low attention) | User has identified their remarkable angle (the rule to break) |
| Marketing is credential-based ("I'm a breathwork facilitator") | Marketing is tribe-based ("Healing doesn't need a therapist's office") |
| Events are described by WHAT happens | Events are described by WHY they're different |

The flow doesn't move them all the way to the Marketing Sweet Spot. It gives them the ANGLE. The experience engine (creating and running events with this angle) is what builds the attention over time.

---

## Open Questions

1. Should Step 5 (AI synthesis) use the matched creators from Experience Creator Matching as reference points? "Your angle is similar to how Brene Brown broke the rule that researchers stay objective."
2. Should the tribe statement be shareable? "My tribe: people who believe healing should be fun." Screenshot-worthy?
3. Should this flow be gated behind a minimum number of experiences? Or available immediately?
