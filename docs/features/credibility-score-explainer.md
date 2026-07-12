# Credibility Score — Scale Portal Feature Explainer

**Created:** 2026-07-12
**Status:** Concept confirmed, needs design + build
**Product:** Scale Portal (`/create`)
**Purpose:** Auto-assemble a creator's proof stack from their Vibe Rise journey data + manual inputs, show gaps, and feed into the Grand Slam Offer flow.

---

## What It Is

A score (0-100%) that shows creators how much PROOF they have that they can deliver on their offer. Most creators undersell because they don't realise they already have credibility — they just haven't packaged it.

The Credibility Score assembles proof from two sources:
1. **Auto-detected** from Vibe Rise app journey data (the Proof Harvester)
2. **Manual input** for things the app can't detect (credentials, external data)

---

## The 6 Proof Types

Based on the existing Grand Slam Offer flow's proof stack (from `Step3_ProofStack.jsx` and `GrandSlamOfferFlow.jsx`):

### 1. Personal Transformation (auto-detectable)
**What it proves:** "I've done this myself. I've lived the transformation I'm selling."

**Data sources from Vibe Rise app:**
- Wahoo completion history (count + types + "How did that feel?" responses)
- NS state shifts over time (e.g. Activated → Fun baseline)
- Cone expansion data (life paths that moved from Pressure → Fun/Vibe Rise)
- Healing flows completed (patterns identified and resolved)
- Hero's journey stage progression (how far through the 12 stages)
- Capacity levels (L0-L5) on relevant curiosities

**Display:** "You completed 47 courage challenges. Your nervous system shifted from Activated to Fun over 4 months. 3 life paths moved from Pressure to Vibe Rise."

**Why it matters:** Hormozi's sales principle — "Three things prospects must believe: (1) the method works, (2) YOU can deliver, (3) it will work for THEM." Personal transformation is the strongest evidence for #2.

---

### 2. Experience Depth (auto-detectable)
**What it proves:** "I've gone deep in this field, not just skimmed the surface."

**Data sources from Vibe Rise app:**
- Capacity levels per curiosity (L0=Education, L1=Trialling, L2=Changing, L3+=visibility layers)
- Time in practice (streak data, tune tab history)
- Curiosity cluster depth (input count per cluster from Curiosity Map)
- Career alignment data (how long in the field)

**Display:** "You've been practising breathwork for 2 years (L2 Changing → Authority visibility). You have 6 months in gathering design (L1 Trialling). Your psychology curiosity has 12 content inputs."

---

### 3. Methodology (partially auto-detectable)
**What it proves:** "I have a named, repeatable method that gets results."

**Data sources from Scale Portal:**
- Remarkable Results flow completed (rule break found + articulated)
- Flow Statement from hero's journey Stage 9
- Shift Architecture completion (if applicable)
- Named method/framework (manual input)

**Auto-detection:** If Remarkable Results exists → methodology proof partially filled. If Flow Statement exists → seed of methodology identified.

**Gap prompt:** "You've found your rule break but haven't named your method yet. What do you call your approach?"

---

### 4. Case Studies (partially auto-detectable)
**What it proves:** "I've helped others achieve this transformation."

**Data sources from Scale Portal:**
- Experiences facilitated (session count, attendee count)
- Testimonials collected (manual input or imported)
- "First Graduate" data from hero's journey Stage 12
- Client results documented

**Gap prompt:** "You've facilitated 3 sessions but haven't collected any testimonials yet. After your next session, ask: 'What shifted for you tonight?'"

---

### 5. Credentials (manual input only)
**What it proves:** "I have formal training or certification in this field."

**Examples:** Certifications, qualifications, training programs completed, degrees, professional memberships.

**Reframe for people without credentials:** "Credentials aren't required. But if you have them, they reduce the trust gap. If you don't, your personal transformation and methodology are stronger proof anyway."

---

### 6. Data/Research (manual input only)
**What it proves:** "There's external evidence backing my approach."

**Examples:** Studies they reference, statistics about their field, research papers, industry data.

