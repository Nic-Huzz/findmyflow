# Creator Portal — Flow Architecture
*Three progressive flows inside the Creator Portal. April 2026.*

---

## The Progression

```
/experience-creators (onboarding gate)
  → Play-List match + business model pick
  → Enters Creator Portal

Creator Portal flows (progressive unlock):

  1. HOW TO PAY RENT NOW
     "How do I fund the early days?"
     Available: immediately

  2. HOW TO BLOW UP YOUR PERSONAL BRAND
     "What makes me impossible to ignore?"
     Available: after 2-3 experiences

  3. HOW TO SCALE YOUR INCOME
     "How do I build a real business from this?"
     Available: after traction (repeat attendees, consistent income)
```

The order IS the journey: **survive → get noticed → scale.**

---

## Flow 1: How to Pay Rent Now

### Purpose
Help experience creators choose a practical early revenue model. Not the dream business. The thing that pays rent while they build.

### When
Immediately after completing Experience Creator Matching. First thing they see in the Creator Portal.

### The Insight
Almost every successful experience creator had a day job or simple service income in the early years. The experience wasn't the revenue initially. It was the side project.

### 5 Early Revenue Models (from creator corpus analysis)

| Model | How it works | Creator examples |
|---|---|---|
| **Day job + side project** | Keep your income, build on the side. The experience is the evening/weekend project. | Ali Abdaal (doctor + YouTube), Marie Forleo (bartender + coaching) |
| **1:1 service** | Trade time for money, one client at a time. Use the sessions to learn what works. | Gabor Mate (physician), Priya Parker (facilitator), Esther Perel (therapist) |
| **Free events, paid elsewhere** | Give the experience free, monetize through a different channel (membership, products, grants). | Adriene Mishler (free YouTube + paid app), Myles Horton (free school + grants) |
| **Small group paid events** | Charge a modest fee, small room, repeat regularly. Revenue from volume of events. | Tony Robbins (hotel seminars), Dave Ramsey (church classes $10-50) |
| **Institutional salary** | An institution pays you to do the work. University, hospital, company, nonprofit. | Brene Brown (university), Phil Jackson (minor leagues), John Gottman (university) |

### Flow Structure (5 screens)

1. **Frame**: "Every creator you admire had a way to pay rent while building. Here are the 5 most common."
2. **The 5 models**: Show each with 1-line description + 2 creator examples. User picks the one closest to their current situation.
3. **What your pick looks like**: Based on their selection + their chosen archetype from matching, show a specific example. "You chose [Workshops] + [Small group paid events]. Here's what that looks like: Dave Ramsey charged $10/person to teach financial literacy in church classrooms every Saturday."
4. **Your number**: Simple calculator. "[X] people x [$Y] per event x [Z] events per month = $[total]." Help them see the math.
5. **Save + first action**: "Your first action: [specific to their model]." Save to profile.

### Data needed
- Early revenue model tags for each of the 59 creators (needs extraction)
- Simple calculator component
- Saves to user profile (chosen_revenue_model)

---

## Flow 2: How to Blow Up Your Personal Brand

### Purpose
Help experience creators identify their remarkable angle: the rule they break, the thing that makes people talk. Shift marketing from credential-listing to tribe-building.

### When
After 2-3 experiences completed. They have enough real-world experience to answer the questions honestly.

### The Insight
Attention doesn't come from being better. It comes from breaking a rule nobody questioned. The rule break creates a tribe of people who say "I believe this too." The tribe IS the distribution.

### Flow Structure (6 screens)

1. **Frame**: "The people you admire didn't become known by being better. They became known by breaking a rule nobody questioned. Let's find yours."
2. **Your wound reveals the rule**: Show their Life Map problems. "Which of these feels most personal?" Then: "What system or standard caused this?"
3. **Your background disproves it**: Show their life journey. "What would surprise people about your background relative to what you do now?"
4. **What do you do differently?**: "What does everyone in your field do that you think is backwards? What do you do instead?"
5. **Your one sentence**: AI (Sonnet) synthesizes into: rule statement + remarkable bio + tribe statement. User can edit.
6. **Save + apply**: Saves to profile. Pre-loads into experience marketing copy.

