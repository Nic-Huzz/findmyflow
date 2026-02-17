# Fantasy League Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a public marketing landing page at `/fantasy` for the FindMyFlow Fantasy League — 12 sections of copy, alternating dark/light backgrounds, full scroll animations, CSS-only particle hero, animated scorecard, sticky mobile CTA.

**Architecture:** Single-file page component (`FantasyLeagueLanding.jsx` + `FantasyLeagueLanding.css`) following the exact pattern of `src/pages/LandingPage.jsx`. Uses existing `useReveal`/`useRevealAll` hooks and `animation-tokens.css`. All CSS scoped to `.fantasy-lp`.

**Tech Stack:** React 18, CSS (no external animation libraries), existing `useReveal` / `useRevealAll` IntersectionObserver hooks from `src/hooks/useReveal.js`.

**Reference files:**
- Copy spec: `docs/clawdbot/league-lp.md`
- Design doc: `docs/plans/2026-02-15-fantasy-league-landing-page-design.md`
- Pattern reference: `src/pages/LandingPage.jsx` + `src/pages/LandingPage.css`
- Animation system: `src/styles/animation-tokens.css` + `src/hooks/useReveal.js`
- Category data: `src/lib/league/leagueConfig.js`

---

## Task 1: Route Setup + Empty Shell

**Files:**
- Create: `src/pages/FantasyLeagueLanding.jsx`
- Create: `src/pages/FantasyLeagueLanding.css`
- Modify: `src/AppRouter.jsx`

**Step 1: Create empty component**

Create `src/pages/FantasyLeagueLanding.jsx`:
```jsx
import './FantasyLeagueLanding.css'

export default function FantasyLeagueLanding() {
  return (
    <div className="fantasy-lp">
      <h1>Fantasy League Landing — Shell</h1>
    </div>
  )
}
```

Create `src/pages/FantasyLeagueLanding.css`:
```css
/* ============================================================
   FANTASY LEAGUE LANDING PAGE
   Scoped to .fantasy-lp to prevent conflicts
   ============================================================ */
.fantasy-lp {
  min-height: 100vh;
  color: white;
}
```

**Step 2: Wire up the route**

In `src/AppRouter.jsx`:

1. Add lazy import near line 148 (after `EarthquakeQuiz`):
```jsx
const FantasyLeagueLanding = lazyRetry(() => import('./pages/FantasyLeagueLanding'))
```

2. Add CSS import near line 270 (after EarthquakeQuiz.css):
```jsx
import './pages/FantasyLeagueLanding.css'
```

3. Add public route (no AuthGate) near line 471 after the `/try/earthquake` route:
```jsx
{/* Fantasy League Landing Page - Public */}
<Route path="/fantasy" element={<FantasyLeagueLanding />} />
```

4. In `ConditionalBottomToolbar` (~line 323), add to exclusion list:
```jsx
location.pathname === '/fantasy' ||
```

5. In `ConditionalZarlo` (~line 293), add to exclusion check:
```jsx
const isFantasyLP = location.pathname === '/fantasy'
```
And add `|| isFantasyLP` to the return-null condition.

**Step 3: Verify**

Run: `npm run build`
Expected: Build succeeds with no errors.

Run: `npm run dev` and navigate to `http://localhost:5173/fantasy`
Expected: See "Fantasy League Landing — Shell" text. No bottom toolbar, no Zarlo widget.

**Step 4: Commit**

```bash
git add src/pages/FantasyLeagueLanding.jsx src/pages/FantasyLeagueLanding.css src/AppRouter.jsx
git commit -m "feat: scaffold fantasy league landing page at /fantasy"
```

---

## Task 2: CSS Foundation — Custom Properties, Backgrounds, Containers, Typography

**Files:**
- Modify: `src/pages/FantasyLeagueLanding.css`

**Step 1: Write the full CSS foundation**

Replace entire contents of `FantasyLeagueLanding.css` with:

```css
/* ============================================================
   FANTASY LEAGUE LANDING PAGE
   Scoped to .fantasy-lp to prevent conflicts.
   Design: dark/light alternating sections, sports broadcast feel.
   ============================================================ */

/* ============ CUSTOM PROPERTIES ============ */
.fantasy-lp {
  --flp-purple: #5e17eb;
  --flp-purple-dark: #4a0ea8;
  --flp-gold: #ffdd27;
  --flp-gold-warm: #E9A23B;
  --flp-cream: #faf8f5;
  --flp-dark: #0a0118;
  --flp-dark-mid: #120225;

  /* Category accents */
  --flp-cat-business: #5e17eb;
  --flp-cat-play: #E9A23B;
  --flp-cat-healing: #10b981;
  --flp-cat-voice: #8B5CF6;
  --flp-cat-content: #3B82F6;

  min-height: 100vh;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
    'Helvetica Neue', Helvetica, Arial, sans-serif;
  scroll-behavior: smooth;
  overflow-x: hidden;
}

/* ============ CONTAINER ============ */
.fantasy-lp .flp-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;
}

@media (max-width: 768px) {
  .fantasy-lp .flp-container {
    padding: 0 1.25rem;
  }
}

/* ============ SECTION BASE ============ */
.fantasy-lp .flp-section-dark {
  background: var(--flp-dark);
  color: white;
  padding: 5rem 0;
}

.fantasy-lp .flp-section-light {
  background: var(--flp-cream);
  color: #1a1a2e;
  padding: 5rem 0;
}

/* ============ TYPOGRAPHY ============ */
.fantasy-lp h1, .fantasy-lp h2, .fantasy-lp h3, .fantasy-lp h4 {
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.fantasy-lp .flp-section-dark h2,
.fantasy-lp .flp-section-dark h3,
.fantasy-lp .flp-section-dark h4,
.fantasy-lp .flp-section-dark p {
  color: white;
}

.fantasy-lp .flp-section-light h2,
.fantasy-lp .flp-section-light h3 {
  color: #1a1a2e;
}

.fantasy-lp .flp-section-light p {
  color: #374151;
}

.fantasy-lp .flp-section-heading {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 800;
  text-align: center;
  margin: 0 0 1rem;
}

.fantasy-lp .flp-gold-text {
  background: linear-gradient(90deg, #ffdd27, #ffc107, #f59e0b, #ffc107, #ffdd27);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: flpShimmer 4s linear infinite;
}

@keyframes flpShimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.fantasy-lp .flp-body-text {
  font-size: clamp(1.0625rem, 2vw, 1.1875rem);
  line-height: 1.75;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.fantasy-lp .flp-muted {
  opacity: 0.6;
  font-size: 0.875rem;
}

/* ============ CTA BUTTONS ============ */
.fantasy-lp .flp-cta-gold {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1.125rem 2.5rem;
  border-radius: 14px;
  font-size: 1.125rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  text-decoration: none;
  background: linear-gradient(135deg, #ffdd27 0%, #ffc107 50%, #ffdd27 100%);
  background-size: 200% auto;
  color: #212529;
  box-shadow: 0 4px 20px rgba(255, 221, 39, 0.35);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: flpCtaPulse 3s ease-in-out infinite;
}

.fantasy-lp .flp-cta-gold:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 40px rgba(255, 221, 39, 0.5);
  background-position: right center;
}

@keyframes flpCtaPulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(255, 221, 39, 0.35); }
  50% { box-shadow: 0 4px 30px rgba(255, 221, 39, 0.55); }
}

/* ============ IMAGE PLACEHOLDERS ============ */
.fantasy-lp .flp-img-placeholder {
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  font-size: 0.8125rem;
  font-style: italic;
  color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.03);
}

.fantasy-lp .flp-section-light .flp-img-placeholder {
  border-color: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.3);
  background: rgba(0, 0, 0, 0.02);
}

/* ============ RESPONSIVE ============ */
@media (max-width: 768px) {
  .fantasy-lp .flp-section-dark,
  .fantasy-lp .flp-section-light {
    padding: 3.5rem 0;
  }
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/pages/FantasyLeagueLanding.css
git commit -m "feat(fantasy-lp): CSS foundation — tokens, containers, typography, CTAs"
```

