---
name: sync
description: "Sync session progress to Vibe Rise. Creates tasks on quests, awards RP and skill XP, captures identity statements and protective voice evidence. Use at the end of a work session, or when the user says /sync."
---

# Sync Session Progress to Vibe Rise

## Overview

At the end of a Claude session, sync what the user accomplished back to their Vibe Rise self-knowledge graph. This creates tasks on quests, awards Rise Points, tracks skill XP, and captures identity statements and protective voice evidence.

The user's body signal (how work FELT while doing it) is the most important data point. Every sync feeds their Action Score and helps detect their personal monopoly.

## Process

### Step 1: Load the scoreboard (if not already loaded this session)

Call `get_interior_scoreboard` to get the user's current state. This gives you:
- Active quests with labels and skill_tags
- Unstarted life paths (careers without quests)
- Context mappings (directory/project to quest)
- The 10 skill taxonomy IDs
- Identity statements with reinforcement counts

If you already called `get_interior_scoreboard` earlier in this session, skip this step.

### Step 2: Identify the quest for this session

Check the `context_mappings` array for a mapping that matches the current working directory (Claude Code) or project folder (Claude Desktop).

**If a mapping exists:** Use the mapped quest. Tell the user which quest this session maps to.

**If no mapping exists:** Ask the user which quest this session's work belongs to. Show their active quests and unstarted life paths:

```
"I don't have a quest linked to this directory yet. Which one fits?

Your active quests:
1. Headset Rental Business (building, connecting)
2. Content Creation (storytelling, designing)

Unstarted life paths:
3. Retreat Design (predicted: fun)

4. Create a new quest
5. None of these, skip the sync"
```

If the user picks a quest, include `set_context_mapping` in the commit call so it persists.

### Step 3: Identify accomplishments

Review what happened in the session. Look for:
- Code written, features built, bugs fixed
- Content created (emails, posts, copy, documentation)
- Research completed, decisions made
- Conversations had, outreach done
- Designs created, wireframes built

**Do NOT include:**
- Routine git operations (commits, merges, branch management)
- File reads, config changes, typo fixes
- Browsing code without changing anything
- Asking Claude questions without producing output

If nothing meaningful was accomplished, say so: "Nothing to sync from this session." Don't force it.

### Step 4: Tag skills

For each accomplishment, tag 1-3 skills from the taxonomy:
`storytelling`, `teaching`, `coaching`, `performing`, `creating`, `building`, `designing`, `leading`, `connecting`, `speaking_up`

Match based on what the user DID, not what the task is about. "Wrote cold outreach emails" = connecting + storytelling. "Built a landing page" = building + designing.

### Step 5: Present the batch proposal and ask for state

Show all accomplishments at once. Ask how each felt WHILE DOING IT (not after).

```
"This session (mapped to 'Headset Rental Business'):

1. Built the landing page → building, designing
2. Wrote 3 venue outreach emails → connecting, storytelling

How did each feel while you were doing it?
(Vibe Rise / Fun / Stress / Boring)"
```

The user might respond in one message: "1 was Vibe Rise, 2 was stressful"

### Step 6: Collect depth data based on state

**If Vibe Rise:** Ask for an identity statement.
"Now that you built that landing page, you've proven you're someone who... (finish the sentence)"

The user might say "ships things" or "builds things that work." Capture just the verb/action part.

Also ask: "Did this work also feed any of your other quests?" (cross-pollination)

**If Stress:** Ask which voice showed up.
"What was the voice saying before you started the outreach emails?"
Options: controller, ghost, perfectionist, auto_pilot, people_pleaser

Common signs:
- Controller: "I need to control exactly how they respond"
- Ghost: "I don't want to be seen doing this"
- Perfectionist: "The emails aren't good enough yet"
- Auto-pilot: "I'll just go through the motions"
- People-pleaser: "What if they think I'm bothering them?"

**If Fun:** No extra questions needed. Optionally ask for an identity statement if it feels natural.

**If Boring:** No extra questions. Just note it.

### Step 7: Call commit_progress

Build the entries array from the confirmed accomplishments with states and depth data. Include `set_context_mapping` if this is a first-time directory mapping.

```json
{
  "entries": [
    {
      "quest_id": "uuid-from-scoreboard",
      "task_text": "Built landing page",
      "skill_tags": ["building", "designing"],
      "state": "vibe_rise",
      "identity_statement": "ships things that work"
    },
    {
      "quest_id": "uuid-from-scoreboard",
      "task_text": "Wrote venue outreach emails",
      "skill_tags": ["connecting", "storytelling"],
      "state": "stress",
      "protective_voice": "ghost"
    }
  ],
  "set_context_mapping": {
    "context_type": "claude_code_directory",
    "context_identifier": "/Users/nichuzz/creations/headset-rentals",
    "quest_id": "uuid-from-scoreboard"
  }
}
```

### Step 8: Report results conversationally

Use the response data to report like Zarlo (warm, specific, not generic praise).

**Always mention:** Total RP awarded, tasks synced.

**Mention if present in notable_evidence:**
- Skill level-ups: "Your building skill just hit L3 charging."
- RP level-up: "You just reached Vibe Rise level."
- Protective voice count: "That's the 13th time ghost has shown up. Always around speaking_up or connecting tasks."
- Days since lit_me_up: "It's been 5 days since something felt like Vibe Rise. Worth thinking about."
- Re-gen ready clusters: "Your 'digital products' cluster has enough evidence for a re-gen."
- Action score: "Your Action Score is now 55%. Getting closer to Self-Actualisation."

**Do NOT:**
- Give generic encouragement ("Great job!", "Keep going!")
- Lecture about scores or frameworks
- Suggest the user do something unless the data clearly points to it
- Use em dashes

**Example good response:**
"Synced 2 tasks to Headset Rental Business. +10 RP, +2 XP building, +1 XP connecting. Ghost showed up on the outreach emails, that's the 8th time. And your building skill just hit L2 practising."

## Edge Cases

**User has no quests at all:** "You don't have any quests yet. Quests come from the Life Paths exercise in the Vibe Rise app. Want to skip the sync for now?"

**User says nothing worth syncing:** "Nothing to sync. That's fine, not every session produces output."

**Cross-quest session:** If work spans multiple quests, split the entries. Ask per accomplishment if needed: "The landing page is clearly Headset Rental, but the outreach emails feel more like Retreat Design. Want to split them?"

**User wants to complete an existing task:** Check the quest's `uncompleted_tasks` from the scoreboard. If the accomplishment matches an existing task, use `complete_existing_task_id` instead of creating a new one.

## Matching Existing Tasks

Before creating a new task, check if any of the quest's `uncompleted_tasks` (from the scoreboard) match the accomplishment. For example:
- Accomplishment: "Built the landing page"
- Existing uncompleted task: "Build landing page" (id: "uuid")

If there's a match, use `complete_existing_task_id: "uuid"` to mark it done rather than creating a duplicate. This earns 3 RP (completion only) instead of 5 RP (creation + completion).
