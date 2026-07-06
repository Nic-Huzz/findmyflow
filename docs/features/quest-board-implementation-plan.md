# Quest Board — Implementation Plan (v4, Staged)

## The hierarchy

```
Life Paths (all possible career directions you've mapped)
  └── Quests (the 1-3 you're actively pursuing right now)
       └── Tasks (concrete steps to progress the quest)
            └── some tasks tagged as Courage Challenges (brave/scary → appear in Courage tab)
```

---

## Stages overview

| Stage | What | Risk | Time | Shippable? |
|-------|------|------|------|-----------|
| 1 | Tab renames only | Zero — just strings | 30 min | ✅ Push to prod |
| 2 | Quest data model + basic quest cards | Medium — new tables, new component | 1 hour | ✅ Push to prod |
| 3 | Struggle pills | Low — additive, no existing code touched | 30 min | ✅ Push to prod |
| 4 | Zone assessments + milestones scroll | Medium — extracting from old Level tab | 45 min | ✅ Push to prod |
| 5 | Polish + edge cases | Low | 30 min | ✅ Push to prod |

Each stage is independently testable. If Stage 2 breaks, stages 3-5 wait. Nothing in a later stage depends on the previous stage being perfect.

---

## Stage 1: Rename only (30 min)

Zero functionality changes. Just strings.

### Changes

| What | From | To |
|------|------|----|
| Tab name | "Wahoo" | "Courage" |
| Tab name | "Level" | "Quests" |
| Tab order | Tune, Wahoo, Healing, Level | Quests, Tune, Courage, Healing |
| Default tab | Tune | Tune (unchanged) |

### Files

| File | Change |
|------|--------|
| `src/hooks/useChallengeData.js` | `categories = ['Quests', 'Tune', 'Courage', 'Healing']` |
| `src/Challenge.jsx` | All `'Wahoo'` → `'Courage'`, `'Level'` → `'Quests'` |
| `src/components/ChallengeHeader.jsx` | Tab display names |
| `src/components/level/LevelConfig.js` | `navigateTo: 'Wahoo'` → `'Courage'` |
| `src/components/level/DeepDiveCard.jsx` | `'Wahoo'` → `'Courage'` |
| `src/components/PlayListTab.jsx` | Fallback label |
| `src/components/TuneTab.jsx` | Boost category label |

### What stays unchanged

The Quests tab still renders the old LevelTab component. It just says "Quests" instead of "Level." This is intentional — Stage 2 replaces the content.

### Test

- All 4 tabs render with new names
- Tab switching works
- Default opens to Tune
- Courage tab shows the same content as old Wahoo tab
- Nothing broken

### Ship

Push to main. Deploy. Verify on prod.

---

## Stage 2: Quest data model + basic quest cards (1 hour)

The core build. Creates the quest system and replaces the top of the Quests tab.

### 2a. Database tables

```sql
create table quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  label text not null,
  career_id text,
  predicted_state text,
  status text default 'active',
  close_reason text,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table quest_tasks (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid references quests on delete cascade not null,
  user_id uuid references auth.users not null,
  text text not null,
  done boolean default false,
  is_courage_challenge boolean default false,
  groan_challenge_id uuid,
  stuck_point_id text,
  sort_order int default 0,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- RLS: users can only access their own
alter table quests enable row level security;
create policy "users_own_quests" on quests for all using (user_id = auth.uid());

alter table quest_tasks enable row level security;
create policy "users_own_quest_tasks" on quest_tasks for all using (user_id = auth.uid());
```

### 2b. Quest card component

New file: `src/components/QuestCard.jsx`

**Collapsed state:**
```
🔥 Dance Event Host
Vibe Rise · 2/4 tasks · ▾
```

**Expanded state:**
```
🔥 Dance Event Host
Vibe Rise · 2/4 tasks · ▴

☐ Find a venue
☐ Cold call 5 venues              ⚡
☐ Book first event                ⚡
✅ Design flyer

[Type a task...           ] [Add]
☐ Tag as courage challenge

                    [Close quest ›]
```

