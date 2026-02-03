# Phase 1: Narrative First Implementation Plan

**Goal:** Apply the Play-List/Playground narrative with minimal code changes to test resonance before deeper investment.

**Timeline:** 1-2 weeks
**Risk Level:** Low
**Dependencies:** None

---

## Overview

Phase 1 focuses on three workstreams:

| Workstream | Effort | Impact | Files Affected |
|------------|--------|--------|----------------|
| 1. Landing Page Rewrite | Medium | High | `LandingPage.jsx`, `LandingPage.css` |
| 2. Playground/Play-List Rebrand | Low | Medium | 4 Groan components, copy only |
| 3. Protective Voice Identification | Low | High | Onboarding flow, Profile |

---

## Workstream 1: Landing Page Rewrite

### Current State
The landing page already has strong foundations:
- "The Matrix" language (Chapter 2)
- Ancient wisdom framing (Svadharma, Te, Ikigai)
- "Earthquake" moment ("Is This You?" section)
- "Groans" mentioned in founder story
- Flow/play language in hero

### Changes Needed

#### 1.1 Hero Section Update

**Current:**
```
I believe there's a flow for your life.
A unique path only you can walk — where work feels like play...
```

**New:**
```
You were born with powers.
The Matrix suppressed them.

That restlessness you feel? That's not a flaw.
That's your Flow trying to activate after years of suppression.

We help you rediscover what feels like play — and build a life around it.
```

**CTA Update:**
- "Join Waiting List" → "Begin Your Training"
- "Find Your Journey Stage" → "Discover Your Flow"

---

#### 1.2 Add "Protective Voices" Section

Insert after "Is This You?" section (before "How You Got Here").

**New Section: "Meet the voices keeping you small"**

```jsx
<section className="landing-protective-voices">
  <div className="landing-container">
    <h2>Meet the voices keeping you small</h2>
    <p className="voices-intro">
      They're not out there. They're in here.
    </p>

    <div className="voices-grid">
      <div className="voice-card">
        <div className="voice-icon">🎭</div>
        <h3>The Perfectionist</h3>
        <p className="voice-lie">"You're not ready yet."</p>
        <p className="voice-truth">Freezes you before you can start.</p>
      </div>

      <div className="voice-card">
        <div className="voice-icon">🪞</div>
        <h3>The People Pleaser</h3>
        <p className="voice-lie">"They won't like the real you."</p>
        <p className="voice-truth">Hides your authentic self.</p>
      </div>

      <div className="voice-card">
        <div className="voice-icon">🎮</div>
        <h3>The Controller</h3>
        <p className="voice-lie">"If you can't guarantee success, don't try."</p>
        <p className="voice-truth">Blocks all uncertainty.</p>
      </div>

      <div className="voice-card">
        <div className="voice-icon">🏃</div>
        <h3>The Performer</h3>
        <p className="voice-lie">"Do more. Then you'll be enough."</p>
        <p className="voice-truth">Drives you to exhaustion.</p>
      </div>

      <div className="voice-card">
        <div className="voice-icon">👻</div>
        <h3>The Ghost</h3>
        <p className="voice-lie">"Being seen is dangerous."</p>
        <p className="voice-truth">Keeps you invisible.</p>
      </div>
    </div>

    <p className="voices-reframe">
      These aren't character flaws. They're survival mechanisms that once protected you.
      Now they're blocking your access to play.
    </p>

    <p className="voices-key-insight">
      <strong>The things that feel most like play are the things that feel most dangerous — because they're the most you.</strong>
    </p>
  </div>
</section>
```

---

#### 1.3 Update "Groans" Reference in Founder Story

**Current (line ~444):**
```jsx
<div className="method-item">
  <span className="method-name">Groans</span>
  <span className="method-desc">Actions you know you're capable of, but your body holds fear</span>
</div>
```

**New:**
```jsx
<div className="method-item">
  <span className="method-name">The Play-List</span>
  <span className="method-desc">Activities your essence sees as play — but your Protective Voices have made you fear</span>
</div>
<div className="method-item">
  <span className="method-name">The Groan</span>
  <span className="method-desc">That resistance you feel when approaching play. The sound of reclaiming your identity.</span>
</div>
```

---

#### 1.4 Add "The Playground" Concept

Insert before or within the "Flow Finder Framework" section.

**New content:**
```jsx
<div className="playground-intro">
  <h3>The Playground</h3>
  <p>
    Your Play-List lives in The Playground — a space to reclaim activities
    your essence knows are play, but your Protective Voices have made you fear.
  </p>

  <div className="visibility-layers">
    <div className="layer">
      <span className="layer-name">Screen</span>
      <span className="layer-desc">Claim your identity behind a screen</span>
    </div>
    <div className="layer">
      <span className="layer-name">Live</span>
      <span className="layer-desc">Claim your identity in person</span>
    </div>
    <div className="layer">
      <span className="layer-name">Money</span>
      <span className="layer-desc">Claim your identity is worth paying for</span>
    </div>
    <div className="layer">
      <span className="layer-name">Vulnerable</span>
      <span className="layer-desc">Claim your identity even when imperfect</span>
    </div>
    <div className="layer">
      <span className="layer-name">Authority</span>
      <span className="layer-desc">Fully own: "This is who I am"</span>
    </div>
  </div>

  <p className="playground-promise">
    Each layer is a deeper level of saying: <em>"This is me. This is what I do. This is who I am."</em>
  </p>
</div>
```

