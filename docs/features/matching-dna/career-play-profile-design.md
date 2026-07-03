# Career Play Profile Design

## Status: Design Phase (Mar 2026)

## Problem Statement

The entrepreneur Play Profile (quiz → DNA match → stuck point → challenge) doesn't port directly to careers because:

1. **Data coverage** — Entrepreneurs like Sara Blakely or Elon Musk have deep, well-documented business stories across multiple stuck points (books, podcasts, interviews). Career role models rarely have that depth across all 5 career stuck points.
2. **Schema fit** — The DNA dimensions (workRhythm, fuelType, orientation, knowledgeStyle, scaleApproach) were designed around how you build a business. They don't map cleanly to career identity questions like "Am I in the wrong role?" or "How do I find my purpose?"

## Decision: Problem-First Approach

**Chosen over DNA Match and Hybrid approaches.**

Instead of: Quiz → DNA Match → Stuck Point → Challenge

Flow: **Stuck Point → Role Model Menu → Challenge**

1. User picks their career stuck point (e.g. "Wrong Role", "Finding Purpose")
2. Sees 2-3 role models who navigated that specific problem successfully
3. Picks the one whose story resonates
4. Gets an AI-powered challenge based on that person's approach

### Why Problem-First wins

- Each role model only needs deep coverage on 1-2 stuck points (not all 5)
- No forced DNA dimension mapping
- More role models total (15-20 across 5 stuck points, 3-4 per point)
- Users self-select resonance rather than algorithm-matching
- Easier to research and validate
- Candidates like Brene Brown become perfect for Visibility even if she's weak on Wrong Role

### Trade-offs accepted

- Loses the "personality quiz" gamification of the entrepreneur version
- No DNA archetype label ("The Playful Creator")
- Could add a short "what resonates?" prompt before showing role model options for light personalization

## Alternatives Considered

### Option A: DNA Match (like entrepreneurs)
Works if 10+ role models with good coverage across all 5 stuck points AND DNA dimensions map to career identity. Reality: only 6 candidates had strong coverage across 4-5 points, and dimensions like "scaleApproach: Artisan vs Titan" don't mean much for career questions.

### Option C: Hybrid
Short "what resonates?" prompt → narrows to stuck point → curated role models → user picks. Not chosen as primary but could layer in later.

## Research Results: 10 Candidates Assessed

| Candidate | Wrong Role | Purpose | Career Change | Visibility | Value | Verdict |
|---|---|---|---|---|---|---|
| Oprah Winfrey | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | Exceptional, all 5 |
| Julia Child | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | Exceptional, all 5 |
| Angela Duckworth | ★★★ | ★★★ | ★★★ | ★★☆ | ★★★ | Strong, 4.5/5 |
| Lin-Manuel Miranda | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | Strong, all 5 |
| Satya Nadella | ★★★ | ★★★ | ★★☆ | ★★★ | ★★★ | Strong, 4/5 |
| Bob Iger | ★★★ | ★★★ | ★★☆ | ★★★ | ★★★ | Strong, 4/5 |
| Brene Brown | ★★☆ | ★★★ | ★★☆ | ★★★ | ★★★ | Good, 3/5 |
| Mellody Hobson | ★★☆ | ★★★ | ★★★ | ★★★ | ★★★ | Good, 4/5 |
| Adam Grant | ★★★ | ★★★ | ★★☆ | ★★★ | ★★☆ | Good, 3/5 |
| Sheryl Sandberg | ★★☆ | ★★☆ | ★★★ | ★★★ | ★★★ | Good, 3/5 |

**Alt candidates researched:** Ruth Bader Ginsburg (strong), Maya Angelou (strong), Howard Schultz (weak, too entrepreneurial)

## Recommended Roster: Role Models by Stuck Point

| Stuck Point | Best Candidates |
|---|---|
| Wrong Role | Oprah, Angela Duckworth, Julia Child |
| Finding Purpose | Julia Child, Lin-Manuel Miranda, Satya Nadella |
| Career Change | Angela Duckworth, Julia Child, Oprah |
| Visibility | Brene Brown, Mellody Hobson, Oprah |
| Knowing Your Value | Bob Iger, Mellody Hobson, Angela Duckworth |

Each person appears where they're genuinely strongest. No filler.

## 5 Career Stuck Points

