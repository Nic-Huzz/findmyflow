# Phase 1: Journey Onboarding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the new 4-beat story-driven onboarding flow at `/get-started`, replacing `PersonaAssessment` with Pixar scene cards and wound stage selections.

**Architecture:** `JourneyOnboarding` component (partially built on worktree `worktree-agent-a19f2653`) renders a full-screen purple gradient overlay. 4 beats: Hook → Story → Reframe → Promise. Selections stored in localStorage pre-auth, persisted to `journey_onboarding_selections` table post-auth via `persistJourneyOnboarding()`.

**Tech Stack:** React 18, React Router v7, Vite, Supabase (PostgreSQL + Auth), CSS transitions, localStorage.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/onboarding/JourneyOnboarding.jsx` | Merge from worktree + modify | Remove avatar beat (REVEAL), add REFRAME beat, update PROMISE beat, add image paths to WOUND_STAGES |
| `src/components/onboarding/JourneyOnboarding.css` | Merge from worktree + modify | Remove avatar CSS (~100 lines), add reframe + updated promise styles |
| `src/lib/journeyOnboarding.js` | Merge from worktree + modify | Remove `generatePendingAvatar`, `PHOTO_STORAGE_KEY`, avatar upload logic. Keep `persistJourneyOnboarding`, `hasPendingJourneyData`, `deriveArchetypePattern`. |
| `src/AppRouter.jsx` | Modify line 404 | Change `/get-started` from `<PersonaAssessment />` to `<JourneyOnboarding onSignUp={...} />` |
| `src/pages/MePage.jsx` | Modify (~line 82) | Add useEffect calling `persistJourneyOnboarding` after auth if pending data exists |
| `supabase/migrations/20260327000000_journey_onboarding.sql` | Merge from worktree, apply | Creates `journey_onboarding_selections` table, adds columns to `user_stage_progress` |
| `public/images/onboarding/*.png` | Already in place | 12 Pixar scene images |
| `public/tension-assessment-v2.json` | Create | New 3+1 tension questions (ships now, wired in Phase 2) |

---

### Task 1: Merge worktree and resolve conflicts

**Files:**
- Worktree: `.claude/worktrees/agent-a19f2653/`
- Target: main branch

- [ ] **Step 1: Check for divergence**

```bash
cd /Users/nichurrell/creations/Findmyflow
git log --oneline main..worktree-agent-a19f2653 | head -10
git log --oneline worktree-agent-a19f2653..main | head -10
```

First command shows worktree commits not on main. Second shows main commits not on worktree. If second has output, there will be merge work.

- [ ] **Step 2: Check for conflicting files**

```bash
git diff --name-only main worktree-agent-a19f2653
```

Expected output should include:
- `src/components/onboarding/JourneyOnboarding.jsx` (new)
- `src/components/onboarding/JourneyOnboarding.css` (new)
- `src/lib/journeyOnboarding.js` (new)
- `supabase/migrations/20260327000000_journey_onboarding.sql` (new)
- `src/components/onboarding/index.js` (modified)

If any of these files were also modified on main, note for conflict resolution.

- [ ] **Step 3: Merge**

```bash
git merge worktree-agent-a19f2653 --no-ff -m "feat: merge journey onboarding component from worktree"
```

If conflicts occur, resolve by keeping BOTH: the worktree's new files and any main-branch changes to shared files like `index.js`. Then:

```bash
git add -A
git commit -m "feat: merge journey onboarding component from worktree (conflicts resolved)"
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds. The new component files exist but aren't imported by any route yet, so no integration errors.

- [ ] **Step 5: Verify new files exist on main**

```bash
ls -la src/components/onboarding/JourneyOnboarding.jsx
ls -la src/components/onboarding/JourneyOnboarding.css
ls -la src/lib/journeyOnboarding.js
ls -la supabase/migrations/20260327000000_journey_onboarding.sql
```

Expected: All files present.

---

### Task 2a: Remove avatar state and handlers

Remove all avatar-related code from JourneyOnboarding.jsx. This is the first of three sub-tasks that modify the component.

**Files:**
- Modify: `src/components/onboarding/JourneyOnboarding.jsx`

- [ ] **Step 1: Update BEATS constant (around line 42)**

Change from:
```javascript
const BEATS = {
  HOOK: 'hook',
  STORY: 'story',
  REVEAL: 'reveal',
  PROMISE: 'promise',
}
```

To:
```javascript
const BEATS = {
  HOOK: 'hook',
  STORY: 'story',
  REFRAME: 'reframe',
  PROMISE: 'promise',
}
```

- [ ] **Step 2: Remove avatar state declarations (around lines 231-237)**

Remove these lines from the component function:
```javascript
  // Beat 3: Reveal
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)
```

And remove `fileInputRef`:
```javascript
  const fileInputRef = useRef(null)
```

Keep `autoAdvanceRef` (used by scene selection).

- [ ] **Step 3: Remove handleFileSelect function**

Search for `const handleFileSelect` and remove the entire function (handles file input change event for photo upload).

- [ ] **Step 4: Remove compressImage function**

Search for `function compressImage` or `const compressImage` and remove the entire function.

- [ ] **Step 5: Remove handleGenerateAvatar function (around lines 386-457)**

Remove the entire `handleGenerateAvatar` async function that handles photo upload and avatar generation.

- [ ] **Step 6: Update handleSignUp (around line 469)**

Change from:
```javascript
const handleSignUp = () => {
  const onboardingData = {
    stageSelections,
    avatarUrl,
    completedAt: new Date().toISOString(),
  }
```

To (remove `avatarUrl`):
```javascript
const handleSignUp = () => {
  const onboardingData = {
    stageSelections,
    completedAt: new Date().toISOString(),
  }
```

- [ ] **Step 7: Update all references from BEATS.REVEAL to BEATS.REFRAME**

Search for `BEATS.REVEAL` throughout the file and replace with `BEATS.REFRAME`. This includes:
- Navigation logic in `handleStoryNext` (when last stage is selected, transition to REFRAME instead of REVEAL)
- Any beat progress dot logic

- [ ] **Step 8: Verify build**

```bash
npm run build
```

Expected: May fail because the REVEAL beat's JSX still references removed state. That's fine — Task 2b replaces it.

- [ ] **Step 9: Commit**

```bash
git add src/components/onboarding/JourneyOnboarding.jsx
git commit -m "refactor: remove avatar generation state and handlers from onboarding"
```

---

### Task 2b: Add Reframe beat JSX

Replace the old Reveal beat JSX with the new Reframe beat.

**Files:**
- Modify: `src/components/onboarding/JourneyOnboarding.jsx`

- [ ] **Step 1: Find and remove the REVEAL beat JSX**

Search for the block that renders when `currentBeat === BEATS.REVEAL` (or now `BEATS.REFRAME` after Task 2a). It will contain file input, photo preview, generating state, avatar display, and error state. Remove the entire conditional block.

- [ ] **Step 2: Add the Reframe beat JSX**

In the same location, add:

```jsx
{currentBeat === BEATS.REFRAME && (
  <div
    className={`journey-onboarding jo-reframe ${transitionClass} ${directionClass}`}
  >
    <div className="jo-ambient">
      <div className="jo-glow jo-glow-1 jo-glow-gold" />
      <div className="jo-glow jo-glow-2" />
    </div>

    {renderBeatProgress()}

    <div className="jo-reframe-content">
      <div
        className="jo-reframe-center"
        onClick={() => transitionTo(setCurrentBeat, BEATS.PROMISE, 'right')}
      >
        <h2 className="jo-reframe-text">
          What if you could build a life that fits who you actually are, not who you were told to be?
        </h2>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/JourneyOnboarding.jsx
git commit -m "feat: add reframe beat to onboarding (replaces avatar reveal)"
```

---

### Task 2c: Update Promise beat JSX

Update the Promise beat to remove avatar references and use the new clean copy.

**Files:**
- Modify: `src/components/onboarding/JourneyOnboarding.jsx`

- [ ] **Step 1: Find the PROMISE beat JSX**

Search for `currentBeat === BEATS.PROMISE`. The current version shows the avatar (if generated) or a placeholder emoji. Replace the content inside the promise wrapper:

- [ ] **Step 2: Replace Promise content**

Keep the outer wrapper (with transition classes, ambient glow, beat progress). Replace the inner content:

```jsx
<div className="jo-promise-content">
  <div className="jo-promise-icon">🌊</div>
  <h2 className="jo-promise-heading">That's what FindMyFlow is for.</h2>
  <p className="jo-promise-subtext">Your journey starts here.</p>
  <button className="jo-cta-button" onClick={handleSignUp}>
    <span className="jo-shimmer-layer" />
    Start My Journey
    <span className="jo-btn-arrow">&#8594;</span>
  </button>
</div>
```

- [ ] **Step 3: Remove the hidden file input**

Search for `<input type="file"` and remove it (was used for avatar photo upload). Also remove any `accept="image/*"` input element.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds. No references to removed avatar state remain.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/JourneyOnboarding.jsx
git commit -m "feat: update promise beat with clean sign-up CTA"
```

---

### Task 3: Update CSS

Remove avatar CSS, add reframe styles.

**Files:**
- Modify: `src/components/onboarding/JourneyOnboarding.css`

- [ ] **Step 1: Remove avatar-related CSS**

Search for and remove all CSS rules matching these patterns:
- `.jo-reveal` and all nested selectors (`.jo-reveal .jo-reveal-content`, etc.)
- `.jo-upload-*` classes
- `.jo-photo-*` classes
- `.jo-avatar-*` classes
- `.jo-generating-*` classes
- `.jo-error-*` classes
- `@keyframes jo-avatarReveal` or similar avatar animations
- `.jo-promise-avatar` and related avatar display in promise

- [ ] **Step 2: Add reframe CSS**

Add after the story beat styles:

```css
/* ═══════════════════════════════════════════════════════════════
   BEAT 3: REFRAME
   ═══════════════════════════════════════════════════════════════ */