---

#### 1.5 Update Closing CTA

**Current flow:**
- Generic "Join Waiting List"

**New framing:**
```
Ready to reclaim your right to play?

Every hero has an origin moment.
This could be yours.

[Begin Your Training →]  [Discover Your Flow →]
```

---

### Landing Page Implementation Checklist

- [ ] Update hero copy (powers, Matrix, Flow activation)
- [ ] Update hero CTAs
- [ ] Add Protective Voices section after "Is This You?"
- [ ] Update Groans → Play-List/Groan in founder story
- [ ] Add Playground concept with visibility layers
- [ ] Update closing CTA
- [ ] Add CSS for new sections (`.landing-protective-voices`, `.voices-grid`, etc.)
- [ ] Test mobile responsiveness

---

## Workstream 2: Playground/Play-List Rebrand

### Files to Update

| File | Changes |
|------|---------|
| `GroanMatrix.jsx` | Rename display text, keep component name for now |
| `GroanMatrix.css` | No changes needed |
| `GroanChallengeCard.jsx` | Update copy to Play-List language |
| `GroansSummary.jsx` | Update copy |
| `GroanReflectionInput.jsx` | Update prompt language |

### Copy Changes (No Component Renaming)

#### GroanMatrix.jsx

**Headers/Titles:**
- "Groan Matrix" → "The Playground"
- "Your Groans" → "Your Play-List"
- "Generate Groan" → "Add to Play-List"

**Visibility Layer Labels (if displayed):**
Keep layer names but add context:
- "Screen" → "Screen — Own it behind a screen"
- "Live" → "Live — Own it in person"
- etc.

**Empty State:**
- Current: "No groans yet"
- New: "Your Playground is empty. What feels like play... but also terrifies you?"

#### GroanChallengeCard.jsx

**Card copy updates:**
- "Complete Groan" → "Play"
- "Skip Groan" → "Not ready yet"
- "Groan completed!" → "You played! 🎉"

**Encourage framing:**
Add subtle copy that reinforces the vulnerability framework:
- "This feels scary because it's authentically you."
- "The groan you feel is your Protective Voice. Play anyway."

#### GroanReflectionInput.jsx

**Prompts:**
- "How did this groan feel?" → "How did it feel to play?"
- "What did you learn?" → "What did you reclaim?"

### Rebrand Implementation Checklist

- [ ] Update GroanMatrix.jsx display text
- [ ] Update GroanChallengeCard.jsx copy
- [ ] Update GroansSummary.jsx copy
- [ ] Update GroanReflectionInput.jsx prompts
- [ ] Search codebase for other "Groan" display text
- [ ] DO NOT rename component files yet (wait for Phase 2)

---

## Workstream 3: Protective Voice Identification

### Goal
Add a single question to onboarding that identifies the user's primary Protective Voice, then display it on their profile.

### Implementation

#### 3.1 Add Voice Identification Question

**Location:** End of existing onboarding flow (after persona questions in `HomeFirstTime.jsx`)

**New Step:**
```jsx
{step === 'voice-identification' && (
  <div className="voice-identification">
    <h2>One more thing...</h2>
    <p>Which of these voices sounds most like yours?</p>

    <div className="voice-options">
      {[
        { id: 'perfectionist', name: 'The Perfectionist', lie: '"You\'re not ready yet."' },
        { id: 'people-pleaser', name: 'The People Pleaser', lie: '"They won\'t like the real you."' },
        { id: 'controller', name: 'The Controller', lie: '"If you can\'t guarantee success, don\'t try."' },
        { id: 'performer', name: 'The Performer', lie: '"Do more. Then you\'ll be enough."' },
        { id: 'ghost', name: 'The Ghost', lie: '"Being seen is dangerous."' },
      ].map(voice => (
        <button
          key={voice.id}
          className={`voice-option ${selectedVoice === voice.id ? 'selected' : ''}`}
          onClick={() => setSelectedVoice(voice.id)}
        >
          <span className="voice-name">{voice.name}</span>
          <span className="voice-lie">{voice.lie}</span>
        </button>
      ))}
    </div>

    <p className="voice-reassurance">
      Don't worry — we all have these voices. They once protected us.
      Now we're going to show them they're no longer needed.
    </p>
  </div>
)}
```

#### 3.2 Store the Selection

**Database:** Add to `user_stage_progress` table

```sql
ALTER TABLE user_stage_progress
ADD COLUMN primary_voice TEXT;
```

**Save on selection:**
```javascript
await supabase
  .from('user_stage_progress')
  .update({ primary_voice: selectedVoice })
  .eq('user_id', userId)
```

#### 3.3 Display on Profile

**Location:** `Profile.jsx` or wherever user info is displayed

