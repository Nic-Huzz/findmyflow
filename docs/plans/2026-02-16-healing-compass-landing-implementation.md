# Healing Compass Workshop Landing Page — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a public workshop landing page at `/healing-compass-workshop` — 10 scrolling sections explaining Healing Compass concepts, collecting 4 personal answers, and emailing results via Resend Edge Function.

**Architecture:** Single-file page component (`HealingCompassLanding.jsx` + `HealingCompassLanding.css`) following the exact pattern of `src/pages/FantasyLeagueLanding.jsx`. Uses existing `useReveal`/`useRevealAll` hooks and `animation-tokens.css`. All CSS scoped to `.hcl`. Supabase Edge Function for email delivery.

**Tech Stack:** React 18, CSS (no external animation libraries), existing `useReveal` / `useRevealAll` IntersectionObserver hooks from `src/hooks/useReveal.js`, Resend API via Supabase Edge Function.

**Reference files:**
- Design doc: `docs/plans/2026-02-16-healing-compass-landing-design.md`
- Pattern reference: `src/pages/FantasyLeagueLanding.jsx` + `src/pages/FantasyLeagueLanding.css`
- Animation system: `src/styles/animation-tokens.css` + `src/hooks/useReveal.js`
- Workshop data: `src/data/workshopContent.js` (shared data for frontend + Edge Function)
- Archetype data: `src/data/essenceProfiles.js`
- Email pattern: `supabase/functions/send-archetype-profile/index.ts`
- Workshop PDF: `reference/Healing Compass/Healing Compass.pdf`

---

## Task 1: Route Setup + Empty Shell

**Files:**
- Create: `src/pages/HealingCompassLanding.jsx`
- Create: `src/pages/HealingCompassLanding.css`
- Modify: `src/AppRouter.jsx`

**Step 1: Create empty component**

Create `src/pages/HealingCompassLanding.jsx`:
```jsx
import { useState } from 'react'
import { useRevealAll } from '../hooks/useReveal'
import './HealingCompassLanding.css'

export default function HealingCompassLanding() {
  useRevealAll()

  return (
    <div className="hcl">
      <h1>Healing Compass Workshop — Shell</h1>
    </div>
  )
}
```

Create `src/pages/HealingCompassLanding.css`:
```css
/* ============================================================
   HEALING COMPASS WORKSHOP LANDING PAGE
   Scoped to .hcl to prevent conflicts
   ============================================================ */
.hcl {
  --hcl-purple: #5e17eb;
  --hcl-purple-dark: #4a0ea8;
  --hcl-gold: #E9A23B;
  --hcl-cream: #faf8f5;
  --hcl-dark: #0a0118;
  --hcl-dark-mid: #120225;
  --hcl-spring: cubic-bezier(0.16, 1, 0.3, 1);

  min-height: 100vh;
  color: white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  scroll-behavior: smooth;
  overflow-x: hidden;
}
```

**Step 2: Wire up the route**

In `src/AppRouter.jsx`:

1. Add lazy import near line 149 (after `FantasyLeagueLanding`):
```jsx
const HealingCompassLanding = lazyRetry(() => import('./pages/HealingCompassLanding'))
```

2. Add CSS import near line 272 (after `FantasyLeagueLanding.css`):
```jsx
import './pages/HealingCompassLanding.css'
```

3. Add public route (no AuthGate) near line 478 (after `/fantasy` route):
```jsx
{/* Healing Compass Workshop Landing - Public */}
<Route path="/healing-compass-workshop" element={<HealingCompassLanding />} />
```

4. In `ConditionalBottomToolbar` (~line 326), add to exclusion list:
```jsx
location.pathname === '/healing-compass-workshop' ||
```

5. In `ConditionalZarlo` (~line 295), add to exclusion:
```jsx
const isHealingWorkshopLP = location.pathname === '/healing-compass-workshop'
```
And update the if-check to include it.

**Checkpoint:** Visit `/healing-compass-workshop` — see shell text, no bottom toolbar, no Zarlo.

---

## Task 1b: Shared Workshop Data File