---

## Task 3: Header + Hero Section with Particle Grid

**Files:**
- Modify: `src/pages/FantasyLeagueLanding.jsx`
- Modify: `src/pages/FantasyLeagueLanding.css`

**Step 1: Build the JSX**

Replace entire `FantasyLeagueLanding.jsx` with:

```jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRevealAll } from '../hooks/useReveal'
import './FantasyLeagueLanding.css'

export default function FantasyLeagueLanding() {
  const navigate = useNavigate()
  const [headerSolid, setHeaderSolid] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const heroRef = useRef(null)
  const revealRef = useRevealAll()

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => setHeaderSolid(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const ctaHref = '/try/earthquake'

  return (
    <div className="fantasy-lp" ref={revealRef}>
      {/* ===== HEADER ===== */}
      <header className={`flp-header${headerSolid ? ' flp-header--solid' : ''}`}>
        <div className="flp-container flp-header-inner">
          <div className="flp-header-logo" onClick={() => navigate('/')}>
            FindMyFlow
          </div>
          <button className="flp-header-login" onClick={() => navigate('/log-in')}>
            Log in
          </button>
        </div>
      </header>

      {/* ===== SECTION 1: HERO ===== */}
      <section className="flp-hero" ref={heroRef}>
        <div className="flp-hero-particles" aria-hidden="true" />
        <div className="flp-container flp-hero-content">
          <p className="flp-hero-season flp-gold-text">Season 1.</p>
          <p className="flp-hero-stats">
            4 teams. 12 players. 4 weeks.
          </p>
          <h1 className="flp-hero-headline">
            The first competition where you level up{' '}
            <em>your business AND your life</em> — or lose to someone who did.
          </h1>
          <a href={ctaHref} className="flp-cta-gold flp-hero-cta">
            Apply for Season 1 →
          </a>
          <p className="flp-hero-scarcity">
            Starts soon. 12 spots. That's it.
          </p>
        </div>
      </section>

      {/* Remaining sections will be added in subsequent tasks */}
    </div>
  )
}
```

**Step 2: Add header + hero CSS**

Append to `FantasyLeagueLanding.css`:

```css
/* ============ HEADER ============ */
.fantasy-lp .flp-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: transparent;
  transition: background 0.3s ease, border-color 0.3s ease;
  border-bottom: 1px solid transparent;
}

.fantasy-lp .flp-header--solid {
  background: rgba(10, 1, 24, 0.95);
  backdrop-filter: blur(12px);
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.fantasy-lp .flp-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.fantasy-lp .flp-header-logo {
  font-size: 1.25rem;
  font-weight: 800;
  color: white;
  cursor: pointer;
  letter-spacing: -0.5px;
}

.fantasy-lp .flp-header-login {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fantasy-lp .flp-header-login:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
}

/* ============ HERO ============ */
.fantasy-lp .flp-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6rem 0 4rem;
  background: linear-gradient(180deg, #0a0118 0%, #120225 40%, #1a0336 70%, #0a0118 100%);
  overflow: hidden;
}

/* CSS-only particle grid */
.fantasy-lp .flp-hero-particles {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1.5px 1.5px at 20% 30%, rgba(255, 221, 39, 0.25) 50%, transparent 50%),
    radial-gradient(1px 1px at 40% 70%, rgba(94, 23, 235, 0.4) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 60% 20%, rgba(255, 221, 39, 0.2) 50%, transparent 50%),
    radial-gradient(1px 1px at 80% 60%, rgba(94, 23, 235, 0.35) 50%, transparent 50%),
    radial-gradient(1px 1px at 10% 80%, rgba(255, 221, 39, 0.15) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 70% 50%, rgba(94, 23, 235, 0.3) 50%, transparent 50%),
    radial-gradient(1px 1px at 50% 90%, rgba(255, 221, 39, 0.2) 50%, transparent 50%),
    radial-gradient(1px 1px at 90% 15%, rgba(94, 23, 235, 0.25) 50%, transparent 50%);
  background-size: 200px 200px;
  animation: flpParticleDrift 20s linear infinite;
  opacity: 0.7;
}

@keyframes flpParticleDrift {
  0% { transform: translate(0, 0); }
  50% { transform: translate(-15px, -10px); }
  100% { transform: translate(0, 0); }
}

.fantasy-lp .flp-hero-content {
  position: relative;
  z-index: 1;
}

.fantasy-lp .flp-hero-season {
  font-size: clamp(3rem, 8vw, 5rem);
  font-weight: 900;
  margin: 0 0 0.5rem;
  letter-spacing: -0.03em;
}

.fantasy-lp .flp-hero-stats {
  font-size: clamp(1.125rem, 2.5vw, 1.375rem);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 2rem;
  letter-spacing: 0.5px;
}

.fantasy-lp .flp-hero-headline {
  font-size: clamp(1.375rem, 3.5vw, 2rem);
  font-weight: 600;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.9);
  max-width: 750px;
  margin: 0 auto 2.5rem;
}

.fantasy-lp .flp-hero-headline em {
  font-style: normal;
  color: white;
  font-weight: 700;
}

.fantasy-lp .flp-hero-cta {
  font-size: clamp(1.0625rem, 2vw, 1.1875rem);
}

.fantasy-lp .flp-hero-scarcity {
  margin: 1.25rem 0 0;
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.3px;
}

@media (max-width: 768px) {
  .fantasy-lp .flp-hero {
    min-height: 90vh;
    padding: 5rem 0 3rem;
  }

  .fantasy-lp .flp-hero-cta {
    width: 100%;
    max-width: 340px;
  }
}
```

**Step 3: Verify**

Run: `npm run dev`, navigate to `/fantasy`.
Expected: Dark hero with subtle particle dots drifting, "Season 1." in gold shimmer, stats, headline, gold CTA button with pulse glow, scarcity text. Header transparent, becomes solid on scroll.

**Step 4: Commit**