1. **Wrong Role** — "I think I'm in the wrong job/career"
2. **Finding Purpose** — "I don't know what I'm meant to do"
3. **Career Change** — "I want to change but don't know how to make the leap"
4. **Visibility** — "I'm good at what I do but nobody knows it"
5. **Knowing Your Value** — "I undersell myself and don't charge/earn what I'm worth"

## Existing Entrepreneur Play Profile Architecture (Reference)

Future agents need to understand the current system to build the career version alongside it.

### How the entrepreneur version works

1. **Game Selection** (`PlayProfileQuiz.jsx` → `founderDnaGames.js`): User picks games they enjoy from 8 categories. Each game has inferred DNA dimension scores (inferredOrientation, inferredKnowledgeStyle).
2. **DNA Sliders** (`PlayProfileQuiz.jsx`): User adjusts 5 sliders for their DNA dimensions.
3. **DNA Match** (`dnaMatching.js` → `founderDnaFounders.json`): Algorithm matches to a famous founder (Steve Jobs, etc.) based on DNA similarity.
4. **DNA Reveal**: Shows matched founder with bio, quote, and "why this DNA" explanation.
5. **Stuck Point Selection** (`founderDnaStuckPoints.js`): User picks from 8 entrepreneur stuck points (Flow Finder, Validation, Product Creation, Testing, Money Models, Grand Slam Offer, Campaign, Launch & Tracking). Each has 3 follow-up questions with 4 options.
6. **AI Diagnostic** (`AIDiagnostic.jsx` → `founderDnaAI.js`): Multi-turn AI conversation about the stuck point using the matched founder's perspective.
7. **Challenge Delivery** (`ChallengeDelivery.jsx`): AI generates a custom challenge.
8. **Challenge Rating** (`ChallengeRating.jsx`): User rates completed challenge with voice/compass data.

### Key data structures

- `founder_dna_results` table: stores DNA profile, matched founder, archetype, slider values, selected games
- `founder_dna_sessions` table: stores stuck point, diagnosis, challenge, ratings, voice/compass data
- `founderDnaFounders.json`: 10+ founders with DNA codes, bios, and stage-specific story content (stories keyed by stage number 0-7, each with title + content)
- `founderDnaStuckPoints.js`: 8 stuck points with 3 follow-up questions each, uses `{founderName}` placeholder in Q3

### What the career version does NOT need

- DNA dimensions (workRhythm, fuelType, orientation, knowledgeStyle, scaleApproach)
- DNA matching algorithm
- Game selection step
- DNA sliders

### What the career version DOES need (new)

- 5 career stuck points (defined above) with follow-up questions
- Role model data file (like `founderDnaFounders.json` but for career role models)
- Role model selection UI (user picks from 3-4 per stuck point)
- AI diagnostic adapted for career context
- Challenge generation adapted for career context
- Possibly a new table or reuse of `founder_dna_sessions` with a `profile_type` discriminator

### Open design questions

1. **Shared or separate tables?** Could add `profile_type: 'entrepreneur' | 'career'` to existing tables, or create parallel `career_dna_*` tables
2. **Shared or separate components?** The Quiz, Dashboard, AI Diagnostic, and Challenge components could potentially be shared with a config/mode prop, similar to MoneyModelFlowBase pattern
3. **Entry point**: How does user choose entrepreneur vs career Play Profile? Tab on `/play-profile`? Separate route? Based on persona type (vibe seeker = career, business = entrepreneur)?
4. **Role model story depth**: Each role model needs story content for their 1-2 strongest stuck points (like the founder stageStories format). Research agents gathered ratings but not the actual story content yet.
5. **Follow-up questions**: Need career-specific follow-up questions for each stuck point (the entrepreneur ones in `founderDnaStuckPoints.js` are business-focused)

## Next Steps

- [ ] Define follow-up questions for each stuck point
- [ ] Assign 3-4 role models per stuck point with specific story angles
- [ ] Design the role model card UI (photo, quote, story summary)
- [ ] Build AI challenge generation prompts per role model
- [ ] Decide on data schema (reuse `founder_dna_sessions` or new table)
- [ ] Research deep story content for each role model at their assigned stuck points
- [ ] Write career-specific follow-up questions for each of the 5 stuck points
- [ ] Decide entry point: how users choose entrepreneur vs career Play Profile
- [ ] Consider whether to reuse PlayProfileQuiz/Dashboard components with a mode prop or build separate
