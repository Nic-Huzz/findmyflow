# Courage Challenge Fear Options — Design Decisions

## What was built

Replaced the old 3-step courage challenge flow (visibility layer → protective voice → healing) with a 2-step fear-based flow (fear selection → healing). Fear options are depth-specific and auto-tag the protective voice.

**Old flow:** depth → "What part pushes your boundary?" (screen/live/money/vulnerable/authority) → "What voice tries to stop you?" (5 voices) → healing prompt

**New flow:** depth → "What makes this scary?" (5 fear options per depth, voice auto-tagged) → [disambiguation if ambiguous] → healing prompt

## Three lenses explored

We identified three ways to frame "what makes this scary":

| Lens | Question | Example | Strength | Weakness |
|---|---|---|---|---|
| **Domain** (original) | What action pushes your boundary? | "Be known as exploring this" | Concrete, actionable | Doesn't capture the real fear |
| **Common fears** (attempt 1) | What makes this scary? | "Fear of being judged" | Emotionally resonant, universal | Generic, not depth-specific |
| **Protective voices** (attempt 2) | What's the voice saying? | "I'll be seen failing at something new" | Grounded in app's framework, developmental | Could feel clinical |

**Decision:** The voice-mapped options ARE the intersection of all three. Each fear statement is written in a voice's language, captures the real fear, and is specific to the depth level. One set of options, three data points extracted.

## Fear options by depth level

### Learning about it (education)

| Voice | Fear | Layer | Ambiguous? |
|---|---|---|---|
| 🎯 Perfectionist | I need to know everything before I start | vulnerable | Yes: Perfectionist or Controller |
| 👻 Ghost | I don't want people to know I'm searching | authority | No |
| 🪞 People Pleaser | People will think this is a phase | live | No |
| 🧱 Controller | I can't commit until I've researched every option | money | Yes: Controller or Perfectionist |
| 🤖 Auto-Pilot | I'll start this and abandon it like everything else | screen | No |

### Tried it / testing it (testing)

| Voice | Fear | Layer | Ambiguous? |
|---|---|---|---|
| 👻 Ghost | I'll be seen failing at something new | live | No |
| 🎯 Perfectionist | My first attempt won't be good enough | vulnerable | No |
| 🪞 People Pleaser | I'll have to explain why I'm doing this | live | No |
| 🧱 Controller | I can't let anyone see until it's polished | screen | Yes: Controller or Perfectionist |
| 🤖 Auto-Pilot | I tried it once, maybe that's enough | screen | No |

### Do it regularly (practising)

| Voice | Fear | Layer | Ambiguous? |
|---|---|---|---|
| 🧱 Controller | I need to manage how people see my progress | authority | No |
| 👻 Ghost | I'll outgrow my circle and end up alone | live | Yes: Ghost or People Pleaser |
| 🪞 People Pleaser | My growth is making people around me uncomfortable | live | No |
| 🎯 Perfectionist | I've plateaued and I'm not improving fast enough | vulnerable | No |
| 🤖 Auto-Pilot | I'm just going through the motions now | screen | No |

### Getting paid for this (charging)

| Voice | Fear | Layer | Ambiguous? |
|---|---|---|---|
| 🎯 Perfectionist | I'm not good enough to charge for this | money | Yes: Perfectionist or People Pleaser |
| 👻 Ghost | I'd rather give it away than face someone saying no | money | No |
| 🧱 Controller | I need the perfect offer before I can sell | money | Yes: Controller or Perfectionist |
| 🪞 People Pleaser | I'll price based on what they want to pay, not what it's worth | money | No |
| 🤖 Auto-Pilot | I'll just keep doing it for free, it's easier | money | No |

### Teaching / passing it on (teaching)

| Voice | Fear | Layer | Ambiguous? |
|---|---|---|---|
| 🎯 Perfectionist | Someone will ask something I can't answer | authority | No |
| 🧱 Controller | I need to control every outcome for my students | authority | No |
| 👻 Ghost | Being seen as an authority makes me a target | authority | No |
| 🤖 Auto-Pilot | I've been doing this so long I've lost the spark | vulnerable | No |
| 🪞 People Pleaser | I'll water down my teaching to keep everyone happy | live | No |

## Voice mapping accuracy

- **19/25 (76%) clean mapping** — fear auto-tags voice, no disambiguation needed
- **6/25 (24%) ambiguous** — user gets a one-tap "Which sounds more like you?" popup

Ambiguous pairs:
1. Perfectionist vs Controller (4 occurrences) — both use "preparation as avoidance" but for different reasons (shame vs control)
2. Ghost vs People Pleaser (1 occurrence) — "outgrowing your circle" could be pulling away OR fear of disrupting
3. Perfectionist vs People Pleaser (1 occurrence) — "not good enough to charge" could be imposter syndrome OR not wanting to burden

## Disambiguation descriptions

When the popup appears, each voice shows a one-line description:

| Voice | Description |
|---|---|
| Perfectionist | It's not ready yet, I need it to be perfect |
| Controller | I need to control every variable before I move |
| Ghost | I want to pull away before anyone notices |
| People Pleaser | I don't want to make anyone uncomfortable |
| Auto-Pilot | It's easier to just check out |

## Developmental fear story

The fears tell a story as users progress through depth levels:

- **Education:** Identity fears — am I allowed to be interested in this?
- **Testing:** Judgement fears — what if I'm seen failing as a beginner?
- **Practising:** Identity transition — the messy middle, outgrowing old circles
- **Charging:** Worthiness — am I valuable enough to charge?
- **Teaching:** Authority + imposter syndrome — can I be real in authority?

## Data storage

- `visibility_layer` (ENUM): stores the mapped layer value (screen/live/money/vulnerable/authority) for backward compat
- `visibility_layers` (text[]): stores the fear option ID (e.g. `charge_worth`) for precise tracking
- `protective_voice` on `healing_intentions`: stores the auto-tagged or disambiguated voice ID

## Alternative options explored but not built

### Common fears (attempt 1, universal, not depth-specific)

| Fear | Icon |
|---|---|
| Fear of being judged | 👀 |
| Fear of rejection | 🚫 |
| Fear of failing publicly | 😰 |
| Being seen or noticed | 🔦 |
| Asking for money | 💰 |
| Being vulnerable | 💜 |
| Feeling not ready or good enough | 🪞 |
| Risking conflict or disagreement | ⚡ |

These were rejected because they're generic and don't evolve by depth level. Good for a v0 but not grounded in the protective voices framework.

### Domain × Voice × Layer matrix

We explored whether all three dimensions (what action, which voice, which layer) could combine into a 3D picker. Rejected as over-complicated — the fear option IS the intersection of all three, extracted with one tap.

## V2 considerations

- Custom fear input ("Something else") for when none of the 5 options fit
- Fear frequency tracking — which fears come up most across all users
- Fear evolution — does someone's dominant voice change as they progress through depth levels?
- Linking fear data to healing flow outcomes — do certain fears resolve faster with certain healing approaches?
