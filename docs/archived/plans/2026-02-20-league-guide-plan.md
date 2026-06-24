# Fantasy League Guide — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a 5-slide explainer page at `/league/guide` for users brand new to FindMyFlow and the Fantasy League.

**Architecture:** Single React component (`LeagueGuide.jsx`) following the existing stage explainer pattern (see `ValidationExplainer.jsx`). Reuses `FlowFinderExplainer.css`. Purely informational — no quest completion sync. Lazy-loaded route.

**Tech Stack:** React 18, React Router v7, existing CSS from `FlowFinderExplainer.css`

**Design doc:** `docs/plans/2026-02-20-league-guide-design.md`

---

### Task 1: Create LeagueGuide component

**Files:**
- Create: `src/flows/LeagueGuide.jsx`

**Reference files (read before writing):**
- `src/flows/ValidationExplainer.jsx` — pattern to follow (slide array, progress dots, nav buttons)
- `src/flows/FlowFinderExplainer.css` — CSS classes to reuse
- `src/lib/league/leagueConfig.js` — `FANTASY_CATEGORIES` for category data (icons, colors, labels)

**Step 1: Create `src/flows/LeagueGuide.jsx`**

Follow the ValidationExplainer pattern exactly. Key differences:
- No `useAuth`, no `supabase`, no `syncFlowFinderWithChallenge` — this is purely informational
- Import `FANTASY_CATEGORIES, CATEGORY_KEYS` from `../../lib/league/leagueConfig`
- Import `FlowFinderExplainer.css` for styling
- 5 slides as defined in the design doc

