# Tab Restructure + Wahoo Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the 7-day challenge tabs from `[Quests, Tune, Courage, Healing, Journey]` to `[Journey, Quests, Tune, Courage]` — merging Healing into Courage, reordering tabs, updating WahooCreator to capture depth + visibility, and enriching JourneyTab with life paths summary + Flow Map button.

**Architecture:** Four sequential tasks. Task 1 (tab reorder + Healing removal) is the structural change. Task 2 (WahooCreator cleanup) updates data capture. Task 3 (Courage tab healing inline) adds healing data to wahoo cards and moves the standalone healing input. Task 4 (JourneyTab enrichment) adds life paths + Flow Map. Each task produces a buildable, working app.

**Tech Stack:** React 18 + Supabase (PostgreSQL) + Vite

## Global Constraints

- Light theme throughout (background `#f5f5f0` or white, brand purple `#5e17eb`, gold `#E9A23B`)
- CSS scoped to parent prefix (e.g. `.wc-` for WahooCreator, `.plt-` for PlayListTab, `.jt-` for JourneyTab)
- PlayListTab styles live in `src/Challenge.css` (lines 3174+), prefixed `.playlist-tab .plt-`
- No em dashes in user-facing copy
- Write so a 12-year-old would understand
- Branch: `light-portal`
- `scary_score` and `wahoo_score` columns are referenced across many files (FeedCard, GroanMatrix, GroanCompletionModal, LibraryOfAnswers, checklistChallengeService, playlistFeedService, StrikeDesignFlow). **Do NOT drop these columns.** Just stop passing them from WahooCreator.
- `HealingIntentionsList.css` is shared by `QuestSelector.jsx` and `WahooDiscoveryFlow.jsx` (they import it for `qs-` styles). **Do NOT delete this CSS file.**

## File Map

```
MODIFY:
  src/hooks/useChallengeData.js        — categories array, TAB_TO_CATEGORY, remove healingSubTab
  src/Challenge.jsx                     — remove Healing tab render, remove HealingIntentionsList import, clean Healing refs
  src/components/level/LevelTab.jsx     — onNavigateTab('Healing') → 'Courage', button text
  src/components/Zarlo/ZarloChat.jsx    — tab=healing → tab=courage
  src/lib/zarlo/zarloPageContent.js     — tab=healing → tab=courage
  src/flows/ShadowWorkFlow.jsx          — tab=healing → tab=courage
  src/flows/HealingCompass.jsx          — tab=healing → tab=courage
  src/components/WahooCreator.jsx       — full rewrite: remove categories, add depth + visibility
  src/components/WahooCreator.css       — add depth + visibility styles
  src/lib/crm/groanChallengeService.js  — add depthLevel + visibilityLayers params
  src/components/PlayListTab.jsx        — remove category bubbles, add healing fetch + inline render + standalone input
  src/components/JourneyTab.jsx         — add life paths summary + Flow Map button
  src/components/JourneyTab.css         — styles for life paths + Flow Map button

CREATE:
  supabase/migrations/20260712100000_wahoo_depth_visibility.sql
```

---

### Task 1: Tab Reorder + Remove Healing Tab

**Files:**
- Modify: `src/hooks/useChallengeData.js`
- Modify: `src/Challenge.jsx`
- Modify: `src/components/level/LevelTab.jsx`
- Modify: `src/components/Zarlo/ZarloChat.jsx`
- Modify: `src/lib/zarlo/zarloPageContent.js`
- Modify: `src/flows/ShadowWorkFlow.jsx`
- Modify: `src/flows/HealingCompass.jsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `categories` array = `['Journey', 'Quests', 'Tune', 'Courage']`, all `?tab=healing` URLs redirect to Courage tab

- [ ] **Step 1: Change categories array**

In `src/hooks/useChallengeData.js`, line 140:
```javascript
// BEFORE:
const categories = ['Quests', 'Tune', 'Courage', 'Healing', 'Journey']

// AFTER:
const categories = ['Journey', 'Quests', 'Tune', 'Courage']
```

- [ ] **Step 2: Update TAB_TO_CATEGORY map**

In `src/hooks/useChallengeData.js`, around line 47:
```javascript
// BEFORE:
'healing': 'Healing',

