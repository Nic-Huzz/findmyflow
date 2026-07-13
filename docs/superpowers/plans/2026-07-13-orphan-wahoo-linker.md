# Orphan Wahoo Linker — Popup Component

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-off popup component that lets users link orphaned wahoos (completed courage challenges not connected to a life path) to quests. Shows on the Journey tab when orphans exist. Self-dismisses when all are linked.

**Architecture:** Single task. New popup component + integration into JourneyTab. The popup replaces the current orphan section (the gold-bordered card listing orphans with a link to Quests tab).

**Tech Stack:** React 18 + Supabase + Vite

## Global Constraints

- Light theme (#f5f5f0, #5e17eb purple, #E9A23B gold)
- CSS prefix: `owl-` (Orphan Wahoo Linker)
- Branch: `light-portal`
- This is a ONE-OFF activity. Most users will never see this (only existing users with pre-quest wahoos). New users always link wahoos at creation (compulsory quest selector in WahooCreator). So keep it simple, don't over-engineer.

## Current State

JourneyTab currently shows orphaned wahoos as a static list with "Go to Quests tab to link these" CTA. The Quests tab has no linking functionality. The CTA is a dead end.

The orphan data is already fetched in JourneyTab (two-step query: completed wahoos - linked wahoo IDs = orphans). Stored in `orphanedWahoos` state.

## Data Flow

```
groan_challenges (completed, no quest_task link)
    → user picks a quest from QuestSelector
    → INSERT quest_tasks row: { quest_id, user_id, text: wahoo.title, is_courage_challenge: true, groan_challenge_id: wahoo.id }
    → wahoo disappears from orphan list
    → quest depth auto-bumps (copy WahooCreator pattern)
```

---

### Task 1: OrphanWahooLinker Component

**Files:**
- Create: `src/components/journey/OrphanWahooLinker.jsx`
- Create: `src/components/journey/OrphanWahooLinker.css`
- Modify: `src/components/JourneyTab.jsx` (replace orphan section with popup component)

**Interfaces:**
- Consumes: `orphanedWahoos` array (from JourneyTab parent), `userId`, `QuestSelector` component
- Produces: `quest_tasks` rows linking wahoos to quests. Calls `onLinked()` callback to refresh parent data.

- [ ] **Step 1: Create OrphanWahooLinker component**

Create `src/components/journey/OrphanWahooLinker.jsx`:

```javascript
/**
 * OrphanWahooLinker — One-off popup for linking orphaned wahoos to quests.
 * Shows inline QuestSelector per wahoo item. Item disappears after linked.
 * Auto-dismisses when all wahoos are linked or user closes.
 * CSS prefix: owl-
 */

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { hapticSuccess } from '../../lib/haptics'
import QuestSelector from '../QuestSelector'
import './OrphanWahooLinker.css'

const DEPTH_ORDER = { education: 0, testing: 1, practising: 2, charging: 3, teaching: 4 }

export default function OrphanWahooLinker({ wahoos, userId, onLinked, onClose }) {
  const [linkingId, setLinkingId] = useState(null) // which wahoo has quest selector open
  const [linkedIds, setLinkedIds] = useState(new Set())
  const [saving, setSaving] = useState(false)

  const remaining = wahoos.filter(w => !linkedIds.has(w.id))

  async function handleLink(wahoo, questId) {
    if (!questId || saving) return
    setSaving(true)

    try {
      // Create quest_task linking wahoo to quest
      await supabase.from('quest_tasks').insert({
        quest_id: questId,
        user_id: userId,
        text: wahoo.title || wahoo.challenge_text,
        is_courage_challenge: true,
        groan_challenge_id: wahoo.id,
        sort_order: 0,
        done: true, // already completed
      })

      // Auto-bump quest depth if wahoo has depth_level
      if (wahoo.depth_level) {
        const { data: quest } = await supabase
          .from('quests')
          .select('depth_level')
          .eq('id', questId)
          .single()
        if ((DEPTH_ORDER[wahoo.depth_level] ?? -1) > (DEPTH_ORDER[quest?.depth_level] ?? -1)) {
          await supabase
            .from('quests')
            .update({ depth_level: wahoo.depth_level })
            .eq('id', questId)
        }
      }

      hapticSuccess()
      setLinkedIds(prev => new Set([...prev, wahoo.id]))
      setLinkingId(null)

      // If all linked, notify parent
      if (remaining.length <= 1) {
        onLinked?.()
      }
    } catch (err) {
      console.error('Link wahoo error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (remaining.length === 0) return null

  return (
    <div className="owl-overlay" onClick={onClose}>
      <div className="owl-popup" onClick={e => e.stopPropagation()}>
        <button className="owl-close" onClick={onClose}>&times;</button>
        <h3 className="owl-title">Connect your wins</h3>
        <p className="owl-intro">
          These courage challenges aren't linked to a life path yet. Tap one to connect it.
        </p>

        <div className="owl-list">
          {remaining.map(w => (
            <div key={w.id} className="owl-item">
              <div className="owl-item-row" onClick={() => setLinkingId(linkingId === w.id ? null : w.id)}>
                <span className="owl-item-icon">⚡</span>
                <span className="owl-item-text">{w.title || w.challenge_text}</span>
                <span className="owl-item-arrow">{linkingId === w.id ? '▴' : '▾'}</span>
              </div>
              {linkingId === w.id && (
                <div className="owl-quest-picker">
                  <QuestSelector
                    userId={userId}
                    value={null}
                    onChange={(questId) => handleLink(w, questId)}
                  />
                  {saving && <span className="owl-saving">Linking...</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="owl-footer">
          <span className="owl-count">{remaining.length} remaining</span>
          <button className="owl-skip" onClick={onClose}>Do this later</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create OrphanWahooLinker CSS**

Create `src/components/journey/OrphanWahooLinker.css`:

```css
.owl-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

.owl-popup {
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 24px 20px;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.owl-close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.3);
}

