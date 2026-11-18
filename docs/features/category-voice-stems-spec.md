# Category Voice Stems + Category Statement Synthesis

**Status:** Design draft
**Date:** 2026-11-17
**Context:** Addition to voice stems flow (both workshop + onboarding), after Stage 4 essence reveal + avatar

## Position in Flow

Stage 1-4 (essence) → Essence Reveal → Avatar → **Category Stems (new)** → **Category Statement (new)** → 3 Nudges → Experience Game (onboarding only)

## Category Voice Stems (Stage 4b)

4 sentence completion stems, same voice format as stages 1-4. Speed is the point.

### Stems

```
1. "The problem I see that nobody else is solving right is..."
2. "Everyone assumes the answer is... but I think that's wrong because..."
3. "The experience that showed me a different way was..."
4. "If I could solve it my way, I would..."
```

### Why these work after essence reveal

The person just discovered their wound, prediction, and archetype. These stems aren't abstract business questions anymore. They're personal:

- Stem 1: Their wound IS the problem. They lived it.
- Stem 2: The conventional answer is the suppression pattern. The "wrong assumption" is the rule they made.
- Stem 3: Their essence recovery moment. When they broke the rule and something shifted.
- Stem 4: Their archetype in action. How they'd naturally solve it.

### Facilitator intro (workshop version)

> "You've just met yourself. Now let's find out what you're here to do. These next four stems connect who you are to the problem you're meant to solve. Same rules. Fast. Don't think."

## Category Statement Synthesis (AI)

After the 4 stems, send all data to Claude for synthesis.

### Input to AI

- Stage 1 results: energy, essenceSummary, patterns, mirror
- Stage 2 results: prediction, sourceEvent, rule, protectivePattern, wound, NS archetype
- Stage 3 results: dimension scores, lowest dimension
- Stage 4 results: primary + secondary archetype, essenceBlend, mirrorReveal
- Category stems: 4 raw transcripts

### AI Prompt (draft)

```
You are synthesizing a Category Statement for someone who just completed a deep self-discovery exercise.

They discovered:
- Childhood essence: {energy} - {essenceSummary}
- What shut it down: {prediction}, installed by {sourceEvent.who} at {woundStage}
- The rule they made: "{rule}"
- Their protective pattern: {protectivePattern}
- Their archetype: {primaryArchetype.name} ({essenceBlend})
- Their lowest dimension: {lowestDimension}

They then answered 4 category stems:
1. "The problem I see that nobody else is solving right is..." → {transcript1}
2. "Everyone assumes the answer is... but I think that's wrong because..." → {transcript2}
3. "The experience that showed me a different way was..." → {transcript3}
4. "If I could solve it my way, I would..." → {transcript4}

Synthesize a Category Statement that connects their essence to their category. This should feel like a revelation, not a business plan.

Return ONLY valid JSON:

{
  "categoryName": "2-4 words. The name of their category. Not a job title. A movement. E.g. 'Courage as Medicine', 'Play as Therapy', 'Movement as Freedom'",
  "categoryStatement": "3-4 sentences in second person. First: connect their wound to the problem they see. Second: name the wrong assumption and why they see through it (their experience). Third: how their archetype essence solves it differently. Fourth: one sentence that makes them feel like they were MADE for this. Max 80 words.",
  "connectionThread": "One sentence connecting their childhood essence to their category. E.g. 'The kid who couldn't stop moving became the person who teaches others that the body knows before the mind does.' Max 30 words.",
  "nudgeSuggestions": [
    "A specific action they could take this week based on their category + essence. Concrete, doable, slightly scary. E.g. 'Tell one person about the problem you see, without apologising for caring.'",
    "Second nudge, different angle",
    "Third nudge, different angle"
  ]
}

Rules:
- The categoryName should feel like something they'd put on a flag, not a LinkedIn headline
- The categoryStatement should make them emotional. This is the moment it all clicks.
- Use their actual words from ALL stages wherever possible
- The nudgeSuggestions should feel like dares, not homework
- NEVER use em dashes. Use periods, commas, or restructure.
```

## 3 Nudge Questions (Post-Category)

After the Category Statement reveal, show:

> "Three things you can do this week to honour this essence:"

Display the 3 AI-generated nudgeSuggestions as cards. User can tap to accept or edit each one. These become their first courage challenges if they sign up for the app.

## Summary Card (Session End)

Visual card with:
- Avatar image
- Archetype name + essenceBlend
- Category name + connectionThread
- 3 nudges

Shareable (screenshot-ready). This is the "receipt" of the session.

## Data Flow

```
Voice stems → process-stems (stage: 'category') → returns categoryName, categoryStatement, connectionThread, nudgeSuggestions
```

Add as stage 7 in process-stems edge function, or create a new `synthesize-category` edge function.

Recommendation: Add to process-stems as stage 7. Same pattern, same function, just a new prompt builder.

## Open Questions

1. Voice or text for category stems? Voice keeps the speed/bypass mechanic. Text lets them be more thoughtful. Could offer both.
2. Should the AI pre-populate suggested answers based on prior stages, then let the user confirm/edit? ("Based on what you shared, we think the problem you see is... is that right?")
3. Workshop vs onboarding: workshop might skip nudges (facilitator sets The Dare). Onboarding uses AI nudges.