```jsx
/**
 * LeagueGuide.jsx — /league/guide
 *
 * 5-slide explainer for users brand new to Fantasy League.
 * Follows the stage explainer pattern (ValidationExplainer, etc.)
 * Purely informational — no quest completion sync.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FANTASY_CATEGORIES, CATEGORY_KEYS } from '../lib/league/leagueConfig'
import { hapticLight } from '../lib/haptics'
import './FlowFinderExplainer.css'

export default function LeagueGuide() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    // Slide 1: Welcome
    {
      title: "Welcome to Fantasy League",
      icon: "🏆",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Fantasy League is a team competition that makes building your business fun.
          </p>
          <p>
            You and 2 friends form a <strong>squad</strong>. Each week, your squad goes head-to-head against another squad.
          </p>
          <p>
            The more you work on yourself and your business, the more points you earn — and the better your squad performs.
          </p>
          <p className="highlight-box">
            The more you work on yourself and your business, <strong>the more your team wins</strong>.
          </p>
        </div>
      )
    },
    // Slide 2: How You Score Points
    {
      title: "How You Score Points",
      icon: "⚡",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Every week, you'll get quests in the 7-Day Challenge.
          </p>
          <p>
            These quests help you build your business, face your fears, and take care of yourself. Completing them earns points.
          </p>
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon">💼</div>
              <div className="step-info">
                <h4>Business Quests</h4>
                <p>Work on your project — validation, offers, funnels, and more.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">💚</div>
              <div className="step-info">
                <h4>Healing Quests</h4>
                <p>Daily check-ins, weekly reflections, and self-care rituals.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">🎮</div>
              <div className="step-info">
                <h4>Courage Challenges</h4>
                <p>Face your fears with visibility challenges from your Play-List.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Slide 3: The 5 Categories
    {
      title: "The 5 Categories",
      icon: "📊",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Your points are split across 5 scoring categories.
          </p>
          <div className="validation-steps">
            {CATEGORY_KEYS.map(key => {
              const cat = FANTASY_CATEGORIES[key]
              const descriptions = {
                business_efficiency: 'Project stage quests. Quality over quantity.',
                play_list: 'Courage challenges. Face your fears.',
                healing: 'Self-care, daily & weekly rituals.',
                voice: 'Deep dive exploration.',
                bonus: 'Tracker quests + social content.',
              }
              return (
                <div key={key} className="validation-step">
                  <div className="step-icon">{cat.icon}</div>
                  <div className="step-info">
                    <h4 style={{ color: cat.color }}>{cat.label}</h4>
                    <p>{descriptions[key]}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="highlight-box">
            Your team's <strong>combined scores</strong> compete in each category.
          </p>
        </div>
      )
    },
    // Slide 4: How Matchups Work
    {
      title: "How Matchups Work",
      icon: "⚔️",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Each week, your squad faces another squad.
          </p>
          <p>
            Your team's combined points are compared in each of the 5 categories. Whoever scores higher in a category wins it.
          </p>
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon" style={{ fontSize: '20px', background: 'rgba(16,185,129,0.2)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓✓✓</div>
              <div className="step-info">
                <h4 style={{ color: '#10b981' }}>Win (3 pts)</h4>
                <p>Win 3 or more of the 5 categories.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon" style={{ fontSize: '20px', background: 'rgba(233,162,59,0.2)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓✓</div>
              <div className="step-info">
                <h4 style={{ color: '#E9A23B' }}>Draw (1 pt each)</h4>
                <p>Tie at 2 categories each.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon" style={{ fontSize: '20px', background: 'rgba(239,68,68,0.2)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✗</div>
              <div className="step-info">
                <h4 style={{ color: '#ef4444' }}>Loss (0 pts)</h4>
                <p>Win 0 or 1 categories.</p>
              </div>
            </div>
          </div>
          <p className="highlight-box">
            Match points decide the <strong>league standings</strong>. Most points at season end wins!
          </p>
        </div>
      )
    },
    // Slide 5: Ready to Play
    {
      title: "Ready to Play",
      icon: "🚀",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            That's all you need to know. Here's the game plan:
          </p>
          <div className="validation-steps">
            <div className="validation-step">
              <div className="step-icon">1️⃣</div>
              <div className="step-info">
                <h4>Join a Squad</h4>
                <p>Create a team or join one with an invite code.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">2️⃣</div>
              <div className="step-info">
                <h4>Do Your Quests</h4>
                <p>Complete quests in the 7-Day Challenge to earn points.</p>
              </div>
            </div>
            <div className="validation-step">
              <div className="step-icon">3️⃣</div>
              <div className="step-info">
                <h4>Check the Scoreboard</h4>
                <p>Watch your team climb the standings each week.</p>
              </div>
            </div>
          </div>
          <p className="highlight-box">
            You don't need to be perfect. <strong>Just show up and do the work</strong> — your squad is counting on you.
          </p>
        </div>
      )
    }
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      hapticLight()
      setCurrentSlide(currentSlide + 1)
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      hapticLight()
      setCurrentSlide(currentSlide - 1)
    } else {
      navigate('/league')
    }
  }

  const isLastSlide = currentSlide === slides.length - 1

  return (
    <div className="flow-finder-explainer">
      <div className="explainer-container">
        {/* Progress dots */}
        <div className="explainer-progress">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`progress-dot ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
              onClick={() => { hapticLight(); setCurrentSlide(index) }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="explainer-slide">
          {slides[currentSlide].icon && (
            <div className="slide-icon">{slides[currentSlide].icon}</div>
          )}
          <h1 className="slide-title">{slides[currentSlide].title}</h1>
          {slides[currentSlide].content}
        </div>

        {/* Navigation */}
        <div className="explainer-nav">
          {isLastSlide ? (
            <>
              <button
                className="nav-btn primary"
                onClick={() => navigate('/league')}
              >
                Join the League →
              </button>
              <button
                className="nav-btn secondary"
                onClick={() => navigate('/7-day-challenge')}
              >
                Back to Challenge
              </button>
            </>
          ) : (
            <>
              <button className="nav-btn primary" onClick={handleNext}>
                Next →
              </button>
              <button className="nav-btn secondary" onClick={handlePrev}>
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify the file was created correctly**

Run: `npm run build 2>&1 | head -20`

This will fail because the route doesn't exist yet — that's expected. Just confirm no syntax errors in the component.

**Step 3: Commit**

```bash
git add src/flows/LeagueGuide.jsx
git commit -m "feat: add LeagueGuide explainer component (5 slides)"
```

---

### Task 2: Add route and lazy import in AppRouter

**Files:**
- Modify: `src/AppRouter.jsx`

**Step 1: Add lazy import**

At line ~233 (after the other league imports), add:

```jsx
const LeagueGuide = lazyRetry(() => import('./flows/LeagueGuide'))
```

**Step 2: Add route**

After the `/league/admin` route block (~line 1027), add:

```jsx
<Route path="/league/guide" element={
  <AuthGate>
    <LeagueGuide />
  </AuthGate>
} />
```

**Step 3: Verify build**

Run: `npm run build`

Expected: Clean build, no errors.

**Step 4: Commit**

```bash
git add src/AppRouter.jsx
git commit -m "feat: add /league/guide route"
```

---

### Task 3: Add entry point link from Rules tab

**Files:**
- Modify: `src/pages/league/LeagueOverview.jsx`

**Step 1: Add link at bottom of Rules tab**

In `LeagueOverview.jsx`, inside the `activeTab === 'rules'` section (~line 444, just before the closing `</div>` of `lo-card`), add a link to the guide:

```jsx
<div style={{
  marginTop: 24,
  paddingTop: 16,
  borderTop: '1px solid rgba(94,23,235,0.1)',
  textAlign: 'center',
}}>
  <a
    href="/league/guide"
    style={{
      color: '#5e17eb',
      fontWeight: 600,
      fontSize: '0.9rem',
      textDecoration: 'none',
    }}
  >
    New to Fantasy? Read the full guide →
  </a>
</div>
```

Note: Using `<a href>` instead of `<Link>` per project convention for lazy-loaded routes.

**Step 2: Verify build**

Run: `npm run build`

Expected: Clean build.

**Step 3: Manual test**

Run: `npm run dev`

1. Navigate to `/league` → Rules tab → see "New to Fantasy?" link at bottom
2. Click link → navigates to `/league/guide`
3. Swipe through all 5 slides using Next/Back
4. Progress dots work (clickable, active state, completed state)
5. Last slide: "Join the League" → `/league`, "Back to Challenge" → `/7-day-challenge`
6. First slide Back → `/league`

**Step 4: Commit**

```bash
git add src/pages/league/LeagueOverview.jsx
git commit -m "feat: add league guide link to Rules tab"
```

---

### Task 4: Final verification

**Step 1: Full build check**

Run: `npm run build`

Expected: Clean build, no warnings.

**Step 2: Visual review checklist**

- [ ] Purple gradient background fills viewport
- [ ] Progress dots: gold active, faded gold completed, transparent inactive
- [ ] Card has dark glass background with border
- [ ] Text is readable (white/off-white on dark)
- [ ] Category cards show correct icons and brand colors
- [ ] Navigation buttons: gold primary, dark secondary
- [ ] Mobile responsive (check 375px width)
- [ ] Haptic feedback fires on dot/button taps