```bash
git add src/pages/FantasyLeagueLanding.jsx src/pages/FantasyLeagueLanding.css
git commit -m "feat(fantasy-lp): header + hero section with particle grid"
```

---

## Task 4: Problem + Reframe Sections (Sections 2 & 3)

**Files:**
- Modify: `src/pages/FantasyLeagueLanding.jsx`
- Modify: `src/pages/FantasyLeagueLanding.css`

**Step 1: Add JSX**

In `FantasyLeagueLanding.jsx`, replace the `{/* Remaining sections */}` comment with:

```jsx
      {/* ===== SECTION 2: THE PROBLEM ===== */}
      <section className="flp-section-light flp-problem">
        <div className="flp-container">
          <div className="flp-problem-lines">
            <p className="flp-problem-line reveal-fade-up">You've done the courses.</p>
            <p className="flp-problem-line reveal-fade-up">Read the books.</p>
            <p className="flp-problem-line reveal-fade-up">Hired the coach.</p>
            <p className="flp-problem-line reveal-fade-up">Built the Notion system.</p>
          </div>
          <p className="flp-problem-know reveal-fade-up">You KNOW what to do.</p>
          <p className="flp-problem-stuck reveal-fade-up">So why are you still stuck?</p>

          <div className="flp-problem-reframe reveal-fade-up">
            <p>Because transformation isn't an information problem.</p>
            <p className="flp-problem-bold">It's an accountability problem.</p>
            <p>And you've been trying to solve it alone.</p>
          </div>

          <div className="flp-img-placeholder reveal-fade-up" style={{ aspectRatio: '16/9', maxWidth: 500, margin: '2.5rem auto 0' }}
               aria-label="Illustration: pile of abandoned self-help tools, journals, unfinished courses">
            📸 "The Graveyard" — abandoned tools, unfinished courses, Chapter 3 bookmarks
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: THE REFRAME ===== */}
      <section className="flp-section-dark flp-reframe">
        <div className="flp-container" style={{ textAlign: 'center' }}>
          <p className="flp-reframe-intro reveal-fade-up">
            Here's what nobody tells you about transformation:
          </p>
          <div className="flp-reframe-examples reveal-fade-up">
            <p>The gym works because other people are there.</p>
            <p>AA works because you have a sponsor.</p>
            <p>CrossFit works because your team is counting on you.</p>
          </div>
          <p className="flp-reframe-insight reveal-fade-up">
            The best self-development programs in the world<br />
            don't work because of the content.
          </p>
          <p className="flp-reframe-punchline reveal-fade-up">
            They work because you can't hide.
          </p>

          <div className="flp-img-placeholder reveal-fade-up" style={{ aspectRatio: '2/1', maxWidth: 700, margin: '2.5rem auto 0' }}
               aria-label="Split screen: person alone overwhelmed vs group of 3 mid-challenge">
            📸 Split screen — alone at desk with 47 tabs vs. group laughing mid-challenge
          </div>
        </div>
      </section>

      {/* Remaining sections will be added in subsequent tasks */}
```

**Step 2: Add CSS**

Append to `FantasyLeagueLanding.css`:

```css
/* ============ PROBLEM SECTION ============ */
.fantasy-lp .flp-problem {
  text-align: center;
}

.fantasy-lp .flp-problem-lines {
  max-width: 500px;
  margin: 0 auto 2.5rem;
}

.fantasy-lp .flp-problem-line {
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  font-weight: 500;
  color: #4b5563;
  margin: 0 0 0.5rem;
  line-height: 1.6;
}

.fantasy-lp .flp-problem-know {
  font-size: clamp(1.375rem, 3vw, 1.75rem);
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 1.5rem;
}

.fantasy-lp .flp-problem-stuck {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  color: #1a1a2e;
  margin: 0 0 3rem;
}

.fantasy-lp .flp-problem-reframe {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(94, 23, 235, 0.04);
  border-radius: 12px;
  border-left: 4px solid var(--flp-purple);
}

.fantasy-lp .flp-problem-reframe p {
  font-size: clamp(1.0625rem, 2vw, 1.25rem);
  line-height: 1.7;
  color: #374151;
  margin: 0 0 0.75rem;
}

.fantasy-lp .flp-problem-reframe p:last-child {
  margin-bottom: 0;
}

.fantasy-lp .flp-problem-bold {
  font-weight: 700;
  color: var(--flp-purple) !important;
  font-size: clamp(1.25rem, 2.5vw, 1.5rem) !important;
}

/* ============ REFRAME SECTION ============ */
.fantasy-lp .flp-reframe-intro {
  font-size: clamp(1rem, 2vw, 1.1875rem);
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 2rem;
}

.fantasy-lp .flp-reframe-examples p {
  font-size: clamp(1.0625rem, 2vw, 1.25rem);
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 0.5rem;
}

.fantasy-lp .flp-reframe-insight {
  font-size: clamp(1.125rem, 2vw, 1.25rem);
  color: rgba(255, 255, 255, 0.7);
  margin: 2.5rem 0 1.5rem;
  line-height: 1.7;
}

.fantasy-lp .flp-reframe-punchline {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 800;
  color: white;
  margin: 0;
}
```

**Step 3: Verify**

Navigate to `/fantasy`, scroll down. Problem lines should fade up one by one on cream background. Reframe section dark with large bold punchline. Image placeholders visible with dashed borders.

**Step 4: Commit**

```bash
git add src/pages/FantasyLeagueLanding.jsx src/pages/FantasyLeagueLanding.css
git commit -m "feat(fantasy-lp): problem + reframe sections"
```

---

## Task 5: League Intro + 5 Category Cards (Section 4)

**Files:**
- Modify: `src/pages/FantasyLeagueLanding.jsx`
- Modify: `src/pages/FantasyLeagueLanding.css`

**Step 1: Add JSX**

Replace the `{/* Remaining sections */}` comment with:

```jsx
      {/* ===== SECTION 4: INTRODUCING THE LEAGUE ===== */}
      <section className="flp-section-dark flp-league-intro">
        <div className="flp-container">
          <h2 className="flp-section-heading reveal-fade-up">
            FindMyFlow <span className="flp-gold-text">Fantasy League</span>
          </h2>
          <div className="flp-league-intro-text reveal-fade-up">
            <p>4 teams of 3 people. Competing across 5 dimensions of real life. For 4 weeks.</p>
            <p className="flp-league-intro-bold">
              This isn't a course. This isn't a challenge.<br />
              This is a competition — and your team needs you to show up.
            </p>
          </div>

          <div className="flp-categories">
            {[
              { icon: '📊', name: 'Business Efficiency', color: 'var(--flp-cat-business)',
                desc: 'Ship real business milestones. Efficiency > volume.',
                detail: 'A founder at Stage 1 competes with one at Stage 5 — what matters is how deep you go.' },
              { icon: '🎮', name: 'Play-List', color: 'var(--flp-cat-play)',
                desc: 'Face your fears. Literally.',
                detail: 'Each "Groan" challenge pushes your visibility edge. Scared AND excited? 1.5x points.' },
              { icon: '🧘', name: 'Healing', color: 'var(--flp-cat-healing)',
                desc: 'Recognise. Release. Rewire. Reconnect.',
                detail: "The 4 R's aren't optional — they unlock the next level without burnout." },
              { icon: '🛡️', name: 'Voice', color: 'var(--flp-cat-voice)',
                desc: 'Your Protective Voice kept you safe. It also kept you stuck.',
                detail: 'Daily reflections on how your Essence spoke up and your armour tried to stop it.' },
              { icon: '📸', name: 'Content', color: 'var(--flp-cat-content)',
                desc: 'Share your journey. Tag the league.',
                detail: 'Every post, story, or reel = points. The league promotes itself through its players.' },
            ].map((cat, i) => (
              <div key={cat.name} className="flp-category-card reveal-scale"
                   style={{ '--cat-color': cat.color, animationDelay: `${i * 80}ms` }}>
                <span className="flp-category-icon">{cat.icon}</span>
                <h3 className="flp-category-name">{cat.name}</h3>
                <p className="flp-category-desc">{cat.desc}</p>
                <p className="flp-category-detail">{cat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Remaining sections will be added in subsequent tasks */}
```

**Step 2: Add CSS**

Append to `FantasyLeagueLanding.css`:

```css
/* ============ LEAGUE INTRO ============ */
.fantasy-lp .flp-league-intro-text {
  text-align: center;
  max-width: 650px;
  margin: 0 auto 3rem;
}

.fantasy-lp .flp-league-intro-text p {
  font-size: clamp(1.0625rem, 2vw, 1.25rem);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 1rem;
}

.fantasy-lp .flp-league-intro-bold {
  font-weight: 600;
  color: white !important;
}

/* Category Cards */
.fantasy-lp .flp-categories {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

.fantasy-lp .flp-category-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: 3px solid var(--cat-color, var(--flp-purple));
  border-radius: 12px;
  padding: 1.5rem 1.25rem;
  transition: transform 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out);
}

.fantasy-lp .flp-category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.fantasy-lp .flp-category-icon {
  font-size: 1.75rem;
  display: block;
  margin-bottom: 0.75rem;
}

.fantasy-lp .flp-category-name {
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem;
}

.fantasy-lp .flp-category-desc {
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 0.75rem;
}

.fantasy-lp .flp-category-detail {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* Responsive: horizontal scroll on mobile */
@media (max-width: 1024px) {
  .fantasy-lp .flp-categories {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .fantasy-lp .flp-categories {
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 1rem;
  }

  .fantasy-lp .flp-category-card {
    min-width: 260px;
    flex-shrink: 0;
    scroll-snap-align: start;
  }
}
```

**Step 3: Verify**

Navigate to `/fantasy`, scroll to section 4. 5 category cards in a grid (desktop) or horizontal swipe (mobile). Each card has colored top border, icon, name, description, detail text. Cards scale-in on scroll.

**Step 4: Commit**

```bash
git add src/pages/FantasyLeagueLanding.jsx src/pages/FantasyLeagueLanding.css
git commit -m "feat(fantasy-lp): league intro + 5 category cards with swipe"
```

---

## Task 6: How It Works — 4-Step Timeline (Section 5)

**Files:**
- Modify: `src/pages/FantasyLeagueLanding.jsx`
- Modify: `src/pages/FantasyLeagueLanding.css`

**Step 1: Add JSX**

Replace the `{/* Remaining sections */}` comment with:

```jsx
      {/* ===== SECTION 5: HOW IT WORKS ===== */}
      <section className="flp-section-light flp-how-it-works">
        <div className="flp-container">
          <h2 className="flp-section-heading reveal-fade-up">How It Works</h2>

          <div className="flp-timeline">
            {/* Step 1 */}
            <div className="flp-timeline-step reveal-fade-up">
              <div className="flp-timeline-marker">1</div>
              <div className="flp-timeline-content">
                <h3>Take the Earthquake Quiz</h3>
                <p>7 questions. 4 minutes. Discover your Protective Voice, your Awakening Stage, and the one block that's running your life.</p>
                <p className="flp-timeline-note">This becomes your player profile.</p>
              </div>
              <div className="flp-img-placeholder flp-timeline-img" aria-label="Earthquake Quiz screenshot with player card frame">
                📸 Quiz results reveal — player card frame
              </div>
            </div>

            {/* Step 2 */}
            <div className="flp-timeline-step reveal-fade-up">
              <div className="flp-timeline-marker">2</div>
              <div className="flp-timeline-content">
                <h3>Get Drafted</h3>
                <p>We place you on a team of 3. Mixed stages. Mixed voices. Mixed businesses.</p>
                <p className="flp-timeline-note">Your teammates aren't like you. That's the point.</p>
              </div>
              <div className="flp-img-placeholder flp-timeline-img" aria-label="4 team cards with player silhouettes, draft night energy">
                📸 Team draft — 4 shields, 3 silhouettes each
              </div>
            </div>

            {/* Step 3 */}
            <div className="flp-timeline-step reveal-fade-up">
              <div className="flp-timeline-marker">3</div>
              <div className="flp-timeline-content">
                <h3>Compete for 4 Weeks</h3>
                <p>Weeks 1–3: Round robin. Your team vs every other team. Week 4: Finals.</p>
                <p className="flp-timeline-note">Win 3 of 5 categories each week. You can't brute-force this with business alone.</p>
              </div>
              <div className="flp-img-placeholder flp-timeline-img" aria-label="League bracket showing 3-week round robin and Week 4 finals">
                📸 Matchup bracket — round robin → finals
              </div>
            </div>

            {/* Step 4 */}
            <div className="flp-timeline-step reveal-fade-up">
              <div className="flp-timeline-marker">4</div>
              <div className="flp-timeline-content">
                <h3>Share Everything</h3>
                <p>Every player becomes a creator. Post your wins, your groans, the moments your Protective Voice tried to stop you and you did it anyway.</p>
                <p className="flp-timeline-note">Content is the 5th category. Your team literally needs you to be visible.</p>
              </div>
              <div className="flp-img-placeholder flp-timeline-img" aria-label="Mock Instagram/LinkedIn posts using league templates">
                📸 Content templates — phone screen mockups
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Remaining sections will be added in subsequent tasks */}
```

**Step 2: Add CSS**

Append to `FantasyLeagueLanding.css`:

```css
/* ============ HOW IT WORKS — TIMELINE ============ */
.fantasy-lp .flp-timeline {
  max-width: 900px;
  margin: 3rem auto 0;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  position: relative;
}

/* Vertical connecting line */
.fantasy-lp .flp-timeline::before {
  content: '';
  position: absolute;
  left: 22px;
  top: 40px;
  bottom: 40px;
  width: 2px;
  background: linear-gradient(to bottom, var(--flp-purple), var(--flp-gold));
  border-radius: 1px;
}

.fantasy-lp .flp-timeline-step {
  display: grid;
  grid-template-columns: 46px 1fr 280px;
  gap: 1.5rem;
  align-items: start;
}

.fantasy-lp .flp-timeline-marker {
  width: 46px;
  height: 46px;
  background: linear-gradient(135deg, var(--flp-purple), var(--flp-gold));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 12px rgba(94, 23, 235, 0.3);
}

.fantasy-lp .flp-timeline-content h3 {
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 0.75rem;
}

.fantasy-lp .flp-timeline-content p {
  font-size: 1rem;
  line-height: 1.7;
  color: #4b5563;
  margin: 0 0 0.5rem;
}

.fantasy-lp .flp-timeline-note {
  font-weight: 600;
  color: var(--flp-purple) !important;
  font-size: 0.9375rem !important;
}

.fantasy-lp .flp-timeline-img {
  aspect-ratio: 4/3;
  align-self: center;
}

/* Alternating image side on desktop */
.fantasy-lp .flp-timeline-step:nth-child(even) {
  grid-template-columns: 46px 280px 1fr;
}

.fantasy-lp .flp-timeline-step:nth-child(even) .flp-timeline-img {
  order: -1;
}

/* Mobile: stacked */
@media (max-width: 768px) {
  .fantasy-lp .flp-timeline::before {
    display: none;
  }

  .fantasy-lp .flp-timeline-step,
  .fantasy-lp .flp-timeline-step:nth-child(even) {
    grid-template-columns: 40px 1fr;
    gap: 1rem;
  }

  .fantasy-lp .flp-timeline-img,
  .fantasy-lp .flp-timeline-step:nth-child(even) .flp-timeline-img {
    grid-column: 1 / -1;
    order: unset;
    max-width: 100%;
  }

  .fantasy-lp .flp-timeline-marker {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}
```

**Step 3: Verify**

Scroll to "How It Works". 4 steps with numbered circles, connecting gradient line, alternating text/image sides on desktop. Stacked on mobile. Steps fade in on scroll.

**Step 4: Commit**

```bash
git add src/pages/FantasyLeagueLanding.jsx src/pages/FantasyLeagueLanding.css
git commit -m "feat(fantasy-lp): how it works 4-step timeline"
```

---

## Task 7: Scoring Section with Animated Scorecard (Section 6)

**Files:**
- Modify: `src/pages/FantasyLeagueLanding.jsx`
- Modify: `src/pages/FantasyLeagueLanding.css`

**Step 1: Add animated count-up hook**

At the top of `FantasyLeagueLanding.jsx`, add a small hook after the imports:

```jsx
// Animated count-up for scorecard numbers
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const start = performance.now()
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, target, duration])

  return { count, ref }
}
```

**Step 2: Add JSX**

Replace the `{/* Remaining sections */}` comment with:

```jsx
      {/* ===== SECTION 6: SCORING ===== */}
      <section className="flp-section-dark flp-scoring">
        <div className="flp-container">
          <h2 className="flp-section-heading reveal-fade-up">
            No black boxes. Here's exactly how scoring works.
          </h2>
          <div className="flp-scoring-text reveal-fade-up">
            <p>Each week: your team vs one other team, across all 5 categories.</p>
            <p>Win a category = 1 point. Win 3+ categories = win the week.</p>
            <p className="flp-scoring-philosophy">
              That means a team of business machines loses to a balanced team that also heals,
              plays, reflects, and shows up publicly.
            </p>
            <p className="flp-scoring-motto">
              This IS the philosophy: <strong>all wheels need to turn.</strong>
            </p>
          </div>

          <Scorecard />
        </div>
      </section>

      {/* Remaining sections will be added in subsequent tasks */}
```

Add the `Scorecard` component above the default export:

```jsx
function Scorecard() {
  const rows = [
    { icon: '📊', cat: 'Business', left: 82, right: 71, winner: 'left' },
    { icon: '🎮', cat: 'Play-List', left: 145, right: 162, winner: 'right' },
    { icon: '🧘', cat: 'Healing', left: 89, right: 67, winner: 'left' },
    { icon: '🛡️', cat: 'Voice', left: 42, right: 55, winner: 'right' },
    { icon: '📸', cat: 'Content', left: 85, right: 70, winner: 'left' },
  ]

  return (
    <div className="flp-scorecard reveal-scale">
      <div className="flp-scorecard-header">
        <span className="flp-scorecard-team">TEAM FLOW STATE</span>
        <span className="flp-scorecard-vs">vs</span>
        <span className="flp-scorecard-team">TEAM GROAN ZONE</span>
      </div>
      {rows.map(row => (
        <ScorecardRow key={row.cat} {...row} />
      ))}
      <div className="flp-scorecard-result">
        FLOW STATE WINS 3–2 🏆
      </div>
    </div>
  )
}

function ScorecardRow({ icon, cat, left, right, winner }) {
  const l = useCountUp(left)
  const r = useCountUp(right)
  return (
    <div className="flp-scorecard-row" ref={l.ref}>
      <span className={`flp-sc-score${winner === 'left' ? ' flp-sc-winner' : ''}`}>{l.count}</span>
      <span className="flp-sc-label">{icon} {cat}</span>
      <span className={`flp-sc-score${winner === 'right' ? ' flp-sc-winner' : ''}`} ref={r.ref}>{r.count}</span>
    </div>
  )
}
```

**Step 3: Add CSS**

Append to `FantasyLeagueLanding.css`:

```css
/* ============ SCORING ============ */
.fantasy-lp .flp-scoring-text {
  text-align: center;
  max-width: 650px;
  margin: 0 auto 3rem;
}

.fantasy-lp .flp-scoring-text p {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 0.75rem;
}

.fantasy-lp .flp-scoring-philosophy {
  color: rgba(255, 255, 255, 0.65) !important;
  font-style: italic;
}

.fantasy-lp .flp-scoring-motto {
  font-size: clamp(1.125rem, 2vw, 1.25rem) !important;
  color: var(--flp-gold) !important;
  font-weight: 600;
}

/* Scorecard */
.fantasy-lp .flp-scorecard {
  max-width: 520px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.fantasy-lp .flp-scorecard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.fantasy-lp .flp-scorecard-team {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: white;
}

.fantasy-lp .flp-scorecard-vs {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.fantasy-lp .flp-scorecard-row {
  display: grid;
  grid-template-columns: 60px 1fr 60px;
  align-items: center;
  padding: 0.875rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.fantasy-lp .flp-sc-label {
  text-align: center;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.fantasy-lp .flp-sc-score {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.fantasy-lp .flp-sc-winner {
  color: var(--flp-gold);
}

.fantasy-lp .flp-scorecard-result {
  padding: 1.25rem 1.5rem;
  text-align: center;
  font-size: 1rem;
  font-weight: 800;
  color: var(--flp-gold);
  letter-spacing: 0.5px;
  background: rgba(255, 221, 39, 0.05);
}
```

**Step 3: Verify**

