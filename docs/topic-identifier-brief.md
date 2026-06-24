# Play-List Topic Identifier — Build Brief

## Overview

After users identify their playskills via /get-started, they need **topics** (problems they care about) to make those playskills actionable. Playskills are the *how* (actions). Topics are the *what* (problems to apply them to). The combination creates specific, doable challenges.

Example: "Telling the story the room needs to hear" (playskill) + "Healing looks too serious" (topic) = "Tell the story the room needs to hear about why healing doesn't have to be heavy" (challenge).

## User Flow

```
Play-List tab (first visit, no topics saved)
  |
  v
"Identify Play-List Topics" CTA button
  |
  v
/identify-topics flow:
  Step 1: Copy prompt (user's playskills baked in dynamically)
  Step 2: Paste ChatGPT/Claude response
  Step 3: Parse structured output
  Step 4: Review extracted topics
  Step 5: Save to DB
  |
  v
Return to Play-List tab (now shows playskill cards)
  |
  v
Tap a playskill -> popup opens
  |
  v
Popup slide 1: "What topic will you cover?"
  - Matched (topics AI linked to this playskill)
  - Potential (other topics from extraction)
  - [ Identify your own... ] (free text input)
  |
  v
Popup slide 2: Challenge text + day picker
  (existing flow, visibility layer archived for now)
  |
  v
Challenge created
```

## The AI Prompt

Dynamically generated with the user's saved playskills from nikigai_clusters (step_id: 'get_started').

```
Analyze our entire conversation history. I want you to identify
the PROBLEMS and TOPICS I naturally gravitate toward.

Look for:
- What frustrates me about how things are done
- What I keep trying to fix or improve
- The people whose struggles I can't stop thinking about
- The broken systems I notice before anyone else

Only include problems where you can cite specific evidence from
our conversations. No generic observations.

For each problem, note which of my play-skills would naturally
apply to solving it:

MY PLAY-SKILLS:
- [dynamically inserted from user's saved playskills]
- [dynamically inserted from user's saved playskills]
- ...

Extract in this EXACT format:

---START EXTRACTION---

PROBLEMS
- PROBLEM: [Short name, under 10 words]
  DESCRIPTION: [One sentence expanding on the problem]
  EVIDENCE: [Specific quote or pattern from our conversations]
  MATCHED PLAY-SKILLS: [List the exact play-skill phrases that fit]

(aim for 5-7 problems, quality over quantity)

---END EXTRACTION---
```

## Parsing

Regex extraction matching:
- `PROBLEM: (.+)` — short label (under 10 words)
- `DESCRIPTION: (.+)` — one sentence expansion
- `EVIDENCE: (.+)` — quote from user's AI conversations
- `MATCHED PLAY-SKILLS: (.+)` — comma-separated list of exact playskill phrases

The matched playskills must string-match against the user's saved playskill cluster_labels in the DB. Any that don't match are dropped silently (ChatGPT may rephrase slightly).

## Data Storage

Save to existing `nikigai_clusters` table:

```
session_id: [from new flow_sessions row, flow_type: 'identify_topics']
user_id: [user id]
cluster_type: 'problems'
cluster_stage: 'final'
step_id: 'identify_topics'
cluster_label: [PROBLEM short name]
items: [{
  text: [PROBLEM short name],
  description: [DESCRIPTION],
  evidence: [EVIDENCE],
  matchedPlayskills: [
    "Telling the story the room needs to hear",
    "Shaping how a space or moment feels"
  ]
}]
```

Dedup on re-runs: delete existing rows with `step_id: 'identify_topics'` before inserting.

Must create a `flow_sessions` row first (flow_type: 'identify_topics') to satisfy the session_id FK constraint.

## Play-List Tab Changes

### Empty state (no playskills)
Route to /get-started. Text: "Find Your Flow First."

### Has playskills, no topics
Show "Identify Play-List Topics" CTA button. This is the entry point to /identify-topics.

### Has playskills AND topics
Show playskill cards as a list. Each card shows:
- Playskill text
- Number of matched topics
- Category icon

### Tap playskill -> popup

Slide 1: "What topic will you cover?"

**Matched** subheading — topics where `matchedPlayskills` array contains this playskill's cluster_label. These are the AI-validated matches.

**Potential** subheading — all other topics from the user's problem clusters that don't specifically match this playskill. The user might see a connection the AI didn't.

**Identify your own** — free text input at the bottom. User types a custom topic.

Slide 2: Challenge text + day picker (existing popup flow, visibility layer archived).

## Topic Matching Logic (client-side)

```javascript
// On playskill card tap:
const allTopics = userProblemClusters // from nikigai_clusters where cluster_type = 'problems'

const matched = allTopics.filter(t =>
  t.items[0]?.matchedPlayskills?.includes(selectedPlayskill.cluster_label)
)

const potential = allTopics.filter(t =>
  !t.items[0]?.matchedPlayskills?.includes(selectedPlayskill.cluster_label)
)
```

## Files to Create/Modify

### New files
- `src/flows/IdentifyTopicsFlow.jsx` — the copy/paste/parse/review flow
- `src/flows/IdentifyTopicsFlow.css` — styling (can reuse pso-* patterns from PlaySkillsOnboarding)

### Modified files
- `src/components/PlayListTab.jsx` — new empty states, playskill card list, topic picker in popup
- `src/components/MobilePlaylistPicker.jsx` — add topic selection as first step before challenge creation
- `src/AppRouter.jsx` — add /identify-topics route

## Design Notes

- Same copy/paste UX pattern as /get-started (proven, users understand it)
- No edge function needed for this flow (ChatGPT does the matching, we just parse)
- The prompt is dynamically built from the user's saved playskills, so it's always current
- If user redoes /get-started with different playskills, old topic matches may go stale. Acceptable for v1, the user can redo /identify-topics to refresh.
- No Pixar images on topic cards (they're problem statements, not aspirational actions)
- Visibility layer is archived — challenges skip straight to text + day picker

## Out of Scope

- AI-generated challenge text suggestions (future enhancement)
- Auto-refreshing topic matches when playskills change
- Problem wheel taxonomy mapping (topics stay as free-form labels)
- Voice input for topic identification
- Founder matching against topics
