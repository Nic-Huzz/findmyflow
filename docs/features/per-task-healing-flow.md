# Per-Task Healing Flow

## Overview

Every courage-tagged task in a quest can have a healing flow attached. This replaces the standalone Healing tab exercises with contextual, task-anchored healing work.

**Core insight**: Courage (action despite fear) and Healing (removing the source of fear) are two sides of the same coin. Every courage challenge has a healing dimension.

## The Flow (7 steps)

### Step 1: The Pattern
"Which voice shows up around this task?"
- Ghost (hiding, avoiding being seen)
- Controller (overworking, micromanaging)
- Auto-Pilot (going through motions, checked out)
- Perfectionist (waiting until perfect, never shipping)

4 archetype cards with Pixar illustrations. Single select.

### Step 2: The Fear
"What's the worst thing that could happen if you [task]?"
Free text input. Pre-filled context from the quest/task.

### Step 3: The Origin
"Can you think of a time you first learned this wasn't safe?"
Free text with placeholder example: "When I was 12, I shared something I was proud of and..."

### Step 4: The Insight (auto-generated)
Connects past → present:
"When [origin event] happened, you felt [fear]. Your [pattern] was created to protect you from that happening again. But that was then. [Task] is now."

### Step 5: The Rewire
"What's true now that wasn't true then?"
Free text. Identity-level rewrite.

### Step 6: Go Deeper (optional, education + upsell)
Education: "Your mind now understands the pattern. But your nervous system still holds the original charge. Until the body releases it, the pattern will keep running. That's why somatic work creates shifts that thinking alone can't."

Options:
- Book a session with Huzz (Calendly)
- Self-guided release session ($49 download)
- Continue on my own

### Step 7: Expect the Best
"Now expect the best outcome. What does that look like?"
Free text. Flips the narrative from worst case (step 2) to best case.

## Post-Task Completion

When the user ticks the task as done on the quest card, the post-completion prompt asks:
"Did the positive outcome happen?"
- Yes
- No
- Something better

This creates a feedback loop: fear → action → reality check. Over time, builds evidence that the worst case rarely happens.

## Completion States

**Stage A: Recognised** (cognitive, free)
Steps 1-5 completed. Task shows 💚 with "recognised" badge.

**Stage B: Released** (somatic, paid/optional)
User marks "I did the release work" after session/breathwork/self-guided.
Task shows 💚 with "released" badge.

## Healing Tab Restructure

The Healing tab becomes a view of all active healing intentions across quests:
1. Header: "Removing what blocks your path"
2. Active healing intentions grouped by stage (recognised / released)
3. Weekly release CTA (Big Release / Session with Huzz / Self-guided)
4. Deep dives remain accessible via Quest tab "I need help with..." pills

## Data Model

`quest_tasks` gains:
- `healing_pattern` (text, nullable): ghost/controller/auto_pilot/perfectionist
- `healing_fear` (text, nullable): worst case text
- `healing_origin` (text, nullable): origin story
- `healing_rewire` (text, nullable): new belief
- `healing_expectation` (text, nullable): best case text
- `healing_stage` (text, nullable): 'recognised' | 'released'
- `healing_outcome` (text, nullable): 'yes' | 'no' | 'something_better'

Or alternatively, a separate `healing_intentions` table linked to `quest_task_id`.

## What moves where

| Current Healing Tab Item | New Location |
|---|---|
| Responded From Love/Fear | Tune tab (already there) |
| Expect Positive Outcome | Step 7 of per-task flow |
| Processing Emotions | Replaced by per-task flow |
| Nap/Sauna/Massage | Tune tab (Rest) |
| Environment Hygiene | Tune tab (Drains) |
| Trigger Pattern | Step 1 (Pattern) of per-task flow |
| Big Release | Step 6 option |
| Session with Huzz | Step 6 option |
| Healing Compass | "I need help with..." struggle pill |
| Limiting Belief Rewire | Merged into per-task flow |
| Matrix Codes | Struggle pill |
| Explainers | Tab header education |