### Output
- Rule statement: "Healing doesn't need a therapist's office. It needs a room full of strangers willing to laugh."
- Remarkable bio: "A VC analyst who spent $30K on 52 courses and was still stuck. The thing that worked was dancing with strangers at sunrise."
- Tribe statement: "People who believe healing should be fun, communal, and accessible."

### Data needed
- Life Map responses (already in nikigai_clusters)
- Edge function: `generate-remarkable-angle` (Sonnet)
- DB table: `remarkable_angles`
- Full design doc: `docs/remarkable-flow-design.md`

---

## Flow 3: How to Scale Your Income

### Purpose
Help experience creators design a sustainable business model with multiple revenue layers. This is the 3-layer model (attraction/core/continuity) applied to their chosen archetype.

### When
After traction: repeat attendees, consistent income from Flow 1's model, confidence in their remarkable angle from Flow 2.

### The Insight
Every scaled experience creator has three layers: something free that builds trust (attraction), something paid that delivers transformation (core), something recurring that earns between events (continuity). The specific layers depend on their archetype.

### Flow Structure (6 screens)

1. **Frame**: "You've been paying rent and getting noticed. Now let's build the business model that scales."
2. **Your archetype recap**: Show their chosen archetype from matching. "You chose [Workshops & Training]. Here's how creators in this model scale."
3. **Attraction layer**: "What do you give away for free that builds trust?" Show archetype-specific options with creator examples.
4. **Core offer**: "What's the paid experience people come to you for?" Show archetype-specific options with pricing ranges.
5. **Continuity**: "What earns between events?" Show archetype-specific options (memberships, digital products, licensing).
6. **Your model summary + save**: Visual summary of all 3 layers. Save to profile. This becomes the "Product Suite" card in My Business tab.

### Data needed
- ARCHETYPE_OFFERS (already defined in ExperienceCreatorFlow.jsx)
- Per-creator revenue streams (in experienceCreatorOfferMap.json)
- Saves to `creator_assessments` or new `business_model` table

---

## Where They Live in the Portal

All three flows are accessible from the **My Business** tab in CreatorHome.

```
My Business tab:
  ┌─────────────────────────────────┐
  │ Where am I on my journey?       │  ← Scope Map position
  │ (The Stream/Lake/Waterfall/River)│
  ├─────────────────────────────────┤
  │ How to Pay Rent Now             │  ← Flow 1 (always visible)
  │ [Model chosen / Start flow]    │
  ├─────────────────────────────────┤
  │ How to Blow Up Your Brand       │  ← Flow 2 (unlocks after 2-3 experiences)
  │ [Remarkable angle / Start flow] │
  ├─────────────────────────────────┤
  │ How to Scale Your Income        │  ← Flow 3 (unlocks after traction)
  │ [3-layer model / Start flow]   │
  ├─────────────────────────────────┤
  │ How do I work best?             │  ← Play Profile (existing)
  │ [DNA result / Find Out]        │
  └─────────────────────────────────┘
```

### Progressive unlock logic

| Flow | Unlocked when | Shows when locked |
|---|---|---|
| Pay Rent Now | Always | — |
| Blow Up Your Brand | `experiences` count >= 2 | "Run 2 experiences first" |
| Scale Your Income | Has remarkable_angle saved AND experiences count >= 5 | "Find your remarkable angle first" |

---

## Build Order

1. **Flow 1: Pay Rent Now** — needs early revenue model extraction for 59 creators, simple flow + calculator
2. **Flow 2: Blow Up Your Brand** — needs edge function (Sonnet), Life Map integration, full design in `remarkable-flow-design.md`
3. **Flow 3: Scale Your Income** — needs ARCHETYPE_OFFERS wired into a flow with per-creator examples
4. **My Business tab update** — replace current cards with the 3-flow progressive layout

---

## Relationship to Other Frameworks

| Framework | Connection |
|---|---|
| **Marketing Sweet Spot** (Trust x Attention) | Flow 1 = builds trust (consistency). Flow 2 = builds attention (remarkability). Flow 3 = monetizes the diagonal. |
| **River System** (Stream/Lake/Waterfall/River) | Flow 1 = Lake users (need income while finding direction). Flow 2 = Waterfall users (found direction, need visibility). Flow 3 = River users (expanding from specificity). |
| **Play-List** | The play-list is constant across all 3 flows. What changes is how it's monetized (Flow 1), how it's marketed (Flow 2), and how it scales (Flow 3). |
