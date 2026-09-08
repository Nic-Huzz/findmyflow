# Path Definition Flow: Narrative Redesign Spec

## Summary

Restructure the Path Definition flow (Screen 1 + Screen 2) to follow the Robbins x Dispenza leverage sequence. Voice moves earlier (after buts), identity becomes a reveal (not input), smallest step moves to last.

## Current Sequence (Screen 1: Framing → Screen 2: Commitment)

```
Screen 1:
  1. What does staying give you? (Life Fuels)
  2. What does this path give you? (Life Fuels)
  3. Buts → "I want to but..."
  4. "And" reframe

Screen 2:
  5. Smallest step
  6. Fear question → "If your buts win, what are you most afraid happens?"
  7. Identity → "I am someone who..." (free text input)
  8. Protective voice picker
```

## New Sequence

```
Screen 1: THE SHIFT
  1. What does staying give you? (Life Fuels - unchanged)
  2. What does this path give you? (Life Fuels - unchanged)
  3. Buts → "I want to but..." (unchanged)
  4. Voice → "Which voice is saying that?" (MOVED from Screen 2)
  5. "And" reframe → NOW includes voice name:
     "I want to [X] and my [Ghost] wants to hide"

Screen 2: THE COMMITMENT
  6. Fear → "If your buts win, what are you most afraid happens?" (unchanged)
  7. Identity REVEAL (CHANGED - no longer a text input):
     - Show user's superpower from Essence Mirror
     - Show user's vision_in_action from Essence Mirror
     - Attribute: "- The [Essence Name]"
  8. Smallest step → "What's the first thing the [Essence Name] does this week?"
     (MOVED to last position, reframed with essence name)
```

## What Changes in Code

### File: `src/flows/PathDefinitionFlow.jsx`

#### Screen 1 changes:

1. **Add voice picker after buts** (before reframe). Move the existing `VOICES` picker from Screen 2 to Screen 1, appearing after buts are entered.

2. **Update "and" reframe to include voice name.** Currently: `"I want to [but text] and [reframe]"`. New: `"I want to [goal] and my [Voice Name] wants to [voice sub]"`. Use the selected voice's `sub` field for the reframe text.

#### Screen 2 changes:

3. **Load essence data.** Fetch from `lead_flow_profiles` (latest by `created_at`) OR from archetype lookup via `user_stage_progress.essence_archetype` → `essenceArchetypes.js`. Need fields: `superpower`, `vision_in_action`, essence name.

4. **Replace identity text input with contrast + reveal.** After fear question, show two cards:

   **Card 1: The Protective Future (push)**
   ```
   When your [Ghost] leads:
   "[user's fear_outcome text]"
   ```
   
   **Card 2: The Essence Future (pull)**
   ```
   When the [Essence Name] leads:
   "[superpower text]"
   "[vision_in_action text]"
   ```
   
   The contrast between these two IS the leverage. The user sees both futures side by side. This is the value shift moment - they must want the essence future more than the protective safety.
   
   Below the reveal, show an editable pre-fill (not blank input):
   ```
   "I am someone who [superpower, simplified]"
   ```
   Pre-filled from essence data, but tappable to edit. This lets users who don't connect with the auto-text customise it, while most users just accept the reveal.

5. **Move smallest step to last.** After the identity reveal. Reframe the question: `"What's the first thing the [Essence Name] does this week?"` instead of `"What's the smallest step this week?"`.

6. **Update `canSave` gate.** Old: `stepText.trim() && fearText.trim() && identityText.trim() && voice`. New: `fearText.trim() && voice && stepText.trim() && identityText.trim()`. Identity text is pre-filled from essence but still required (editable).

7. **Save the identity.** `identity_declaration` saves whatever is in the (pre-filled or edited) identity input. Also save `essence_at_declaration` (the archetype name) so we can track if they later re-do Essence Mirror.

### Data source for essence:

```js
// Try blended (personalised) first, fall back to base archetype
const essenceFields = stageProgress.custom_essence_fields
const essenceName = stageProgress.custom_essence_name || stageProgress.essence_archetype

const superpower = essenceFields?.superpower 
  || ESSENCE_ARCHETYPES.find(a => a.name === essenceName)?.superpower
const visionInAction = essenceFields?.vision_in_action
  || ESSENCE_ARCHETYPES.find(a => a.name === essenceName)?.vision_in_action
```

### Edge case: no essence data

If user hasn't completed Essence Mirror, show a CTA instead of the reveal: "Discover your essence first" → link to `/essence-mirror`. The flow can still be completed without it (keep the old text input as fallback), but the reveal is the primary path.

## Voice Picker Position

The voice picker uses the same `VOICES` constant already defined in PathDefinitionFlow.jsx. It moves from Screen 2 to Screen 1, appearing after buts are entered and before the reframe.

The question changes from:
- Old: "Which voice tries to stop you from being that person?"
- New: "Which voice is saying that?"

This is simpler and connects directly to the buts they just named.

## Reframe Update

Current reframe shows buts with "and":
```
"I want to run events" → "I want to run events and I'm scared of rejection"
```

New reframe uses the user's ACTUAL but text + attributes it to the voice:
```
"Nobody will come. That's my Ghost talking."
"I'm not ready yet. That's my Perfectionist talking."
```

Format: `"[user's but text]. That's my [Voice Name] talking."`

For each but the user entered, append the voice attribution. This makes the reframe personal (their words) + conscious (named the pattern).

```js
const voiceName = VOICES.find(v => v.id === voice)?.label || 'voice'
const reframedButs = buts.map(b => `"${b}." That's my ${voiceName} talking.`)
}
```

## Design Notes

- Light theme throughout
- No em dashes in user-facing copy
- 12-year-old readable language
- Identity reveal card should feel like a "mirror moment" - pause, breathe, recognition
- Smallest step input should feel energised, not cautious (the essence framing does this)

## Related

- Obsidian: `Frameworks/Courage Narrative Engine.md`
- Obsidian: `Frameworks/Change Model Alignment - Robbins x Dispenza.md`
- Obsidian: `Frameworks/Leverage Questioning Patterns - Robbins x Dispenza.md`
- `src/data/essenceArchetypes.js` - superpower, vision_in_action fields
- `src/data/protectiveVoices.js` - canonical voice data