```jsx
{userProfile.primary_voice && (
  <div className="profile-voice">
    <h3>Your Primary Protective Voice</h3>
    <div className="voice-display">
      <span className="voice-name">{VOICE_DATA[userProfile.primary_voice].name}</span>
      <span className="voice-lie">{VOICE_DATA[userProfile.primary_voice].lie}</span>
    </div>
    <p className="voice-insight">
      This voice developed to protect you. Now it's time to thank it — and show it you're safe.
    </p>
  </div>
)}
```

### Voice Data Constant

Create `src/data/protectiveVoices.js`:
```javascript
export const PROTECTIVE_VOICES = {
  perfectionist: {
    name: 'The Perfectionist',
    lie: "You're not ready yet.",
    origin: 'Developed when mistakes led to shame or punishment',
    protection: 'Prevents you from shipping to prevent you from failing publicly',
    kryptonite: 'Shipping something imperfect',
    signs: ['Endless preparation', 'Moving goalposts', 'Inability to launch']
  },
  'people-pleaser': {
    name: 'The People Pleaser',
    lie: "They won't like the real you.",
    origin: 'Developed when authenticity led to rejection or judgment',
    protection: 'Makes you agreeable to prevent conflict and rejection',
    kryptonite: 'Showing up as yourself, setting boundaries',
    signs: ['Chronic agreement', 'Inability to state opinions', 'Fear of disappointing']
  },
  controller: {
    name: 'The Controller',
    lie: "If you can't control the outcome, don't try.",
    origin: 'Developed when chaos or loss created a need for safety',
    protection: 'Avoids uncertainty to prevent unexpected pain',
    kryptonite: 'Taking action without guaranteed results',
    signs: ['Over-planning', 'Analysis paralysis', 'Refusing to start without certainty']
  },
  performer: {
    name: 'The Performer',
    lie: "Do more. Be more. Then you'll finally be enough.",
    origin: 'Developed when worth was tied to output and achievement',
    protection: 'Keeps you busy to prevent the emptiness of "not enough"',
    kryptonite: 'Resting without guilt',
    signs: ['Burnout cycles', 'Inability to celebrate', 'Always raising the bar']
  },
  ghost: {
    name: 'The Ghost',
    lie: "Visibility is dangerous. Stay small.",
    origin: 'Developed when being seen led to pain, criticism, or danger',
    protection: 'Keeps you hidden to prevent judgment and attack',
    kryptonite: 'Being seen anyway',
    signs: ['Hiding work', 'Avoiding promotion', 'Discomfort with spotlight']
  }
}
```

### Voice Identification Checklist

- [ ] Create `src/data/protectiveVoices.js` with voice definitions
- [ ] Add voice identification step to `HomeFirstTime.jsx`
- [ ] Add `primary_voice` column to `user_stage_progress` table
- [ ] Save voice selection to database
- [ ] Display voice on Profile page
- [ ] Add CSS for voice selection and display
- [ ] Test the full onboarding flow

---

## Success Metrics

| Metric | How to Measure | Target |
|--------|----------------|--------|
| Landing page resonance | Signups, time on page, scroll depth | +20% signups |
| Voice identification completion | % who complete the step | >80% |
| Voice accuracy | Survey: "Does this feel accurate?" | >70% "yes" |
| Play-List engagement | Completion rate vs. old "Groans" | Baseline → +10% |
| Qualitative feedback | User interviews, support messages | Positive sentiment |

---

## Implementation Order

```
Week 1:
├── Day 1-2: Create protectiveVoices.js data file
├── Day 2-3: Landing page hero + Protective Voices section
├── Day 3-4: Voice identification in onboarding
├── Day 4-5: Profile voice display
└── Day 5: Landing page remaining sections

Week 2:
├── Day 1-2: Playground/Play-List copy updates
├── Day 2-3: Landing page polish + mobile testing
├── Day 3-4: Full flow testing
└── Day 4-5: Deploy + monitor metrics
```

---

## Files to Create/Modify

### New Files
- `src/data/protectiveVoices.js`
- `supabase/migrations/[timestamp]_add_primary_voice.sql`

### Modified Files
- `src/pages/LandingPage.jsx`
- `src/pages/LandingPage.css`
- `src/components/HomeFirstTime.jsx`
- `src/pages/Profile.jsx` (or equivalent)
- `src/components/GroanMatrix.jsx`
- `src/components/GroanChallengeCard.jsx`
- `src/components/GroansSummary.jsx`
- `src/components/GroanReflectionInput.jsx`

---

## Rollback Plan

All changes are copy/UI focused. If metrics don't improve:
1. Revert landing page to previous version
2. Keep voice identification (low risk, high value data)
3. A/B test Playground vs. Groans terminology

---

## Next Steps After Phase 1

If Phase 1 metrics are positive:
1. **Phase 2:** Visual refresh of Playground (make it feel like a playground)
2. **Phase 2:** Add Voice-specific Zarlo responses
3. **Phase 3:** XP tracking infrastructure

---

*Document created: 2025-02-03*
*Status: Draft*