**Files:** Create `src/data/workshopContent.js`

Single source of truth for all workshop content. Used by both the React component and referenced by the Edge Function email template. Keeps JSX clean (map over arrays) and prevents content duplication.

```js
export const EMOTIONAL_NEEDS = [
  { key: 'life-design', name: 'Life Design', subtitle: 'Autonomy', group: 'Survive', description: "I need to feel like I have choices and control over my own path" },
  { key: 'connection', name: 'Connection', subtitle: 'Relatedness', group: 'Survive', description: "I need to feel seen, loved, and like I belong" },
  { key: 'mastery', name: 'Mastery', subtitle: 'Competence', group: 'Thrive', description: "I need to feel like I'm growing, learning, and getting better" },
  { key: 'meaning', name: 'Meaning', subtitle: 'Purpose', group: 'Thrive', description: "I need to feel like my life matters and I'm contributing to something bigger" },
]

export const PROTECTIVE_PATTERNS = [
  { key: 'ghost', name: 'The Ghost', description: "Disappears. Withdraws. Becomes invisible to avoid being hurt." },
  { key: 'controller', name: 'The Controller', description: "Takes charge of everything. If I control it, it can't hurt me." },
  { key: 'performer', name: 'The Performer', description: "Becomes whoever you need me to be. Earns love through achievement." },
  { key: 'perfectionist', name: 'The Perfectionist', description: "If I'm perfect, I can't be criticised. Delays and overthinks." },
  { key: 'people-pleaser', name: 'The People Pleaser', description: "Says yes to everything. Puts everyone else first to stay safe." },
]

export const FOUR_RS = [
  { key: 'recognise', name: 'Recognise', description: "Notice the pattern. Name the protective voice. See when it activates." },
  { key: 'release', name: 'Release', description: "Let the body process. Breathwork, shaking, somatic release." },
  { key: 'rewire', name: 'Rewire', description: "Create the new story. Reframe the belief. Build the new neural pathway." },
  { key: 'reconnect', name: 'Reconnect', description: "Return to the younger self. Give them what they needed. Integration." },
]

// The 8 archetypes shown in the workshop (filter from essenceProfiles.js)
export const WORKSHOP_ARCHETYPE_NAMES = [
  'Compassionate Leader', 'Truth-Teller', 'Radiant Rebel', 'Playful Creator',
  'Sacred Jester', 'Wild Alchemist', 'Heart Holder', 'Cosmic Connector'
]
```