// AFTER:
'healing': 'Courage',
```

- [ ] **Step 3: Remove healingSubTab state**

In `src/hooks/useChallengeData.js`:

Remove line ~120:
```javascript
const [healingSubTab, setHealingSubTab] = useState('daily')
```

Remove from the return object (lines ~1867-1868):
```javascript
healingSubTab,
setHealingSubTab,
```

- [ ] **Step 4: Remove Healing tab render + import from Challenge.jsx**

Remove the import (line 46):
```javascript
// DELETE:
import HealingIntentionsList from './components/HealingIntentionsList'
```

Remove the render block (lines ~1640-1643):
```javascript
// DELETE:
{/* Healing tab — per-task healing intentions */}
{activeCategory === 'Healing' && (
  <HealingIntentionsList userId={user?.id} />
)}
```

- [ ] **Step 5: Clean all Healing references in Challenge.jsx**

Remove the Healing tab unlock check (around line 350-352):
```javascript
// DELETE:
.select('id').eq('user_id', user.id).eq('quest_category', 'Healing').limit(1)
// and:
if (d?.length > 0) setUnlockedTabs(prev => new Set([...prev, 'Healing']))
```

Remove the `healingSubTab` destructuring from useChallengeData (lines ~132-134):
```javascript
// DELETE these from destructuring:
healingSubTab,
setHealingSubTab,
```

Update artifact exclusion (line ~1506):
```javascript
// BEFORE:
{artifactProgress && activeCategory !== 'Courage' && activeCategory !== 'Healing' && (() => {
// AFTER:
{artifactProgress && activeCategory !== 'Courage' && (() => {
```

Remove any remaining `activeCategory === 'Healing'` conditional blocks. The healing FREQUENCY filter logic (lines ~1258-1260) and healing frequency meta (line ~1517) can be removed since the tab no longer exists.

Keep scoring logic that references `quest.category === 'Healing'` (line ~801, ~821) — this is data-level scoring, not tab rendering.

Remove the `HealingSummary` conditional and its `onBack` to `'Healing'` (line ~1497):
```javascript
// Change:
onBack={() => setActiveCategory('Healing')}
// To:
onBack={() => setActiveCategory('Courage')}
```

- [ ] **Step 6: Update LevelTab — Healing → Courage**

In `src/components/level/LevelTab.jsx`:

Line 792:
```javascript
// BEFORE:
onClick={() => { setUnlockExplainer(null); onNavigateTab?.('Healing') }}
// AFTER:
onClick={() => { setUnlockExplainer(null); onNavigateTab?.('Courage') }}
```

Line 793 (text):
```javascript
// BEFORE:
Open Healing Tab →
// AFTER:
Open Courage Tab →
```

Line 962:
```javascript
// BEFORE:
onClick={() => onNavigateTab?.('Healing')}
// AFTER:
onClick={() => onNavigateTab?.('Courage')}
```

- [ ] **Step 7: Update all `?tab=healing` URLs to `?tab=courage`**

`src/components/Zarlo/ZarloChat.jsx` line 722:
```javascript
route: '/7-day-challenge?tab=courage'
```

`src/lib/zarlo/zarloPageContent.js` line 702:
```javascript
route: '/7-day-challenge?tab=courage'
```

`src/flows/ShadowWorkFlow.jsx` line 1028:
```javascript
onClick={() => navigate('/7-day-challenge?tab=courage')}
```

`src/flows/HealingCompass.jsx` line 1248:
```javascript
onClick={() => navigate('/7-day-challenge?tab=courage')}
```

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors. No unused import warnings for HealingIntentionsList.

- [ ] **Step 9: Manual test**

Open `/7-day-challenge`:
- Tabs show: Journey, Quests, Tune, Courage (in that order)
- Default tab = Tune
- No Healing tab visible
- Navigate to `?tab=healing` → lands on Courage tab
- Journey tab shows hero stage card (existing JourneyTab component)

- [ ] **Step 10: Commit**

```bash
git add src/hooks/useChallengeData.js src/Challenge.jsx src/components/level/LevelTab.jsx src/components/Zarlo/ZarloChat.jsx src/lib/zarlo/zarloPageContent.js src/flows/ShadowWorkFlow.jsx src/flows/HealingCompass.jsx
git commit -m "feat: tab restructure — Journey/Quests/Tune/Courage, Healing merged into Courage"
```

---

### Task 2: WahooCreator Cleanup — Depth + Visibility Capture

**Files:**
- Create: `supabase/migrations/20260712100000_wahoo_depth_visibility.sql`
- Modify: `src/components/WahooCreator.jsx` (full rewrite)
- Modify: `src/components/WahooCreator.css` (add depth + visibility styles)
- Modify: `src/lib/crm/groanChallengeService.js` (add new params)
- Modify: `src/components/PlayListTab.jsx` (remove `currentVisibilityLayer` prop from WahooCreator)

**Interfaces:**
- Consumes: `groan_challenges` table, `createGroanChallenge` function
- Produces: new `depth_level` and `visibility_layers` columns on `groan_challenges`, WahooCreator captures both

- [ ] **Step 1: Create migration**

Create `supabase/migrations/20260712100000_wahoo_depth_visibility.sql`:
```sql
-- Add depth level and visibility layers to groan_challenges
-- depth_level: L0-L4 scale (education/testing/practising/charging/teaching)
-- visibility_layers: multi-select array of visibility types

ALTER TABLE groan_challenges
  ADD COLUMN IF NOT EXISTS depth_level text
    CHECK (depth_level IS NULL OR depth_level IN ('education', 'testing', 'practising', 'charging', 'teaching')),
  ADD COLUMN IF NOT EXISTS visibility_layers text[] DEFAULT '{}';

-- Index for depth queries (used by Zarlo Brief + Insight Drops)
CREATE INDEX IF NOT EXISTS idx_groan_challenges_depth
  ON groan_challenges (user_id, depth_level)
  WHERE depth_level IS NOT NULL;

-- Note: scary_score, wahoo_score, and visibility_layer (singular) columns are
-- kept for backwards compatibility. They are referenced by FeedCard, GroanMatrix,
-- GroanCompletionModal, LibraryOfAnswers, checklistChallengeService,
-- playlistFeedService, and StrikeDesignFlow. Do not drop.
```

- [ ] **Step 2: Apply migration**

Run: `npm run db:push` or apply via Supabase dashboard SQL editor.

- [ ] **Step 3: Update createGroanChallenge params**

In `src/lib/crm/groanChallengeService.js`, the `createGroanChallenge` function starts at line 99. Add two new params to the destructuring:

```javascript
export async function createGroanChallenge(challengeData) {
  const {
    userId,
    title,
    description,
    visibilityLayer,
    sourceType,
    sourceId = null,
    sourceLabel = null,
    scaryScore = 5,
    wahooScore = 5,
    linkedContractId = null,
    generationPrompt = null,
    wahooCategory = null,
    depthLevel = null,
    visibilityLayers = [],
  } = challengeData
```

Then in the `.insert()` call (around line 117), add the two new fields after `wahoo_category`:
```javascript
      wahoo_category: wahooCategory,
      depth_level: depthLevel,
      visibility_layers: visibilityLayers,
```

- [ ] **Step 4: Rewrite WahooCreator.jsx**

Full replacement. Key changes from current:
- Quest link moved to step 2, made compulsory (was optional at step 3)
- Category buttons (Appearance/Creation/Connection) removed entirely
- Depth level (L0-L4) radio buttons added as step 3
- Visibility multi-select added as step 4 (examples adapt to depth)
- `scaryScore` and `wahooScore` no longer passed (keep defaults in service)
- `currentVisibilityLayer` prop removed (was hardcoded passthrough)

Write `src/components/WahooCreator.jsx`:

```javascript
/**
 * WahooCreator.jsx
 *
 * Wahoo creation for the Courage tab.
 * Flow: free text → quest link (compulsory) → depth level → visibility → submit.
 * Secondary path: "Choose from your list" → activate a queued bucket-list wahoo.
 *
 * CSS prefix: wc-
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import QuestSelector from './QuestSelector'
import './WahooCreator.css'

const DEPTH_LEVELS = [
  { id: 'education', label: 'Learning about it', icon: '📚' },
  { id: 'testing', label: 'Tried it / testing it', icon: '🧪' },
  { id: 'practising', label: 'Do it regularly', icon: '🔄' },
  { id: 'charging', label: 'Getting paid for this', icon: '💰' },
  { id: 'teaching', label: 'Teaching / passing it on', icon: '🎓' },
]

const VISIBILITY_EXAMPLES = {
  education: [
    { id: 'screen', label: 'Share what I\'m learning', icon: '📱' },
    { id: 'live', label: 'Attend a talk or class', icon: '👥' },
    { id: 'money', label: 'Invest in a course or book', icon: '💳' },
    { id: 'vulnerable', label: 'Admit I don\'t know yet', icon: '💜' },
    { id: 'authority', label: 'Let people know I\'m curious', icon: '🌟' },
  ],
  testing: [
    { id: 'screen', label: 'Share my first experience', icon: '📱' },
    { id: 'live', label: 'Go to a class or session', icon: '👥' },
    { id: 'money', label: 'Buy what I need to get started', icon: '💳' },
    { id: 'vulnerable', label: 'Tell someone I\'m a beginner', icon: '💜' },
    { id: 'authority', label: 'Be known as exploring this', icon: '🌟' },
  ],
  practising: [
    { id: 'screen', label: 'Share my journey so far', icon: '📱' },
    { id: 'live', label: 'Join regular practice groups', icon: '👥' },
    { id: 'money', label: 'Invest in going deeper', icon: '💳' },
    { id: 'vulnerable', label: 'Share my struggles', icon: '💜' },
    { id: 'authority', label: 'Be known as someone who does this', icon: '🌟' },
  ],
  charging: [
    { id: 'screen', label: 'Create a professional presence', icon: '📱' },
    { id: 'live', label: 'Run a paid session in person', icon: '👥' },
    { id: 'money', label: 'Set my price and stand by it', icon: '💳' },
    { id: 'vulnerable', label: 'Show my process, not just results', icon: '💜' },
    { id: 'authority', label: 'Be known as a professional', icon: '🌟' },
  ],
  teaching: [
    { id: 'screen', label: 'Create teaching content', icon: '📱' },
    { id: 'live', label: 'Train others in person', icon: '👥' },
    { id: 'money', label: 'Build revenue from teaching', icon: '💳' },
    { id: 'vulnerable', label: 'Teach honestly, including what I don\'t know', icon: '💜' },
    { id: 'authority', label: 'Be the go-to person', icon: '🌟' },
  ],
}

export default function WahooCreator({
  userId,
  bucketList = [],
  onWahooAccepted,
  onClose,
}) {
  const [step, setStep] = useState('freetext')
  const [freeText, setFreeText] = useState('')
  const [linkedQuestId, setLinkedQuestId] = useState(null)
  const [depthLevel, setDepthLevel] = useState(null)
  const [visibilityLayers, setVisibilityLayers] = useState([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const successTimerRef = useRef(null)

  useEffect(() => {
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current) }
  }, [])

  function toggleVisibility(id) {
    setVisibilityLayers(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  async function handleSubmit() {
    if (!freeText.trim() || !linkedQuestId || !depthLevel || generating) return
    setGenerating(true)
    setError(null)

    try {
      const { data: dbRecord, error: saveError } = await createGroanChallenge({
        userId,
        title: freeText.trim(),
        description: freeText.trim(),
        visibilityLayer: visibilityLayers[0] || 'screen',
        sourceType: 'skill',
        sourceLabel: 'Free text',
        depthLevel,
        visibilityLayers,
      })
      if (saveError || !dbRecord) throw saveError || new Error('Challenge was not saved')

      const { error: acceptError } = await acceptGroanChallenge(dbRecord.id)
      if (acceptError) throw acceptError

      await supabase.from('priority_weekly_picks').upsert({
        user_id: userId,
        week_start_date: getWeekStartLocal(),
        pick_type: 'groan',
        reference_id: dbRecord.id,
        display_name: freeText.trim(),
      }, { onConflict: 'user_id,week_start_date,pick_type,reference_id', ignoreDuplicates: true })

      if (linkedQuestId) {
        try {
          await supabase.from('quest_tasks').insert({
            quest_id: linkedQuestId,
            user_id: userId,
            text: freeText.trim(),
            is_courage_challenge: true,
            groan_challenge_id: dbRecord.id,
            sort_order: 0,
          })
        } catch (e) { /* non-blocking */ }
      }

      hapticSuccess()
      onWahooAccepted?.()
      setStep('success')
      successTimerRef.current = setTimeout(() => onClose?.(), 1500)
    } catch (err) {
      console.error('Accept Wahoo error:', err)
      setError('Failed to save. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="wc-container">
        <div className="wc-success">
          <div className="wc-success-icon">🔥</div>
          <p className="wc-success-text">Wahoo accepted!</p>
          <p className="wc-success-sub">Go make it happen.</p>
        </div>
      </div>
    )
  }

  if (step === 'fromlist') {
    return (
      <div className="wc-container">
        <button className="wc-back" onClick={() => setStep('freetext')}>← Back</button>
        <div className="wc-card">
          <h3 className="wc-card-title">Your Wahoo List</h3>
          <p className="wc-card-sub">Pick one to activate this week.</p>
          <div className="wc-suggestions-list">
            {bucketList.map(w => (
              <button
                key={w.id}
                className="wc-suggestion-card"
                onClick={async () => {
                  hapticLight()
                  setGenerating(true)
                  try {
                    await acceptGroanChallenge(w.id)
                    await supabase.from('priority_weekly_picks').upsert({
                      user_id: userId,
                      week_start_date: getWeekStartLocal(),
                      pick_type: 'groan',
                      reference_id: w.id,
                      display_name: w.title || w.challenge_text,
                    }, { onConflict: 'user_id,week_start_date,pick_type,reference_id', ignoreDuplicates: true })
                    hapticSuccess()
                    onWahooAccepted?.()
                    setStep('success')
                    successTimerRef.current = setTimeout(() => onClose?.(), 1500)
                  } catch (err) {
                    console.error('Accept from list error:', err)
                    setError('Failed to activate. Try again.')
                  } finally {
                    setGenerating(false)
                  }
                }}
                disabled={generating}
              >
                <div className="wc-suggestion-title">{w.title || w.challenge_text}</div>
              </button>
            ))}
          </div>
          {error && <p className="wc-error">{error}</p>}
        </div>
      </div>
    )
  }

  const visOptions = depthLevel ? VISIBILITY_EXAMPLES[depthLevel] : []
  const canSubmit = freeText.trim() && linkedQuestId && depthLevel && !generating

  return (
    <div className="wc-container">
      <div className="wc-header">
        <h3 className="wc-title">Add a Wahoo</h3>
        <p className="wc-explainer">Something you&apos;d love to do that scares you a little.</p>
      </div>

      <div className="wc-card">
        <h3 className="wc-card-title">What&apos;s the wahoo?</h3>
        <textarea
          className="wc-textarea"
          placeholder="I want to..."
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          rows={2}
        />

        <div className="wc-field-label">Which life path is this for?</div>
        <QuestSelector userId={userId} value={linkedQuestId}
          onChange={(id) => setLinkedQuestId(id)} />

        <div className="wc-field-label">Where are you with this?</div>
        <div className="wc-depth-options">
          {DEPTH_LEVELS.map(d => (
            <button
              key={d.id}
              className={`wc-depth-btn ${depthLevel === d.id ? 'selected' : ''}`}
              onClick={() => { hapticLight(); setDepthLevel(d.id); setVisibilityLayers([]) }}
            >
              <span className="wc-depth-icon">{d.icon}</span>
              <span className="wc-depth-label">{d.label}</span>
            </button>
          ))}
        </div>

        {depthLevel && (
          <>
            <div className="wc-field-label">What part pushes your boundary?</div>
            <div className="wc-vis-options">
              {visOptions.map(v => (
                <button
                  key={v.id}
                  className={`wc-vis-btn ${visibilityLayers.includes(v.id) ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); toggleVisibility(v.id) }}
                >
                  <span className="wc-vis-icon">{v.icon}</span>
                  <span className="wc-vis-label">{v.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {error && <p className="wc-error">{error}</p>}

        <button className="wc-cta" disabled={!canSubmit} onClick={handleSubmit}>
          {generating ? 'Saving...' : 'Submit'}
        </button>

        {bucketList.length > 0 && (
          <button
            className="wc-text-link"
            onClick={() => { hapticLight(); setError(null); setStep('fromlist') }}
          >
            Or choose from your list ({bucketList.length} waiting)
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Add depth + visibility CSS**

Append to `src/components/WahooCreator.css`:
```css
/* ── Depth + Visibility fields ── */
.wc-field-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.4);
  margin: 16px 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.wc-depth-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wc-depth-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
}

.wc-depth-btn.selected {
  border-color: #5e17eb;
  background: rgba(94, 23, 235, 0.04);
}

.wc-depth-icon { font-size: 1.1rem; }
.wc-depth-label { font-size: 0.9rem; font-weight: 500; color: #1a1a1a; }

.wc-vis-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wc-vis-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
}

.wc-vis-btn.selected {
  border-color: #E9A23B;
  background: rgba(233, 162, 59, 0.04);
}

.wc-vis-icon { font-size: 1rem; }
.wc-vis-label { font-size: 0.85rem; font-weight: 500; color: rgba(0, 0, 0, 0.6); }
```

- [ ] **Step 6: Update PlayListTab — remove currentVisibilityLayer from WahooCreator**

In `src/components/PlayListTab.jsx`, the WahooCreator is rendered around line 355 inside the modal. Remove the `currentVisibilityLayer` prop:

```javascript
// BEFORE:
<WahooCreator
  key={wahooCreatorKey}
  userId={userId}
  currentVisibilityLayer={currentVisibilityLayer}
  bucketList={Object.values(categoryWahoos).flat().filter(w => w.status !== 'completed' && !w.accepted_at)}

// AFTER:
<WahooCreator
  key={wahooCreatorKey}
  userId={userId}
  bucketList={Object.values(categoryWahoos).flat().filter(w => w.status !== 'completed' && !w.accepted_at)}
```

Note: `currentVisibilityLayer` prop is still used by `WahooDiscoveryFlow` and `WahooInspiration` in this same file. Do NOT remove it from PlayListTab's own props — only from the WahooCreator usage.

- [ ] **Step 7: Remove category bubble system from PlayListTab**

In `src/components/PlayListTab.jsx`, remove:

1. The `WAHOO_CATEGORIES` constant (line 23-27)
2. The `categoryWahoos` state and `fetchCategoryWahoos` function (lines ~55-78)
3. The `expandedBubble`, `quickAddText`, `quickAddSaving` state (lines ~56-57)
4. The `handleQuickAdd` function (lines ~114-136)
5. The `fetchCategoryWahoos()` call from the Promise.all (line ~103)
6. The entire `plt-expression-header` + `plt-category-bubbles` JSX block (lines ~268-337)

Keep:
- `fetchActiveChallenges` (still needed)
- `WahooDiscoveryFlow` (first-visit state still uses playskills check)
- `WahooInspiration` (still valid)
- `activeChallenges` state and rendering

After removal, the `hasCategoryWahoos` check (line ~230) for first-visit state needs updating. Change to only check playskills:

```javascript
// BEFORE:
const hasCategoryWahoos = Object.values(categoryWahoos).flat().length > 0
if (playskills.length === 0 && !hasCategoryWahoos) {

// AFTER:
if (playskills.length === 0 && activeChallenges.length === 0) {
```

Also update the bucket list passed to WahooCreator. Previously it used `categoryWahoos`. Now pass queued (generated, not accepted) wahoos directly:

```javascript
// BEFORE:
bucketList={Object.values(categoryWahoos).flat().filter(w => w.status !== 'completed' && !w.accepted_at)}

// AFTER:
bucketList={bucketListWahoos}
```

Add a new fetch for bucket list wahoos:
```javascript
const [bucketListWahoos, setBucketListWahoos] = useState([])

// In the Promise.all effect, add:
supabase.from('groan_challenges')
  .select('id, title, challenge_text, status, accepted_at')
  .eq('user_id', userId)
  .eq('status', 'generated')
  .is('accepted_at', null)
  .order('created_at', { ascending: false })
  .limit(20)
```

Then in the `.then()`:
```javascript
setBucketListWahoos(bucketListRes?.data || [])
```

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 9: Manual test**

Open Courage tab → "Add a Wahoo":
- Form shows: text → quest selector → depth (5 radio buttons) → visibility (multi-select, adapts to depth) → submit
- No category buttons (Appearance/Creation/Connection)
- Quest selector is required (submit disabled without it)
- Depth is required (submit disabled without it)
- Visibility is optional (submit works without it)
- After submit: wahoo appears in Active Wahoos list

- [ ] **Step 10: Commit**

```bash
git add supabase/migrations/20260712100000_wahoo_depth_visibility.sql src/components/WahooCreator.jsx src/components/WahooCreator.css src/lib/crm/groanChallengeService.js src/components/PlayListTab.jsx
git commit -m "feat: WahooCreator — depth L0-L4, visibility multi-select, categories archived"
```

---

### Task 3: Courage Tab — Inline Healing on Wahoo Cards + Standalone Input

**Files:**
- Modify: `src/components/PlayListTab.jsx` (add healing data fetch, inline render, standalone input, HealingFlowModal)
- Modify: `src/Challenge.css` (add `.plt-healing-*` and `.plt-blocking-*` styles)

**Interfaces:**
- Consumes: `healing_intentions` table (via `quest_tasks.groan_challenge_id` join), `HealingFlowModal` component, `QuestSelector` component
- Produces: Each active wahoo card shows its healing intention inline. "What's blocking you?" input at bottom of active section opens healing flow.

- [ ] **Step 1: Add imports to PlayListTab**

At the top of `src/components/PlayListTab.jsx`, add:
```javascript
import HealingFlowModal from './HealingFlowModal'
```

QuestSelector is already imported.

- [ ] **Step 2: Add healing state + data fetch**

After the existing state declarations in PlayListTab, add:

```javascript
// Healing data for inline display
const [healingByChallenge, setHealingByChallenge] = useState({})

// Standalone healing flow state (moved from HealingIntentionsList)
const [blockingText, setBlockingText] = useState('')
const [showBlockingQuestPicker, setShowBlockingQuestPicker] = useState(false)
const [blockingQuestId, setBlockingQuestId] = useState(null)
const [blockingTaskId, setBlockingTaskId] = useState(null)
const [showBlockingHealingModal, setShowBlockingHealingModal] = useState(false)
```

Add an effect to fetch healing intentions for active challenges:
```javascript
useEffect(() => {
  if (!userId || activeChallenges.length === 0) {
    setHealingByChallenge({})
    return
  }
  const challengeIds = activeChallenges.map(c => c.reference_id).filter(Boolean)
  if (!challengeIds.length) return

  supabase
    .from('quest_tasks')
    .select('groan_challenge_id, id, healing_intentions!quest_task_id(id, pattern, fear_text, origin_text, healing_stage, outcome, protective_voice, quest_task_id)')
    .in('groan_challenge_id', challengeIds)
    .not('groan_challenge_id', 'is', null)
    .then(({ data }) => {
      if (!data) return
      const map = {}
      data.forEach(qt => {
        const intentions = qt.healing_intentions || []
        const active = intentions.find(h => !h.outcome)
        if (active && qt.groan_challenge_id) {
          map[qt.groan_challenge_id] = { ...active, questTaskId: qt.id }
        }
      })
      setHealingByChallenge(map)
    })
}, [userId, activeChallenges.length])
```

- [ ] **Step 3: Update renderActiveWahoos with inline healing**

Replace the `renderActiveWahoos` function. Key addition: after each wahoo's name/meta, render inline healing if present. Also add a "Resume healing" link and a "Explore fear" button per card:

```javascript
function renderActiveWahoos() {
  return (
    <div className="plt-section-card">
      <div className="plt-section-header">
        <div className="plt-section-header-left">
          <span className="plt-section-icon">🔥</span>
          <span className="plt-section-title">Active Wahoos</span>
        </div>
        <span className="plt-section-count">{activeChallenges.length}</span>
      </div>
      <div className="plt-section-items">
        {activeChallenges.map(pick => {
          const isLoading = loadingChallengeId === pick.reference_id
          const healing = healingByChallenge[pick.reference_id]
          const hasActiveHealing = healing && !healing.outcome && healing.healing_stage

          return (
            <div key={pick.id || pick.reference_id} className="plt-item-row">
              <span className="plt-item-check"></span>
              <div className="plt-item-body">
                <div className="plt-item-name">{pick.display_name}</div>
                <div className="plt-item-meta">{pick._source_label || 'Courage'}</div>

                {hasActiveHealing && (
                  <div className="plt-healing-inline"
                    onClick={() => {
                      setBlockingTaskId(healing.questTaskId)
                      setBlockingText(pick.display_name)
                      setShowBlockingHealingModal(true)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="plt-healing-icon">💚</span>
                    <div className="plt-healing-body">
                      {healing.pattern && (
                        <div className="plt-healing-pattern">"{healing.pattern}"</div>
                      )}
                      {healing.protective_voice && (
                        <div className="plt-healing-voice">
                          {healing.protective_voice.charAt(0).toUpperCase() + healing.protective_voice.slice(1).replace(/_/g, ' ')}
                        </div>
                      )}
                      {healing.origin_text && (
                        <div className="plt-healing-origin">{healing.origin_text}</div>
                      )}
                      <div className="plt-healing-cta">
                        {healing.healing_stage === 'in_progress' ? 'Continue healing flow →' : 'View →'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                className="plt-item-action"
                disabled={isLoading}
                onClick={async () => {
                  setLoadingChallengeId(pick.reference_id)
                  const { data } = await supabase
                    .from('groan_challenges')
                    .select('*')
                    .eq('id', pick.reference_id)
                    .single()
                  setLoadingChallengeId(null)
                  if (data) setCompletingChallenge(data)
                }}
              >
                {isLoading ? '...' : 'I Did It!'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add standalone "What's blocking you?" input**

In the main return JSX, between `renderActiveWahoos()` and the "Add a Wahoo" button (around line 340), add:

```jsx
{/* What's blocking you? — standalone healing entry */}
<div className="plt-blocking-input">
  <div className="plt-blocking-row">
    <span className="plt-blocking-icon">💚</span>
    <input
      className="plt-blocking-field"
      type="text"
      value={blockingText}
      onChange={e => { setBlockingText(e.target.value); if (showBlockingQuestPicker) setShowBlockingQuestPicker(false) }}
      placeholder="What's blocking you right now?"
      onKeyDown={e => {
        if (e.key === 'Enter' && blockingText.trim()) setShowBlockingQuestPicker(true)
      }}
    />
    {blockingText.trim() && !showBlockingQuestPicker && (
      <button className="plt-blocking-go" onClick={() => setShowBlockingQuestPicker(true)}>
        Explore
      </button>
    )}
  </div>
  {showBlockingQuestPicker && (
    <div style={{ marginTop: 8 }}>
      <QuestSelector userId={userId} value={blockingQuestId}
        onChange={async (questId) => {
          if (!questId || !blockingText.trim()) return
          setBlockingQuestId(questId)
          const { data: task } = await supabase.from('quest_tasks').insert({
            quest_id: questId,
            user_id: userId,
            text: blockingText.trim(),
            is_courage_challenge: true,
            sort_order: 0,
          }).select('id').single()
          if (task) {
            setBlockingTaskId(task.id)
            setShowBlockingHealingModal(true)
            setShowBlockingQuestPicker(false)
          }
        }} />
    </div>
  )}
</div>
```

- [ ] **Step 5: Add HealingFlowModal at the bottom of PlayListTab render**

Before the closing `</div>` of the main return, after the GroanCompletionModal, add:

```jsx
{/* Healing flow modal (standalone or resume) */}
{showBlockingHealingModal && blockingTaskId && (
  <HealingFlowModal
    taskText={blockingText}
    userId={userId}
    questTaskId={blockingTaskId}
    onComplete={() => {
      setShowBlockingHealingModal(false)
      setBlockingText('')
      setBlockingTaskId(null)
      setBlockingQuestId(null)
      // Refresh healing data
      fetchActiveChallenges()
      onRefreshPoints?.()
    }}
    onClose={() => {
      setShowBlockingHealingModal(false)
      setBlockingText('')
      setBlockingTaskId(null)
    }}
  />
)}
```

- [ ] **Step 6: Add CSS for inline healing + blocking input**

Append to `src/Challenge.css` (inside the `.playlist-tab` scope, after the existing `plt-` styles around line 3520):

```css
/* ── Inline healing on wahoo cards ── */
.playlist-tab .plt-healing-inline {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.04);
  border: 1px solid rgba(16, 185, 129, 0.1);
}

.playlist-tab .plt-healing-icon {
  font-size: 0.8rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.playlist-tab .plt-healing-body {
  flex: 1;
  min-width: 0;
}

.playlist-tab .plt-healing-pattern {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.3;
  font-style: italic;
}

.playlist-tab .plt-healing-voice {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(16, 185, 129, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

.playlist-tab .plt-healing-origin {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.3);
  margin-top: 3px;
  line-height: 1.3;
}

.playlist-tab .plt-healing-cta {
  font-size: 0.75rem;
  font-weight: 600;
  color: #10b981;
  margin-top: 4px;
}

/* ── Standalone "What's blocking you?" ── */
.playlist-tab .plt-blocking-input {
  margin: 12px 0;
  background: white;
  border-radius: 14px;
  padding: 12px 14px;
  border: 1px dashed rgba(16, 185, 129, 0.2);
}

.playlist-tab .plt-blocking-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.playlist-tab .plt-blocking-icon { font-size: 1.1rem; opacity: 0.6; }

.playlist-tab .plt-blocking-field {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.85rem;
  color: #1a1a1a;
  background: transparent;
  font-family: inherit;
}

.playlist-tab .plt-blocking-field::placeholder {
  color: rgba(0, 0, 0, 0.25);
}

.playlist-tab .plt-blocking-go {
  padding: 6px 12px;
  border-radius: 10px;
  border: none;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 8: Manual test**

Open Courage tab:
- Active wahoos with healing intentions show green inline cards beneath the wahoo text
- Tapping the inline healing card opens HealingFlowModal to resume the flow
- "What's blocking you?" input appears below active wahoos
- Type text → "Explore" button appears → click → QuestSelector shows → pick quest → HealingFlowModal opens
- Completing healing flow refreshes the active challenges list

- [ ] **Step 9: Commit**

```bash
git add src/components/PlayListTab.jsx src/Challenge.css
git commit -m "feat: Courage tab — inline healing on wahoo cards + standalone blocking input"
```

---

### Task 4: JourneyTab — Life Paths Summary + Flow Map Button

**Files:**
- Modify: `src/components/JourneyTab.jsx`
- Modify: `src/components/JourneyTab.css`

**Interfaces:**
- Consumes: `quests` table, `quest_tasks` table, `life_path_sessions` table, `QuestPathMap` component
- Produces: JourneyTab shows life paths with predicted state + depth level, and a "View Flow Map" button that opens QuestPathMap with real data

- [ ] **Step 1: Add imports**

At the top of `src/components/JourneyTab.jsx`:
```javascript
import QuestPathMap from './level/QuestPathMap'
```

- [ ] **Step 2: Add state for life paths + Flow Map**

Add to the existing state declarations:
```javascript
const [lifePaths, setLifePaths] = useState([])
const [questTasks, setQuestTasks] = useState({})
const [trunkState, setTrunkState] = useState(null)
const [safety, setSafety] = useState(0)
const [careers, setCareers] = useState([])
const [showFlowMap, setShowFlowMap] = useState(false)
```

- [ ] **Step 3: Expand the data fetch**

Replace the existing `useEffect` with a more comprehensive fetch. The current one loads stage, voices, and brief. Add quests, quest_tasks, and life_path_sessions:

```javascript
useEffect(() => {
  if (!userId) return
  Promise.all([
    supabase.from('user_stage_progress')
      .select('current_journey_level')
      .eq('user_id', userId).maybeSingle(),
    supabase.from('healing_intentions')
      .select('protective_voice')
      .eq('user_id', userId)
      .not('protective_voice', 'is', null),
    supabase.from('zarlo_briefs')
      .select('brief')
      .eq('user_id', userId).maybeSingle(),
    supabase.from('quests')
      .select('id, label, status, predicted_state, depth_level')
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('label', 'Healing Work')
      .order('created_at'),
  ]).then(async ([stageRes, voiceRes, briefRes, questsRes]) => {
    setHeroStage(stageRes.data?.current_journey_level || 0)

    const counts = {}
    voiceRes.data?.forEach(row => {
      if (row.protective_voice)
        counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
    })
    setVoiceCounts(counts)
    setBrief(briefRes.data?.brief || null)

    const activeQuests = questsRes.data || []
    setLifePaths(activeQuests)

    // Fetch quest tasks for Flow Map
    if (activeQuests.length > 0) {
      const { data: allTasks } = await supabase
        .from('quest_tasks')
        .select('*')
        .in('quest_id', activeQuests.map(q => q.id))
        .order('sort_order')
      const taskMap = {}
      ;(allTasks || []).forEach(t => {
        if (!taskMap[t.quest_id]) taskMap[t.quest_id] = []
        taskMap[t.quest_id].push(t)
      })
      setQuestTasks(taskMap)
    }

    // Fetch trunk state from life_path_sessions
    const { data: sessionData } = await supabase
      .from('life_path_sessions')
      .select('current_state, safety, careers')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (sessionData) {
      setTrunkState(sessionData.current_state)
      setSafety(sessionData.safety || 0)
      setCareers(sessionData.careers || [])
    }

    setLoading(false)
  })
}, [userId])
```

Note: `life_path_sessions` may use `client_email` instead of `user_id` for the filter (see QuestMapPage.jsx line 31). Check the table schema. If it uses `client_email`, you need the user's email:
```javascript
// If life_path_sessions uses client_email:
const { data: userData } = await supabase.auth.getUser()
const email = userData?.user?.email
if (email) {
  const { data: sessionData } = await supabase
    .from('life_path_sessions')
    .select('current_state, safety, careers')
    .eq('client_email', email)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  // ...
}
```

- [ ] **Step 4: Add Life Paths summary + Flow Map button to render**

Insert after the voice progress section and before the stuck detection section:

```jsx
{/* Life Paths Summary */}
{lifePaths.length > 0 && (
  <div className="jt-section">
    <h3 className="jt-section-title">Your Life Paths</h3>
    <div className="jt-paths-list">
      {lifePaths.map(path => (
        <div key={path.id} className="jt-path-row">
          <span className="jt-path-dot" style={{
            background: path.predicted_state === 'vibe' ? '#c084fc'
              : path.predicted_state === 'peace' ? '#10b981'
              : path.predicted_state === 'anxious' ? '#f59e0b'
              : path.predicted_state === 'shutdown' ? '#ef4444'
              : '#d1d5db'
          }} />
          <span className="jt-path-name">{path.label}</span>
          {path.depth_level && (
            <span className="jt-path-depth">
              {path.depth_level === 'education' ? 'L0'
                : path.depth_level === 'testing' ? 'L1'
                : path.depth_level === 'practising' ? 'L2'
                : path.depth_level === 'charging' ? 'L3'
                : path.depth_level === 'teaching' ? 'L4'
                : ''}
            </span>
          )}
        </div>
      ))}
    </div>
    <button className="jt-flowmap-btn" onClick={() => setShowFlowMap(true)}>
      View Flow Map
    </button>
  </div>
)}

{/* Flow Map overlay */}
{showFlowMap && (
  <QuestPathMap
    quests={lifePaths}
    questTasks={questTasks}
    trunkState={trunkState}
    safety={safety}
    careers={careers}
    userId={userId}
    onUpdate={() => {
      // Refetch quests on update
      supabase.from('quests')
        .select('id, label, status, predicted_state, depth_level')
        .eq('user_id', userId).eq('status', 'active').neq('label', 'Healing Work')
        .order('created_at')
        .then(({ data }) => { if (data) setLifePaths(data) })
    }}
    onClose={() => setShowFlowMap(false)}
  />
)}
```

- [ ] **Step 5: Add CSS for life paths + Flow Map button**

Append to `src/components/JourneyTab.css`:

```css
/* Life Paths Summary */
.jt-paths-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.jt-path-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
}

.jt-path-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.jt-path-name {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
}

.jt-path-depth {
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(233, 162, 59, 0.7);
  background: rgba(233, 162, 59, 0.08);
  padding: 2px 8px;
  border-radius: 10px;
  letter-spacing: 0.5px;
}

/* Flow Map button */
.jt-flowmap-btn {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(94, 23, 235, 0.15);
  border-radius: 12px;
  background: rgba(94, 23, 235, 0.04);
  color: #5e17eb;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.jt-flowmap-btn:active {
  background: rgba(94, 23, 235, 0.08);
}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 7: Manual test**

Open Journey tab:
- Hero stage card shows (existing)
- Life paths list shows below with coloured dot (matching predicted_state), name, and depth badge (if set)
- "View Flow Map" button opens QuestPathMap overlay with real data (lines, dots, avatars)
- Closing Flow Map returns to Journey tab
- Voice progress dots still show (if applicable)
- Stuck detection still shows (if applicable)

- [ ] **Step 8: Commit**

```bash
git add src/components/JourneyTab.jsx src/components/JourneyTab.css
git commit -m "feat: JourneyTab — life paths summary with depth + state + Flow Map button"
```
