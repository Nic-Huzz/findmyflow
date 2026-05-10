# Task Brief: Skills & Problems Favouriting System

## Context

Life Map generates AI-clustered skills, problems, and personas from the user's life story responses. These are saved to `nikigai_clusters` (cluster_type: 'skills' | 'problems' | 'persona'). The /create Identity tab and Blow Up Your Brand flow both read from this table.

**The problem**: Life Map can produce 15-20 skill items and 10+ problem items. The /create Identity tab shows ALL of them as pills, making the list overwhelming (see screenshot). Users need a way to surface their top 5 most resonant skills and problems.

## What to Build

### 1. DB Migration
Add `is_favourite BOOLEAN DEFAULT FALSE` column to `nikigai_clusters`.

```sql
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS is_favourite BOOLEAN DEFAULT FALSE;
```

### 2. Life Map Curation Step
**File**: `src/flows/LifeMapFlow.jsx`

After the AI clustering reveal (the screen that shows "What You've Always Been Good At" + cluster cards), add a new screen:

**"Pick your top 5"** — for skills, then for problems.

UI: Show all cluster items as tappable pills. Tap to star (toggle `is_favourite`). Max 5 selections per category. Gold border on selected. Counter shows "3/5 selected".

The curation step should:
- Show skills first: "Which of these feel most like you right now? Pick up to 5."
- Then problems: "Which of these fire you up the most? Pick up to 5."
- Save: update `nikigai_clusters` rows with `is_favourite: true` for selected items
- Must work for both first-time completion AND returning users viewing saved results

**Important**: The Life Map reveal screen is at approximately line 860+. The current flow goes: processing → reveal (3 sections: skills, problems, personas) → connecting dots narrative → share card. Insert the curation AFTER reveal, BEFORE connecting dots.

### 3. CreatorHomeV2 Identity Tab
**File**: `src/components/CreatorHome/CreatorHomeV2.jsx`

Update the skills and problems queries to prefer favourites:

```javascript
// Skills query (line ~168)
supabase.from('nikigai_clusters')
  .select('cluster_label, is_favourite')
  .eq('user_id', userId)
  .eq('cluster_type', 'skills')

// In render: show favourites first, or only favourites if they exist
const displaySkills = userSkills.some(s => s.is_favourite)
  ? userSkills.filter(s => s.is_favourite)
  : userSkills
```

Same pattern for problems.

### 4. Blow Up Your Brand (RemarkableFlow.jsx)
**File**: `src/flows/RemarkableFlow.jsx`

The problems query at line 76 fetches `cluster_label`. Update to also fetch `is_favourite`:

```javascript
.select('cluster_label, is_favourite')
.eq('cluster_type', 'problems')
```

In the RULE_PICK step (line 321), show favourited problems first with a visual distinction, followed by the rest.

### 5. PlaySkillPicker Interaction
**File**: `src/components/PlaySkillPicker.jsx`

PlaySkillPicker saves with simple category-level items. These won't have `is_favourite` set. This is fine — favouriting is a Life Map feature. PlaySkillPicker items will show as non-favourited in the Identity tab, which is correct (they're category picks, not specific curated skills).

## Key Data Flow

```
Life Map → nikigai_clusters (cluster_type: 'skills'|'problems', step_id: null)
  → Curation step sets is_favourite: true on top 5
    → CreatorHomeV2 shows favourites only (if they exist)
    → Blow Up Your Brand shows favourites first in problem picker
    → PlayListTab unaffected (uses category IDs, not favourites)
```

## Key Files
- `src/flows/LifeMapFlow.jsx` — 1050+ lines, the curation step inserts after the reveal screen (~line 860)
- `src/components/CreatorHome/CreatorHomeV2.jsx` — Identity tab, skills/problems display (~line 290-310)
- `src/flows/RemarkableFlow.jsx` — Blow Up Your Brand, problem picker (~line 313-357)
- `src/components/PlaySkillPicker.jsx` — no changes needed, just context
- `public/data/problemTaxonomyV2.json` — 12 problem categories with placemakes

## Edge Cases
- User completes Life Map but skips curation → `is_favourite` stays false for all → Identity tab shows all items (current behaviour, graceful fallback)
- User returns to Life Map and re-runs it → old clusters are deleted and replaced → favourites reset, user picks again
- User has skills from PlaySkillPicker (step_id='get_started') AND Life Map (step_id=null) → only Life Map items can be favourited (PlaySkillPicker items don't go through curation)
- Cluster items are stored in `nikigai_clusters.items` array, not as individual rows per item. The `is_favourite` flag is on the CLUSTER row, not individual items within it. So "favouriting" means marking a cluster as favourite, which typically represents a theme like "Teaching & Explaining" containing 3-5 individual items.

## Design Notes
- Follow the existing Life Map styling (dark theme, gold accents, purple cards)
- The curation UI should feel like a celebration, not a task. "These patterns emerged from your whole life. Which ones feel most alive right now?"
- Max 5 per category is a suggestion, not a hard requirement. Could be 3-5. The goal is to reduce 15-20 items to a manageable set.
- The curation step should be skippable ("Show all" or "Skip for now")
