# Inline Voice Buttons Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Essence/Protective voice pill buttons directly under every "Start X" flow button on quest cards, so users can log voices without finding the hidden Voices tab.

**Architecture:** New self-contained `VoiceDropdown` component rendered inside `QuestCard.jsx` after the graduation note for flow-type quests. Component handles its own Supabase read/write for voice entries. Saves to existing `quest_completions` table with `quest_category: 'Healing'`.

**Tech Stack:** React 18, Supabase JS client, existing Challenge.css patterns

---

### Task 1: Create VoiceDropdown Component

**Files:**
- Create: `src/components/VoiceDropdown.jsx`
- Create: `src/components/VoiceDropdown.css`

**Step 1: Create `src/components/VoiceDropdown.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import './VoiceDropdown.css'

function VoiceDropdown({ questId, userId, projectId, userArchetypes }) {
  const [openType, setOpenType] = useState(null) // 'essence' | 'protective' | null
  const [essenceText, setEssenceText] = useState('')
  const [protectiveText, setProtectiveText] = useState('')
  const [essenceSaved, setEssenceSaved] = useState(false)
  const [protectiveSaved, setProtectiveSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const essenceName = userArchetypes?.essence || 'Essence'
  const protectiveName = userArchetypes?.protective || 'Protective'

  // Check for existing completions on mount
  useEffect(() => {
    if (!userId || !questId) return
    async function checkExisting() {
      const { data } = await supabase
        .from('quest_completions')
        .select('quest_id')
        .eq('user_id', userId)
        .in('quest_id', [
          `inline_voice_${questId}_essence`,
          `inline_voice_${questId}_protective`
        ])
      if (data) {
        data.forEach(row => {
          if (row.quest_id.endsWith('_essence')) setEssenceSaved(true)
          if (row.quest_id.endsWith('_protective')) setProtectiveSaved(true)
        })
      }
    }
    checkExisting()
  }, [userId, questId])

  const handleToggle = useCallback((type) => {
    setOpenType(prev => prev === type ? null : type)
  }, [])

  const handleSave = useCallback(async (type) => {
    const text = type === 'essence' ? essenceText : protectiveText
    if (!text.trim() || saving) return

    setSaving(true)
    const voiceQuestId = `inline_voice_${questId}_${type}`

    const { error } = await supabase
      .from('quest_completions')
      .insert([{
        user_id: userId,
        quest_id: voiceQuestId,
        quest_category: 'Healing',
        quest_type: 'recognise',
        points_earned: 3,
        challenge_instance_id: null,
        challenge_day: 0,
        project_id: projectId || null,
        stage: null,
        reflection_text: JSON.stringify({
          voice_type: type,
          source_quest: questId,
          archetype: type === 'essence' ? essenceName : protectiveName,
          text: text.trim()
        })
      }])

    setSaving(false)

    if (error) {
      console.error('Error saving voice:', error)
      return
    }

    if (type === 'essence') {
      setEssenceSaved(true)
    } else {
      setProtectiveSaved(true)
    }
    setOpenType(null)

    // Increment scores via RPC
    try {
      const now = new Date()
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      const weekStart = new Date(now.getFullYear(), now.getMonth(), diff)
      weekStart.setHours(0, 0, 0, 0)

      await supabase.rpc('increment_scores', {
        p_user_id: userId,
        p_project_id: null,
        p_category: 'healing',
        p_points: 3,
        p_week_start: weekStart.toISOString()
      })
    } catch (e) {
      console.warn('Score increment failed:', e)
    }
  }, [questId, userId, projectId, essenceText, protectiveText, essenceName, protectiveName, saving])

  return (
    <div className="voice-dropdown-section">
      <div className="voice-pill-row">
        <button
          className={`voice-pill essence ${openType === 'essence' ? 'active' : ''}`}
          onClick={() => handleToggle('essence')}
        >
          <span className={`voice-pill-dot ${essenceSaved ? 'filled' : ''}`} />
          <span className="voice-pill-icon">✨</span>
          <span className="voice-pill-label">{essenceName}</span>
          <svg className={`voice-pill-chevron ${openType === 'essence' ? 'open' : ''}`} width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className={`voice-pill protective ${openType === 'protective' ? 'active' : ''}`}
          onClick={() => handleToggle('protective')}
        >
          <span className={`voice-pill-dot ${protectiveSaved ? 'filled' : ''}`} />
          <span className="voice-pill-icon">🛡️</span>
          <span className="voice-pill-label">{protectiveName}</span>
          <svg className={`voice-pill-chevron ${openType === 'protective' ? 'open' : ''}`} width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {openType && (
        <div className={`voice-input-panel ${openType}`}>
          <div className="voice-input-prompt">
            {openType === 'essence'
              ? `What does your ${essenceName} say about this?`
              : `What is your ${protectiveName} saying?`}
          </div>
          <textarea
            className="voice-input-textarea"
            placeholder={openType === 'essence'
              ? 'I feel excited because...'
              : "I'm worried that..."}
            value={openType === 'essence' ? essenceText : protectiveText}
            onChange={(e) => openType === 'essence'
              ? setEssenceText(e.target.value)
              : setProtectiveText(e.target.value)}
            rows={3}
          />
          <div className="voice-input-actions">
            <button
              className={`voice-save-btn ${openType}`}
              onClick={() => handleSave(openType)}
              disabled={saving || !(openType === 'essence' ? essenceText.trim() : protectiveText.trim())}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceDropdown
```

**Step 2: Create `src/components/VoiceDropdown.css`**

