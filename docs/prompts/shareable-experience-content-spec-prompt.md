# Prompt: Spec Out Shareable Experience Content for Vibe Rise

## Context

Vibe Rise is a personal development app (React + Supabase) that helps people expand their comfort zone through courage challenges, healing flows, and quest-based progression. The core thesis: **your comfort zone is the ceiling on your career, not your knowledge.** We call this the "School of Experience" vs the "School of Theory."

The product chain is: **comfort zone → experience → brand → career.** The app covers comfort zone → experience. We need a "become known" layer that helps users turn their accumulated experience into visible evidence — closing the loop to brand → career.

This is NOT a content creation tool. It's the app helping users capture and share proof of what they've done. The experience IS the content. The app just makes it visible.

## Two User Types

- **The Stuck:** "I know what I want, I can't get there." They're doing courage challenges to expand their comfort zone. They need shareable evidence that their comfort zone is growing — proof they're becoming someone different.
- **The Seeker:** "I know it's not this, I don't know what it is yet." They're discovering what lights them up via the dome. They need shareable moments that help them (and others) see the pattern forming.

## What Already Exists in the App

**Data the app captures:**
- Dome shape (8-dimension radar chart of comfort zone across ~90 experiences)
- Courage challenge completions (what they did, proof screenshots/text, before/after nervous system state, difficulty predictions vs reality)
- Quest progress (life paths being pursued, tasks completed)
- Healing flow completions (7-step per-task flows addressing fear/origin/insight/rewire)
- Weekly review reflections (identity shift, procrastination patterns, courage highlights)
- Identity statements ("I'm someone who..." declarations after courage challenges)
- Rise Points + hero stage level (Getting Started through Movement Maker)
- Dome growth over time (edges pushing out as comfort zone expands)
- Life Fuel channels (Choice, Connection, Mastery, Meaning — tracked after each challenge)
- Aftertaste responses ("Do you want to do that again?" — yes/not sure/no)

**Shareables that already exist (basic):**
- Dome shape image (from Experience Game and /me page)
- Ambition Radar overlay (gap between dream and current)
- Aliveness Quiz verdict card

## What Needs Speccing

### Part 1: Native Content the App Creates (Auto-Generated Shareables)

The app should automatically generate shareable visual content at key moments. These should feel like achievements/milestones, not marketing.

**Key questions to answer:**
- Which moments are worth auto-generating a shareable? (e.g., dome milestone, first courage challenge, quest completion, level up, weekly review summary, identity statement, healing breakthrough, streak milestone)
- What format works for each? (image card, animated summary, story-format vertical, text snippet with visual)
- What data goes on each shareable? (the dome? a quote? the before/after? stats?)
- How much is auto-designed vs user-customizable?
- Should they look like the app's brand (purple/gold) or be platform-native?
- How do we make them genuinely interesting to non-users? (not just "I did a thing" — something that makes someone ask "what is that?")

**Reference products to study:**
- Strava year-in-review and activity cards
- Duolingo streak screenshots and league promotions
- Spotify Wrapped
- Apple Fitness ring closures
- GitHub contribution graphs
- Peloton PR and milestone cards

### Part 2: Prompts/Templates That Help Users Create + Share

After key moments, the app suggests how to share what just happened. Not "share this to Instagram" — more like "here's how to talk about what you just experienced."

**Key questions to answer:**
- Which moments trigger a sharing prompt? (probably a subset of Part 1 moments)
- What's the prompt format? (fill-in-the-blank template? AI-generated draft? question that sparks their own words?)
- Where do they share to? (Instagram story, LinkedIn post, WhatsApp message, in-app community, Twitter/X)
- How do we avoid this feeling like engagement-bait or "share this" spam?
- Should prompts be opt-in (user enables sharing mode) or contextual (appears after meaningful moments only)?
- How do we make the template sound like THEM, not like the app?

**Example moments and possible prompts:**
- After first courage challenge: "You just did [thing] for the first time. What surprised you about it?"
- After dome growth: "Your [dimension] just expanded. 3 months ago this would have felt impossible. What changed?"
- After healing flow: "You named the voice that was holding you back. What would you tell someone else who hears the same voice?" (sensitive — needs careful handling)
- After weekly review: "This week you [identity statement]. When did you first realize that was true?"
- After level up: "You just hit [level]. Here's your journey so far: [auto-summary]. What would you tell yourself at level 1?"

### Part 3: The Compound Flywheel

Each shared piece of evidence makes the next opportunity easier. Spec should address:
- Does the app track what was shared and where? (share events table)
- Can we measure downstream impact? (new signups attributed to shares, engagement on shared content)
- Does sharing earn Rise Points or contribute to progression?
- Is there an "experience portfolio" page others can view? (public profile)
- How does this connect to the "become known" thesis without being cringe?

## Design Constraints

- **Light theme throughout.** Purple (#5e17eb) → Gold (#E9A23B) gradient for brand. Match #f5f5f0 or white backgrounds.
- **Write so a 12-year-old would understand.** No jargon on user-facing copy.
- **Never use em dashes** in user-facing copy.
- **iOS app via Capacitor** — shareables need to work with native share sheet.
- **Privacy:** Healing flow content is deeply personal. Sharing prompts for healing moments need explicit opt-in and careful framing. Default = private. User chooses what to share.
- **Anti-slop:** Sharing should feel earned and authentic, never forced or gamified into spam. Quality > quantity. One genuine share beats ten templated posts.

## Deliverable

A feature spec at `docs/features/shareable-experience-content-spec.md` covering:
1. Moment → shareable mapping (which moments, which formats, which platforms)
2. Auto-generated shareable designs (mockup descriptions or wireframes)
3. Prompt/template system design (triggers, formats, tone)
4. Data model (new tables/columns needed)
5. Privacy model (what's public by default, what requires opt-in)
6. Flywheel tracking (share events, attribution)
7. Implementation priority (what to build first for maximum retention + brand loop impact)
8. Reference product analysis (what works from Strava/Duolingo/Spotify/etc., what doesn't fit Vibe Rise)

## Codebase Reference

- App: `/Users/nichuzz/creations/Findmyflow/`
- Dome visualization: `src/components/DomeOfSafety.jsx`
- Courage challenges: `src/components/` (WahooCreator, PlayListTab)
- Weekly review: `src/components/WeeklyReviewFlow.jsx`
- Lead magnet flows: `src/flows/ExperienceGameFlow.jsx`, `src/flows/AlivenessQuiz.jsx`, `src/flows/AmbitionRadar.jsx`
- Identity statements: tracked in quest completions and courage challenge flows
- Rise Points: `src/lib/scoreUtilities.js`
- Share existing: look at any existing share button implementations for patterns
- Dome dimensions: `src/data/domeDimensions.js`
- Strategy doc: `docs/frameworks/find-my-flow-x-category-pirates.md` (v3 section)