**Design review needed before coding.** Use `/frontend-design` to review the card component before building. Key decisions:
- Collapsed height and tap target
- Expanded transition (slide or instant)
- Courage toggle position (inline with input or below)
- Close quest flow (inline buttons or modal)
- State emoji size and color treatment
- Progress indicator (text "2/4" or mini bar)

### 2c. Quests tab top section

Replace the level selector and per-level quests with:

```
── Your Journey ──
📖 Life Map                [START]    ← moves to Completed when done
🗺️ Map Your Life Paths    [VIEW]    ← always stays
🦸 Hero Avatar             [VIEW]    ← disappears when done

── Your Active Quests ──
[Quest Card: Dance Event Host]
[Quest Card: Keynote Speaker]
[+ Add Quest]
"We recommend focusing on 1-3 quests at a time"
```

**Everything below Active Quests stays as the old Level tab content for now.** Stages 3-4 replace it. This means during Stage 2, the zone assessments and milestones still render from the old LevelTab code.

### 2d. Add Quest modal

```
┌──────────────────────────────────┐
│  Add a Quest                     │
│                                  │
│  What life path are you          │
│  pursuing?                       │
│  [________________________________]
│                                  │
│  What state does it trigger?     │
│  [😶 Uninterested] [😰 Pressure]│
│  [😌 Fun] [🔥 Vibe Rise]        │
│                                  │
│  [Add Quest]                     │
└──────────────────────────────────┘
```

On submit:
1. Create `quests` row
2. Add career to `life_path_sessions.careers[]` if not already there
3. Quest card appears in Active Quests

### 2e. Wire life paths flow

Update `LifePathWidgetTest.jsx` "Save & finish" to:
1. Check if `quests` row exists for the selected career
2. If not, create one
3. Create `quest_tasks` rows from wahoo steps
4. For courage-tagged tasks, create `groan_challenges` (existing logic)
5. Prevent duplicates: check `stuck_point_id` before creating tasks

### 2f. Close quest flow

Tap "Close quest" → modal:
```
┌──────────────────────────────────┐
│  Close "Dance Event Host"?       │
│                                  │
│  [🎉 I achieved it!]            │
│  [🤔 Lost interest]             │
│  [⏳ Not the right time]         │
└──────────────────────────────────┘
```

Sets `quests.status` + `close_reason`. Quest moves to Completed section.

### Test

- Add a quest manually via the modal
- Add a quest via the life paths flow
- Add tasks to a quest
- Tag a task as courage challenge → verify it appears in Courage tab
- Complete a task → verify progress updates
- Close a quest → verify it moves to Completed
- Refresh → verify all data persists

### Ship

Push to main. Deploy.

---

## Stage 3: Struggle pills (30 min)

Additive. No existing code modified.

### Add below Active Quests:

```
── I'm struggling with... ──
[🧭 Should I start my own thing?]
[😨 What created my fear?]
[🔮 I want subconscious shifts]
```

### Pill 1: 🧭 "Should I start my own thing?"
- Career Clarity Quiz (`/career-clarity`) — check: `hasCareerClarity`

### Pill 2: 😨 "What created my fear?"
- Origin Story (`/wound-map?returnTo=/7-day-challenge`) — check: `hasWoundMap`
- Matrix Codes (`/matrix-code-deep-dive`) — check: `hasFlowDeepDive['recognise_shadow_work']`
- NS Boundaries (`/nervous-system`) — check: `hasFlowDeepDive['nervous_system_map']`

### Pill 3: 🔮 "I want subconscious shifts"
- Healing Compass (`/healing-compass`) — check: `hasHealingCompass`
- Limiting Belief Rewire (`/limiting-belief-rewire`) — check: `hasFlowDeepDive['limiting_belief_rewire']`