Scroll to scoring section. Scorecard should count up from 0 to final numbers when scrolled into view. Winner scores highlighted gold. "FLOW STATE WINS 3–2" at bottom.

**Step 4: Commit**

```bash
git add src/pages/FantasyLeagueLanding.jsx src/pages/FantasyLeagueLanding.css
git commit -m "feat(fantasy-lp): scoring section with animated count-up scorecard"
```

---

## Task 8: Who This Is For + Huzz's Story (Sections 7 & 8)

**Files:**
- Modify: `src/pages/FantasyLeagueLanding.jsx`
- Modify: `src/pages/FantasyLeagueLanding.css`

**Step 1: Add JSX**

Replace the `{/* Remaining sections */}` comment with:

```jsx
      {/* ===== SECTION 7: WHO THIS IS FOR ===== */}
      <section className="flp-section-light flp-audience">
        <div className="flp-container">
          <h2 className="flp-section-heading reveal-fade-up">Is this for you?</h2>
          <div className="flp-audience-grid">
            <div className="flp-audience-yes reveal-fade-up">
              <h3 className="flp-audience-label flp-audience-label--yes">This is for you if:</h3>
              <ul>
                <li>You've invested $1,000+ in self-development and still feel stuck in the same loop</li>
                <li>You know what to do but can't make yourself do it — information isn't your problem, activation is</li>
                <li>You're building something — a business, a project, a new version of yourself — and doing it alone isn't working</li>
                <li>You secretly crave accountability but hate being told what to do</li>
                <li>You'd rather compete than meditate (don't worry — you'll do both)</li>
              </ul>
            </div>
            <div className="flp-audience-no reveal-fade-up">
              <h3 className="flp-audience-label flp-audience-label--no">This is NOT for you if:</h3>
              <ul>
                <li>You want to consume content without taking action</li>
                <li>You're looking for a quick fix</li>
                <li>You think healing and business are separate things</li>
                <li>You can't commit 30 minutes a day for 4 weeks</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 8: HUZZ'S STORY ===== */}
      <section className="flp-huzz-story">
        <div className="flp-container">
          <div className="flp-story-content reveal-fade-up">
            <h2 className="flp-story-heading">Built by someone who was the Caged Creator.</h2>
            <p>I spent 2 years consuming every course, book, and framework I could find. Built Notion systems. Hired coaches. Still stuck.</p>
            <p className="flp-story-key">What actually worked?</p>
            <p className="flp-story-answer">Doing scary shit with other people watching.</p>
            <p>That's what this is. FindMyFlow is the system I wish existed when I was drowning in self-help that didn't help. The Fantasy League is how you actually use it.</p>
          </div>
          <div className="flp-img-placeholder flp-story-photo reveal-scale"
               aria-label="Huzz then vs now: corporate suit 2020 vs Bali rainbow clothes 2025">
            📸 Left: Corporate Huzz "Everything's fine" → Right: Bali Huzz "Everything's real"
          </div>
        </div>
      </section>

      {/* Remaining sections will be added in subsequent tasks */}
```

**Step 2: Add CSS**

Append to `FantasyLeagueLanding.css`:

```css
/* ============ WHO THIS IS FOR ============ */
.fantasy-lp .flp-audience-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  max-width: 850px;
  margin: 2.5rem auto 0;
}

.fantasy-lp .flp-audience-label {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 1.25rem;
}

.fantasy-lp .flp-audience-label--yes { color: #059669; }
.fantasy-lp .flp-audience-label--no { color: #dc2626; }

.fantasy-lp .flp-audience-yes ul,
.fantasy-lp .flp-audience-no ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.fantasy-lp .flp-audience-yes li,
.fantasy-lp .flp-audience-no li {
  font-size: 0.9375rem;
  line-height: 1.6;
  padding: 0.625rem 0 0.625rem 2rem;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.fantasy-lp .flp-audience-yes li::before {
  content: '✓';
  position: absolute;
  left: 0;
  font-weight: 700;
  color: #059669;
}

.fantasy-lp .flp-audience-no li::before {
  content: '✗';
  position: absolute;
  left: 0;
  font-weight: 700;
  color: #dc2626;
}

@media (max-width: 768px) {
  .fantasy-lp .flp-audience-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

/* ============ HUZZ'S STORY ============ */
.fantasy-lp .flp-huzz-story {
  padding: 5rem 0;
  background: linear-gradient(135deg, #1a0a2e 0%, #2d1458 50%, #1a0a2e 100%);
}

.fantasy-lp .flp-huzz-story .flp-container {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 3rem;
  align-items: center;
}

.fantasy-lp .flp-story-heading {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  color: white;
  margin: 0 0 1.5rem;
}

.fantasy-lp .flp-story-content p {
  font-size: 1.0625rem;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 1rem;
}

.fantasy-lp .flp-story-key {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6) !important;
  margin-top: 1.5rem !important;
}

.fantasy-lp .flp-story-answer {
  font-size: clamp(1.25rem, 2.5vw, 1.5rem) !important;
  font-weight: 700;
  color: var(--flp-gold) !important;
}

.fantasy-lp .flp-story-photo {
  aspect-ratio: 3/4;
  min-height: 300px;
}

@media (max-width: 768px) {
  .fantasy-lp .flp-huzz-story .flp-container {
    grid-template-columns: 1fr;
  }

  .fantasy-lp .flp-story-photo {
    aspect-ratio: 16/9;
    min-height: unset;
  }
}
```

**Step 3: Verify & Commit**

```bash
git add src/pages/FantasyLeagueLanding.jsx src/pages/FantasyLeagueLanding.css
git commit -m "feat(fantasy-lp): who this is for + huzz story sections"
```

---

## Task 9: Details + FAQ + Final CTA + Footer (Sections 9–12)

**Files:**
- Modify: `src/pages/FantasyLeagueLanding.jsx`
- Modify: `src/pages/FantasyLeagueLanding.css`

**Step 1: Add JSX**

Replace the `{/* Remaining sections */}` comment with:

```jsx
      {/* ===== SECTION 9: DETAILS ===== */}
      <section className="flp-section-dark flp-details">
        <div className="flp-container">
          <h2 className="flp-section-heading reveal-fade-up">Season 1 Details</h2>
          <div className="flp-details-grid reveal-fade-up">
            {[
              { icon: '📅', label: 'Duration', value: '4 weeks' },
              { icon: '👥', label: 'Players', value: '12 (4 teams of 3)' },
              { icon: '💰', label: 'Cost', value: '$10/month membership' },
              { icon: '📱', label: 'Platform', value: 'FindMyFlow + Telegram' },
              { icon: '⏱️', label: 'Time', value: '~30 min/day' },
              { icon: '🏆', label: 'Prize', value: 'Bragging rights (TBC)' },
            ].map(d => (
              <div key={d.label} className="flp-detail-item">
                <span className="flp-detail-icon">{d.icon}</span>
                <span className="flp-detail-label">{d.label}</span>
                <span className="flp-detail-value">{d.value}</span>
              </div>
            ))}
          </div>

          {/* 4-week timeline */}
          <div className="flp-week-timeline reveal-fade-up">
            {['Round Robin begins', 'Momentum', 'Final round robin', 'FINALS 🏆'].map((week, i) => (
              <div key={i} className="flp-week-block">
                <span className="flp-week-num">Week {i + 1}</span>
                <span className="flp-week-label">{week}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 10: FAQ ===== */}
      <section className="flp-section-light flp-faq">
        <div className="flp-container">
          <h2 className="flp-section-heading reveal-fade-up">Frequently Asked Questions</h2>
          <div className="flp-faq-list">
            {[
              { q: "What if I'm just starting my business?", a: "Perfect. Business Efficiency scores depth per challenge, not how far along you are. A founder at Stage 1 competes on equal footing with someone at Stage 5. What matters is how many challenges you complete and how deep you go." },
              { q: "What if I don't have time?", a: "30 minutes a day. That's one podcast episode. One gym session. One Netflix episode. If your team is counting on you, you'll find 30 minutes." },
              { q: "Can I pick my team?", a: "No. Teams are assigned to create balance — mixed stages, mixed archetypes, mixed businesses. The diversity is part of the design. Your teammate's strength is your blind spot." },
              { q: "What's the scoring based on?", a: "Real actions inside FindMyFlow: completing business challenges, doing Groan (fear) challenges, daily healing practices, voice reflections, and creating content. No self-reporting. No honour system on the core 4." },
              { q: "What if I fall behind?", a: "Your team will notice. That's the point. This isn't an app you can ghost — you have 2 people counting on your points this week." },
              { q: "Is this just for entrepreneurs?", a: "It's for anyone building something — a business, a side project, a creative practice, or a better relationship with themselves. The business stages adapt to where you are." },
              { q: "What happens after Season 1?", a: "If it works — Season 2, bigger, louder, with alumni captains drafting new teams. If it doesn't — we learn, iterate, go again. This is a beta. You're the founding players." },
            ].map((faq, i) => (
              <div key={i} className={`flp-faq-item reveal-fade-up${expandedFaq === i ? ' flp-faq-item--open' : ''}`}>
                <button
                  className="flp-faq-q"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  aria-expanded={expandedFaq === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  {faq.q}
                  <span className="flp-faq-chevron" aria-hidden="true">›</span>
                </button>
                <div className="flp-faq-a" id={`faq-answer-${i}`} role="region">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 11: FINAL CTA ===== */}
      <section className="flp-section-dark flp-final-cta">
        <div className="flp-container" style={{ textAlign: 'center' }}>
          <p className="flp-final-stats reveal-fade-up">12 spots. 4 teams. Season 1.</p>
          <div className="flp-final-text reveal-fade-up">
            <p>The courses didn't work because nobody was watching.</p>
            <p>The books didn't work because nobody was counting on you.</p>
            <p>The coaches helped — but you need a team, not a guru.</p>
          </div>
          <p className="flp-final-punchline reveal-fade-up">This is your team.</p>
          <a href={ctaHref} className="flp-cta-gold flp-final-btn reveal-scale">
            Apply for Season 1 →
          </a>
          <p className="flp-final-reassurance reveal-fade-up">
            Takes 4 minutes. Starts with the Earthquake Quiz.<br />
            If you're not a fit, we'll tell you.
          </p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="flp-footer">
        <div className="flp-container">
          <p className="flp-footer-brand">FindMyFlow · Built by Huzz in Bali 🌴</p>
          <p className="flp-footer-tagline">
            "The missing layer between knowing what to do and being able to do it."
          </p>
        </div>
      </footer>
```

**Step 2: Add CSS**

Append to `FantasyLeagueLanding.css`:

```css
/* ============ DETAILS ============ */
.fantasy-lp .flp-details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  max-width: 700px;
  margin: 2.5rem auto;
}

.fantasy-lp .flp-detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.fantasy-lp .flp-detail-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.fantasy-lp .flp-detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.25rem;
}

.fantasy-lp .flp-detail-value {
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

/* Week timeline */
.fantasy-lp .flp-week-timeline {
  display: flex;
  gap: 0;
  max-width: 700px;
  margin: 0 auto;
}

.fantasy-lp .flp-week-block {
  flex: 1;
  text-align: center;
  padding: 1rem 0.5rem;
  position: relative;
  border-top: 3px solid rgba(255, 255, 255, 0.1);
}

.fantasy-lp .flp-week-block:last-child {
  border-top-color: var(--flp-gold);
}

.fantasy-lp .flp-week-num {
  display: block;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 0.375rem;
}

.fantasy-lp .flp-week-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.fantasy-lp .flp-week-block:last-child .flp-week-label {
  color: var(--flp-gold);
  font-weight: 700;
}

@media (max-width: 768px) {
  .fantasy-lp .flp-details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ============ FAQ ============ */
.fantasy-lp .flp-faq-list {
  max-width: 700px;
  margin: 2.5rem auto 0;
}

.fantasy-lp .flp-faq-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.fantasy-lp .flp-faq-q {
  width: 100%;
  background: none;
  border: none;
  padding: 1.25rem 2rem 1.25rem 0;
  text-align: left;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #1a1a2e;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
}

.fantasy-lp .flp-faq-q:hover {
  color: var(--flp-purple);
}

.fantasy-lp .flp-faq-chevron {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%) rotate(0deg);
  font-size: 1.25rem;
  transition: transform 0.25s var(--ease-out);
  color: rgba(0, 0, 0, 0.3);
}

.fantasy-lp .flp-faq-item--open .flp-faq-chevron {
  transform: translateY(-50%) rotate(90deg);
}

.fantasy-lp .flp-faq-a {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s var(--ease-out);
}

.fantasy-lp .flp-faq-item--open .flp-faq-a {
  max-height: 300px;
}

.fantasy-lp .flp-faq-a p {
  padding: 0 0 1.25rem;
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #4b5563;
}

/* ============ FINAL CTA ============ */
.fantasy-lp .flp-final-cta {
  padding: 6rem 0;
  position: relative;
}

/* Subtle glow behind CTA */
.fantasy-lp .flp-final-cta::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 221, 39, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.fantasy-lp .flp-final-stats {
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  font-weight: 700;
  color: var(--flp-gold);
  margin: 0 0 2rem;
}

.fantasy-lp .flp-final-text p {
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 0.5rem;
}

.fantasy-lp .flp-final-punchline {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  color: white;
  margin: 2rem 0 2.5rem;
}

.fantasy-lp .flp-final-btn {
  font-size: clamp(1.125rem, 2vw, 1.25rem);
}

.fantasy-lp .flp-final-reassurance {
  margin: 1.5rem 0 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.6;
}

/* ============ FOOTER ============ */
.fantasy-lp .flp-footer {
  padding: 3rem 0;
  background: #050010;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.fantasy-lp .flp-footer-brand {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 0.5rem;
}

.fantasy-lp .flp-footer-tagline {
  font-size: 0.8125rem;
  font-style: italic;
  color: rgba(255, 255, 255, 0.3);
  margin: 0;
}
```