**Reframe:** "If you reference a study or data point when explaining your method, add it here. It's not essential — but it strengthens your case."

---

## The Score Display

```
YOUR PROOF STACK

Personal Transformation    ████████░░  80%
  47 wahoos, NS shifted Activated→Fun, 3 paths expanded

Experience Depth           ██████░░░░  60%
  Breathwork L2+Authority, Gathering L1, Psychology L0

Methodology                ████░░░░░░  40%
  Rule break found. Method not yet named.

Case Studies               ██░░░░░░░░  20%
  1 session facilitated. No testimonials collected.

Credentials                ░░░░░░░░░░   0%
  None entered.

Data/Research              ░░░░░░░░░░   0%
  None entered.

─────────────────────────────────────────
Overall Credibility: 33%

"You have more proof than you think.
 Your transformation IS your strongest proof.
 Let's package it."
```

---

## How It Connects to Existing Features

### Feeds INTO:
- **Grand Slam Offer Flow** (`GrandSlamOfferFlow.jsx`): Proof stack step (Step 3) pre-fills from Credibility Score data
- **Offer Builder 100M** (`OfferBuilder100M/Step3_ProofStack.jsx`): Same proof types — Credibility Score is the persistent version
- **Positioning Summary** (`PositioningSummary.jsx`): Positioning statement stronger when backed by proof data
- **Scale Score** (`FacilitatorScore.jsx`): Phase 3 readiness partly about proof of results

### Feeds FROM:
- **Vibe Rise App** (via Proof Harvester): wahoo data, NS data, healing data, capacity levels, hero's journey stage
- **Curiosity Map**: cluster depth, career alignment
- **Remarkable Results**: rule break, remarkability score
- **Create Portal activity**: sessions facilitated, content published

### The Proof Harvester Bridge

When a user enters the Create Portal for the first time (Stage 10 of hero's journey), the Proof Harvester runs automatically:

1. Pull all Vibe Rise journey data
2. Reframe as credibility evidence
3. Pre-fill proof types 1 (Personal Transformation) and 2 (Experience Depth)
4. Show the user: "You already have 60% of your proof stack from your journey. Let's fill the gaps."

---

## Connection to Hormozi's Three Beliefs

Prospects must believe:
1. **The method works in general** → Methodology proof + Data/Research
2. **YOU specifically can deliver** → Personal Transformation + Experience Depth + Credentials
3. **It will work for THEM** → Case Studies (proof from people like them)

The Credibility Score primarily addresses belief #2 ("YOU can deliver"), with hooks into #1 and #3.

---

## Connection to Hero's Journey Stages

| Stage | Credibility Impact |
|---|---|
| Stages 1-4 | No proof yet (pre-action) |
| Stage 5 | Personal transformation begins (first data point) |
| Stage 6 | Personal transformation accumulates (wahoo count, streak, NS shifts) |
| Stage 7 | Experience depth grows (patterns identified = deep engagement) |
| Stage 8 | Personal transformation proof strongest (reconsolidation = before/after) |
| Stage 9 | Methodology seed (Flow Statement = named approach) |
| Stage 10 | Proof Harvester activates, Credibility Score generated |
| Stage 11 | Case studies begin (first external validation) |
| Stage 12 | Full proof stack (first graduate = ultimate case study) |

---

## Consumer Version (Vibe Rise App)

A lighter version could exist in the Vibe Rise app as "Transformation Evidence" — not for selling, but for self-evidence:

- "Here's proof your life has changed"
- Shareable card (like Strava year-in-review)
- Reinforces identity: "I was stuck. Now I'm not. Here's the data."
- Feeds the figurine's transformation evidence dimension

---

## Open Questions for Build

- [ ] Where in the Scale Portal does this live? New tab? Section within Creator Home? Part of Playbook Pipeline?
- [ ] Does it update in real-time or on-demand?
- [ ] How do we handle proof types 5+6 (manual input) — separate form or inline?
- [ ] Should Credibility Score influence Scale Score?
- [ ] Mobile-first design considerations