```css
/* Voice Dropdown - inline on flow quest cards */

.voice-dropdown-section {
  margin-top: 0.75rem;
}

.voice-pill-row {
  display: flex;
  gap: 8px;
}

.voice-pill {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1.5px solid #e8e0f5;
  background: #faf8ff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  font-weight: 600;
  color: #5e17eb;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.voice-pill.protective {
  color: #d97706;
  border-color: #f5e6c8;
  background: #fffbf5;
}

@media (hover: hover) and (pointer: fine) {
  .voice-pill.essence:hover {
    background: #f0ebff;
    border-color: #c4b5fd;
  }
  .voice-pill.protective:hover {
    background: #fef3e0;
    border-color: #E9A23B;
  }
}

.voice-pill.active.essence {
  border-color: #5e17eb;
  background: #ede9fe;
}

.voice-pill.active.protective {
  border-color: #E9A23B;
  background: #fef3e0;
}

/* Status dot */
.voice-pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  opacity: 0.4;
  flex-shrink: 0;
}

.voice-pill-dot.filled {
  background: #22c55e;
  border-color: #22c55e;
  opacity: 1;
}

.voice-pill-icon {
  font-size: 14px;
  line-height: 1;
}

.voice-pill-label {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.voice-pill-chevron {
  flex-shrink: 0;
  transition: transform 0.2s;
}

.voice-pill-chevron.open {
  transform: rotate(180deg);
}

/* Dropdown panel */
.voice-input-panel {
  margin-top: 8px;
  padding: 12px;
  border-radius: 10px;
  animation: voiceSlideDown 0.2s ease;
}

@keyframes voiceSlideDown {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.voice-input-panel.essence {
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border: 1.5px solid #e0d6fe;
}

.voice-input-panel.protective {
  background: linear-gradient(135deg, #fffbf0 0%, #fef3e0 100%);
  border: 1.5px solid #fde6b3;
}

.voice-input-prompt {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.voice-input-panel.essence .voice-input-prompt {
  color: #5e17eb;
}

.voice-input-panel.protective .voice-input-prompt {
  color: #d97706;
}

.voice-input-textarea {
  width: 100%;
  border: 1.5px solid rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.7);
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  color: #333;
  outline: none;
  font-family: inherit;
  resize: none;
}

.voice-input-textarea:focus {
  border-color: #5e17eb;
  background: #fff;
}

.voice-input-panel.protective .voice-input-textarea:focus {
  border-color: #E9A23B;
}

.voice-input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.voice-save-btn {
  padding: 6px 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: #fff;
  transition: opacity 0.2s;
}

.voice-save-btn.essence {
  background: #5e17eb;
}

.voice-save-btn.protective {
  background: #E9A23B;
}

.voice-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Step 3: Verify files created**

Run: `ls -la src/components/VoiceDropdown.*`
Expected: Both `.jsx` and `.css` files exist.

**Step 4: Commit**

```bash
git add src/components/VoiceDropdown.jsx src/components/VoiceDropdown.css
git commit -m "feat: add VoiceDropdown component for inline voice entries on flow quests"
```

---

### Task 2: Wire VoiceDropdown into QuestCard

**Files:**
- Modify: `src/components/QuestCard.jsx`

**Step 1: Add import and new props**

At top of `QuestCard.jsx` (after line 27), add:

```jsx
import VoiceDropdown from './VoiceDropdown'
```

Add two new props to the QuestCard function signature:

```jsx
  // For inline voice dropdowns on flow quests
  userId,
  userArchetypes,
```

**Step 2: Render VoiceDropdown after graduation note**

After the graduation note block (line 615), before the completed state block (line 617), insert:

```jsx
      {/* Inline voice buttons for flow quests */}
      {quest.inputType === 'flow' && !completed && !locked && userId && (
        <VoiceDropdown
          questId={quest.id}
          userId={userId}
          projectId={selectedProject?.id}
          userArchetypes={userArchetypes}
        />
      )}
```

**Step 3: Commit**

```bash
git add src/components/QuestCard.jsx
git commit -m "feat: wire VoiceDropdown into QuestCard for flow-type quests"
```

---

### Task 3: Pass userId and userArchetypes from Challenge.jsx to QuestCard

**Files:**
- Modify: `src/Challenge.jsx`

**Step 1: Find where QuestCard is rendered**

Search for `<QuestCard` in Challenge.jsx. There will be one or more render sites. Add these props to each:

```jsx
userId={user?.id}
userArchetypes={userArchetypes}
```

The `user` object comes from `useAuth()` (already in scope in Challenge.jsx).
The `userArchetypes` state is already defined in Challenge.jsx (loaded from `user_stage_progress`).

**Step 2: Verify the props exist in scope**

Check that `user` and `userArchetypes` are both accessible at each QuestCard render site. They should be — `user` from `useAuth()` and `userArchetypes` from state.

**Step 3: Commit**

```bash
git add src/Challenge.jsx
git commit -m "feat: pass userId and userArchetypes to QuestCard for voice dropdowns"
```

---

### Task 4: Build and smoke test

**Step 1: Run the build**

Run: `npm run build`
Expected: No errors. Warnings are OK.

**Step 2: Run dev server and test**

Run: `npm run dev`

Manual test checklist:
- Navigate to 7-day challenge page
- Pick a Business stage tab with flow quests
- Verify: two pill buttons appear below each "Start X" button
- Verify: pills show archetype names (not "Essence"/"Protective" if user has archetypes set)
- Click Essence pill → dropdown opens with purple theme
- Click Protective pill → essence closes, protective opens with gold theme
- Click same pill again → closes
- Type text + Save → dot turns green, dropdown closes
- Refresh page → green dot persists (data was saved)
- Completed quests → no voice pills shown
- Locked quests → no voice pills shown

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: voice dropdown adjustments from smoke test"
```