.owl-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 6px;
}

.owl-intro {
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.45);
  margin: 0 0 16px;
  line-height: 1.4;
}

.owl-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.owl-item {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.owl-item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
}

.owl-item-row:active {
  background: rgba(0, 0, 0, 0.02);
}

.owl-item-icon {
  font-size: 0.9rem;
  flex-shrink: 0;
}

.owl-item-text {
  flex: 1;
  font-size: 0.85rem;
  color: #1a1a1a;
  font-weight: 500;
}

.owl-item-arrow {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.owl-quest-picker {
  padding: 0 14px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.owl-saving {
  font-size: 0.75rem;
  color: #E9A23B;
  font-weight: 600;
  display: block;
  margin-top: 4px;
}

.owl-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.owl-count {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.3);
}

.owl-skip {
  background: none;
  border: none;
  color: rgba(0, 0, 0, 0.35);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
```

- [ ] **Step 3: Integrate into JourneyTab**

In `src/components/JourneyTab.jsx`:

Add import:
```javascript
import OrphanWahooLinker from './journey/OrphanWahooLinker'
```

Add state:
```javascript
const [showOrphanLinker, setShowOrphanLinker] = useState(false)
```

Replace the existing orphan section (the `jt-orphan-section` block, ~lines 292-313) with:

```jsx
{/* Orphaned Wahoos — prompt to link */}
{orphanedWahoos.length > 0 && !showOrphanLinker && (
  <div className="jt-section jt-orphan-section">
    <h3 className="jt-section-title">Connect your wins to a life path</h3>
    <p className="jt-orphan-intro">
      You've done {orphanedWahoos.length} courage challenge{orphanedWahoos.length > 1 ? 's' : ''} not connected to a life path yet.
    </p>
    <button className="jt-orphan-cta" onClick={() => setShowOrphanLinker(true)}>
      Link them now →
    </button>
  </div>
)}

{/* Orphan Linker Popup */}
{showOrphanLinker && (
  <OrphanWahooLinker
    wahoos={orphanedWahoos}
    userId={userId}
    onLinked={() => {
      setShowOrphanLinker(false)
      setOrphanedWahoos([])
      // Refresh life paths data
      supabase.from('quests')
        .select('id, label, status, predicted_state, depth_level')
        .eq('user_id', userId).eq('status', 'active').neq('label', 'Healing Work')
        .order('created_at')
        .then(({ data }) => { if (data) setLifePaths(data) })
    }}
    onClose={() => setShowOrphanLinker(false)}
  />
)}
```

Also update the `jt-orphan-cta` CSS to be a button style (not a link):

In `src/components/JourneyTab.css`, the existing `.jt-orphan-cta` is already styled as a block button. Just make sure it has `cursor: pointer` and `border: none`:

```css
.jt-orphan-cta {
  display: block;
  width: 100%;
  text-align: center;
  padding: 10px;
  border-radius: 10px;
  background: rgba(233, 162, 59, 0.08);
  color: #E9A23B;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  margin-top: 12px;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Manual test**

Journey tab:
- Orphan section shows "Connect your wins to a life path" with count + "Link them now" button
- Tapping "Link them now" opens bottom sheet popup
- Each wahoo has a tap-to-expand QuestSelector
- Selecting a quest links the wahoo (creates quest_task row)
- Item disappears from list after linking
- "Do this later" closes the popup
- When all linked, popup auto-dismisses + section disappears
- Life paths data refreshes (depth may update)

- [ ] **Step 6: Commit**

```bash
git add src/components/journey/OrphanWahooLinker.jsx src/components/journey/OrphanWahooLinker.css src/components/JourneyTab.jsx src/components/JourneyTab.css
git commit -m "feat: OrphanWahooLinker — one-off popup to link orphaned wahoos to quests"
```