### UX
- Only one pill open at a time
- Tap an open pill to close it
- Flow cards show completion status (✅ or Start)
- Reuse `DeepDiveCard` component

### Test

- Tap each pill → correct flows expand
- Tap different pill → swaps
- Completion states show correctly

### Ship

Push to main. Deploy.

---

## Stage 4: Zone assessments + milestones (45 min)

Replace the remaining old Level tab content.

### Zone Assessments: horizontal scroll

8 cards. All visible, no locks.

**Card (in scroll strip):**
```
┌────────────┐
│  1          │
│  Identity   │
│  ✅ or ○    │
└────────────┘
```

**On tap → modal:**
- Level name + question ("Who am I really?")
- Sweet Spot Graph (reuse `SweetSpotGraph` component)
- Zone descriptions (topLeft / diagonal / bottomRight)
- "Take Zone Diagnosis" button → `/zone-diagnosis/:level`
- Boss Fight info (reuse `BossFightCard` inline)
- Essence question

**Completion:** Check `user_level_progress` for zone selection at that level.

### Milestones: horizontal scroll

8 cards. Same scroll pattern.

**Card (in scroll strip):**
```
┌────────────┐
│  1          │
│  Identity   │
│  ○          │
└────────────┘
```

**On tap → modal:**
- Milestone text
- Commit / "I Did It" buttons (reuse existing logic)
- Reflection display if completed

**Completion:** Check `milestone_completions` table.

### Remove old code
- Level selector (0-8 number tabs)
- Per-level rendering logic
- Graduation logic
- CapacityCard from this tab (already on Tune)
- `courageCount` gating

### Test

- Swipe through zone cards
- Tap one → modal shows graph + diagnosis link
- Swipe through milestone cards
- Tap one → commit flow works
- No old level selector visible

### Ship

Push to main. Deploy.

---

## Stage 5: Polish + edge cases (30 min)

### Duplicate prevention
When re-entering `/life-paths` and saving wahoo steps for a career with an existing quest:
- Query existing `quest_tasks` by `quest_id`
- Skip creating tasks where `text` already matches
- Append genuinely new tasks

### Completed section
Bottom of quest board:
- Closed/completed quests (collapsible, default collapsed)
- Completed Life Map (if done, moved from Your Journey)
- Each shows status: "🎉 Achieved" or "🤔 Lost interest" or "⏳ Paused"

### Mobile responsive
- Quest cards full width
- Scroll strips have proper touch scrolling
- Modals are full-screen on mobile
- Struggle pills wrap on narrow screens

### CSS cleanup
- Remove unused Level tab styles
- Scope new styles with `.quest-board-` prefix

### Test
- Full flow: Life paths → Quest created → Tasks added → Courage tab shows courage challenges → Close quest → Completed section
- Mobile: all sections usable one-handed
- Returning user: data loads correctly

### Ship
Push to main. Deploy.

---

## What "done" looks like (after all 5 stages)

User opens `/7-day-challenge`. Lands on Tune. Tabs: Quests | **Tune** | Courage | Healing.

**Quests tab:** "Your Journey" shows Life Paths (View). Below: "Your Active Quests" — a Dance Event Host card (Vibe Rise, 2/4 tasks). They expand it, check off "Find a venue." Progress updates. They tap "+ Add Quest", type "Keynote Speaker", tag it Fun. New card appears.

They scroll to "I'm struggling with..." and tap "What created my fear?" Three flow cards expand. They start Origin Story.

Below: horizontal scroll of 8 zone assessment cards. They tap "Direction" — modal shows the Essence × Service graph. They take the zone diagnosis.

Below: horizontal scroll of 8 milestones. They commit to "Help one person with your essence this week."

**Courage tab:** Shows their 2 courage-tagged tasks from Dance Event Host + 1 from Keynote Speaker as active challenges this week.

**Healing tab:** Weekly intention suggestions pull from their stuck point reasons.

Three tabs, one data source, zero duplication.