**Step 3: Verify**

Full page scroll-through. All 12 sections render: Hero → Problem → Reframe → Categories → How It Works → Scoring → Who It's For → Huzz → Details → FAQ → Final CTA → Footer. FAQ accordion opens/closes. All sections fade in on scroll.

**Step 4: Commit**

```bash
git add src/pages/FantasyLeagueLanding.jsx src/pages/FantasyLeagueLanding.css
git commit -m "feat(fantasy-lp): details, FAQ, final CTA, footer — all 12 sections complete"
```

---

## Task 10: Sticky Mobile CTA

**Files:**
- Modify: `src/pages/FantasyLeagueLanding.jsx`
- Modify: `src/pages/FantasyLeagueLanding.css`

**Step 1: Add state + observer**

In `FantasyLeagueLanding.jsx`, add a ref for the footer and state for sticky CTA visibility:

```jsx
const [stickyCtaVisible, setStickyCtaVisible] = useState(false)
const footerRef = useRef(null)
```

Add IntersectionObserver effects after the existing scroll useEffect:

```jsx
// Sticky CTA: show after hero exits, hide when footer enters
useEffect(() => {
  const heroEl = heroRef.current
  const footerEl = footerRef.current
  if (!heroEl) return

  let heroOut = false
  let footerIn = false
  const update = () => setStickyCtaVisible(heroOut && !footerIn)

  const heroObs = new IntersectionObserver(
    ([e]) => { heroOut = !e.isIntersecting; update() },
    { threshold: 0 }
  )
  heroObs.observe(heroEl)

  let footerObs
  if (footerEl) {
    footerObs = new IntersectionObserver(
      ([e]) => { footerIn = e.isIntersecting; update() },
      { threshold: 0 }
    )
    footerObs.observe(footerEl)
  }

  return () => { heroObs.disconnect(); footerObs?.disconnect() }
}, [])
```

Add `ref={footerRef}` to the `<footer>` element.

Add the sticky CTA bar just before the closing `</div>` of `.fantasy-lp`:

```jsx
      {/* Sticky mobile CTA */}
      <div className={`flp-sticky-cta${stickyCtaVisible ? ' flp-sticky-cta--visible' : ''}`}>
        <a href={ctaHref} className="flp-cta-gold flp-sticky-cta-btn">
          Apply for Season 1 →
        </a>
      </div>
```

**Step 2: Add CSS**

Append to `FantasyLeagueLanding.css`:

```css
/* ============ STICKY MOBILE CTA ============ */
.fantasy-lp .flp-sticky-cta {
  display: none;
}

@media (max-width: 768px) {
  .fantasy-lp .flp-sticky-cta {
    display: block;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 90;
    padding: 0.75rem 1rem;
    background: rgba(10, 1, 24, 0.95);
    backdrop-filter: blur(12px);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    transform: translateY(100%);
    transition: transform 0.3s var(--ease-out);
  }

  .fantasy-lp .flp-sticky-cta--visible {
    transform: translateY(0);
  }

  .fantasy-lp .flp-sticky-cta-btn {
    width: 100%;
    padding: 0.875rem;
    font-size: 1rem;
    animation: none; /* disable pulse on sticky — too distracting */
  }

  /* Add bottom padding to page so footer isn't hidden behind sticky bar */
  .fantasy-lp .flp-footer {
    padding-bottom: 5rem;
  }
}
```

**Step 3: Verify**

Open DevTools, set viewport to 375px width. Scroll past hero — gold CTA bar slides up from bottom. Scroll to footer — it disappears. Not visible on desktop.

**Step 4: Commit**

```bash
git add src/pages/FantasyLeagueLanding.jsx src/pages/FantasyLeagueLanding.css
git commit -m "feat(fantasy-lp): sticky mobile CTA bar"
```

---

## Task 11: Final Polish — Build Verify, Responsive Check, Reduced Motion

**Files:**
- Possibly touch: `src/pages/FantasyLeagueLanding.jsx`, `src/pages/FantasyLeagueLanding.css`

**Step 1: Production build**

Run: `npm run build`
Expected: Build succeeds with 0 errors and 0 warnings.

**Step 2: Visual regression check**

Open `npm run dev`, navigate to `/fantasy`. Check at these widths:
- 1440px (desktop)
- 1024px (tablet)
- 768px (tablet portrait)
- 375px (mobile)

Checklist:
- [ ] Header: transparent → solid on scroll at all widths
- [ ] Hero: particle grid visible, "Season 1." gold shimmer, CTA pulsing
- [ ] Problem: lines fade up on scroll, cream background
- [ ] Reframe: dark background, punchline is largest text
- [ ] Categories: 5-col grid on desktop, horizontal swipe on mobile
- [ ] Timeline: alternating image sides on desktop, stacked on mobile, connecting line visible
- [ ] Scorecard: numbers count up on scroll, gold highlights on winners
- [ ] Audience: two-column green/red checks on desktop, stacked on mobile
- [ ] Huzz's story: warm gradient background, text + photo side by side (desktop), stacked (mobile)
- [ ] Details: 3-col grid (desktop), 2-col (mobile), week timeline horizontal
- [ ] FAQ: accordion opens/closes smoothly, chevron rotates
- [ ] Final CTA: glow behind button, text centered
- [ ] Footer: minimal, dark
- [ ] Sticky CTA: mobile only, appears after hero, hides at footer
- [ ] All CTA links go to `/try/earthquake`

**Step 3: Reduced motion**

In Chrome DevTools → Rendering → check "Emulate CSS media feature prefers-reduced-motion: reduce".
Expected: All animations instant (no fade, no slide, no count-up delay). Page still fully functional.

**Step 4: Accessibility quick check**

- Tab through page: CTA buttons and FAQ items should be focusable
- FAQ: `aria-expanded` toggles correctly
- No color-only information (checks have ✓/✗ text, not just green/red)

**Step 5: Fix any issues found, then commit**

```bash
git add src/pages/FantasyLeagueLanding.jsx src/pages/FantasyLeagueLanding.css
git commit -m "feat(fantasy-lp): polish pass — responsive, a11y, reduced motion"
```

---

## Summary

| Task | Description | Est. |
|------|-------------|------|
| 1 | Route setup + empty shell | 3 min |
| 2 | CSS foundation (tokens, containers, typography, CTAs) | 5 min |
| 3 | Header + Hero with particle grid | 5 min |
| 4 | Problem + Reframe sections | 5 min |
| 5 | League Intro + 5 category cards | 5 min |
| 6 | How It Works 4-step timeline | 5 min |
| 7 | Scoring + animated scorecard | 5 min |
| 8 | Who This Is For + Huzz's Story | 5 min |
| 9 | Details + FAQ + Final CTA + Footer | 5 min |
| 10 | Sticky mobile CTA | 3 min |
| 11 | Polish pass (responsive, a11y, build) | 5 min |

11 tasks. 11 commits. Every section has complete copy-paste code.