The Edge Function will duplicate these constants (Edge Functions can't import from `src/`), but having a canonical source in the repo means we always know which version is correct.

**Checkpoint:** File exists. Import works from `HealingCompassLanding.jsx`.

---

## Task 2: CSS Foundation + Section Bases

**Files:** Modify `src/pages/HealingCompassLanding.css`

Build CSS foundation following FantasyLeagueLanding.css pattern:

```css
/* Container */
.hcl .hcl-container { max-width: 900px; margin: 0 auto; padding: 0 2rem; }

/* Section bases */
.hcl .hcl-section-dark { background: var(--hcl-dark); color: white; padding: 5rem 0; }
.hcl .hcl-section-light { background: linear-gradient(180deg, #fff 0%, var(--hcl-cream) 100%); color: #1a1a2e; padding: 5rem 0; }

/* Typography */
.hcl .hcl-section-label { text-transform: uppercase; letter-spacing: 0.15em; font-size: 0.85rem; color: var(--hcl-gold); margin-bottom: 0.75rem; }
.hcl .hcl-section-heading { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 700; line-height: 1.2; margin-bottom: 1.5rem; }

/* Card selection pattern */
.hcl .hcl-card { cursor: pointer; border: 2px solid transparent; border-radius: 1rem; padding: 1.5rem; transition: all 0.3s var(--hcl-spring); }
.hcl .hcl-card:hover { border-color: rgba(233, 162, 59, 0.3); }
.hcl .hcl-card--selected { border-color: var(--hcl-gold); box-shadow: 0 0 20px rgba(233, 162, 59, 0.2); }

/* Gold CTA button */
.hcl .hcl-cta-gold { display: inline-block; background: linear-gradient(135deg, var(--hcl-gold), #d4882f); color: #0a0118; font-weight: 700; font-size: 1.1rem; padding: 1rem 2.5rem; border-radius: 60px; border: none; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
.hcl .hcl-cta-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(233, 162, 59, 0.3); }

/* Reveal animations (reuse existing classes from useReveal) */
.hcl .reveal-fade-up { opacity: 0; transform: translateY(30px); transition: opacity 0.6s, transform 0.6s var(--hcl-spring); }
.hcl .reveal-fade-up.revealed { opacity: 1; transform: translateY(0); }
.hcl .reveal-scale { opacity: 0; transform: scale(0.95); transition: opacity 0.6s, transform 0.6s var(--hcl-spring); }
.hcl .reveal-scale.revealed { opacity: 1; transform: scale(1); }

/* Mobile */
@media (max-width: 768px) {
  .hcl .hcl-container { padding: 0 1.25rem; }
  .hcl .hcl-section-dark, .hcl .hcl-section-light { padding: 3.5rem 0; }
}
```

**Checkpoint:** Sections render with correct background colors and spacing.

---

## Task 3: Hero Section + Emotional Splinters

**Files:** Modify `HealingCompassLanding.jsx` + `.css`

**Section 1 — Hero:**
- Dark purple gradient background with subtle radial glow
- "Your Healing Compass" heading
- "Everything from today's workshop — your answers, the frameworks, and your next steps."
- Subtle scroll indicator

**Section 2 — Emotional Splinters:**
- Light background
- Brief explanation: "As children, we all experience moments where our emotional needs aren't met. These 'emotional splinters' don't disappear — they create protective patterns that follow us into adulthood."
- Simple visual: splinter → pattern → behaviour chain

**Checkpoint:** Hero and splinters sections render beautifully on mobile and desktop.

---

## Task 4: Emotional Needs Selection (Interactive)

**Files:** Modify `HealingCompassLanding.jsx` + `.css`

**Section 3 — 4 Emotional Needs:**
- Dark background
- 4 selectable cards in a 2x2 grid (stack on mobile):
  - **Life Design** (Autonomy): "I need to feel like I have choices and control over my own path"
  - **Connection** (Relatedness): "I need to feel seen, loved, and like I belong"
  - **Mastery** (Competence): "I need to feel like I'm growing, learning, and getting better"
  - **Meaning** (Purpose): "I need to feel like my life matters and I'm contributing"
- Survive/Thrive grouping labels above each pair
- Selected card gets gold border + glow

**Section 4 — Action Commitment:**
- Light background
- Prompt: "When this need isn't being met, what's one action you'll take instead of falling into your old pattern?"
- Textarea input, styled with border-radius and subtle border
- Character hint (optional, not enforced)

State shape:
```jsx
const [answers, setAnswers] = useState({
  emotionalNeed: null,    // 'life-design' | 'connection' | 'mastery' | 'meaning'
  action: '',             // free text
  protectivePattern: null, // 'ghost' | 'controller' | 'performer' | 'perfectionist' | 'people-pleaser'
  essenceArchetype: null   // archetype name string
})
```

**Checkpoint:** Can select an emotional need (gold highlight), type an action. Selections persist while scrolling.

---

## Task 5: Protective Patterns + 4R's

**Files:** Modify `HealingCompassLanding.jsx` + `.css`

**Section 5 — 5 Protective Patterns:**
- Dark background
- 5 selectable cards (horizontal scroll on mobile, grid on desktop):
  - **The Ghost**: "Disappears. Withdraws. Becomes invisible to avoid being hurt."
  - **The Controller**: "Takes charge of everything. If I control it, it can't hurt me."
  - **The Performer**: "Becomes whoever you need me to be. Earns love through achievement."
  - **The Perfectionist**: "If I'm perfect, I can't be criticised. Delays and overthinks."
  - **The People Pleaser**: "Says yes to everything. Puts everyone else first to stay safe."
- Each card has name + one-line description
- Selected card gets gold border + glow

**Section 6 — The 4R's:**
- Light background
- 4 framework cards (not selectable, informational):
  - **Recognise**: "Notice the pattern. Name the protective voice. See when it activates."
  - **Release**: "Let the body process. Breathwork, shaking, somatic release."
  - **Rewire**: "Create the new story. Reframe the belief. Build the new neural pathway."
  - **Reconnect**: "Return to the younger self. Give them what they needed. Integration."
- Each with a simple icon/emoji and the description

**Checkpoint:** Can select a protective pattern. 4R's display as non-interactive reference.

---

## Task 6: Essence Archetypes Selection

**Files:** Modify `HealingCompassLanding.jsx` + `.css`

**Section 7 — 8 Essence Archetypes:**
- Dark background
- Import archetype data from `src/data/essenceProfiles.js`
- 8 selectable cards in a responsive grid (2 cols mobile, 4 cols desktop)
- Only show the 8 workshop archetypes: Compassionate Leader, Truth-Teller, Radiant Rebel, Playful Creator, Sacred Jester, Wild Alchemist, Heart Holder, Cosmic Connector
- Each card shows: name, group tag (Activator/Bridger/Transmuter/Stabiliser), one-line essence
- Selected card expands or highlights with gold glow + shows poetic_line

**Checkpoint:** Can select an archetype. Card highlights with gold and shows poetic line.

---

## Task 7: Future Self Letter + Email Form

**Files:** Modify `HealingCompassLanding.jsx` + `.css`

**Section 8 — Future Self Letter:**
- Warm gradient background (purple → gold subtle)
- **Name input lives HERE** (inline "Dear [name input]") — not in the email section below. This way the letter fills in live as they type their name.
- Read-only letter template that dynamically fills:
  ```
  Dear [inline name input],

  Today I discovered that my core emotional need is [selected need] —
  and that when it's not met, I've been using [selected pattern] to protect myself.

  The truth is, [pattern] kept me safe when I was younger.
  But I don't need that armour anymore.

  When the [pattern] shows up, I will remember to [action text].

  You are a [archetype name] — [poetic_line].

  With love,
  [name, auto-filled from above]
  ```
- If selections are missing, show placeholder text in gold italic brackets
- Name input styled as an elegant underlined field within the letter text

**Section 9 — Email Delivery:**
- Dark background
- "Get Your Results" heading
- Email input only (name already captured in the letter section above)
- "Send My Results" gold CTA button
- Loading state on button while sending
- **Validation UX:** On submit, if any selections are missing:
  1. Show inline message listing what's missing (e.g. "Choose your emotional need above")
  2. Scroll to the first incomplete section with smooth scroll
  3. Pulse the section heading with a gold glow animation (1-2 seconds) to draw attention
  4. Focus returns to the email form after they complete the missing selection? No — let them scroll naturally back down.
- Success state: replace form with "Check your inbox" confirmation + checkmark animation
- Error state: inline error message (network/server), retry button

**Section 10 — Footer:**
- Dark background, minimal
- "FindMyFlow · Built by Huzz" + link to main app

**Sticky mobile CTA:**
- Fixed bottom bar (appears after scrolling past hero)
- "Send My Results ↑" — scrolls to email section
- Hidden until all 3 required selections are made + name is filled

**Checkpoint:** Letter fills dynamically including name. Validation scrolls to missing sections with pulse highlight. Form validates all fields. Submit button shows loading state.

---

## Task 8: Database Migration

**Files:** Create `supabase/migrations/20260216100000_workshop_submissions.sql`

```sql
-- Workshop submissions for Healing Compass landing page
CREATE TABLE workshop_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  emotional_need TEXT NOT NULL,
  action_commitment TEXT,
  protective_pattern TEXT NOT NULL,
  essence_archetype TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public insert (no auth), no client reads
ALTER TABLE workshop_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert workshop submissions"
  ON workshop_submissions FOR INSERT WITH CHECK (true);

-- Index for admin lookups
CREATE INDEX idx_workshop_submissions_email ON workshop_submissions(email);
CREATE INDEX idx_workshop_submissions_created ON workshop_submissions(created_at DESC);
```

Apply via Supabase dashboard or `supabase db push`.

**Checkpoint:** Table exists in Supabase. Can insert a test row via SQL editor.

---

## Task 9: Edge Function — send-workshop-profile

**Files:** Create `supabase/functions/send-workshop-profile/index.ts`

Follow `send-archetype-profile/index.ts` pattern exactly:

1. CORS headers (same as existing)
2. Accept POST with JSON body: `{ name, email, emotionalNeed, action, protectivePattern, essenceArchetype }`
3. Build HTML email:
   - Header with Healing Compass branding
   - "Your Workshop Answers" section with emotional need, action, protective pattern (with descriptions)
   - "Your Essence Archetype" section with full profile from essenceProfiles data (poetic_line, superpower, north_star, energetic_transmission, recognition_pattern, essence_wound, inner_child_desire, characters, vision_in_action)
   - "The 4R's" summary section
   - "Your Future Self Letter" pre-filled
   - CTA button: "Continue Your Journey" → `https://findmyflow.nichuzz.com`
4. Send via Resend API (`RESEND_API_KEY` env var)
5. Send notification copy to `huzz@nichuzz.com`
6. Insert into `workshop_submissions` table (use `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`)
7. Return `{ success: true }`

Email HTML style: inline CSS, max-width 600px, matches purple/gold brand.

**Checkpoint:** Deploy function. Test with curl. Email arrives with all sections formatted.

---

## Task 10: Connect Frontend to Edge Function

**Files:** Modify `HealingCompassLanding.jsx`

1. Wire "Send My Results" button to call Edge Function:
```jsx
const handleSubmit = async () => {
  setSubmitting(true)
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-workshop-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        name,
        email,
        emotionalNeed: answers.emotionalNeed,
        action: answers.action,
        protectivePattern: answers.protectivePattern,
        essenceArchetype: answers.essenceArchetype
      })
    })
    if (!res.ok) throw new Error('Failed to send')
    setSubmitted(true)
  } catch (err) {
    setError('Something went wrong. Please try again.')
  } finally {
    setSubmitting(false)
  }
}
```

2. Validate before submit: all 3 selections + name + email required
3. Success state: replace form with confirmation message
4. Error state: show inline error, allow retry

**Checkpoint:** Full end-to-end flow works. Select answers → enter details → submit → email arrives → confirmation shows.

---

## Task 11: Polish + Mobile Testing

**Files:** Modify `HealingCompassLanding.css` + `.jsx`

1. Test all breakpoints (375px, 428px, 768px, 1024px, 1440px)
2. Ensure card grids stack properly on mobile
3. Verify reveal animations fire on scroll
4. Test sticky CTA appears/disappears correctly
5. Check letter fills dynamically as selections change
6. Verify email renders well in Gmail, Apple Mail (test via Resend)
7. Add `<meta>` viewport tag if needed (should already exist in index.html)

**Checkpoint:** Page looks polished on iPhone SE through desktop. All animations smooth. Email looks good.

---

## Summary

| Task | Effort | Dependencies |
|------|--------|-------------|
| 1. Route + Shell | Small | None |
| 1b. Workshop Data File | Small | None |
| 2. CSS Foundation | Small | Task 1 |
| 3. Hero + Splinters | Medium | Task 2 |
| 4. Emotional Needs | Medium | Tasks 1b, 2 |
| 5. Patterns + 4R's | Medium | Tasks 1b, 2 |
| 6. Archetypes | Medium | Tasks 1b, 2 |
| 7. Letter + Form | Medium | Tasks 4-6 |
| 8. DB Migration | Small | None |
| 9. Edge Function | Large | Tasks 1b, 8 |
| 10. Connect Frontend | Small | Tasks 7, 9 |
| 11. Polish | Medium | All |

Tasks 1 and 1b can run in parallel. Tasks 3-6 can be built in parallel (independent sections). Task 8 can run in parallel with frontend work. Task 9 depends on Tasks 1b and 8. Task 10 connects everything. Task 11 is final polish.