.jo-reframe {
  justify-content: center;
}

.jo-reframe .jo-reframe-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 24px;
}

.jo-reframe .jo-reframe-center {
  cursor: pointer;
  max-width: 340px;
}

.jo-reframe .jo-reframe-text {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--jo-gold);
  text-align: center;
  line-height: 1.4;
  letter-spacing: -0.3px;
  animation: jo-fadeInUp 0.8s ease;
}
```

- [ ] **Step 3: Update promise styles**

Find `.jo-promise .jo-promise-avatar` and related avatar display styles. Remove them. Add/update:

```css
.jo-promise .jo-promise-icon {
  font-size: 2.5rem;
  margin-bottom: 24px;
  animation: jo-fadeInScale 0.6s ease;
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Clean build.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/JourneyOnboarding.css
git commit -m "style: remove avatar CSS, add reframe beat styles"
```

---

### Task 4: Add Pixar images to scene cards

Update WOUND_STAGES to include image paths and update the scene card rendering.

**Files:**
- Modify: `src/components/onboarding/JourneyOnboarding.jsx`
- Modify: `src/components/onboarding/JourneyOnboarding.css`

- [ ] **Step 1: Add image property to each scene in WOUND_STAGES**

Add `image` field to each of the 12 scene objects in the WOUND_STAGES constant (around lines 57-207). Keep existing `color` and `icon` as fallbacks.

Stage 1 scenes:
```javascript
{ id: 'overwhelmed_child', ..., image: '/images/onboarding/stage1-overwhelmed.png' },
{ id: 'secure_base', ..., image: '/images/onboarding/stage1-secure.png' },
{ id: 'invisible_child', ..., image: '/images/onboarding/stage1-invisible.png' },
```

Stage 2 scenes:
```javascript
{ id: 'rejected_self', ..., image: '/images/onboarding/stage2-rejected.png' },
{ id: 'unconditional_belonging', ..., image: '/images/onboarding/stage2-belonging.png' },
{ id: 'adapted_self', ..., image: '/images/onboarding/stage2-adapted.png' },
```

Stage 3 scenes:
```javascript
{ id: 'the_rebel', ..., image: '/images/onboarding/stage3-rebel.png' },
{ id: 'grounded_student', ..., image: '/images/onboarding/stage3-grounded.png' },
{ id: 'good_student', ..., image: '/images/onboarding/stage3-good-student.png' },
```

Stage 3.5 scenes:
```javascript
{ id: 'the_chameleon', ..., image: '/images/onboarding/stage3_5-chameleon.png' },
{ id: 'found_their_tribe', ..., image: '/images/onboarding/stage3_5-tribe.png' },
{ id: 'the_withdrawn', ..., image: '/images/onboarding/stage3_5-withdrawn.png' },
```

- [ ] **Step 2: Update scene card JSX to render images**

Find the scene card rendering in the Story beat (search for `jo-scene-card` or the map over `stage.scenes`). Update the card content to show image with text pill below:

```jsx
{stage.scenes.map((scene) => (
  <div
    key={scene.id}
    className={`jo-scene-card ${stageSelections[stage.id] === scene.id ? 'jo-scene-selected' : ''}`}
    onClick={() => handleSceneSelect(stage.id, scene.id)}
  >
    {scene.image && (
      <img
        className="jo-scene-image"
        src={scene.image}
        alt={scene.name}
        onError={(e) => {
          e.target.style.display = 'none'
          if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex'
        }}
      />
    )}
    <div
      className="jo-scene-icon-fallback"
      style={{
        display: scene.image ? 'none' : 'flex',
        background: `${scene.color}15`,
      }}
    >
      <span>{scene.icon}</span>
    </div>
    <div className="jo-scene-pill">
      <div className="jo-scene-name">{scene.name}</div>
      <div className="jo-scene-desc">{scene.description}</div>
    </div>
  </div>
))}
```

- [ ] **Step 3: Add scene image CSS**

Add/update in JourneyOnboarding.css. Replace any existing `.jo-scene-card` styles:

```css
.jo-scene-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.jo-scene-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.jo-scene-selected {
  border-color: var(--jo-gold) !important;
  box-shadow: 0 0 0 1px var(--jo-gold), 0 8px 28px rgba(233, 162, 59, 0.2) !important;
  transform: translateY(-2px);
}

.jo-scene-selected::after {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 10px;
  width: 26px;
  height: 26px;
  background: var(--jo-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1a1a2e;
  box-shadow: 0 2px 8px rgba(233, 162, 59, 0.4);
  animation: jo-checkPop 0.3s ease;
  z-index: 2;
}

@keyframes jo-checkPop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.jo-scene-image {
  width: 100%;
  height: 155px;
  object-fit: cover;
  display: block;
}

.jo-scene-icon-fallback {
  width: 100%;
  height: 155px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
}

.jo-scene-pill {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.jo-scene-selected .jo-scene-pill {
  background: rgba(233, 162, 59, 0.15);
  border-color: rgba(233, 162, 59, 0.3);
}

.jo-scene-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: white;
  margin-bottom: 2px;
}

.jo-scene-desc {
  font-size: 0.73rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.35;
}
```

- [ ] **Step 4: Verify images load in dev server**

```bash
npm run dev
```

Navigate to onboarding. Check that all 12 images load (no 404s in console). Check image height is 155px with text pill below.

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/JourneyOnboarding.jsx src/components/onboarding/JourneyOnboarding.css
git commit -m "feat: add Pixar scene images to onboarding wound stage cards"
```

---

### Task 5: Simplify journeyOnboarding.js

Remove avatar generation utilities. Keep persistence functions.

**Files:**
- Modify: `src/lib/journeyOnboarding.js`

- [ ] **Step 1: Remove avatar-related code**

Remove:
- `PHOTO_STORAGE_KEY` constant (line ~15)
- `generatePendingAvatar` function (lines ~94-165)
- Any reference to `PHOTO_STORAGE_KEY` in `persistJourneyOnboarding`
- The `generatePendingAvatar()` call inside `persistJourneyOnboarding` (fire-and-forget avatar gen)
- `getPendingAvatarUrl` function (lines ~269-277)

Keep:
- `RESULT_STORAGE_KEY` and `PROGRESS_STORAGE_KEY`
- `SCENE_METADATA` constant
- `deriveArchetypePattern(stageSelections)` function
- `persistJourneyOnboarding(userId)` function (remove avatar parts inside it)
- `hasPendingJourneyData()` function

- [ ] **Step 2: Update persistJourneyOnboarding to remove avatar reference**

In the function, find where it reads `avatarUrl` from the stored result and remove it. The function should:
1. Read `RESULT_STORAGE_KEY` from localStorage
2. Destructure `stageSelections` (remove `avatarUrl`)
3. Insert into `journey_onboarding_selections` (keep as-is)
4. Update `user_stage_progress` with `journey_onboarding_completed: true` (remove `hero_avatar_url` update)
5. Clear localStorage keys

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Clean build.

- [ ] **Step 4: Commit**

```bash
git add src/lib/journeyOnboarding.js
git commit -m "refactor: remove avatar generation from journeyOnboarding utilities"
```

---

### Task 6: Wire into app router

Connect onboarding to the routing system.

**Files:**
- Modify: `src/AppRouter.jsx` (line 404)
- Modify: `src/pages/MePage.jsx` (add persistence useEffect)

- [ ] **Step 1: Add import to AppRouter.jsx**

At the top of AppRouter.jsx, add the import (alongside existing static imports around line 33):

```javascript
import JourneyOnboarding from './components/onboarding/JourneyOnboarding'
```

- [ ] **Step 2: Replace /get-started route (line 404)**

Change:
```jsx
<Route path="/get-started" element={<PersonaAssessment />} />
```

To:
```jsx
<Route path="/get-started" element={
  <JourneyOnboarding
    onSignUp={() => window.location.href = '/log-in?signup=true'}
  />
} />
```

Note: Using `window.location.href` instead of `navigate()` because the onboarding is pre-auth and the auth page needs a full page load. Check what the existing signup flow uses — grep for `log-in` or `signup` in the codebase to find the exact auth URL.

- [ ] **Step 3: Add persistence to MePage.jsx**

At the top of MePage.jsx, add the import (around line 21):

```javascript
import { hasPendingJourneyData, persistJourneyOnboarding } from '../lib/journeyOnboarding'
```

Add a new useEffect after the existing data-loading effects (around line 82):

```javascript
// Persist journey onboarding data after first login
useEffect(() => {
  if (!user?.id) return
  if (!hasPendingJourneyData()) return

  persistJourneyOnboarding(user.id)
    .then(result => {
      if (result.success) {
        console.log('Journey onboarding persisted, pattern:', result.pattern?.dominant)
      }
    })
    .catch(err => console.warn('Failed to persist journey onboarding:', err))
}, [user?.id])
```

- [ ] **Step 4: Apply database migration**

```bash
supabase db push
```

Verify in Supabase dashboard:
- `journey_onboarding_selections` table exists with columns: user_id, stage_id, scene_id, zone, archetype, created_at, updated_at
- `user_stage_progress` has new columns: hero_avatar_url, journey_onboarding_completed

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: Clean build.

- [ ] **Step 6: Commit**

```bash
git add src/AppRouter.jsx src/pages/MePage.jsx
git commit -m "feat: wire journey onboarding into app router, persist after auth"
```

---

### Task 7: Create tension questions v2 JSON

Ship the new tension assessment data file for Phase 2.

**Files:**
- Create: `public/tension-assessment-v2.json`

- [ ] **Step 1: Create the file**

Write to `public/tension-assessment-v2.json`:

```json
{
  "version": "2.0.0",
  "metadata": {
    "name": "Journey Tension Assessment",
    "description": "3+1 diagnostic questions mapping to journey levels"
  },
  "questions": [
    {
      "id": "tension_identity",
      "level": 1,
      "question": "When it comes to knowing how you want to show up in the world...",
      "options": [
        { "label": "I have no idea. I don't know what change I want to make or how I fit", "score": 0 },
        { "label": "I have a sense of what I care about but I can't articulate it yet", "score": 1 },
        { "label": "I can describe it but I'm still testing whether it's really me", "score": 2 },
        { "label": "I know exactly how I want to show up and the change I want to make", "score": 3 }
      ]
    },
    {
      "id": "tension_vulnerability",
      "level": 2,
      "question": "When it comes to letting people see where you're really at...",
      "options": [
        { "label": "I keep it to myself. Letting people in feels unsafe", "score": 0 },
        { "label": "I open up occasionally but only when it feels controlled", "score": 1 },
        { "label": "I can be honest with a few people, but I still filter the messy parts", "score": 2 },
        { "label": "I let people see all of it. The uncertainty, the struggle, the real me", "score": 3 }
      ]
    },
    {
      "id": "tension_enough",
      "level": 4,
      "question": "When it comes to taking action on what matters...",
      "options": [
        { "label": "I'm stuck. Fear of judgement and not being good enough keeps me frozen", "score": 0 },
        { "label": "I start things but fear of what people think stops me finishing", "score": 1 },
        { "label": "I take action, but I still hold back the bold stuff to stay safe", "score": 2 },
        { "label": "I move. The fear is there but it doesn't decide for me anymore", "score": 3 }
      ]
    },
    {
      "id": "tension_passion",
      "level": 7,
      "conditional": true,
      "showIf": "all_previous_gte_2",
      "question": "When it comes to investing in the path you're on...",
      "options": [
        { "label": "I don't feel safe putting real skin in the game", "score": 0 },
        { "label": "I invest a little but I always keep one foot in the safe option", "score": 1 },
        { "label": "I'm committing more, but the big bet still terrifies me", "score": 2 },
        { "label": "I feel safe going all in. The risk feels right because the path is mine", "score": 3 }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add public/tension-assessment-v2.json
git commit -m "feat: add v2 tension assessment questions for journey levels"
```

---

### Task 8: Manual QA

- [ ] **Step 1: Mobile viewport test**

Chrome DevTools → iPhone 14 Pro (390x844). Navigate to `/get-started`.

Walk through all screens:
- 3 hook slides (tap "Tap to continue", last slide shows "Let's find out" CTA)
- 4 stage selections (Pixar images load at 155px height, cards selectable, gold border + checkmark on select, auto-advance after 700ms)
- Reframe slide ("What if you could build a life..." — no tap hint, holds, tappable anywhere)
- Promise slide ("That's what FindMyFlow is for." + gold "Start My Journey" CTA)

- [ ] **Step 2: Test double-tap prevention**

On any stage, tap a card twice quickly. Verify:
- First tap selects (gold border)
- Second tap on SAME card: no double-advance (previous timeout cleared)
- Second tap on DIFFERENT card: selection moves, single advance after 700ms

- [ ] **Step 3: Test localStorage**

DevTools → Application → Local Storage → localhost.
After completing all 4 stages, verify `journey_onboarding_result` contains:
```json
{
  "stageSelections": {
    "stage1": "<selected_scene_id>",
    "stage2": "<selected_scene_id>",
    "stage3": "<selected_scene_id>",
    "stage3_5": "<selected_scene_id>"
  },
  "completedAt": "<ISO timestamp>"
}
```

No `avatarUrl` or `photoPreview` in the stored data.

- [ ] **Step 4: Test sign-up flow**

Click "Start My Journey" → should navigate to `/log-in?signup=true` (or whatever the auth URL is).

- [ ] **Step 5: Test post-auth persistence**

After signing up and landing on `/me`:
- Check Supabase dashboard → `journey_onboarding_selections` has 4 rows for the user
- Each row has correct stage_id, scene_id, zone
- `user_stage_progress.journey_onboarding_completed` = true
- localStorage keys cleared (`journey_onboarding_result` and `journey_onboarding_state` gone)

- [ ] **Step 6: Test image fallbacks**

Temporarily rename one image file:
```bash
mv public/images/onboarding/stage1-secure.png public/images/onboarding/stage1-secure.png.bak
```
Reload onboarding. The missing image should show the emoji fallback icon. Then restore:
```bash
mv public/images/onboarding/stage1-secure.png.bak public/images/onboarding/stage1-secure.png
```

- [ ] **Step 7: Final build check**

```bash
npm run build
```

Expected: Clean build, zero warnings.

---

## Phase 1 Complete Checklist

- [ ] Worktree merged to main
- [ ] Avatar code fully removed (state, handlers, CSS, utilities)
- [ ] Reframe beat working (gold text, tappable, transitions)
- [ ] Promise beat clean (no avatar, gold CTA)
- [ ] 12 Pixar images loading in scene cards with 155px height
- [ ] Emoji fallbacks working when images missing
- [ ] Routed at `/get-started` (replaces PersonaAssessment)
- [ ] Double-tap prevention working
- [ ] localStorage persistence working
- [ ] Post-auth database persistence working
- [ ] Tension questions v2 JSON shipped
- [ ] Mobile viewport QA passed
- [ ] Clean build
